# Find a Guide Rwanda

A full-stack web application that connects tourists with verified Rwandan tour guides. It implements the Software Requirements Specification (SRS) functional requirements FR 1 to FR 14 and the related non-functional requirements (NFR 5 to 10, 14 and 15), together with the Emergency Contacts and FAQ/User Guide requirements (NFR 6, Section 2.6).

## 1. SRS alignment

| Requirement | Implementation | Location |
|---|---|---|
| FR 1, FR 2 Registration and login | Role-based sign-up (Tourist or Tour Guide), bcrypt-hashed passwords, JWT sessions, validation messages such as "Please insert your email." | `server/src/modules/auth`, `client/src/features/auth` |
| FR 3 Guide profile and onboarding | Profile editor with languages, experience, RWF/USD pricing, services, availability calendar, photo and verification documents (status returns to Pending) | `modules/guides`, `features/guides` |
| FR 4, FR 5 Search and filter | Keyword search; filters for language, location, price range, availability date and minimum rating; only Verified guides are listed | `modules/guides`, `GuideSearchPage` |
| FR 6 Guide profile view | Public page with bio, photo, languages, specialization, experience, availability, services, Verified badge and reviews | `GuideProfilePage` |
| FR 7, FR 8 Booking lifecycle | Availability check, then Pending; guide Accept (Confirmed) or Reject (Declined); tourist Cancel (Cancelled); guide marks Completed | `modules/bookings`, `features/bookings` |
| FR 9 Messaging | Tourist-guide threads with `content`, `sentAt`, `isRead` | `modules/messaging`, `features/messaging` |
| FR 10 Reviews and ratings | 1-5 stars, only after a Completed booking, one review per booking (database `UNIQUE`), average rating recalculated automatically | `modules/reviews` |
| FR 11 Notifications | Notification bell and drawer for booking events, verification outcomes and new messages | `modules/notifications`, `NotificationBell` |
| FR 12 Guide verification | Admin tab listing guides with their documents; Approve or Reject with a reason | `modules/admin`, `AdminDashboard` |
| FR 13 Report user | Tourists and guides can report users | `ReportUserModal`, `POST /api/reports` |
| FR 14 Administration | Suspend or activate users, monitor all bookings, hide or show reviews, resolve reports | `modules/admin` |
| NFR 6, Section 2.6 | Emergency banner and modal on every page; FAQ and user guide page | `EmergencyBanner`, `FAQPage` |
| NFR 14, 15 | Responsive layout (Tailwind) for desktop, tablet and mobile | all pages |

## 2. Technology

| Layer | Choice |
|---|---|
| Client | React 19, Vite, TypeScript, Tailwind CSS 4, Lucide Icons, React Router |
| Server | Node.js, Express 5, TypeScript (run with `tsx`), Zod validation |
| Database | SQLite through `node:sqlite` (Node.js built-in, no database server to install); schema in `server/db/schema.sql` |
| Security | bcrypt password hashing, JWT, role guards, suspended accounts blocked, private verification documents |

SQLite was selected so that the project runs with one command on any computer. The data-access code is isolated in `server/src/lib/db.ts` and the module services, so moving to PostgreSQL later affects those files only.

## 3. Prerequisites

1. **Node.js 22.13 or newer**. Download from https://nodejs.org, install with the default options, then restart the terminal. Check with `node -v` (it must print v22.13 or higher) and `npm -v`.
2. **Git**. Download from https://git-scm.com and install with the default options. Check with `git --version`.

No database server is required; the application uses SQLite, which is installed automatically with the project.

## 4. Installation and running (every step)

**Step 1. Download the project.** Open a terminal (Windows: PowerShell; macOS/Linux: Terminal) and run:

```bash
git clone https://github.com/Pascali-ne/find-a-guide-rwanda.git
cd find-a-guide-rwanda
```

**Step 2. Install all dependencies** (client and server are installed together):

```bash
npm install
```

**Step 3. Start the application:**

```bash
npm run dev
```

Wait until the terminal shows both `VITE ... ready` and `Find a Guide Rwanda API listening on http://localhost:4000`.

**Step 4. Open the application** in a browser at http://localhost:5173 and log in with one of the demo accounts in Section 5.

The database file and demo data are created automatically on the first start. No `.env` file is needed for local use because every setting has a development default. To change settings, copy `server/.env.example` to `server/.env` and edit it.

**Stopping:** press `Ctrl + C` in the terminal. **Resetting the data:** stop the server, delete the folder `server/data`, and run `npm run dev` again (or run `npm run seed`).

**Troubleshooting**

| Problem | Solution |
|---|---|
| `npm install` fails | Ensure Node.js 22.13 or newer is installed and run `npm install` again |
| Port 4000 or 5173 is already in use | Close the other program, or change `PORT` in `server/.env` |
| The page shows "Cannot reach the server" | The API is not running; check the terminal for errors and restart `npm run dev` |

### Environment variables

Optional for local development; the template is `server/.env.example`:

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `JWT_SECRET` | Secret used to sign login tokens (**change in production**) | development value |
| `CLIENT_ORIGIN` | Allowed browser origin(s), comma-separated | `http://localhost:5173` |
| `DB_PATH` | SQLite file location | `./data/findaguide.db` |
| `UPLOAD_DIR` | Folder for photos and verification documents | `./uploads` |
| `AUTO_SEED` | Seed demo data when the database is empty | `true` |

