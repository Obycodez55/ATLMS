import { Timestamp } from "firebase/firestore";

export type UserRole = "passenger" | "driver" | "admin";
export type VehicleType = "tricycle" | "cab";
export type RideStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

export interface UserDoc {
  uid: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
  // driver-only
  vehicleType?: VehicleType | null;
  isOnline?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Fare {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  amount: number;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  updatedAt: Timestamp;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLocationId: string;
  destinationLocationId: string;
  fare: number;
  status: RideStatus;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverVehicleType: VehicleType | null;
  driverRating: number | null;
  requestedAt: Timestamp;
  acceptedAt: Timestamp | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  paymentConfirmed: boolean;
  rating: number | null;
  ratingComment: string | null;
  groupId: string | null;
}
