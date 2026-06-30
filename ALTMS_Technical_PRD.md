# ALTMS — Technical PRD for Implementation

**Project:** Automated Logistics and Transportation Management System
**Build target:** Working live demo, desktop-first
**Stack:** Next.js (App Router) + Firebase (Auth + Firestore) + Google Maps API
**Builder:** Solo build, walked through phase by phase with Claude Code

---

## 1. What We're Building

A campus-scoped ride-coordination web app for the University of Ibadan. Students/staff (passengers) request rides between fixed campus locations. Existing campus drivers (tricycle/cab operators) accept requests, get tracked live via GPS, and complete trips. Fares are fixed per route, shown upfront. No in-app payment processing — payment confirmation only.

**The one loop that must work, end to end, live:**

```
Passenger requests ride → Driver sees it in real time → Driver accepts
→ Passenger sees driver's live location on map → Trip starts → Trip completes
→ Payment marked confirmed (cash/transfer, no gateway) → Passenger rates driver
```

If this loop works cleanly, the demo succeeds. Everything else is in service of this loop.

---

## 2. Explicit Scope

### In Scope (Build This)
- Firebase Auth (email/password), role-based: passenger / driver / admin
- Fixed location list (8 locations) with real lat/lng pulled from Google Maps
- Fixed fare table between location pairs (seeded data, see Section 5)
- Passenger: request ride, see fare upfront, track driver live, complete trip, rate driver
- Driver: online/offline toggle, see incoming requests in real time, accept, navigate, mark trip complete
- Live GPS tracking: driver's real browser location, streamed to Firestore, rendered on passenger's map in real time
- Google Maps JS API, bounded/centered on University of Ibadan campus
- In-app status banners/toasts (no push notifications)
- Payment confirmation step (boolean flag, no payment gateway)
- 5-star rating + optional comment, written to driver's profile average
- Admin: bare-bones read-only tables (locations/fares, registered drivers) — lowest priority

### Explicitly Out of Scope (Do Not Build)
- Paystack or any payment gateway integration — see Section 9 for the data-backed reasoning
- Free-text address input or open map-pin-dropping — locations are fixed/predefined only
- Automatic multi-passenger matching or ride pooling — see Section 10, P2 stretch only, with hard conditions
- Push notifications (in-app banners only)
- Mobile responsive layout — desktop-first only, mobile is a later pass if time allows
- Admin analytics/dashboards/charts
- Multi-language support, dark mode, onboarding tutorials
- Driver vetting/approval workflow — open registration for demo purposes
- Scheduled/advance bookings — only immediate, real-time requests

---

## 3. Why These Scope Decisions (Evidence-Based)

This project ran a real survey (N=47, UI students/staff) and informal driver conversations (N=3) before building. Key findings that shaped scope:

- **89%** of respondents said "seeing available vehicles in real time" was a top feature — this is why live GPS tracking is prioritized over polish elsewhere.
- **72%** wanted fixed, transparent pricing — this is why the fare table is shown upfront, before request, not calculated after.
- **57%** of respondents are cash-dominant in current payment behavior (only 19% mostly/always use mobile transfer) — this is why Paystack/payment gateway integration was deliberately excluded. Building mandatory digital payment would solve a problem nobody reported having. A simple payment confirmation step matches actual current behavior.
- **100%** own smartphones, **77%** comfortable/very comfortable with location tracking — GPS tracking has no real adoption barrier on the passenger side.
- Driver conversations (N=3, informal) revealed an existing fixed gate-to-location fare structure (not arbitrary pricing as initially assumed), with a batching practice at the gate for shared-route passengers. This is the basis for the ride-pooling stretch goal (Section 10) and should inform the fare table logic (Section 5).
- 2 of 3 drivers interviewed owned smartphones; one had a non-smartphone device — this is why the Driver Interface should stay lightweight, and why driver onboarding cannot assume universal smartphone access in a real-world rollout (noted as a limitation, not a blocker for the demo).

---

## 4. Tech Stack — Locked

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Frontend + API routes in one codebase |
| Auth | Firebase Authentication | Email/password, role stored on user doc |
| Database | Firebase Firestore | Real-time listeners are the core mechanism — no custom WebSocket logic needed |
| Hosting | Vercel | One-command deploy, free tier |
| Maps | Google Maps JavaScript API | Bounded to UI campus coordinates |
| Styling | Tailwind CSS | Pairs cleanly with Claude Design output |
| Live location | Browser Geolocation API (driver side) | Written to Firestore on an interval, read via real-time listener on passenger side |

**Note on proposal consistency:** The written research proposal specifies NestJS + PostgreSQL as the production-grade architecture. This prototype intentionally uses a different stack (Next.js + Firebase) for build speed. This is a normal and defensible engineering decision — prototyping in one stack, specifying production architecture in another — and should be stated plainly if asked, not hidden.

---

## 5. Data Model (Firestore)

