import React, { useEffect, useRef } from 'react';
import { Coordinates, PoiData } from '../types';
import { MapPin } from 'lucide-react';

// Leaflet types
declare const L: any;

interface MapWidgetProps {
  userLocation?: Coordinates;
  targetPois?: PoiData[];
  isVisible?: boolean;
}

// Helper to get SVG string for icon
const getCategoryIconHtml = (category: string | undefined) => {
  const baseStyle = "width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); border: 2px solid white;";
  
  let bg = "#111827"; // Default Black
  let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

  switch (category) {
    case 'police':
      bg = "#2563eb"; // Blue
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      break;
    case 'hospital':
      bg = "#dc2626"; // Red
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-6z"/></svg>`;
      break;
    case 'school':
    case 'university':
      bg = "#ea580c"; // Orange
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
      break;
    case 'food':
    case 'restaurant':
      bg = "#f59e0b"; // Amber/Orange
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
      break;
    case 'bank':
    case 'atm':
      bg = "#16a34a"; // Green
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><line x1="16" y1="21" x2="16" y2="2"/><line x1="12" y1="21" x2="12" y2="2"/><line x1="8" y1="21" x2="8" y2="2"/><line x1="3" y1="2" x2="21" y2="2"/></svg>`;
      break;
    case 'shop':
    case 'market':
    case 'mall':
      bg = "#9333ea"; // Purple
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
      break;
    case 'park':
      bg = "#15803d"; // Dark Green
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c.9-.7 1.4-1.8 1.4-2.9a4 4 0 0 0-4-4 4 4 0 0 0-3.9 3.1 4 4 0 0 0-3.1 5 4 4 0 0 0 1.1 2.8A3.9 3.9 0 0 0 4 19c0 2.2 1.8 4 4 4Z"/><path d="M12 22v-3"/></svg>`;
      break;
  }

  return `<div style="background-color: ${bg}; ${baseStyle}">${iconSvg}</div>`;
};

export const MapWidget: React.FC<MapWidgetProps> = ({ userLocation, targetPois, isVisible = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Default center: Pakistan
      const defaultCenter = [30.3753, 69.3451]; 
      const defaultZoom = 5;

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
        detectRetina: true
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      });

      const labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      });

      const hybridGroup = L.layerGroup([satelliteLayer, labelsLayer]);

      const minimalLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        maxZoom: 20
      });

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        layers: [streetLayer],
        zoomControl: false
      }).setView(defaultCenter, defaultZoom);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      const baseMaps = {
        "Street Map (Shops & Roads)": streetLayer,
        "Satellite Hybrid (Real Houses)": hybridGroup,
        "Clean Map (Minimal)": minimalLayer
      };

      L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(mapInstanceRef.current);

      markersGroupRef.current = L.featureGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Resize / Visibility Change (Fixes gray map issue)
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      // Force leaflet to re-calculate container size
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [isVisible]);

  // Handle User Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      const { latitude, longitude } = userLocation;
      
      const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup("<b>You are here</b>");
      }
      
      // Only pan to user if no search targets
      if (!targetPois || targetPois.length === 0) {
        map.setView([latitude, longitude], 15);
      }
    }
  }, [userLocation, targetPois]);

  // Handle Multiple Target POIs (Categories & Icons)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    
    if (!map || !group) return;

    // Clear previous search markers
    group.clearLayers();

    if (targetPois && targetPois.length > 0) {
      targetPois.forEach(poi => {
        const poiIcon = L.divIcon({
          className: 'custom-div-icon',
          html: getCategoryIconHtml(poi.category),
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const marker = L.marker([poi.lat, poi.lng], { icon: poiIcon })
          .bindPopup(`
            <div style="font-family: sans-serif; text-align: center; color: #111827;">
              <strong style="font-size: 14px;">${poi.title}</strong>
              <br/>
              <span style="font-size: 11px; text-transform: uppercase; color: #6b7280;">${poi.category || 'Location'}</span>
            </div>
          `);
        
        marker.addTo(group);
      });

      // Fit bounds logic
      if (group.getLayers().length > 0) {
        // If single point, zoom 16. If multiple, fit bounds with padding.
        if (targetPois.length === 1) {
            map.setView([targetPois[0].lat, targetPois[0].lng], 16);
        } else {
            map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
        }
      }
    }
  }, [targetPois]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '100%' }} />
      
      {/* Map Legend */}
      <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl text-xs z-[400] border border-gray-200 text-gray-800 hidden sm:block">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
          <span className="font-semibold">Your Location</span>
        </div>
        <div className="flex items-center gap-2">
           <MapPin className="w-4 h-4 text-black fill-black" />
          <span className="font-semibold">Search Result</span>
        </div>
      </div>
    </div>
  );
};