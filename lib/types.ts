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

export interface PickedLocation {
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
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
  pickupLocation: PickedLocation;
  destinationLocation: PickedLocation;
  fare: number;
  status: RideStatus;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverVehicleType: VehicleType | null;
  driverRating: number | null;
  requestedAt: Timestamp;
  expiresAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  paymentConfirmed: boolean;
  cancelledBy: string | null;
  rating: number | null;
  ratingComment: string | null;
  groupId: string | null;
}
