## 2025-02-17 - Secure Password Storage
**Vulnerability:** Plain text passwords stored in client-side code (`AuthContext.tsx`).
**Learning:** Even in mock/prototype authentication systems, storing credentials in plain text is a dangerous practice that can be accidentally deployed or serve as a bad example.
**Prevention:** Always hash credentials before storage, even in mocks. Used `crypto.subtle` (SHA-256) for a browser-native, zero-dependency hashing solution suitable for this architecture.
