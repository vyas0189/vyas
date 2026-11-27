// CI installs from bun.lock, but Renovate and Dependabot only see package-lock.json.
// A lockfile-only security bump that lands in package-lock.json alone never ships
// (astro sat at a vulnerable version for months this way), so fail when the two
// lockfiles resolve any direct dependency to different versions.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const npmLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
// bun.lock is JSONC: strip trailing commas before parsing.
const bunLock = JSON.parse(readFileSync('bun.lock', 'utf8').replace(/,(\s*[}\]])/g, '$1'));

const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const mismatches = [];
for (const name of names) {
	const npmVersion = npmLock.packages?.[`node_modules/${name}`]?.version;
	const bunEntry = bunLock.packages?.[name]?.[0];
	const bunVersion = bunEntry?.slice(bunEntry.lastIndexOf('@') + 1);
	if (npmVersion !== bunVersion) {
		mismatches.push(
			`${name}: package-lock.json ${npmVersion ?? 'missing'}, bun.lock ${bunVersion ?? 'missing'}`,
		);
	}
}

if (mismatches.length) {
	console.error('Lockfiles disagree on direct dependencies:');
	for (const line of mismatches) console.error(`  ${line}`);
	console.error(
		'Run `bun install` and `npm install --package-lock-only`, then commit both lockfiles.',
	);
	process.exit(1);
}
console.log(`Lockfiles agree on ${names.length} direct dependencies.`);
