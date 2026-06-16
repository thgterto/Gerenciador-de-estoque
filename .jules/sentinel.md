## 2025-02-28 - [Privilege Escalation via Mass Assignment]
**Vulnerability:** The `/api/auth/register` endpoint allowed unauthenticated users to specify their `role` (e.g. `ADMIN` or `USER`) during registration, enabling unauthorized privilege escalation.
**Learning:** By directly parsing and passing optional sensitive fields from public endpoints into the business logic, the application inadvertently exposed critical parameters.
**Prevention:** Remove sensitive fields like `role` from public registration validation schemas, ensuring that publicly created users default safely to `USER` roles only.
