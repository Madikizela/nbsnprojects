# GitHub Actions Workflow Fixes

## Date: July 28, 2026

## Issues Addressed

### 1. Node.js 20 Deprecation Warning ✅
**Problem**: GitHub Actions is deprecating Node.js 20, forcing workflows to use Node.js 24
**Error Message**: 
```
Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24
```

**Solution**: Updated all Node.js versions from 22 to 24 in all workflow files

**Files Updated**:
- `.github/workflows/sonarcloud.yml`
- `.github/workflows/codeql-analysis.yml`
- `.github/workflows/owasp-dependency-check.yml`
- `.github/workflows/snyk-security.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/artillery-test.yml`

---

### 2. CodeQL Action v3 Deprecation ✅
**Problem**: CodeQL Action v3 will be deprecated in December 2026
**Warning Message**:
```
CodeQL Action v3 will be deprecated in December 2026. Please update to v4.
```

**Solution**: Updated all CodeQL action versions from v3 to v4

**Actions Updated**:
- `github/codeql-action/init@v3` → `@v4`
- `github/codeql-action/analyze@v3` → `@v4`
- `github/codeql-action/upload-sarif@v3` → `@v4`

**Files Updated**:
- `.github/workflows/codeql-analysis.yml`
- `.github/workflows/owasp-dependency-check.yml`
- `.github/workflows/docker-security.yml`
- `.github/workflows/snyk-security.yml`

---

### 3. Missing SARIF Report Error ✅
**Problem**: OWASP Dependency Check workflow tried to upload non-existent SARIF file
**Error Message**:
```
Error: Path does not exist: reports/dependency-check-report.sarif
```

**Solution**: Added conditional check before uploading SARIF file
```yaml
if: always() && hashFiles('reports/dependency-check-report.sarif') != ''
```

**Files Updated**:
- `.github/workflows/owasp-dependency-check.yml`

---

### 4. Missing Security Permissions ✅
**Problem**: Workflows didn't have permission to access CodeQL Action API endpoints
**Error Message**:
```
This run of the CodeQL Action does not have permission to access the CodeQL Action API endpoints.
Resource not accessible by integration
```

**Solution**: Added explicit permissions to all security-related jobs
```yaml
permissions:
  contents: read
  security-events: write
```

**Jobs Updated**:
- `sonarcloud` job in `sonarcloud.yml`
- `dependency-check` job in `owasp-dependency-check.yml`
- `docker-scan` job in `docker-security.yml`
- `snyk-frontend` job in `snyk-security.yml`
- `snyk-backend` job in `snyk-security.yml`
- `snyk-flutter` job in `snyk-security.yml`
- `snyk-code` job in `snyk-security.yml`

---

## Summary of Changes

### Workflow Files Modified: 7
1. `.github/workflows/sonarcloud.yml`
2. `.github/workflows/codeql-analysis.yml`
3. `.github/workflows/owasp-dependency-check.yml`
4. `.github/workflows/docker-security.yml`
5. `.github/workflows/snyk-security.yml`
6. `.github/workflows/deploy.yml`
7. `.github/workflows/artillery-test.yml`

### Changes Per File:

#### sonarcloud.yml
- ✅ Updated Node.js: 22 → 24
- ✅ Added permissions: `contents: read`, `security-events: write`

#### codeql-analysis.yml
- ✅ Updated Node.js: 22 → 24
- ✅ Updated CodeQL init: v3 → v4
- ✅ Updated CodeQL analyze: v3 → v4
- ✅ Permissions already present (no change needed)

#### owasp-dependency-check.yml
- ✅ Updated Node.js: 22 → 24
- ✅ Updated CodeQL upload-sarif: v3 → v4
- ✅ Added conditional check for SARIF file existence
- ✅ Added permissions: `contents: read`, `security-events: write`

#### docker-security.yml
- ✅ Updated CodeQL upload-sarif: v3 → v4
- ✅ Added permissions: `contents: read`, `security-events: write`

#### snyk-security.yml
- ✅ Updated Node.js: 22 → 24 (frontend job)
- ✅ Updated all CodeQL upload-sarif: v3 → v4 (4 instances)
- ✅ Added permissions to all 4 jobs:
  - snyk-frontend
  - snyk-backend
  - snyk-flutter
  - snyk-code

#### deploy.yml
- ✅ Updated Node.js: 22 → 24

#### artillery-test.yml
- ✅ Updated Node.js: 22 → 24

---

## Expected Results

After these changes, the following should be resolved:

### ✅ No More Deprecation Warnings
- Node.js 20 deprecation warnings eliminated
- CodeQL Action v3 deprecation warnings eliminated

### ✅ Security Scanning Works Properly
- SARIF reports upload successfully when they exist
- All security jobs have proper permissions
- CodeQL analysis can access required API endpoints

### ✅ Future-Proof
- Using latest stable versions (Node 24, CodeQL v4)
- Workflows ready for long-term use
- No breaking changes expected until next major deprecation cycle

---

## Testing Recommendations

1. **Trigger Workflows Manually**:
   - Go to Actions tab in GitHub
   - Run each workflow manually using "workflow_dispatch"
   - Verify all jobs complete successfully

2. **Check Security Tab**:
   - Navigate to Security > Code scanning
   - Verify alerts are being uploaded
   - Check that all scanning tools are reporting

3. **Monitor Next Push**:
   - Make a small commit and push to main
   - Watch all workflows execute
   - Confirm no errors or warnings

4. **Review Artifacts**:
   - Check that test reports are being uploaded
   - Verify SARIF files are created when expected
   - Ensure artifact retention is working

---

## Rollback Instructions

If any issues occur, you can revert by:

1. **Node.js Version**: Change `node-version: '24'` back to `node-version: 22`
2. **CodeQL Version**: Change `@v4` back to `@v3` in CodeQL actions
3. **Permissions**: Remove `permissions:` blocks from job definitions
4. **SARIF Check**: Remove `hashFiles()` condition from upload-sarif steps

However, this is not recommended as these changes address deprecation notices and improve security scanning reliability.

---

## Notes

- All changes are backward compatible
- No changes to actual test logic or scanning configuration
- Permissions follow principle of least privilege (read contents, write security events)
- Conditional SARIF upload prevents false negatives in workflows
- Node.js 24 is the current LTS version supported by GitHub Actions
