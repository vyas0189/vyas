import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// Plain .mjs module — imported relatively, outside the src/ alias.
import {
	buildCsp,
	extractInlineScriptHashes,
	generateHeaders,
} from '../../scripts/generate-headers.mjs';

function sha256(body: string): string {
	return `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
}

describe('extractInlineScriptHashes', () => {
	it('hashes plain and module inline scripts', () => {
		const html = `<html><head>
			<script>console.log('a')</script>
			<script type="module">console.log('b')</script>
		</head></html>`;
		const hashes = extractInlineScriptHashes(html);
		expect(hashes).toEqual(new Set([sha256("console.log('a')"), sha256("console.log('b')")]));
	});

	it('ignores external scripts, JSON-LD data blocks, and empty bodies', () => {
		const html = `<html><head>
			<script type="module" src="/_astro/page.js"></script>
			<script type="application/ld+json">{"@context":"https://schema.org"}</script>
			<script></script>
		</head></html>`;
		expect(extractInlineScriptHashes(html).size).toBe(0);
	});

	it('dedupes identical scripts across occurrences', () => {
		const html = '<script>x()</script><script>x()</script>';
		expect(extractInlineScriptHashes(html).size).toBe(1);
	});

	it('matches end tags containing whitespace, per the HTML spec', () => {
		const html = '<script>a()</script ><script type="module">b()</script\n>';
		expect(extractInlineScriptHashes(html)).toEqual(new Set([sha256('a()'), sha256('b()')]));
	});
});

describe('buildCsp', () => {
	it('includes hashes in script-src and keeps core directives', () => {
		const csp = buildCsp(new Set(["'sha256-abc'"]));
		expect(csp).toContain("script-src 'self' 'sha256-abc'");
		expect(csp).toContain("default-src 'self'");
		expect(csp).toContain("frame-ancestors 'none'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain("base-uri 'self'");
		expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
	});
});

describe('generateHeaders', () => {
	let dir: string;

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it('writes a _headers file covering all pages with the union of hashes', () => {
		dir = mkdtempSync(join(tmpdir(), 'gen-headers-'));
		writeFileSync(join(dir, 'index.html'), '<script>a()</script>');
		mkdirSync(join(dir, 'about'));
		writeFileSync(join(dir, 'about', 'index.html'), '<script>b()</script>');

		const result = generateHeaders(dir);
		expect(result).toEqual({ htmlFiles: 2, scriptHashes: 2 });

		const headers = readFileSync(join(dir, '_headers'), 'utf8');
		expect(headers.startsWith('/*\n  Content-Security-Policy: ')).toBe(true);
		expect(headers).toContain(sha256('a()'));
		expect(headers).toContain(sha256('b()'));
	});

	it('throws when the build output has no HTML', () => {
		dir = mkdtempSync(join(tmpdir(), 'gen-headers-'));
		expect(() => generateHeaders(dir)).toThrow(/No HTML files/);
	});
});
