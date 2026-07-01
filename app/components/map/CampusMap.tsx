"use client";

import { useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import { UI_CAMPUS_CENTER, UI_CAMPUS_ZOOM, getLocationById } from "@/lib/locations";

interface CampusMapProps {
  pickupId?: string | null;
  destinationId?: string | null;
  driverLocation?: { lat: number; lng: number } | null;
  style?: React.CSSProperties;
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  restriction: {
    latLngBounds: {
      north: 7.465,
      south: 7.430,
      east: 3.915,
      west: 3.880,
    },
    strictBounds: false,
  },
};

export default function CampusMap({ pickupId, destinationId, driverLocation, style }: CampusMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (!isLoaded) {
    return (
      <div style={{ background: "#E8EDF2", display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
        <span style={{ color: "#64748B", fontSize: 14 }}>Loading map…</span>
      </div>
    );
  }

  const pickup = pickupId ? getLocationById(pickupId) : null;
  const destination = destinationId ? getLocationById(destinationId) : null;

  const pathPoints = pickup && destination ? [
    { lat: pickup.lat, lng: pickup.lng },
    { lat: destination.lat, lng: destination.lng },
  ] : [];

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%", ...style }}
      center={pickup ? { lat: pickup.lat, lng: pickup.lng } : UI_CAMPUS_CENTER}
      zoom={UI_CAMPUS_ZOOM}
      options={MAP_OPTIONS}
    >
      {pickup && (
        <Marker
          position={{ lat: pickup.lat, lng: pickup.lng }}
          label={{ text: "P", color: "#fff", fontWeight: "bold", fontSize: "12px" }}
          title={pickup.name}
        />
      )}
      {destination && (
        <Marker
          position={{ lat: destination.lat, lng: destination.lng }}
          label={{ text: "D", color: "#fff", fontWeight: "bold", fontSize: "12px" }}
          title={destination.name}
        />
      )}
      {driverLocation && (
        <Marker
          position={driverLocation}
          title="Driver"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00A896",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          }}
        />
      )}
      {pathPoints.length === 2 && (
        <Polyline
          path={pathPoints}
          options={{ strokeColor: "#1F4E79", strokeWeight: 3, strokeOpacity: 0.6 }}
        />
      )}
    </GoogleMap>
  );
}
