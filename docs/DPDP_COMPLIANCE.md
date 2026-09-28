# 🛡️ SAHAAY — DPDP Act (2023) Compliance & Data Privacy Architecture

## 1. Executive Summary
Land records, cadastral surveys, compensation details, and identification credentials (PAN, Aadhaar) represent sensitive personal data under India's **Digital Personal Data Protection (DPDP) Act, 2023**.

SAHAAY is architected with privacy-by-design principles to ensure full statutory compliance, transparency, and data sovereignty for affected landowners and citizens.

---

## 2. Key Privacy Principles Implemented

### 2.1 Aadhaar & Identity Data Protection
- **Masked Storage**: Full 12-digit Aadhaar numbers are never stored in plain text. Only masked references (e.g., `XXXX-XXXX-8921`) and virtual verification hashes are retained in the database.
- **PAN Card Handling**: PAN numbers are validated and stored alongside cryptographic verification timestamps. Uploaded identification scans are access-controlled and restricted via role-based access control (RBAC).

### 2.2 IDOR & Access Control Security
- **Strict Invariable Ownership**: Land records, case files, compensation records, and submitted grievances can only be accessed by the registered landowner (`req.user.userId === case.citizenId`) or verified Land Acquisition Officers with `ROLE=OFFICER`/`ROLE=ADMIN`.
- **Zero Cross-Citizen Leaks**: Even if a citizen knows another parcel or case ID, backend route guards reject unauthorized queries with `403 FORBIDDEN_CASE_ACCESS`.

### 2.3 Purpose Limitation & Consent
- **Notice & Consent**: Citizens provide clear, affirmative consent during registration and document upload for processing land notices under the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act (RFCTLARR), 2013**.
- **No Third-Party Sharing**: Data is strictly processed for acquisition tracking, discrepancy verification, compensation determination, and grievance redressal.

### 2.4 Document Storage & Encryption
- **At-Rest Encryption**: Files stored in local storage or S3/Cloudflare R2 buckets utilize AES-256 server-side encryption.
- **In-Transit Encryption**: All API traffic is secured with TLS 1.3/HTTPS and hardened Content Security Policies (CSP).

---

## 3. Data Subject Rights (Citizens)
Under the DPDP Act 2023, SAHAAY provides citizens with:
1. **Right to Access**: Citizens can view all documents, notices, and assessment records tied to their land parcel.
2. **Right to Correction**: Citizens can raise Section 15 objections and grievances for incorrect land area, wrong survey numbers, or disputed ownership.
3. **Right to Grievance Redressal**: Direct communication channel with designated Land Acquisition Officers with statutory resolution timelines.
