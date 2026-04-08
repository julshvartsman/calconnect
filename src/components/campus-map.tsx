"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

type MapResource = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  building?: string;
};

type CampusMapProps = {
  resources: MapResource[];
  selectedId?: string;
};

const CAMPUS_CENTER: [number, number] = [37.8719, -122.2585];
/** Southwest then northeast — UC Berkeley core, Northside, Southside, downtown strip. */
const BERKELEY_SW: [number, number] = [37.858, -122.275];
const BERKELEY_NE: [number, number] = [37.882, -122.246];
const DEFAULT_ZOOM = 15;
const SELECTED_ZOOM = 17;
const MAP_MAX_ZOOM = 19;

/** Soft, distinct pastels — readable on light basemap tiles */
const CATEGORY_COLORS: Record<string, string> = {
  food: "#3d9f6e",
  housing: "#4f8fd4",
  financial: "#d4a017",
  health: "#e07070",
  "mental-health": "#9b7ed9",
  career: "#e09050",
  academic: "#3db8c4",
  tutoring: "#3db8c4",
  wellness: "#3db896",
  disability: "#8f7ad4",
  legal: "#7a8fa3",
  safety: "#d96060",
  emergency: "#d96060",
  technology: "#6b7fd6",
  "student-life": "#d972a8",
  "student-affairs": "#d972a8",
};

const CLUSTER_CSS = `
.marker-cluster {
  background: rgba(91, 143, 168, 0.22);
  border-radius: 50%;
}
.marker-cluster div {
  background: linear-gradient(145deg, #6b9db8 0%, #5a8aa8 100%);
  color: #fffef8;
  width: 32px;
  height: 32px;
  margin-left: 4px;
  margin-top: 4px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(45, 85, 105, 0.35);
}
.marker-cluster-small {
  background: rgba(91, 143, 168, 0.18);
}
.marker-cluster-medium {
  background: rgba(91, 143, 168, 0.24);
}
.marker-cluster-large {
  background: rgba(91, 143, 168, 0.3);
}
`;

const PIN_ACCENT = "#5a8aa8";

function pinIcon(leaflet: typeof L, color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 28 : 20;
  const border = isSelected ? `3px solid ${PIN_ACCENT}` : "2px solid #ffffff";
  const shadow = isSelected
    ? "0 2px 10px rgba(45, 85, 105, 0.45)"
    : "0 1px 4px rgba(45, 85, 105, 0.25)";
  return leaflet.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border};
      border-radius:50%;
      box-shadow:${shadow};
      transition:transform 0.2s;
      ${isSelected ? "transform:scale(1.12);" : ""}
    "></div>`,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function injectClusterStyles() {
  if (typeof document === "undefined") return;
  const id = "calconnect-cluster-css";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = CLUSTER_CSS;
  document.head.appendChild(style);
}

export function CampusMap({ resources, selectedId }: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const leaflet = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster");
      injectClusterStyles();
      if (cancelled || !containerRef.current) return;

      leafletRef.current = leaflet;

      const berkeleyBounds = leaflet.latLngBounds(BERKELEY_SW, BERKELEY_NE);

      const map = leaflet.map(containerRef.current, {
        center: CAMPUS_CENTER,
        zoom: DEFAULT_ZOOM,
        maxZoom: MAP_MAX_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
        maxBounds: berkeleyBounds,
        maxBoundsViscosity: 1,
      });

      // Carto Positron — light, low-contrast streets (friendlier than default OSM)
      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        })
        .addTo(map);

      map.whenReady(() => {
        map.invalidateSize();
        const minZ = map.getBoundsZoom(berkeleyBounds);
        if (Number.isFinite(minZ) && minZ >= 0) {
          map.setMinZoom(minZ);
        }
      });

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      clusterGroupRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !leafletRef.current) return;
    const map = mapRef.current;
    const leaflet = leafletRef.current;

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }
    markersRef.current.clear();

    const clusterGroup = leaflet.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        let size = "small";
        if (count >= 10) size = "large";
        else if (count >= 5) size = "medium";
        return leaflet.divIcon({
          html: `<div>${count}</div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: leaflet.point(40, 40),
        });
      },
    });

    for (const resource of resources) {
      const color = CATEGORY_COLORS[resource.category] ?? PIN_ACCENT;
      const isSelected = resource.id === selectedId;
      const icon = pinIcon(leaflet, color, isSelected);

      const marker = leaflet.marker([resource.lat, resource.lng], { icon });

      const locationLine = [resource.building, resource.address].filter(Boolean).join(" · ");
      marker.bindPopup(
        `<div style="font-family:system-ui,-apple-system,sans-serif;min-width:160px">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#334155">${escapeHtml(resource.name)}</p>
          <p style="font-size:11px;color:#5a8aa8;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em">${escapeHtml(resource.category.replace("-", " "))}</p>
          ${locationLine ? `<p style="font-size:11px;color:#64748b;margin:0">${escapeHtml(locationLine)}</p>` : ""}
        </div>`,
        { closeButton: false, offset: [0, -2] },
      );

      if (isSelected) {
        marker.openPopup();
      }

      clusterGroup.addLayer(marker);
      markersRef.current.set(resource.id, marker);
    }

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    const berkeleyBounds = leaflet.latLngBounds(BERKELEY_SW, BERKELEY_NE);

    if (selectedId) {
      const selected = resources.find((r) => r.id === selectedId);
      if (selected) {
        map.setView([selected.lat, selected.lng], SELECTED_ZOOM, { animate: true });
      }
    } else if (resources.length > 0) {
      const group = leaflet.featureGroup(Array.from(markersRef.current.values()));
      const padded = group.getBounds().pad(0.12);
      if (berkeleyBounds.contains(padded)) {
        map.fitBounds(padded, {
          maxZoom: DEFAULT_ZOOM,
          padding: [24, 24],
        });
      } else {
        map.fitBounds(berkeleyBounds, { maxZoom: DEFAULT_ZOOM, padding: [16, 16] });
      }
    } else {
      map.fitBounds(berkeleyBounds, { maxZoom: DEFAULT_ZOOM, padding: [20, 20] });
    }
  }, [resources, selectedId, ready]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl"
      style={{ minHeight: 460 }}
    />
  );
}
