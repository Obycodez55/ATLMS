"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Polyline, Polygon } from "@react-google-maps/api";
import { UI_CAMPUS_CENTER, UI_CAMPUS_ZOOM, CAMPUS_BOUNDARY } from "@/lib/locations";
import { PickedLocation } from "@/lib/types";

interface CampusMapProps {
  pickup?: PickedLocation | null;
  destination?: PickedLocation | null;
  driverLocation?: { lat: number; lng: number } | null;
  onMapClick?: (loc: PickedLocation) => void;
  style?: React.CSSProperties;
}

const LIBRARIES: ("marker" | "places")[] = ["marker", "places"];

const MAP_OPTIONS: google.maps.MapOptions = {
  mapId: "altms-campus-map",
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  // No restriction — users can pan/zoom freely around campus
  // Location selection is restricted via Places API bounds instead
};

const BOUNDARY_OPTIONS: google.maps.PolygonOptions = {
  strokeColor: "#1F4E79",
  strokeOpacity: 0.35,
  strokeWeight: 2,
  fillColor: "#1F4E79",
  fillOpacity: 0.04,
  clickable: false,
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

export default function CampusMap({ pickup, destination, driverLocation, onMapClick, style }: CampusMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!onMapClick || !geocoderRef.current || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const addr = results[0].formatted_address;
          name = addr.split(",")[0] || name;
        }
        onMapClick({ name, lat, lng });
      });
    },
    [onMapClick]
  );

  // Pickup marker
  useEffect(() => {
    if (!isLoaded || !mapInstance) return;
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.map = null;
      pickupMarkerRef.current = null;
    }
    if (pickup) {
      pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: pickup.lat, lng: pickup.lng },
        content: makePinElement("P", "#1F4E79"),
        title: pickup.name,
      });
    }
    return () => {
      if (pickupMarkerRef.current) { pickupMarkerRef.current.map = null; pickupMarkerRef.current = null; }
    };
  }, [isLoaded, pickup, mapInstance]);

  // Destination marker
  useEffect(() => {
    if (!isLoaded || !mapInstance) return;
    if (destMarkerRef.current) {
      destMarkerRef.current.map = null;
      destMarkerRef.current = null;
    }
    if (destination) {
      destMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: destination.lat, lng: destination.lng },
        content: makePinElement("D", "#00A896", "square"),
        title: destination.name,
      });
    }
    return () => {
      if (destMarkerRef.current) { destMarkerRef.current.map = null; destMarkerRef.current = null; }
    };
  }, [isLoaded, destination, mapInstance]);

  // Driver marker
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

  const pathPoints =
    pickup && destination
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
      onClick={onMapClick ? handleMapClick : undefined}
    >
      <Polygon paths={CAMPUS_BOUNDARY} options={BOUNDARY_OPTIONS} />

      {pathPoints.length === 2 && (
        <Polyline
          path={pathPoints}
          options={{ strokeColor: "#1F4E79", strokeWeight: 3, strokeOpacity: 0.6 }}
        />
      )}
    </GoogleMap>
  );
}
