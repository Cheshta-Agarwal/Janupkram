# Janupkram — Open Societal Innovation Collaboration Portal

**Janupkram** is a full-stack MERN civic-technology collaboration platform **engineered by students at Lovely Professional University (LPU)** for communities, universities, civic moderators, and industry partners everywhere — not limited to any single state or region.

Janupkram bridges the gap between **real-world grassroots societal problems** and **academic R&D + industry CSR execution**, ensuring every reported challenge moves through an audited, transparent lifecycle from submission to field deployment.

---

## Key Highlights & Quadruple-Helix Model

Janupkram connects **four stakeholder roles** on one unified platform:

1. **Citizens & Communities (`citizen`)**
   - Report local challenges (Sanitation, Agriculture, Healthcare, Education, Environment, Infrastructure) anywhere on an interactive **OpenStreetMap** picker with GPS auto-location and up to 5 field evidence photos.
   - Smart keyword auto-tagging suggests the best category as you type.
   - Track personal submissions through a live 7-stage **Lifecycle Stepper** and upvote community priorities.

2. **Civic Nodal Moderators (`admin`)**
   - Review incoming submissions with a **2km Spatial Duplicate Detector** powered by MongoDB `2dsphere` `$near` geospatial queries (`$maxDistance: 2000`).
   - Validate legitimate challenges or reject duplicates/out-of-scope reports with mandatory reasons.
   - Route validated problems via a **Smart University Router** that ranks registered academic cells by matching domain specializations.

3. **Universities & LPU Student R&D Teams (`university`)**
   - Receive routed challenges and browse open validated challenges.
   - Build multidisciplinary student-faculty teams and submit structured technical proposals (`abstract`, `methodology`, `expectedImpact`, `estimatedBudget`, and 3–5 milestones).
   - Update milestone statuses (`pending` → `in_progress` → `completed`) with deliverable links (GitHub/Prototype videos), advance solutions to `piloted` (≥ 75%) and `deployed` (100%), and accept/decline industry partnership offers.

4. **Industry & CSR Partners (`industry`)**
   - Explore the open innovation marketplace of validated and active R&D challenges.
   - Propose **CSR Funding Grants**, **Technical Mentorship**, **Prototyping Support**, or **Field Deployment** partnerships directly to university teams.

---

## UI, UX & Unique Features

- **Dark & Light Mode (`ThemeContext`):** Instant toggle in the navbar with system preference detection, `localStorage` persistence, dark-mode Recharts styling, and automatic **CartoDB Dark Matter / OpenStreetMap Street / Terrain** map tile switching.
- **Responsive Across All Devices:** Mobile-first bento KPI grids, adaptive navigation drawer, touch-friendly controls, and horizontal-scroll-safe analytics tables and lifecycle steppers.
- **Tactile Micro-Interactions:** Animated hover elevation, gradient CTAs, spring press feedback, pulsing active-status beacons, and slide-in toast notifications (`ToastContext`).
- **Global Quick-Jump Command Palette (`Ctrl+K` / `⌘K`):** Search live challenges across regions, switch themes, or jump straight to workspaces from anywhere.
- **Printable Civic Dossier & CSV Analytics Export:** Export any challenge's 360° dossier via print/PDF (`@media print`) or download executive analytics breakdowns as CSV.
- **Automatic Local Media Fallback:** Uploads use **Cloudinary** when credentials are set, and seamlessly fall back to local `/uploads` static serving when omitted.

---

## Tech Stack

- **Frontend:** React 18 (Vite), React Router DOM v6, Tailwind CSS, Axios, Leaflet & `react-leaflet` (OpenStreetMap), Recharts, Lucide React *(Plain ES6+ JavaScript only)*.
- **Backend:** Node.js, Express.js, Mongoose ODM, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `multer`, `cloudinary`, `cors`, `helmet`, `morgan`.
- **Database:** MongoDB with `2dsphere` geospatial indexing.

---

## Monorepo Directory Structure

```text
societal-innovation-portal/
├── package.json                  # Single-service build & start scripts (Render ready)
├── README.md
├── server/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── cloudinary.js         # Cloudinary + automatic local /uploads fallback
│   ├── middleware/
│   │   ├── auth.js               # verifyToken, optionalAuth, allowRoles(...roles)
│   │   ├── upload.js             # Multer memory upload handler (max 5 files, 8MB each)
│   │   └── errorHandler.js       # Unified Express JSON error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Challenge.js          # Includes 2dsphere GeoJSON location index
│   │   ├── Proposal.js
│   │   ├── Partnership.js
│   │   ├── Notification.js
│   │   └── ActivityLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── challenges.js
│   │   ├── proposals.js
│   │   ├── partnerships.js
│   │   ├── analytics.js
│   │   └── notifications.js
│   ├── seed/
│   │   └── seedData.js           # Idempotent startup & CLI seed (LPU + Pan-India data)
│   ├── utils/
│   │   ├── stateMachine.js       # Enforces legal challenge lifecycle transitions
│   │   └── auditAndNotify.js     # Creates ActivityLog + Notification entries
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Serves API + built client/dist in single-service mode
└── client/
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── api/axios.js
        ├── context/              # AuthContext, ThemeContext, ToastContext
        ├── components/           # Navbar, CommandPalette, MapPicker, LifecycleStepper, etc.
        ├── pages/                # Landing, Auth, 360° Detail, Citizen, Admin, Analytics, University, Industry
        └── utils/constants.js
```

