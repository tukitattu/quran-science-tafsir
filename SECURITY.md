# Security Policy

## Supported versions

The latest published release (web + APK) receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

- Use GitHub's private vulnerability reporting:
  <https://github.com/tukitattu/quran-science-tafsir/security/advisories/new>
- Or email the maintainer listed on the repository profile.

Include the affected URL or app version, a short reproduction, and the impact.
We aim to acknowledge within 72 hours and ship a fix within 14 days for
confirmed issues.

## Scope

In scope:

- The static site at <https://tukitattu.github.io/quran-science-tafsir/>
- The Flutter APKs attached to GitHub Releases
- This repository's GitHub Actions workflows

Out of scope:

- Third-party audio/video CDNs and Wikipedia content linked from the app
- Denial of service through deliberate large downloads
- Issues that require a rooted device or a compromised browser profile

## Built-in protections

| Area | Control |
|------|---------|
| Web | Meta CSP (Pages cannot set headers), strict referrer + permissions policy, `noopener noreferrer` on external links |
| Web data | Wikipedia/REST output escaped and stripped of markup; notes import accepts ayah-keyed primitives only |
| Service worker | Cache versioning and same-origin notification URL validation |
| Android | HTTPS-only network security config, backups/device transfer disabled, minimal permissions |
| Release | APKs must be release-signed (debug signatures rejected), zip-aligned and JNI-signature verified in CI |
| Supply chain | All GitHub Actions pinned to full commit SHAs; `contents: read` by default |
