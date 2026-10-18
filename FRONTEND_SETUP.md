# Dolphin frontend setup and troubleshooting

## Start the backend first

The Vite frontend is served at `http://localhost:5173`. It proxies `/api/...` to the Spring Boot backend, normally `http://localhost:8080`.

In `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:5173
VITE_BACKEND_TARGET=http://localhost:8080
```

Start the backend and confirm its startup log says it is listening on port 8080. Then restart Vite after changing `.env`:

```bash
cd frontend
npm install
npm run dev
```

`ECONNREFUSED` in the Vite log means the target host/port is not accepting connections. Check that Spring Boot is running, confirm its port, and set `VITE_BACKEND_TARGET` accordingly. A running Vite server does not mean the backend is reachable.

## Connect your school

1. Sign in with an existing Dolphin backend user.
2. Open **School settings** and enter the existing institution ID and campus ID from your database.
3. Start with Academic setup, then use the resulting class/section IDs to load real rosters and assessments.

Do not use invented IDs or demo student records. Backend security and scope checks are authoritative.

## Current scope

The UI is now organized as a school management workspace. Students, staff, guardians, admissions, academic setup, attendance and assessments use the corresponding backend endpoints. Attendance/marks drafts are stored locally; synchronization is explicit, not automatic. Several operational modules currently provide initial list views and need dedicated workflows before production use.

A production build could not be verified in this environment because `npm install` timed out. Do not consider this package production-ready until dependency installation, `npm run build`, API integration tests and the offline workflows have been verified.
