"use strict";
/**
 * Update Checker
 *
 * Checks for available updates of installed components and plugins.
 * Supports semantic versioning constraints and version comparison.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkComponentUpdate = checkComponentUpdate;
exports.checkAllComponentUpdates = checkAllComponentUpdates;
exports.compareVersions = compareVersions;
exports.satisfiesConstraint = satisfiesConstraint;
exports.filterVersionsByConstraint = filterVersionsByConstraint;
exports.findLatestVersion = findLatestVersion;
exports.getUpdateSuggestions = getUpdateSuggestions;
exports.isUnstableVersion = isUnstableVersion;
exports.getReleaseNotesUrl = getReleaseNotesUrl;
const semver_1 = __importDefault(require("semver"));
const forge_1 = require("@fractary/forge");
const forge_config_1 = require("./forge-config");
/**
 * Check for updates for a single component
 */
async function checkComponentUpdate(name, currentVersion, type, constraint, registries) {
    const info = {
        name,
        current: currentVersion,
        latest: currentVersion,
        available: [],
        constraint,
        hasUpdate: false,
        updateType: 'none',
    };
    // Normalize version
    const current = semver_1.default.coerce(currentVersion)?.version || currentVersion;
    try {
        // Try to resolve latest version from registries
        const config = registries ? { registries } : (await (0, forge_config_1.loadForgeConfig)()).config;
        for (const registry of config.registries) {
            if (!registry.enabled)
                continue;
            try {
                // Try to fetch from registry
                const resolved = await forge_1.Registry.resolver.resolve(name, type, {
                    registry: registry.name,
                });
                if (resolved && resolved.version) {
                    const latest = semver_1.default.coerce(resolved.version)?.version || resolved.version;
                    if (semver_1.default.gt(latest, current)) {
                        info.latest = latest;
                        info.hasUpdate = true;
                        // Determine update type
                        const diff = semver_1.default.diff(current, latest);
                        info.updateType = diff || 'patch';
                        if (!info.available.includes(latest)) {
                            info.available.push(latest);
                        }
                    }
                }
            }
            catch (error) {
                // Continue with other registries
            }
        }
    }
    catch (error) {
        // If update checking fails, return current info
    }
    return info;
}
/**
 * Check for updates for multiple components
 */
async function checkAllComponentUpdates(components) {
    const { config } = await (0, forge_config_1.loadForgeConfig)();
    const results = {};
    for (const component of components) {
        const updateInfo = await checkComponentUpdate(component.name, component.version || 'unknown', component.type, undefined, config.registries);
        results[component.name] = updateInfo;
    }
    return results;
}
/**
 * Compare two semantic versions
 *
 * Returns:
 * - Positive if version1 > version2
 * - Negative if version1 < version2
 * - 0 if versions are equal
 */
function compareVersions(version1, version2) {
    try {
        const v1 = semver_1.default.coerce(version1)?.version || version1;
        const v2 = semver_1.default.coerce(version2)?.version || version2;
        if (semver_1.default.gt(v1, v2))
            return 1;
        if (semver_1.default.lt(v1, v2))
            return -1;
        return 0;
    }
    catch (error) {
        // Fallback to string comparison
        return version1.localeCompare(version2);
    }
}
/**
 * Check if version satisfies constraint
 */
function satisfiesConstraint(version, constraint) {
    try {
        const v = semver_1.default.coerce(version)?.version || version;
        return semver_1.default.satisfies(v, constraint);
    }
    catch (error) {
        return false;
    }
}
/**
 * Get available versions matching constraint
 */
function filterVersionsByConstraint(versions, constraint) {
    return versions.filter((v) => satisfiesConstraint(v, constraint));
}
/**
 * Find latest version from list
 */
function findLatestVersion(versions) {
    if (versions.length === 0)
        return null;
    try {
        const validVersions = versions
            .map((v) => semver_1.default.coerce(v)?.version || v)
            .filter((v) => semver_1.default.valid(v));
        if (validVersions.length === 0)
            return null;
        return validVersions.sort(semver_1.default.compare).reverse()[0];
    }
    catch (error) {
        return null;
    }
}
/**
 * Get update suggestions
 */
function getUpdateSuggestions(updates, options = {}) {
    return Object.values(updates)
        .filter((info) => {
        if (!info.hasUpdate)
            return false;
        if (options.majorOnly && info.updateType !== 'major')
            return false;
        if (!options.includeUnstable && isUnstableVersion(info.latest))
            return false;
        return true;
    })
        .sort((a, b) => {
        // Sort by update type (major first, then minor, then patch)
        const typeOrder = { major: 0, minor: 1, patch: 2, none: 3 };
        const typeDiff = typeOrder[a.updateType] - typeOrder[b.updateType];
        if (typeDiff !== 0)
            return typeDiff;
        // Then by name
        return a.name.localeCompare(b.name);
    });
}
/**
 * Check if version is unstable (pre-release or build metadata)
 */
function isUnstableVersion(version) {
    try {
        const parsed = semver_1.default.parse(version);
        return parsed ? parsed.prerelease.length > 0 : false;
    }
    catch (error) {
        return false;
    }
}
/**
 * Get version release notes URL (if available)
 */
function getReleaseNotesUrl(name, version, registry) {
    // This is a placeholder for future registry implementations
    // Different registries may have different URL patterns
    if (!registry)
        return null;
    // GitHub pattern
    if (registry.url.includes('github.com')) {
        const match = name.match(/@?([^/]+)\/(.+)/);
        if (match) {
            const [, org, repo] = match;
            return `https://github.com/${org}/${repo}/releases/tag/${version}`;
        }
    }
    // Stockyard pattern
    if (registry.url.includes('stockyard')) {
        return `https://stockyard.fractary.dev/plugins/${name}/${version}`;
    }
    return null;
}
//# sourceMappingURL=update-checker.js.map