## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-23 - Hardcoded Credentials in Source Code
**Vulnerability:** Found hardcoded `admin/admin` and `operador/operador` credentials directly in `context/AuthContext.tsx`.
**Learning:** Even in "offline/portable" tools, hardcoding credentials in the frontend source code is a critical risk as it allows anyone with access to the source (or minified bundle) to extract passwords.
**Prevention:** Implement proper credential hashing and storage (e.g., in the local SQLite DB) or use environment variables for default credentials that are not committed to version control.

## 2025-05-23 - External CDN Reliance in Offline App
**Vulnerability:** `index.html` was loading ECharts from `cdn.jsdelivr.net`, exposing the app to supply chain attacks and breaking offline functionality.
**Learning:** "Portable" apps must bundle all dependencies. Relying on CDNs for core libraries defeats the purpose of offline capability and introduces unnecessary trust in third-party infrastructure.
**Prevention:** Audit `index.html` for external `<script>` tags and replace them with bundled imports. Enforce strict CSP to block unauthorized external domains.
