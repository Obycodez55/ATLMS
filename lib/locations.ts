import { Location } from "./types";

export const CAMPUS_LOCATIONS: Location[] = [
  { id: "main-gate",           name: "UI Main Gate (Oyo Road)",            lat: 7.43924, lng: 3.90021 },
  { id: "ajibode-gate",        name: "Ajibode Gate (Second Gate)",          lat: 7.46412, lng: 3.89745 },
  { id: "trenchard-hall",      name: "Trenchard Hall Circle",               lat: 7.44351, lng: 3.89984 },
  { id: "kenneth-dike-library",name: "Kenneth Dike Library (KDL)",          lat: 7.44225, lng: 3.89882 },
  { id: "senate-building",     name: "The Senate Building",                 lat: 7.44412, lng: 3.90081 },
  { id: "faculty-science",     name: "Faculty of Science",                  lat: 7.44453, lng: 3.89785 },
  { id: "faculty-technology",  name: "Faculty of Technology",               lat: 7.44681, lng: 3.89432 },
  { id: "faculty-arts",        name: "Faculty of Arts",                     lat: 7.44185, lng: 3.89921 },
  { id: "faculty-social-sciences", name: "Faculty of the Social Sciences",  lat: 7.44131, lng: 3.89664 },
  { id: "faculty-education",   name: "Faculty of Education",                lat: 7.44021, lng: 3.89512 },
  { id: "faculty-agriculture", name: "Faculty of Agriculture & Forestry",   lat: 7.44295, lng: 3.89610 },
  { id: "postgraduate-college",name: "The Postgraduate College",            lat: 7.44112, lng: 3.90223 },
  { id: "sub-hub",             name: "Student Union Building (SUB)",        lat: 7.44582, lng: 3.89614 },
  { id: "sports-centre",       name: "UI Sports Centre",                    lat: 7.44654, lng: 3.89801 },
  { id: "mellanby-hall",       name: "Mellanby Hall",                       lat: 7.44272, lng: 3.90041 },
  { id: "tedder-hall",         name: "Tedder Hall",                         lat: 7.44301, lng: 3.89934 },
  { id: "sultan-bello-hall",   name: "Sultan Bello Hall",                   lat: 7.44524, lng: 3.89991 },
  { id: "kuti-hall",           name: "Kuti Hall",                           lat: 7.44815, lng: 3.89672 },
  { id: "queen-elizabeth-hall",name: "Queen Elizabeth II Hall",             lat: 7.44192, lng: 3.89471 },
  { id: "awolowo-hall",        name: "Obafemi Awolowo Hall (Awo)",          lat: 7.45863, lng: 3.89245 },
  { id: "zoological-gardens",  name: "UI Zoological Gardens",              lat: 7.44481, lng: 3.89532 },
];

// Campus boundary polygon — OSM relation/10476332 (academic core)
// GeoJSON coords are [lng, lat]; these are converted to Google Maps {lat, lng} format
export const CAMPUS_BOUNDARY: Array<{ lat: number; lng: number }> = [
  { lat: 7.4628674, lng: 3.8844608 },
  { lat: 7.4555177, lng: 3.8880251 },
  { lat: 7.4571526, lng: 3.8914887 },
  { lat: 7.4581827, lng: 3.8942295 },
  { lat: 7.4599327, lng: 3.8972849 },
  { lat: 7.4599552, lng: 3.8973322 },
  { lat: 7.4616210, lng: 3.8965244 },
  { lat: 7.4627383, lng: 3.8959825 },
  { lat: 7.4617996, lng: 3.8940138 },
  { lat: 7.4626108, lng: 3.8936204 },
  { lat: 7.4632279, lng: 3.8949147 },
  { lat: 7.4633903, lng: 3.8952552 },
  { lat: 7.4636451, lng: 3.8957897 },
  { lat: 7.4659557, lng: 3.8946691 },
  { lat: 7.4679389, lng: 3.8937073 },
  { lat: 7.4669088, lng: 3.8915467 },
  { lat: 7.4666321, lng: 3.8910037 },
  { lat: 7.4664547, lng: 3.8909135 },
  { lat: 7.4663153, lng: 3.8903256 },
  { lat: 7.4642824, lng: 3.8874286 },
  { lat: 7.4628674, lng: 3.8844608 },
];

// Bounding box covering all 21 locations — used for Places API bounds & map restriction
export const CAMPUS_BOUNDS = { north: 7.466, south: 7.438, east: 3.904, west: 3.891 };

export const UI_CAMPUS_CENTER = { lat: 7.452, lng: 3.897 };
export const UI_CAMPUS_ZOOM = 15;

export function getLocationById(id: string): Location | undefined {
  return CAMPUS_LOCATIONS.find((l) => l.id === id);
}

// Haversine distance in metres between two lat/lng points
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distance-based solo fare: ₦150/km · minimum ₦100 · rounded to nearest ₦50
export function getDistanceFare(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const distKm = haversineMeters(lat1, lng1, lat2, lng2) / 1000;
  const raw = distKm * 150;
  return Math.max(100, Math.ceil(raw / 50) * 50);
}

// Shared-ride fare: 70% of solo · rounded to nearest ₦10 · minimum ₦70
export function getDistanceSharedFare(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const solo = getDistanceFare(lat1, lng1, lat2, lng2);
  return Math.max(70, Math.round((solo * 0.7) / 10) * 10);
}