### Collection: `users/{uid}`
```
{
  role: "passenger" | "driver" | "admin",
  fullName: string,
  email: string,
  phone: string,
  createdAt: timestamp,

  // driver-only fields:
  vehicleType: "tricycle" | "cab" | null,
  isOnline: boolean,
  ratingAvg: number,
  ratingCount: number
}
```

### Collection: `driverLocations/{uid}`
Kept separate from `users` to avoid heavy writes on a document also used for auth/profile reads.
```
{
  lat: number,
  lng: number,
  updatedAt: timestamp
}
```

### Collection: `locations/{locationId}` — seed data, fixed, not user-editable
```
{
  name: string,
  lat: number,
  lng: number
}
```
Seed with these 8 entries (pull real lat/lng from Google Maps for each — these are the actual UI campus locations identified from survey data as most-traveled):
1. Main Gate / Trenchard Hall
2. Faculty of Science / Technology
3. Faculty of Arts / Social Sciences / Law
4. Faculty of Education / Agriculture & Forestry
5. College of Medicine (UCH area)
6. Postgraduate School
7. Student Union / Sports Centre
8. Residential Halls / Staff Quarters

### Collection: `fares/{fareId}` — seed data, fixed
Based on driver-reported pricing structure: a fixed fare exists from Main Gate to each location (and the same fare applies in reverse, gate-to-location and location-to-gate). For location-to-location trips (neither end is the gate), use the sum of both legs' gate fares as the default rule, unless a specific override is set.

```
{
  fromLocationId: string,
  toLocationId: string,
  amount: number  // in naira
}
```

**Default fare table (placeholder values — adjust if real figures become available):**

| Route (from Main Gate) | Fare |
|---|---|
| Main Gate ↔ Faculty of Science/Technology | ₦150 |
| Main Gate ↔ Faculty of Arts/Social Sciences/Law | ₦150 |
| Main Gate ↔ Faculty of Education/Agriculture | ₦200 |
| Main Gate ↔ College of Medicine (UCH) | ₦200 |
| Main Gate ↔ Postgraduate School | ₦150 |
| Main Gate ↔ Student Union/Sports Centre | ₦100 |
| Main Gate ↔ Residential Halls/Staff Quarters | ₦150 |

These values are placeholders calibrated loosely against survey Q18 (55% spend ₦200–₦500/day, typically across multiple rides). Adjust if you obtain real published fare data from the Students' Union list referenced in your proposal.

For location-to-location trips, implement the sum-of-legs rule in code rather than seeding every possible pair manually — this keeps the fare table small and maintainable.

### Collection: `rideRequests/{requestId}`
The core object. Everything in the app revolves around this document's lifecycle.
```
{
  passengerId: string,
  pickupLocationId: string,
  destinationLocationId: string,
  fare: number,
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled",
  driverId: string | null,
  requestedAt: timestamp,
  acceptedAt: timestamp | null,
  startedAt: timestamp | null,
  completedAt: timestamp | null,
  paymentConfirmed: boolean,
  rating: number | null,
  ratingComment: string | null,
  groupId: string | null   // reserved for stretch goal — see Section 10, leave null/unused otherwise
}
```

**Status lifecycle:**
`pending` → `accepted` → `in_progress` → `completed` (or `cancelled` from `pending`/`accepted`)

---

## 6. App Route Structure (Next.js App Router)

```
/login
/signup

/passenger                      → request screen (map + location selectors + fare + request button)
/passenger/trip/[requestId]     → waiting / matched / in-progress / complete states, all driven by status field
/passenger/trip/[requestId]/rate → rating screen, shown after payment confirmed

/driver                         → online/offline toggle + list of incoming pending requests
/driver/trip/[requestId]        → active trip screen — start trip / complete trip

/admin                          → bare table views (locations+fares, registered drivers)
```

Use Firestore real-time listeners (`onSnapshot`) on the request document so status changes (driver accepts, trip starts, trip completes) reflect instantly on the passenger's screen without polling or refresh. This is the single most important real-time mechanism in the app — get this working early and verify it actually updates live before building anything on top of it.

---

## 7. Phased Implementation Plan

Work through these phases in order. Do not start a phase until the previous one is fully working — a partially-working later phase is worse than a missing one for tomorrow's demo.

### Phase 0 — Setup (30–45 min)
- Create Next.js project, install Tailwind
- Create Firebase project, enable Auth (email/password) and Firestore
- Add Firebase config to environment variables
- Set up Google Maps API key, restrict to Maps JavaScript API
- Connect repo to Vercel for one-command deploys
- Seed `locations` and `fares` collections with the data from Section 5 (a one-time script or manual Firestore console entry is fine)

### Phase 1 — Auth + Role Routing (45–60 min)
- Signup screen: email, password, full name, role selection (passenger/driver), phone, vehicle type if driver
- Login screen
- On successful auth, write/read role from `users/{uid}` and route to `/passenger` or `/driver` accordingly
- Basic route protection (redirect to `/login` if not authenticated)

