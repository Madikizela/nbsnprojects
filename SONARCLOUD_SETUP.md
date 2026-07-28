# SonarCloud Setup Guide

## Current Issue

The SonarCloud workflow is failing with:
```
The format of the analysis property sonar.token= is invalid
```

This means the `SONAR_TOKEN` secret is either:
1. Not configured in GitHub repository secrets
2. Empty or invalid
3. Not properly formatted

## Solution: Configure SonarCloud Token

### Step 1: Get SonarCloud Token

1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Sign in with your GitHub account
3. Go to **My Account** → **Security** → **Generate Tokens**
4. Create a new token:
   - Name: `NBSN Projects GitHub Actions`
   - Type: `User Token` or `Project Analysis Token`
   - Expiration: Choose appropriate duration
5. **Copy the token** (you won't be able to see it again!)

### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/Madikizela/nbsnprojects`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name**: `SONAR_TOKEN`
   - **Value**: Paste the token from Step 1
5. Click **Add secret**

### Step 3: Configure SonarCloud Project

You also need to update the project key and organization in the workflow file:

Current placeholders in `.github/workflows/sonarcloud.yml`:
```yaml
/k:"your-org_nbsnprojects"    # Project key
/o:"your-org"                  # Organization key
```

**Find your actual values**:
1. Go to your SonarCloud project
2. Note the **Project Key** (e.g., `Madikizela_nbsnprojects`)
3. Note the **Organization Key** (e.g., `madikizela`)

**Update the workflow**:
Replace `"your-org_nbsnprojects"` with your actual project key
Replace `"your-org"` with your actual organization key

### Step 4: Re-run the Workflow

After configuring the token and updating the keys:
1. Go to **Actions** tab in GitHub
2. Find the failed SonarCloud workflow
3. Click **Re-run jobs** → **Re-run failed jobs**

## Alternative: Disable SonarCloud (Temporary)

If you want to disable SonarCloud scanning temporarily:

1. Edit `.github/workflows/sonarcloud.yml`
2. Add `if: false` to the job:

```yaml
jobs:
  sonarcloud:
    name: SonarCloud Code Quality & Security
    runs-on: ubuntu-latest
    if: false  # Temporarily disabled
    permissions:
      contents: read
      security-events: write
```

## Current Workflow Configuration

The workflow now:
- ✅ Checks if `SONAR_TOKEN` is set before running
- ✅ Uses `sonar.login` parameter (newer format)
- ✅ Continues on error (won't fail the entire pipeline)
- ✅ Provides helpful error message if token is missing

## Why SonarCloud?

SonarCloud provides:
- **Code Quality Analysis**: Detects code smells, bugs, and vulnerabilities
- **Security Scanning**: Identifies security hotspots and vulnerabilities
- **Technical Debt**: Measures and tracks technical debt
- **Code Coverage**: Tracks test coverage metrics
- **Continuous Monitoring**: Automatic analysis on every push

## Without SonarCloud

If you choose not to use SonarCloud, you still have:
- ✅ **Snyk Security Scan** - Dependency vulnerabilities
- ✅ **CodeQL Analysis** - Security analysis for C# and JavaScript
- ✅ **OWASP Dependency Check** - Known vulnerabilities in dependencies
- ✅ **Docker Security Scan** - Container image vulnerabilities

These provide comprehensive security coverage even without SonarCloud.

## Recommended Actions

### Option 1: Enable SonarCloud (Recommended)
1. Create SonarCloud account
2. Import your GitHub repository
3. Get the token
4. Add token to GitHub secrets
5. Update project key and organization in workflow

### Option 2: Temporarily Disable
1. Add `if: false` to the sonarcloud job
2. Re-run workflows
3. Set up SonarCloud later when ready

### Option 3: Remove Completely
1. Delete `.github/workflows/sonarcloud.yml`
2. Remove references from documentation
3. Rely on other security scanning tools

## Support

If you need help setting up SonarCloud:
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [GitHub Actions Integration](https://docs.sonarcloud.io/advanced-setup/ci-based-analysis/github-actions/)
- [SonarCloud Community Forum](https://community.sonarsource.com/c/sc/10)
