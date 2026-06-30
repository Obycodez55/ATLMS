# ALTMS — Design Brief for Claude Design

**Project:** Automated Logistics and Transportation Management System
**Scope:** Campus ride-coordination platform — University of Ibadan
**Build target:** Working demo, desktop-first, Next.js + Firebase

---

## 1. Project Context

A campus ride-coordination web platform for the University of Ibadan — "ALTMS." Connects students/staff who need rides across campus with existing tricycle/cab drivers operating informally on campus today. This is a real working prototype, not a marketing site or mockup-only concept.

**Core problem being solved:** UI campus transport is concentrated at the main gate. Internal routes are underserved, wait times are unpredictable, and there is no visibility into vehicle availability. The platform lets a passenger request a ride from anywhere on campus to anywhere else, see a fixed fare upfront, and track their driver in real time.

**Three roles:**
- **Passenger** — requests rides, tracks driver, pays (cash/transfer — no in-app payment gateway), rates trip
- **Driver** — goes online/offline, accepts requests, navigates, marks trip complete
- **Admin** — bare-bones, read-only views only (not a priority screen set)

---

## 2. Visual Direction

- **Style:** Clean, functional, map-centric. Lots of white space. Trust-signaling — this is moving real people around campus, not a toy or game.
- **Reference feel:** Bolt / Uber's clarity and confidence — not playful, not "campus app" cute.
- **Color palette:**
  - Primary: Deep navy blue (#1F4E79 range) — professional, matches existing project branding
  - Accent: Teal/green (#00A896 range) — for "active/live" states: driver en route, online status, live tracking
  - Alert: Amber/red — no drivers available, request cancelled, errors
- **Typography:** Clean sans-serif (Inter or system font stack). This is a utility app — no decorative or playful type.
- **Map is the hero element** on both passenger and driver screens. It should dominate the layout, not sit as a small widget in a corner.

---

## 3. Critical Constraint — Read Before Designing

**Pickup and destination are selected from a fixed, predefined list of campus locations — not free-text address entry, not open map-pin-dropping.**

Use this exact location list when designing the selector UI (searchable dropdown or list-style picker):

1. Main Gate / Trenchard Hall
2. Faculty of Science / Technology
3. Faculty of Arts / Social Sciences / Law
4. Faculty of Education / Agriculture & Forestry
5. College of Medicine (UCH area)
6. Postgraduate School
7. Student Union / Sports Centre
8. Residential Halls / Staff Quarters

These eight came directly from our survey data (N=47) as the most-traveled destinations on campus. Design the selector as a searchable list or grid of named cards — not a text input field.

**Fare display:** Once both pickup and destination are selected, a fixed fare appears immediately (e.g., "₦200"). This should feel instant and confident — no loading spinner needed for this part, it's a lookup, not a calculation.

---

## 4. Screens to Design

### Auth
- **Login** — email/password, with a role indicator or role-selection step (Passenger / Driver)
- **Signup** — simple form, same role selection

### Passenger Flow
- **Request screen** — large map of UI campus as the dominant element, pickup location selector, destination location selector, fare display once both are chosen, prominent "Request Ride" button
- **Waiting state** — "Looking for a driver..." with subtle loading animation, cancel option
- **Matched state** — driver info card (name, vehicle type, rating), live map showing driver's moving marker and approximate ETA
- **Trip in progress** — continued live tracking, clear "Trip in Progress" status indicator
- **Trip complete** — fare summary, a simple "Mark as Paid" confirmation (cash/transfer — no payment gateway UI), followed immediately by a rating screen (5-star input + optional short comment)

### Driver Flow
- **Availability toggle** — large, obvious online/offline switch as the dominant element of the driver home screen
- **Incoming request card** — shows pickup, destination, fare, with clear Accept / Decline actions
- **Active trip screen** — map showing pickup point and destination, "Start Trip" then "Complete Trip" buttons
- **Trip history** — simple list view (date, route, fare) — not analytics, not charts

### Admin (Minimal — Low Design Priority)
- One simple table view: registered drivers list
- One simple table view: fixed locations and fares (read-only)

---

## 5. Components Needed

- **Map container** — full-bleed or large card element with marker placeholders (will be wired to Google Maps API in build phase — design the space and marker style, not functional map behavior)
- **Location selector** — searchable list/grid using the fixed 8-location list above, NOT a text input
- **Status banner / toast** — in-app notification component for events like "Driver accepted your request," "Payment confirmed"
- **Driver info card** — name, vehicle type icon (tricycle/car), star rating
- **Trip summary card** — route, fare, timestamp
- **Rating input** — 5-star selector with optional comment field
- **Online/offline toggle** — large, switch-style, unambiguous state
- **Primary and secondary button styles**
- **Form inputs** (auth screens)
- **Loading and empty states** (e.g., "No drivers available right now")

---

## 6. What NOT to Design

Do not design: deep admin analytics/dashboards, multi-language support, dark mode, onboarding tutorials/walkthroughs, in-app chat, scheduled/advance bookings, or payment gateway checkout screens (Paystack or otherwise — this is explicitly out of scope, see technical PRD for reasoning).

---

## 7. Layout Priority

**Desktop-first.** Design for a standard laptop browser window as the primary target. Mobile responsiveness is a secondary pass only if time allows after the desktop build is working — do not spend design time on breakpoints or mobile layouts unless explicitly asked.

---

## 8. App Structure Reference (for consistency)

Two clearly separated experiences within one app:
- `/passenger/*` — all passenger screens
- `/driver/*` — all driver screens
- `/admin/*` — bare minimum table views

Design these as visually distinct enough that it's immediately clear which role's screen you're looking at (e.g., subtle color accent differences or header labeling), since the same person may demo both roles in two browser windows side by side.