`client/.env.example` contains `VITE_API_URL`, needed only when the API is hosted on a different domain from the client.

### Database commands

```bash
npm run seed      # deletes all data and reloads the demo data
```

To start with a clean database, stop the server, delete the `server/data` folder and start again.

## 5. Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@findaguide.rw` | `Admin@123` |
| Tourist | `emma@example.com` | `Tourist@123` |
| Tour Guide (Verified, Volcanoes National Park) | `jeanclaude@findaguide.rw` | `Guide@123` |
| Tour Guide (Verified, Kigali) | `aline@findaguide.rw` | `Guide@123` |
| Tour Guide (Verified, Nyungwe and Lake Kivu) | `eric@findaguide.rw` | `Guide@123` |
| Tour Guide (**Pending**, Akagera) | `diane@findaguide.rw` | `Guide@123` |

The login page also offers one-click buttons that fill in the Tourist, Guide and Administrator credentials.

### Suggested test scenarios

1. **Search (FR 4, 5):** open *Find guides*; filter by French, Kigali, a maximum price, or a date. Diane (Pending) never appears.
2. **Booking (FR 7, 8):** log in as Emma, book Eric for two days. Log in as Eric and press **Accept**. Booking the same dates for the same guide is then refused.
3. **Review rule (FR 10):** as Emma, open *My bookings*; the completed Kigali tour with Aline has **Leave a review**. A pending or confirmed booking has none. After Eric marks a booking **Completed**, the review button appears.
4. **Verification (FR 12):** log in as the administrator, open *Guide verification*, open Diane's document, then Approve or Reject with a reason. Diane receives a notification and, once approved, appears in search.
5. **Moderation (FR 14):** hide a review in the *Reviews* tab; the guide's average rating updates immediately.
6. **Reports (FR 13):** report a user from a booking or a guide profile, then resolve it in the *Reports* tab.

## 6. Project structure

```
find-a-guide-rwanda/
├── package.json            # npm workspaces: server + client
├── server/
│   ├── db/schema.sql       # database schema (applied automatically)
│   └── src/
│       ├── index.ts, app.ts
│       ├── config/ lib/ middleware/
│       ├── seed/           # demo data (Rwandan destinations and guides)
│       └── modules/        # auth, guides, bookings, messaging, reviews, notifications, admin
└── client/
    └── src/
        ├── App.tsx, main.tsx, index.css
        ├── components/     # Layout, EmergencyBanner, shared UI
        ├── lib/            # API client, formatting, constants
        ├── pages/          # Home, FAQ, NotFound
        └── features/       # auth, guides, bookings, messaging, reviews, notifications, admin
```

### Business rules enforced

| Rule | Mechanism |
|---|---|
| One review per booking | `UNIQUE(booking_id)` plus a service check |
| Review only after completion | Service verifies `status = Completed` and ownership |
| No double booking | Requested days must be in the guide's availability and not overlap a Confirmed booking |
| Only verified guides are public | Search and public profile require `Verified` and an Active account |
| Rating consistency | Recalculated from visible reviews on every review or moderation event |
| Suspended users cannot sign in | Checked at login and on every authenticated request |
| Verification documents are private | Served only to the owning guide and administrators |

## 7. Suggested GitHub workflow (one Pull Request per feature)

Each feature owns a folder on both sides, so a branch can contain one feature only:

| Branch | Server folder | Client folder |
|---|---|---|
| `feature/foundation` | `config`, `lib`, `middleware`, `db` | `components`, `lib`, `pages`, `index.css` |
| `feature/auth` | `modules/auth` | `features/auth` |
| `feature/guides` | `modules/guides` | `features/guides` |
| `feature/bookings` | `modules/bookings` | `features/bookings` |
| `feature/messaging` | `modules/messaging` | `features/messaging` |
| `feature/reviews` | `modules/reviews` | `features/reviews` |
| `feature/notifications` | `modules/notifications` | `features/notifications` |
| `feature/admin` | `modules/admin` | `features/admin` |

## 8. Deployment (public URL on Render)

The server also serves the built client, so a single web service provides the whole application on one URL.

1. Push the repository to GitHub (public).
2. On https://render.com choose **New > Blueprint** (or **New > Web Service**) and select the repository.
3. If creating a Web Service manually, use: **Build command** `npm install --include=dev && npm run build`; **Start command** `npm run start`; environment variables `NODE_VERSION=22` and `JWT_SECRET=<any long random text>`. The included `render.yaml` sets these automatically for a Blueprint.
4. After the deployment finishes, open the URL shown by Render. The demo data is created automatically.

Notes: on Render's free plan the service sleeps after a period of inactivity (the first request may take about a minute), and the disk is temporary, so data created after deployment is reset when the service restarts and the demo data is restored. For permanent storage, attach a persistent disk and set `DB_PATH` and `UPLOAD_DIR` to it.

Live application: _paste the Render URL here_

## 9. Known limitations

* Payments are not processed; the price is the guide's daily rate and payment is agreed directly.
* Emergency numbers are listed from public information and should be verified against official Rwandan sources before a public launch.
* The demo document for the pending guide is a text file; real uploads accept PDF, JPG and PNG.
