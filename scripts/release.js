#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

// Parse CLI flags and positional arguments
const { values, positionals } = parseArgs({
	options: {
		"dry-run": {
			type: "boolean",
			short: "d",
			default: false,
		},
	},
	allowPositionals: true,
});

const isDryRun = values["dry-run"];
const bumpType = positionals[0] || "patch";

/**
 * Reads package.json directly from disk
 */
function getPackageJson() {
	const packagePath = new URL("../package.json", import.meta.url);
	return JSON.parse(readFileSync(packagePath, "utf8"));
}

/**
 * Predicts the next version (for dry runs)
 */
function predictNextVersion(currentVersion, type) {
	const [major, minor, patch] = currentVersion.split(".").map(Number);
	switch (type) {
		case "major":
			return `${major + 1}.0.0`;
		case "minor":
			return `${major}.${minor + 1}.0`;
		default: // patch
			return `${major}.${minor}.${patch + 1}`;
	}
}

/**
 * Updates CHANGELOG.md by moving items under [Unreleased] to [newVersion] - DD-MM-YYYY
 */
function updateChangelog(newVersion) {
	const changelogPath = new URL("../CHANGELOG.md", import.meta.url);
	let changelog = readFileSync(changelogPath, "utf8");

	const today = new Date();
	const day = String(today.getDate()).padStart(2, "0");
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const year = today.getFullYear();
	const dateString = `${day}-${month}-${year}`;

	const unreleasedHeader = "## [Unreleased]";
	const newReleaseHeader = `## [Unreleased]\n\n## [${newVersion}] ${dateString}`;

	if (!changelog.includes(unreleasedHeader)) {
		throw new Error(
			'⚠️ Could not find "## [Unreleased]" section in CHANGELOG.md',
		);
	}

	changelog = changelog.replace(unreleasedHeader, newReleaseHeader);

	if (isDryRun) {
		console.log(
			`\n[DRY RUN] Would update CHANGELOG.md with header:\n${newReleaseHeader}`,
		);
		return;
	}

	writeFileSync(changelogPath, changelog, "utf8");
}

/**
 * Helper to execute shell commands
 */
function runCommand(command, description) {
	console.log(`\n🚀 ${description}...`);
	if (isDryRun) {
		console.log(`  [DRY RUN] Would execute: ${command}`);
		return;
	}
	execSync(command, { stdio: "inherit" });
}

async function release() {
	const { version: currentVersion } = getPackageJson();

	if (isDryRun) {
		console.log(
			"🧪 DRY RUN MODE ENABLED - No files, git tags, or GitHub releases will be created.",
		);
	}

	console.log(`📌 Starting release process (bump type: ${bumpType})`);
	console.log(`Current version: v${currentVersion}`);

	// 1. Run preversion checks
	runCommand("npm run preversion", "Running preversion checks");

	// 2. Bump version in package.json & package-lock.json
	runCommand(
		`npm version ${bumpType} --no-git-tag-version`,
		"Bumping version in package.json",
	);

	const newVersion = isDryRun
		? predictNextVersion(currentVersion, bumpType)
		: getPackageJson().version;

	console.log(`Target version: v${newVersion}`);

	// 3. Update CHANGELOG.md
	console.log("\n📝 Updating CHANGELOG.md...");
	updateChangelog(newVersion);

	// 4. Stage changes, commit, and create local git tag
	runCommand(
		"git add package.json package-lock.json CHANGELOG.md",
		"Staging updated release files",
	);
	runCommand(`git commit -m "${newVersion}"`, "Creating release commit");
	runCommand(`git tag v${newVersion}`, `Creating git tag v${newVersion}`);

	// 5. Run postversion tasks (pushes commit and tags to origin)
	runCommand("npm run postversion", "Pushing commits & tags to remote");

	if (isDryRun) {
		console.log(
			`\n🧪 Dry run completed. Next version would be v${newVersion}.`,
		);
	} else {
		console.log(`\n✅ Successfully released v${newVersion}!`);
	}
}

release().catch((err) => {
	console.error("\n❌ Release failed:", err.message);
	process.exit(1);
});