---

## Challenge Lifecycle State Machine

```text
submitted ─▶ under_review ─▶ validated ─▶ routed ─▶ team_formed ─▶ in_progress ─▶ piloted ─▶ deployed
    │             │
    └─────────────┴──▶ rejected (requires mandatory rejectionReason / optional duplicateOf)
```

---

## REST API Reference

| Module | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Public | Register Citizen, University, or Industry user |
| **Auth** | `POST /api/auth/login` | Public | Login and receive JWT + user profile |
| **Auth** | `GET /api/auth/me` | Authenticated | Fetch current user session |
| **Auth** | `GET /api/auth/users?role=university` | Authenticated | List registered universities & specializations |
| **Challenges** | `GET /api/challenges` | Public / Optional | List & filter challenges with proposal/partnership counts |
| **Challenges** | `GET /api/challenges/spatial/nearby` | Public | Nearby challenges within radius (`lat`, `lng`, `radiusMeters`) |
| **Challenges** | `GET /api/challenges/:id/duplicates` | `admin` | 2km `$near` spatial duplicate detector |
| **Challenges** | `GET /api/challenges/:id` | Public / Optional | 360° view (challenge, proposals, partnerships, audit logs) |
| **Challenges** | `POST /api/challenges` | `citizen` | Submit challenge (`multipart/form-data`, up to 5 images) |
| **Challenges** | `PATCH /api/challenges/:id/review` | `admin` | Validate, mark under review, or reject with reason |
| **Challenges** | `PATCH /api/challenges/:id/route` | `admin` | Route challenge to a university R&D cell |
| **Challenges** | `PATCH /api/challenges/:id/status` | `admin`, `university` | Transition lifecycle (`piloted`, `deployed`, etc.) |
| **Challenges** | `POST /api/challenges/:id/upvote` | Authenticated | Toggle community upvote |
| **Proposals** | `GET /api/proposals` | Authenticated | List proposals filtered by challenge or university |
| **Proposals** | `POST /api/proposals` | `university` | Submit student-faculty team proposal & milestones |
| **Proposals** | `PATCH /api/proposals/:id/milestones/:milestoneId` | `university`, `admin` | Update milestone status & attach deliverable URL |
| **Partnerships** | `GET /api/partnerships` | Authenticated | List industry CSR/mentorship offers |
| **Partnerships** | `POST /api/partnerships` | `industry` | Submit collaboration offer |
| **Partnerships** | `PATCH /api/partnerships/:id/respond` | `university`, `admin` | Accept, decline, or complete a partnership |
| **Analytics** | `GET /api/analytics/overview` | Public | Landing KPI counters |
| **Analytics** | `GET /api/analytics/dashboard` | `admin`, `industry` | Funnel, domain pie, regional breakdown & leaderboard |
| **Notifications** | `GET /api/notifications` | Authenticated | Fetch user notifications & unread count |
| **Notifications** | `PATCH /api/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## Seeded Demo Accounts (Password: `Password@123`)

Janupkram auto-seeds on first startup when `User.countDocuments() === 0` (and also exposes 1-click demo login buttons on `/login`):

| Role | Organization / Name | Email |
| :--- | :--- | :--- |
| Citizen | Aarav Sharma (Phagwara / Open Community) | `citizen@janupkram.org` |
| Nodal Moderator | Dr. Meenakshi Nair (Central Moderation Cell) | `admin@janupkram.org` |
| University (LPU) | Lovely Professional University (LPU) Innovation Studio | `innovation@lpu.co.in` |
| Partner University | National University R&D Alliance | `research@campus-hub.edu.in` |
| Industry Partner | Bharat Tech & CSR Foundation | `csr@industry-collab.org` |

---

## Local Development Setup

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a **MongoDB Atlas** URI

### 1. Configure Environment
Copy `server/.env.example` to `server/.env` and update `MONGO_URI` and `JWT_SECRET` if needed.

### 2. Install & Run Backend (Port `5000`)
```bash
cd server
npm install
npm run seed   # Optional: server also auto-seeds on startup if DB is empty
npm run dev
```

### 3. Install & Run Frontend (Port `5173`)
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173**.

---

## Single-Service Deployment on Render

Janupkram supports deploying **both** the React frontend and Express backend on a **single Render Web Service**:

- **Language:** `Node`
- **Branch:** `main`
- **Root Directory:** *(leave blank)*
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `MONGO_URI` — Your MongoDB Atlas connection string (whitelist `0.0.0.0/0` in Atlas Network Access)
  - `JWT_SECRET` — Secure random string
  - `JWT_EXPIRES_IN` — `7d`
  - *(Optional)* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## Built With Pride at LPU

Designed and engineered by **college students at Lovely Professional University (LPU)** as an open, universal societal innovation platform for communities, campuses, and industry partners everywhere.
