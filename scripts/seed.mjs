/**
 * Seed Firestore with locations and fares.
 * Usage: node scripts/seed.mjs
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * set as environment variables (use Firebase Admin SDK service account).
 *
 * Or seed manually via the Firestore console using the data below.
 */

// ── Locations ──────────────────────────────────────────────────────────────
export const LOCATIONS = [
  { id: "main-gate",         name: "Main Gate / Trenchard Hall",              lat: 7.4443, lng: 3.8965 },
  { id: "faculty-science",   name: "Faculty of Science / Technology",          lat: 7.4478, lng: 3.8993 },
  { id: "faculty-arts",      name: "Faculty of Arts / Social Sciences / Law",  lat: 7.4502, lng: 3.8978 },
  { id: "faculty-education", name: "Faculty of Education / Agriculture & Forestry", lat: 7.4520, lng: 3.9010 },
  { id: "college-medicine",  name: "College of Medicine (UCH area)",           lat: 7.4391, lng: 3.9002 },
  { id: "postgraduate",      name: "Postgraduate School",                      lat: 7.4460, lng: 3.9020 },
  { id: "student-union",     name: "Student Union / Sports Centre",            lat: 7.4485, lng: 3.8950 },
  { id: "residential-halls", name: "Residential Halls / Staff Quarters",       lat: 7.4510, lng: 3.8940 },
];

// ── Fares (gate-to-location pairs only; location-to-location uses sum-of-legs in code) ─
export const FARES = [
  { id: "main-gate--faculty-science",   fromLocationId: "main-gate", toLocationId: "faculty-science",   amount: 150 },
  { id: "main-gate--faculty-arts",      fromLocationId: "main-gate", toLocationId: "faculty-arts",      amount: 150 },
  { id: "main-gate--faculty-education", fromLocationId: "main-gate", toLocationId: "faculty-education", amount: 200 },
  { id: "main-gate--college-medicine",  fromLocationId: "main-gate", toLocationId: "college-medicine",  amount: 200 },
  { id: "main-gate--postgraduate",      fromLocationId: "main-gate", toLocationId: "postgraduate",      amount: 150 },
  { id: "main-gate--student-union",     fromLocationId: "main-gate", toLocationId: "student-union",     amount: 100 },
  { id: "main-gate--residential-halls", fromLocationId: "main-gate", toLocationId: "residential-halls", amount: 150 },
];

// To run the seed, install firebase-admin and uncomment:
//
// import { initializeApp, cert } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
//
// initializeApp({ credential: cert({ projectId: "...", clientEmail: "...", privateKey: "..." }) });
// const db = getFirestore();
//
// for (const loc of LOCATIONS) {
//   const { id, ...data } = loc;
//   await db.collection("locations").doc(id).set(data);
// }
// for (const fare of FARES) {
//   const { id, ...data } = fare;
//   await db.collection("fares").doc(id).set(data);
// }
//
// console.log("Seed complete");
