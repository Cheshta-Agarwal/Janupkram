# Janupkram — Societal Innovation Collaboration Portal (SIH26043)

Full-stack MERN web application for the **Government of Jharkhand** (Smart India Hackathon 2026 — Problem Statement **SIH26043**), connecting Citizens, Government Nodal Officers, Universities/R&D Cells, and Industry CSR Partners.

## Prerequisites
- Node.js v18+ & npm
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or set `MONGO_URI` in `server/.env`)

## Quick Start

### 1. Start the Backend API (Port 5000)
```bash
cd server
npm install
npm run seed   # Optional: server also auto-seeds on startup if database is empty
npm run dev
```

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Single-Service Production Build (Render)
- **Root Directory:** *(leave blank)*
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Required Env Vars:** `MONGO_URI`, `JWT_SECRET`

## Seeded Demo Accounts (Password: `Password@123`)
| Role | Organization / Name | Email |
| :--- | :--- | :--- |
| Citizen | Ramesh Mahato (Ranchi) | `ramesh.citizen@jharkhand.in` |
| Govt. Admin | Dr. Arvind Kumar (Nodal Officer) | `admin@jharkhand.gov.in` |
| University | Lovely Professional University | `innovation@lpu.co.in` |
| University | BIT Mesra, Ranchi | `research@bitmesra.ac.in` |
| Industry CSR | Tata Steel Foundation & Tech Labs | `csr@tatasteel-collab.in` |
