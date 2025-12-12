# Publishing Guide

This document outlines the steps to publish both @fractary/forge and @fractary/cli to npm.

## Prerequisites

1. You must be logged into npm: `npm login`
2. Your npm account must have access to publish @fractary scoped packages
3. You have 2FA/OTP set up on your npm account

## Publishing Order

**IMPORTANT**: You must publish @fractary/forge BEFORE @fractary/cli because the CLI depends on it.

## Step 1: Publish @fractary/forge (SDK)

```bash
cd /mnt/c/GitHub/fractary/forge

# Verify the build
npm run build

# Verify package.json
cat package.json | grep version  # Should show "1.0.0"
cat package.json | grep publishConfig  # Should show "access": "public"

# Dry run to see what will be published
npm publish --dry-run

# Publish (requires OTP)
npm publish --otp=YOUR_OTP_CODE
```

**Verify forge publication:**
```bash
npm view @fractary/forge version
# Should return: 1.0.0
```

## Step 2: Publish @fractary/cli

```bash
cd /mnt/c/GitHub/fractary/cli

# Verify the build
npm run build

# Verify package.json
cat package.json | grep version  # Should show "0.2.0"
cat package.json | grep '"@fractary/forge"'  # Should show "^1.0.0"

# Dry run to see what will be published
npm publish --dry-run

# Publish (requires OTP)
npm publish --otp=YOUR_OTP_CODE
```

**Verify CLI publication:**
```bash
npm view @fractary/cli version
# Should return: 0.2.0
```

## Step 3: Test Installation

Test the published packages work correctly:

```bash
# Create a test directory
mkdir /tmp/test-fractary
cd /tmp/test-fractary

# Install the CLI globally
npm install -g @fractary/cli

# Test the commands
fractary --version  # Should show 0.2.0
fractary --help     # Should list all tools including forge
fractary forge --help  # Should list all 11 forge commands
fractary forge list --help  # Should show list command help
```

## Step 4: Push Git Changes

After successful publication:

```bash
# Push forge repository
cd /mnt/c/GitHub/fractary/forge
git push origin main

# Push CLI repository
cd /mnt/c/GitHub/fractary/cli
git push origin main

# Optional: Create GitHub releases for both repos
```

## Troubleshooting

### "402 Payment Required" Error
Your npm account doesn't have permission to publish @fractary scoped packages. Contact the organization admin.

### "E404 Not Found" for @fractary/forge
The forge package hasn't been published yet. Publish it first before publishing the CLI.

### OTP Issues
- Make sure you're using the current OTP code from your authenticator app
- OTP codes expire quickly (30 seconds), get a fresh one if it fails
- Format: `npm publish --otp=123456` (6 digits, no spaces)

### Build Failures
If the build fails:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Rolling Back

If you need to unpublish or deprecate:

```bash
# Deprecate a version (recommended over unpublish)
npm deprecate @fractary/cli@0.2.0 "Reason for deprecation"

# Unpublish within 72 hours (use sparingly)
npm unpublish @fractary/cli@0.2.0 --otp=YOUR_OTP_CODE
```

## Current Status

- ✅ forge SDK: Ready to publish v1.0.0
- ✅ CLI: Ready to publish v0.2.0
- ✅ Git commits: Created and ready to push
- ✅ CHANGELOG: Updated with v0.2.0 changes
- ✅ Build: Tested and passing
- ⏳ Publication: Awaiting OTP codes

## What Was Changed

### @fractary/forge (v1.0.0)
- Changed `publishConfig.registry` from GitHub Packages to npm public
- No version bump needed (already at 1.0.0)

### @fractary/cli (v0.2.0)
- Version bumped from 0.1.1 to 0.2.0
- Added forge CLI integration (11 commands)
- Added dependencies: @fractary/forge, ajv, gray-matter, prompts
- Updated README with forge documentation
- Added CHANGELOG.md
- Added SPEC-0014 documentation
