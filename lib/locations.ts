import { Location } from "./types";

// Real lat/lng coordinates for University of Ibadan campus locations
export const CAMPUS_LOCATIONS: Location[] = [
  { id: "main-gate", name: "Main Gate / Trenchard Hall", lat: 7.4443, lng: 3.8965 },
  { id: "faculty-science", name: "Faculty of Science / Technology", lat: 7.4478, lng: 3.8993 },
  { id: "faculty-arts", name: "Faculty of Arts / Social Sciences / Law", lat: 7.4502, lng: 3.8978 },
  { id: "faculty-education", name: "Faculty of Education / Agriculture & Forestry", lat: 7.4520, lng: 3.9010 },
  { id: "college-medicine", name: "College of Medicine (UCH area)", lat: 7.4391, lng: 3.9002 },
  { id: "postgraduate", name: "Postgraduate School", lat: 7.4460, lng: 3.9020 },
  { id: "student-union", name: "Student Union / Sports Centre", lat: 7.4485, lng: 3.8950 },
  { id: "residential-halls", name: "Residential Halls / Staff Quarters", lat: 7.4510, lng: 3.8940 },
];

// Fixed fares from Main Gate to each location (naira)
const GATE_FARES: Record<string, number> = {
  "faculty-science": 150,
  "faculty-arts": 150,
  "faculty-education": 200,
  "college-medicine": 200,
  "postgraduate": 150,
  "student-union": 100,
  "residential-halls": 150,
};

export function getFare(fromId: string, toId: string): number | null {
  if (fromId === toId) return null;

  // Direct gate fares
  if (fromId === "main-gate" && GATE_FARES[toId]) return GATE_FARES[toId];
  if (toId === "main-gate" && GATE_FARES[fromId]) return GATE_FARES[fromId];

  // Sum-of-legs rule for location-to-location
  const fromGate = GATE_FARES[fromId];
  const toGate = GATE_FARES[toId];
  if (fromGate && toGate) return fromGate + toGate;

  return null;
}

export function getLocationById(id: string): Location | undefined {
  return CAMPUS_LOCATIONS.find((l) => l.id === id);
}

// UI campus center for map bounds
export const UI_CAMPUS_CENTER = { lat: 7.4478, lng: 3.8985 };
export const UI_CAMPUS_ZOOM = 15;
