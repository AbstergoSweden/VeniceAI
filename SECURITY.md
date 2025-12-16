# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow responsible disclosure practices.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, email us privately at:

📧 **<security@venice-generator.dev>** (or your designated security  email)

### What to Include

Please provide the following information:

1. **Description**: Clear description of the vulnerability
2. **Impact**: What attacker can achieve
3. **Steps to Reproduce**: Detailed reproduction steps
4. **Proof of Concept**: Code demonstrating the issue (if applicable)
5. **Suggested Fix**: If you have a proposed solution
6. **Your Contact**: How we can reach you for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days (severity and impact evaluation)
- **Fix Timeline**:
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days
- **Public Disclosure**: After fix is deployed and users have had time to update

### Coordinated Disclosure

We follow a **90-day disclosure timeline**:

1. Vulnerability reported to us
2. We confirm and develop a fix
3. Fix is released and users notified
4. After 90 days (or when 95%+ of users updated), public disclosure

We respect security researchers and will:

- Credit you in release notes (if desired)
- Keep you updated on our progress
- Work with you on timing of disclosure

---

## Security Best Practices

### For Users

#### API Key Security

**✅ DO:**

- Store API keys in `.env` files (never committed)
- Use environment variables (`import.meta.env.VITE_*`)
- Rotate keys regularly
- Use separate keys for development and production

**❌ DON'T:**

- Hardcode API keys in source code
- Commit `.env` files to version control
- Share API keys in chat, email, or screenshots
- Use production keys in development

#### Firebase Security

**✅ DO:**

- Enable Firebase Security Rules
- Use Anonymous Auth or proper authentication
- Restrict Firestore read/write permissions
- Enable App Check for production

**❌ DON'T:**

- Use default "allow all" Firestore rules in production
- Expose Firebase Admin SDK credentials
- Commit `firebase-config.js` with real credentials

**Recommended Firestore Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      // Users can only read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Web3/MetaMask Security

**✅ DO:**

- Verify transaction details before confirming
- Use testnet for development
- Start with small amounts
- Audit smart contracts

**❌ DON'T:**

- Sign transactions you don't understand
- Share your seed phrase or private keys
- Use the same wallet for testing and real funds
- Trust unaudited contracts

#### Content Security Policy

The app includes a CSP header in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               connect-src 'self' https://api.venice.ai https://firestore.googleapis.com; 
               img-src 'self' data: blob: https:;">
```

**For Production:**

- Remove `'unsafe-inline'` and `'unsafe-eval'` if possible
- Restrict `connect-src` to only needed domains
- Use nonces or hashes for inline scripts

---

## Known Security Considerations

### 1. API Key Exposure

**Risk**: API keys could be exposed in client-side code

**Mitigation**:

- All keys loaded from environment variables
- `.env` files ignored by git
- Keys rotated on compromise
- Rate limiting on Venice.ai side

**User Action**: Never commit `.env` or hardcode keys

### 2. Firebase Client Access

**Risk**: Firebase config visible in client code

**Mitigation**:

- Firebase Security Rules enforce authorization
- Anonymous auth limits abuse
- Firestore rules restrict data access by user ID
- App Check recommended for production

**User Action**: Configure Firestore Security Rules properly

### 3. Local Storage

**Risk**: Generated images stored in browser localStorage

**Mitigation**:

- Images compressed before storage
- Sensitive images can be cleared manually
- No PII stored in localStorage

**User Action**: Use cache clear feature for sensitive content

### 4. Cross-Site Scripting (XSS)

**Risk**: User-generated content could inject scripts

**Mitigation**:

- React escapes all content by default
- CSP headers restrict script execution
- No `dangerouslySetInnerHTML` used

**User Action**: Keep dependencies updated

### 5. Dependency Vulnerabilities

**Risk**: Third-party packages may have vulnerabilities

**Mitigation**:

- Regular `npm audit` checks
- Automated Dependabot updates (if enabled)
- Locked versions in `package-lock.json`

**User Action**: Run `npm audit` before deploying

---

## Security Checklist for Deployment

Before deploying to production:

- [ ] All API keys in environment variables
- [ ] `.env` file not committed to git
- [ ] Firebase Security Rules configured
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] CSP headers configured properly
- [ ] HTTPS enabled (not HTTP)
- [ ] No console.log with sensitive data
- [ ] Error messages don't expose internal details
- [ ] Rate limiting configured on backend
- [ ] Monitoring and logging enabled

---

## Vulnerability Disclosure History

We will publicly disclose resolved vulnerabilities here:

### 2025

No vulnerabilities disclosed yet.

---

## Security Tools

### Recommended Tools

**For Developers:**

- `npm audit`: Check for known vulnerabilities
- `git-secrets`: Prevent committing secrets
- `eslint`: Catch common security issues

**For Users:**

- **1Password/Bitwarden**: Secure password/key management
- **MetaMask**: Hardware wallet support
- **Firebase App Check**: Protect against abuse

### Running Security Scans

```bash
# Check for vulnerable dependencies
npm audit

# Fix automatically (if possible)
npm audit fix

# Check for secrets in git history
git log --all --full-history --source -- '*secret*' '*key*' '.env'

# Scan for hardcoded credentials
grep -r "api.*key" src/ --exclude-dir=node_modules
```

---

## Security Updates

We announce security updates through:

1. **GitHub Security Advisories**
2. **Release Notes** (tagged as SECURITY)
3. **Email** to registered users (if applicable)
4. **Discord Announcements** (if community server exists)

Subscribe to releases on GitHub to stay informed.

---

## Rewards

While we don't currently have a formal bug bounty program, we:

- Publicly acknowledge security researchers (with permission)
- Provide attribution in release notes and CVEs
- May offer rewards on a case-by-case basis for critical findings

---

## Questions About Security?

For security questions that aren't vulnerabilities:

- **GitHub Discussions**: Public security best practices
- **Email**: <security@venice-generator.dev>

For responsible vulnerability disclosure, always use private email.

---

## Attribution

This security policy is based on industry best practices and is regularly updated to reflect the current security posture of the project.

**Last Updated**: 2025-12-16
