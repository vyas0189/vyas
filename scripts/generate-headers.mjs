// Generates dist/_headers with a Content-Security-Policy for every CDN-served
// page. Runs automatically after `astro build` (see the `postbuild` script).
//
// Why post-build: with `output: 'static'`, middleware never runs for
// CDN-served pages, so a CSP set there only ever reached the one SSR API
// route. And the hashes can't live in netlify.toml because the Sentry
// integration injects an inline debug-ID script whose content (and therefore
// hash) changes on every build. The only correct time to compute script
// hashes is after the HTML exists.
//
// Non-executable script types (e.g. application/ld+json) don't need hashes —
// CSP only gates scripts the browser would run. `style-src 'unsafe-inline'`
// is retained deliberately: sonner injects a runtime <style> tag and view
// transitions set inline style attributes.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Browser tokenizers close a script element at `</script` followed by any
// characters up to '>', including whitespace and stray attributes
// (`</script >`, `</script bar>`), so match the same way.
const SCRIPT_RE = /<script([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi;
const EXECUTABLE_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript']);

/** Collect sha256 CSP hashes for every executable inline script in an HTML string. */
export function extractInlineScriptHashes(html) {
	const hashes = new Set();
	for (const [, attrs, body] of html.matchAll(SCRIPT_RE)) {
		if (!body) continue;
		if (/\ssrc\s*=/i.test(attrs)) continue;
		const type = (attrs.match(/\stype\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? '').toLowerCase();
		if (!EXECUTABLE_TYPES.has(type)) continue;
		hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
	}
	return hashes;
}

/** Build the full CSP header value given a set of script hashes. */
export function buildCsp(scriptHashes) {
	const scriptSrc = ["'self'", ...[...scriptHashes].sort()].join(' ');
	return [
		"default-src 'self'",
		`script-src ${scriptSrc}`,
		"style-src 'self' 'unsafe-inline'",
		"font-src 'self'",
		"img-src 'self' data:",
		"connect-src 'self' https://*.sentry.io https://*.ingest.us.sentry.io",
		"worker-src 'self' blob:",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'",
		'upgrade-insecure-requests',
	].join('; ');
}

function findHtmlFiles(dir) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...findHtmlFiles(full));
		else if (entry.name.endsWith('.html')) files.push(full);
	}
	return files;
}

/** Scan a build output directory and write its `_headers` file. Returns a summary. */
export function generateHeaders(distDir) {
	const htmlFiles = findHtmlFiles(distDir);
	if (htmlFiles.length === 0) {
		throw new Error(`No HTML files found under ${distDir} — did the build run?`);
	}

	const hashes = new Set();
	for (const file of htmlFiles) {
		for (const hash of extractInlineScriptHashes(readFileSync(file, 'utf8'))) {
			hashes.add(hash);
		}
	}

	const headersFile = `/*\n  Content-Security-Policy: ${buildCsp(hashes)}\n`;
	writeFileSync(join(distDir, '_headers'), headersFile);
	return { htmlFiles: htmlFiles.length, scriptHashes: hashes.size };
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
	try {
		const distDir = fileURLToPath(new URL('../dist', import.meta.url));
		const { htmlFiles, scriptHashes } = generateHeaders(distDir);
		console.log(
			`generate-headers: wrote dist/_headers (CSP with ${scriptHashes} inline script hash(es) from ${htmlFiles} HTML file(s))`,
		);
	} catch (err) {
		console.error(`generate-headers: ${err instanceof Error ? err.message : err}`);
		process.exit(1);
	}
}
