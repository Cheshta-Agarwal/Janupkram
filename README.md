# Janupkram — Pan-India Open Societal Innovation Collaboration Portal

**Janupkram** is a full-stack MERN civic-technology and societal R&D collaboration platform **engineered by students at Lovely Professional University (LPU)** for citizens, campus innovation cells, civic nodal moderators, and industry CSR partners across India.

Janupkram turns crowdsourced and citizen-reported urban/rural problems into **audited engineering prototypes and tracked civic deployments**—connecting grassroots issue discovery, municipal accountability, academic R&D execution, and CSR grant transparency in one unified workspace.

- **Live Deployment:** [https://janupkram.onrender.com](https://janupkram.onrender.com)
- **Repository:** [https://github.com/Cheshta-Agarwal/Janupkram](https://github.com/Cheshta-Agarwal/Janupkram)

---

## Table of Contents

- [Core Architecture: The Quadruple-Helix Model](#core-architecture-the-quadruple-helix-model)
- [Key Features & Implemented Modules](#key-features--implemented-modules)
- [Tech Stack](#tech-stack)
- [Monorepo Directory Structure](#monorepo-directory-structure)
- [Challenge Lifecycle State Machine](#challenge-lifecycle-state-machine)
- [Frontend Routes](#frontend-routes)
- [REST API Reference](#rest-api-reference)
- [Seeded Demo Accounts](#seeded-demo-accounts)
- [Local Development Setup](#local-development-setup)
- [Single-Service Deployment on Render + MongoDB Atlas](#single-service-deployment-on-render--mongodb-atlas)

---

## Core Architecture: The Quadruple-Helix Model

Janupkram unites **four verified stakeholder roles** across a transparent, role-guarded workflow:

1. **Citizens & Communities (`citizen`)**
   - Report challenges across **7 categories** (`agriculture`, `healthcare`, `sanitation`, `education`, `environment`, `infrastructure`, `other`) with interactive Leaflet map pinning, GPS coordinates, live camera evidence capture, voice-to-text input, and up to 5 photos.
   - Receive live **2km spatial proximity warnings** before submitting duplicates and upvote community priorities.
   - Escalate verified challenges directly to municipal/central authorities and vote in **Community Resolution Verification Polls**.

2. **Civic Nodal Moderators (`admin`)**
   - Screen incoming challenges with a **2km `$near` Spatial Duplicate Detector** powered by MongoDB `2dsphere` geospatial indexes.
   - Validate, place `under_review`, or `reject` submissions (with mandatory `rejectionReason` and optional `duplicateOf` link).
   - Route validated issues via a **Smart University Router** to domain-matched campus R&D cells, audit KYC verification queues, and update municipal escalation acknowledgment statuses.

3. **Universities & LPU Student R&D Teams (`university`)**
   - Browse validated/routed challenges and form student-faculty teams (`abstract`, `methodology`, `expectedImpact`, `estimatedBudget`, team roster, and milestones).
   - Track milestone execution (`pending` → `in_progress` → `completed`) with deliverable URLs, log component expenses in the **CSR Budget Utilization Ledger**, upload geotagged **"After" Resolution Proof**, advance solutions to `piloted` / `deployed`, and issue QR-verified **Impact Certificates**.

4. **Industry & CSR Partners (`industry`)**
   - Discover validated and active R&D challenges in the innovation marketplace.
   - Pledge **CSR Funding Grants**, **Technical Mentorship**, **Prototyping Support**, or **Field Deployment** partnerships directly to student teams, and analyze impact metrics on the Executive Analytics dashboard.

---

## Key Features & Implemented Modules

### 1. Pan-India Spatial Explorer & Interactive Maps
- Coverage across **12 Indian city & campus hubs**: `Phagwara (LPU Belt)`, `New Delhi / NCR`, `Bengaluru`, `Pune`, `Hyderabad`, `Jaipur`, `Mumbai`, `Chandigarh`, `Chennai`, `Kolkata`, `Lucknow`, and `Bhubaneswar`.
- Real-time filtering by **region hub**, **category**, and **search keywords** (title, description, city, or source platform).
- Powered by Leaflet & `react-leaflet` using **Esri World Street Map** and **Esri World Topo Map** tiles (`Street`, `Dark`, and `Terrain` switchers) with dark-mode tile inversion styling so roads and labels stay crisp in both themes.

### 2. Crowdsourced Civic Discovery & Direct Authority Escalation
- Supports importing/tagging real-world civic issues discovered on **Reddit** (`r/bangalore`, `r/delhi`, `r/pune`, `r/jaipur`, `r/india`), **X**, or direct citizen field reports (`sourcePlatform`, `sourceUrl`, `externalTicketId`).
- **Connected Reporting Portals:** Quick links to **CPGRAMS (`pgportal.gov.in`)**, **Swachhata-MoHUA (`sbmurban.org`)**, **MyGov India**, **Reddit Civic Communities**, and **X Public Grievance Grid**.
- **Direct Authority Escalation Engine (`AuthorityEscalationModal`):** Auto-matches issues by city and category to official civic handles & portals (**BBMP**, **MCD**, **PMC**, **CPCB**, **MoHUA**, **MoRTH**, **CPGRAMS/DARPG**), pre-drafts formal grievance messages, and logs dispatched escalations with live admin status tracking (`dispatched` → `acknowledged` → `resolved_by_authority`).

### 3. Rich Stakeholder Profiles, KYC Pipeline & Privilege Gating
- Public stakeholder pages (`/profile/:id`) and private KYC settings (`/settings/verification`) supporting role-specific attributes:
  - **Citizens:** Ward/constituency, civic karma score, endorsement count, reported/resolved history.
  - **Universities:** AISHE/NAAC code, lab capabilities, GitHub/portfolio URLs, active proposals.
  - **Industry / CSR Partners:** CIN/GSTIN, Schedule VII CSR focus areas, mentorship slots, total grants disbursed.
  - **Moderators:** Official designation and municipal/regional jurisdiction.
- Document upload workflow (`gov_id`, `aishe_naac`, `cin_csr1`, etc.) transitioning accounts through `unverified` → `pending_review` → `verified` (awards Shield Badge + `+50` Civic Karma) or `rejected` (with moderator feedback).
- **Privilege Gating (`requireVerified` middleware):** Direct authority escalations (`POST /api/challenges/:id/escalate`), university proposals (`POST /api/proposals`), and industry CSR pledges (`POST /api/partnerships`) require a `verified` account.

### 4. Ground-Truth Evidence, Voice Input & Citizen Sign-Off
- **Live Camera & GPS Capture:** Mobile-friendly field camera upload (`capture="environment"`) storing live timestamp and GPS verification metadata (`captureMetadata`), alongside smart keyword category suggestions.
- **Voice-to-Text Reporting:** Integrated Web Speech API dictation button on challenge submission (`SubmitChallengePage`) plus **English (`en`)**, **Hindi (`hi`)**, and **Punjabi (`pa`)** navbar/UI language switcher (`LanguageContext`).
- **Before & After Proof + Community Poll:** University/admin/citizen teams attach geotagged "After" resolution photos (measuring exact Haversine distance in meters from the original incident site), notifying the original reporter and upvoters to cast **Confirmed Resolved / Still Unresolved** votes.

### 5. Real-Time Collaboration, CSR Budget Ledger & QR Certificates
- **Public Q&A + Private Team War-Room:** Open citizen/researcher Q&A thread on every challenge plus an access-controlled **Private War-Room** restricted to the assigned university, accepted CSR partner, and nodal admin.
- **CSR Budget Utilization Ledger (`POST /api/proposals/:id/budget`):** Line-item hardware/prototyping expense logging with invoice links for full financial transparency.
- **QR-Verified Innovation Certificates (`/verify/cert/:proposalId`):** Print/PDF-ready R&D impact credential with deterministic verification QR visual, team roster, faculty mentor, and milestone completion summary.

### 6. Accessibility, Analytics & Media Fallback
- **Dark & Light Mode (`ThemeContext`)** with system preference detection and `localStorage` persistence.
- **Global Command Palette (`Ctrl+K` / `⌘K`)** for instant challenge search and workspace navigation.
- **Executive Analytics (`/analytics`):** Recharts pipeline funnel, domain pie breakdown, city/region metrics, university leaderboard, and one-click CSV export.
- **Public Open Civic JSON Feed:** Unauthenticated JSON endpoint (`GET /api/challenges/open-feed/public`) for RWA embeds and open civic monitoring.
- **Resilient Media Storage:** Automatically uploads images/PDFs to **Cloudinary** when configured, and falls back to local `/uploads` static storage when omitted.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18 (`^18.3.1`), Vite 5 (`^5.4.10`), React Router DOM v6 (`^6.28.0`), Tailwind CSS 3 (`^3.4.14`), Axios (`^1.7.7`), Leaflet (`^1.9.4`) + `react-leaflet` (`^4.2.1`), Recharts (`^2.13.3`), Lucide React (`^0.454.0`) — *Plain ES6+ JavaScript only* |
| **Backend** | Node.js, Express.js (`^4.21.1`), Mongoose ODM (`^8.8.1`), JWT (`jsonwebtoken ^9.0.2`), `bcryptjs` (`^2.4.3`), `multer` (`^1.4.5-lts.1`), `cloudinary` (`^2.5.1`), `helmet` (`^8.0.0`), `cors` (`^2.8.5`), `morgan` (`^1.10.0`) |
| **Database** | MongoDB / MongoDB Atlas with `2dsphere` GeoJSON spatial indexing & automatic DNS SRV fallback (`8.8.8.8`, `1.1.1.1`) |

---

## Monorepo Directory Structure

```text
societal-innovation-portal/
├── package.json                         # Root build & start scripts (single-service Render deployment)
├── README.md
├── server/
│   ├── config/
│   │   ├── db.js                        # MongoDB connection with Atlas DNS SRV fallback
│   │   └── cloudinary.js                # Cloudinary upload + automatic local /uploads fallback
│   ├── middleware/
│   │   ├── auth.js                      # verifyToken, optionalAuth, allowRoles, requireVerified
│   │   ├── upload.js                    # Multer memory storage (max 8MB/file, 5 files)
│   │   └── errorHandler.js              # Unified Express JSON error formatter
│   ├── models/
│   │   ├── User.js                      # Roles, KYC docs, verificationStatus, civicKarma, endorsements
│   │   ├── Challenge.js                 # GeoJSON 2dsphere index, escalations, comments, resolutionProof & votes
│   │   ├── Proposal.js                  # Team members, milestones, CSR budgetEntries ledger
│   │   ├── Partnership.js               # CSR funding, mentorship, prototyping & field deployment offers
│   │   ├── Notification.js
│   │   └── ActivityLog.js               # Immutable lifecycle audit log
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── challenges.js
│   │   ├── proposals.js
│   │   ├── partnerships.js
│   │   ├── analytics.js
│   │   └── notifications.js
│   ├── seed/
│   │   └── seedData.js                  # Idempotent auto-seed & legacy account upgrade
│   ├── utils/
│   │   ├── stateMachine.js              # Enforces valid challenge status transitions
│   │   └── auditAndNotify.js            # Writes ActivityLog & bulk Notification entries
│   ├── .env.example
│   ├── package.json
│   └── server.js                        # Express API + static client/dist SPA server
└── client/
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── api/axios.js
        ├── context/                     # AuthContext, LanguageContext, ThemeContext, ToastContext
        ├── components/                  # AuthorityEscalationModal, ChallengeCard, CommandPalette, LifecycleStepper, MapPicker, Navbar, NotificationBell, ProtectedRoute, StatusBadge, VerifiedBadge
        ├── pages/                       # Landing, Login, Register, ChallengeDetail, Profile, VerificationSettings, CertificateVerify, Citizen, Admin, Analytics, University, Industry
        └── utils/                       # authorities.js, constants.js
```

---

## Challenge Lifecycle State Machine

```text
submitted ─▶ under_review ─▶ validated ─▶ routed ─▶ team_formed ─▶ in_progress ─▶ piloted ─▶ deployed
    │             │
    └─────────────┴──▶ rejected (requires mandatory rejectionReason & optional duplicateOf link)
```

---

## Frontend Routes

| Route | Access | Page |
| :--- | :--- | :--- |
| `/` | Public | Pan-India Spatial Explorer, live overview KPIs, portal directory & challenge discovery |
| `/login`, `/register` | Public | Authentication with 1-click demo login buttons & role registration |
| `/challenges/:id` | Public / Role-enhanced | 360° Challenge Dossier, Authority Escalation, Public Q&A / Private War-Room, Before/After Proof & Poll |
| `/profile/:id` | Public | Rich Stakeholder Profile, Civic Karma badge & community endorsement toggle |
| `/verify/cert/:proposalId` | Public | QR-Verified Printable Certificate of Societal R&D Impact |
| `/settings/verification` | Authenticated | Profile editor & KYC document submission portal |
| `/citizen`, `/citizen/submit` | `citizen` | Citizen Dashboard & Challenge Submission with GPS/camera/voice capture |
| `/admin` | `admin` | Nodal Moderation Queue, 2km Spatial Duplicate Detector, University Router & KYC Audit Queue |
| `/analytics` | `admin`, `industry` | Executive Funnel, Regional Charts, University Leaderboard & CSV Export |
| `/university` | `university` | R&D Workspace, Proposal Builder, Milestone Tracker & CSR Budget Ledger |
| `/industry` | `industry` | CSR Collaboration Marketplace & Grant Tracking Dashboard |

---

## REST API Reference

| Module | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Public | Register `citizen`, `university`, or `industry` user |
| **Auth** | `POST /api/auth/login` | Public | Authenticate & receive JWT + user profile |
| **Auth** | `GET /api/auth/me` | Authenticated | Fetch current authenticated user |
| **Auth** | `GET /api/auth/users?role=university` | Authenticated | List registered universities & domain specializations |
| **Profile & KYC** | `GET /api/profile/leaderboard/karma` | Public | Top 20 contributors ranked by Civic Karma |
| **Profile & KYC** | `GET /api/profile/:id` | Public / Optional | Rich stakeholder profile + stats + activity lists |
| **Profile & KYC** | `PATCH /api/profile/me` | Authenticated | Update role-specific profile fields |
| **Profile & KYC** | `POST /api/profile/verification` | Authenticated | Upload KYC verification document (`multipart/form-data`) |
| **Profile & KYC** | `GET /api/profile/verification/queue` | `admin` | View pending/all KYC submissions |
| **Profile & KYC** | `PATCH /api/profile/:id/verify` | `admin` | Approve (`verified`, `+50` karma) or `rejected` KYC |
| **Profile & KYC** | `POST /api/profile/:id/endorse` | Authenticated | Toggle community endorsement (`±5` karma) |
| **Challenges** | `GET /api/challenges` | Public / Optional | Paginated search & filter with proposal/partnership counts |
| **Challenges** | `GET /api/challenges/open-feed/public` | Public | Open Civic JSON API for embeds & RWAs |
| **Challenges** | `GET /api/challenges/spatial/nearby` | Public | Geospatial query within radius (`lat`, `lng`, `radiusMeters`) |
| **Challenges** | `GET /api/challenges/:id/duplicates` | `admin` | 2km `$near` spatial duplicate detector |
| **Challenges** | `GET /api/challenges/:id` | Public / Optional | 360° challenge detail, proposals, partnerships & audit logs |
| **Challenges** | `POST /api/challenges` | `citizen` | Submit challenge with up to 5 media files & GPS/source metadata |
| **Challenges** | `PATCH /api/challenges/:id/review` | `admin` | Mark `under_review`, `validated`, or `rejected` |
| **Challenges** | `PATCH /api/challenges/:id/route` | `admin` | Route challenge to a registered university R&D cell |
| **Challenges** | `PATCH /api/challenges/:id/status` | `admin`, `university` | Advance lifecycle (`piloted`, `deployed`, etc.) |
| **Challenges** | `POST /api/challenges/:id/escalate` | Verified (`admin`/`citizen`/`university`) | Log direct escalation to municipal/central authority |
| **Challenges** | `PATCH /api/challenges/:id/escalations/:escId` | `admin` | Update authority escalation status |
| **Challenges** | `POST /api/challenges/:id/comments` | Authenticated | Post Public Q&A or Private War-Room note |
| **Challenges** | `POST /api/challenges/:id/resolution-proof` | `university`, `admin`, `citizen` | Upload geotagged "After" resolution proof |
| **Challenges** | `POST /api/challenges/:id/resolution-vote` | Authenticated | Cast `resolved` / `unresolved` verification poll vote |
| **Challenges** | `POST /api/challenges/:id/upvote` | Authenticated | Toggle community upvote |
| **Proposals** | `GET /api/proposals` | Authenticated | List proposals filtered by challenge, university, or status |
| **Proposals** | `POST /api/proposals` | Verified `university` | Submit student-faculty team proposal & milestones |
| **Proposals** | `PATCH /api/proposals/:id/milestones/:milestoneId` | `university`, `admin` | Update milestone progress & deliverable link |
| **Proposals** | `POST /api/proposals/:id/budget` | `university`, `admin` | Log hardware/prototyping expense to CSR budget ledger |
| **Proposals** | `GET /api/proposals/:id/certificate` | Public | Fetch QR-verified certificate payload & milestone completion stats |
| **Partnerships** | `GET /api/partnerships` | Authenticated | List industry CSR/mentorship offers |
| **Partnerships** | `POST /api/partnerships` | Verified `industry` | Propose CSR funding, mentorship, or deployment support |
| **Partnerships** | `PATCH /api/partnerships/:id/respond` | `university`, `admin` | Accept, decline, or complete a partnership |
| **Analytics** | `GET /api/analytics/overview` | Public | Public landing KPI counters |
| **Analytics** | `GET /api/analytics/dashboard` | `admin`, `industry` | Funnel, category distribution, regional stats & university leaderboard |
| **Notifications** | `GET /api/notifications` | Authenticated | Fetch notifications & unread count |
| **Notifications** | `PATCH /api/notifications/read-all` | Authenticated | Mark all notifications read |

---

## Seeded Demo Accounts

Janupkram automatically seeds MongoDB on startup when `User.countDocuments() === 0` (and provides **1-click Demo Login** buttons on `/login`). All demo accounts share the same password:

**Demo Password:** `Password@123`

| Role | Name / Organization | Email |
| :--- | :--- | :--- |
| **Citizen** | Aarav Sharma (`Phagwara / Open Community`) | `citizen@janupkram.org` |
| **Nodal Moderator** | Dr. Meenakshi Nair (`Central Moderation Cell`) | `admin@janupkram.org` |
| **University (LPU)** | Lovely Professional University (LPU) Innovation Studio | `innovation@lpu.co.in` |
| **Partner University** | National University R&D Alliance | `research@campus-hub.edu.in` |
| **Industry / CSR Partner** | Bharat Tech & CSR Foundation | `csr@industry-collab.org` |

---

## Local Development Setup

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** local instance (`mongodb://127.0.0.1:27017`) or a **MongoDB Atlas** connection string

### 1. Environment Configuration
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/janupkram_portal
JWT_SECRET=janupkram_lpu_super_secret_change_in_prod
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional Cloudinary credentials (omit to store uploads locally under /uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 2. Install & Run Backend (Port `5000`)
```bash
cd server
npm install
npm run seed   # Optional: server auto-seeds if database has 0 users
npm run dev
```

### 3. Install & Run Frontend (Port `5173`)
```bash
cd client
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Single-Service Deployment on Render + MongoDB Atlas

The root `package.json` configures **Janupkram** to build the Vite frontend and serve both `client/dist` and `/api/*` from a single Node/Express Render Web Service:

1. **MongoDB Atlas Network Access:** Add `0.0.0.0/0` to IP Access List and create a database user.
2. **Render Web Service Settings:**
   - **Language:** `Node`
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
3. **Render Environment Variables:**
   - `MONGO_URI` — MongoDB Atlas SRV connection string (`mongodb+srv://...`)
   - `JWT_SECRET` — Strong production secret key
   - `JWT_EXPIRES_IN` — `7d`
   - *(Optional)* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## Built With Pride at LPU

Designed and engineered by students at **Lovely Professional University (LPU)** as an open Pan-India civic & academic R&D collaboration portal.