### Phase 2 — Core Ride Loop (2–3 hrs) — Highest Priority Phase
- Passenger request screen: location selector (pickup/destination from fixed list), fare auto-displays once both are selected (read from `fares` collection / sum-of-legs rule)
- On "Request Ride," create a `rideRequests` doc with `status: "pending"`
- Driver home screen: online/offline toggle (writes to `users/{uid}.isOnline`)
- When online, driver sees a real-time list of all `pending` requests (Firestore listener on `rideRequests` where `status == "pending"`)
- Driver taps "Accept" → updates request: `status: "accepted"`, `driverId`, `acceptedAt`
- Passenger's screen (listening on that specific request doc) updates instantly to "Matched" state, showing driver info
- **Verify this full loop works live, in two browser windows, before moving to Phase 3.**

### Phase 3 — Live GPS Tracking (1.5–2 hrs)
- On driver's active trip screen, use Browser Geolocation API (`watchPosition`) to get real coordinates
- Write driver's lat/lng to `driverLocations/{uid}` on a reasonable interval (every few seconds is enough — do not over-engineer update frequency)
- Integrate Google Maps JS API, bounded/centered on UI campus coordinates
- Passenger's matched/in-progress screen listens to `driverLocations/{driverId}` and renders a moving marker on the map
- Plot pickup and destination as static markers using the `locations` collection's lat/lng

### Phase 4 — Trip Completion, Payment, Rating (1–1.5 hrs)
- Driver: "Start Trip" button → `status: "in_progress"`, `startedAt`
- Driver: "Complete Trip" button → `status: "completed"`, `completedAt`
- Passenger sees a "Mark as Paid" confirmation button (cash/transfer handoff happens outside the app) → writes `paymentConfirmed: true`
- Immediately after, passenger sees a rating screen: 5-star input + optional comment → writes `rating`, `ratingComment` to the request, and updates the driver's `ratingAvg`/`ratingCount` on their user doc

### Phase 5 — In-App Notifications (30 min)
- Simple toast/banner component, triggered by status changes already being listened to (e.g., when status flips to "accepted," show "Driver accepted your request")
- No push notifications, no service workers — just reactive UI based on the real-time listeners you already have

### Phase 6 — Admin (Bare Minimum) (30–45 min, lowest priority — do last or skip)
- Simple read-only table: all documents in `locations` joined with `fares`
- Simple read-only table: all `users` where `role == "driver"`, showing name, vehicle type, rating

### Phase 7 — Stretch Goal: Same-Destination Request Joining (Conditional — see Section 10)
Only attempt if Phases 0–4 are fully stable and tested live, exactly as they'll run in the demo, with time remaining.

---

## 8. Demo Script (Use This as Your Test Script Too)

Run this exact sequence yourself before presenting, in two browser windows (passenger + driver):

1. Log in as passenger
2. Select pickup and destination → fare appears
3. Tap "Request Ride" → status shows "Looking for driver"
4. Switch to driver window, go online, see the request appear in real time
5. Accept the request → switch back to passenger window, confirm it updated to "Matched" automatically
6. Driver starts trip → confirm passenger sees live map marker moving (or at least updating) and "Trip in Progress" status
7. Driver completes trip → passenger marks payment confirmed → passenger rates the driver
8. Confirm the rating reflects on the driver's profile/user doc

If all 8 steps work live without a refresh or manual intervention, the demo is ready.

---

## 9. Payment Exclusion — Reasoning to State If Asked

> "Our survey data showed 57% of users primarily pay cash for campus transport, with only 19% mostly or always using mobile transfer. Rather than force a digital payment flow that doesn't match current behavior, we prioritized fare transparency and real-time tracking — the features our respondents actually said mattered most (72% and 89% respectively). The system architecture supports adding a payment gateway like Paystack later; it simply wasn't a priority for this scope, and our data is the reason why."

---

## 10. Stretch Goal — Ride Pooling / Same-Destination Joining

**Status:** P2, conditional. Do not start until the core loop (Phases 0–4) is fully stable and demo-tested.

**Source:** Informal driver conversations (N=3) revealed drivers currently batch passengers heading to the same destination at the gate, prioritizing longer trips. This is the basis for this feature — it formalizes an existing informal practice rather than inventing a new one.

**Simplified scope (not full pooling/matching):**
1. When a passenger creates a request, check Firestore for any other `pending` request with the same `destinationLocationId`, created within the last few minutes
2. If found, show: "Another passenger is also requesting [destination]. Join their request?"
3. If passenger confirms, tag both requests with a shared `groupId`
4. Driver accepting one request with a `groupId` is shown and can accept both as a single trip
5. Each passenger pays the same fixed fare — no fare-splitting math

**Explicitly excluded even in the stretch version:** proximity-based automatic grouping, route-overlap detection between different start points, fare splitting logic. If this isn't completed, it's documented in the final report as a future enhancement — not a missing feature.

---

## 11. Test Accounts to Prepare Before Demo

Create these in advance so you're not signing up live during the presentation:

- One passenger test account
- One driver test account (with vehicle type set)
- Optionally, one admin account if Phase 6 is completed

Have two browser windows (or one regular + one incognito) logged into passenger and driver respectively, ready to go before you start presenting.
