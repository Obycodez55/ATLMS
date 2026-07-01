"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Polyline } from "@react-google-maps/api";
import { UI_CAMPUS_CENTER, UI_CAMPUS_ZOOM, getLocationById } from "@/lib/locations";

interface CampusMapProps {
  pickupId?: string | null;
  destinationId?: string | null;
  driverLocation?: { lat: number; lng: number } | null;
  style?: React.CSSProperties;
}

const LIBRARIES: ("marker")[] = ["marker"];

const MAP_OPTIONS: google.maps.MapOptions = {
  mapId: "altms-campus-map",   // required for AdvancedMarkerElement
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  restriction: {
    latLngBounds: { north: 7.465, south: 7.430, east: 3.915, west: 3.880 },
    strictBounds: false,
  },
};

function makePinElement(label: string, bg: string, shape: "circle" | "square" = "circle") {
  const el = document.createElement("div");
  el.style.cssText = `
    width:32px; height:32px;
    border-radius:${shape === "circle" ? "50%" : "8px"};
    background:${bg};
    color:#fff;
    font:700 13px/32px Inter,sans-serif;
    text-align:center;
    border:2.5px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.25);
  `;
  el.textContent = label;
  return el;
}

function makeDriverElement() {
  const el = document.createElement("div");
  el.style.cssText = `
    width:18px; height:18px;
    border-radius:50%;
    background:#00A896;
    border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,168,150,0.5);
  `;
  return el;
}

export default function CampusMap({ pickupId, destinationId, driverLocation, style }: CampusMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  // Pickup marker
  useEffect(() => {
    if (!isLoaded || !mapInstance) return;
    const loc = pickupId ? getLocationById(pickupId) : null;
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.map = null;
      pickupMarkerRef.current = null;
    }
    if (loc) {
      pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: loc.lat, lng: loc.lng },
        content: makePinElement("P", "#1F4E79"),
        title: loc.name,
      });
    }
    return () => {
      if (pickupMarkerRef.current) { pickupMarkerRef.current.map = null; pickupMarkerRef.current = null; }
    };
  }, [isLoaded, pickupId, mapInstance]);

  // Destination marker
  useEffect(() => {
    if (!isLoaded || !mapInstance) return;
    const loc = destinationId ? getLocationById(destinationId) : null;
    if (destMarkerRef.current) {
      destMarkerRef.current.map = null;
      destMarkerRef.current = null;
    }
    if (loc) {
      destMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: loc.lat, lng: loc.lng },
        content: makePinElement("D", "#00A896", "square"),
        title: loc.name,
      });
    }
    return () => {
      if (destMarkerRef.current) { destMarkerRef.current.map = null; destMarkerRef.current = null; }
    };
  }, [isLoaded, destinationId, mapInstance]);

  // Driver location marker
  useEffect(() => {
    if (!isLoaded || !mapInstance) return;
    if (!driverLocation) {
      if (driverMarkerRef.current) { driverMarkerRef.current.map = null; driverMarkerRef.current = null; }
      return;
    }
    if (driverMarkerRef.current) {
      driverMarkerRef.current.position = driverLocation;
    } else {
      driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: driverLocation,
        content: makeDriverElement(),
        title: "Driver",
      });
    }
  }, [isLoaded, driverLocation, mapInstance]);

  const pickup = pickupId ? getLocationById(pickupId) : null;
  const destination = destinationId ? getLocationById(destinationId) : null;
  const pathPoints = pickup && destination
    ? [{ lat: pickup.lat, lng: pickup.lng }, { lat: destination.lat, lng: destination.lng }]
    : [];

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-[#E8EDF2]" style={style}>
        <span className="text-[14px] text-[#64748B]">Loading map…</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%", ...style }}
      center={pickup ? { lat: pickup.lat, lng: pickup.lng } : UI_CAMPUS_CENTER}
      zoom={UI_CAMPUS_ZOOM}
      options={MAP_OPTIONS}
      onLoad={onMapLoad}
    >
      {pathPoints.length === 2 && (
        <Polyline
          path={pathPoints}
          options={{ strokeColor: "#1F4E79", strokeWeight: 3, strokeOpacity: 0.6 }}
        />
      )}
    </GoogleMap>
  );
}
