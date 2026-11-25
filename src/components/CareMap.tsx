'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster from 'supercluster';
import { CareFacility } from '../types/care';
import { getGradeLabel } from '../utils/gradeLabel';
import { Crosshair, Plus, Minus, RotateCcw, Layers, RefreshCw } from 'lucide-react';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface CareMapProps {
  facilities: CareFacility[];
  selectedFacility: CareFacility | null;
  onSelectFacility: (facility: CareFacility | null) => void;
  userLocation: { lat: number; lng: number } | null;
  onRequestUserLocation: () => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onSearchHere?: () => void;
  fitBoundsTrigger?: number;
  targetCenter?: { lat: number; lng: number; zoom?: number; seq: number } | null;
}

const TYPE_MARKER_STYLE: Record<string, { color: string; svg: string }> = {
  nursing: {
    color: '#0e8a8d', // 요양원 (그린블루 + 집 아이콘)
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  },
  daycare: {
    color: '#0284c7', // 주간보호 (스카이 블루 + 해 아이콘)
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></svg>',
  },
  hospital: {
    color: '#e11d48', // 요양병원 (로즈 레드 + 십자가 아이콘)
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="9.5" y="3" width="5" height="18" rx="1.5"/><rect x="3" y="9.5" width="18" height="5" rx="1.5"/></svg>',
  },
  silvertown: {
    color: '#6366f1', // 실버타운 (인디고 + 빌딩 아이콘)
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/></svg>',
  },
  hospcare: {
    color: '#d97706', // 병원간병 (앰버 + 하트 아이콘)
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  },
  homecare: {
    color: '#0d9488', // 집간병·방문요양 (틸 + 사람 아이콘)
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  },
};

export default function CareMap({
  facilities,
  selectedFacility,
  onSelectFacility,
  userLocation,
  onRequestUserLocation,
  onBoundsChange,
  onSearchHere,
  fitBoundsTrigger,
  targetCenter,
}: CareMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const lastPannedIdRef = useRef<string | null>(null);
  const renderMarkersRef = useRef<() => void>(() => {});

  const [mapType, setMapType] = useState<'BASE' | 'HYBRID'>('BASE');
  const [showSearchHere, setShowSearchHere] = useState(false);

  const clusterIndex = useMemo(() => {
    const sc = new Supercluster<{ facility: CareFacility }>({
      radius: 56,
      maxZoom: 16,
      minZoom: 5,
    });
    const points = facilities.map((f) => ({
      type: 'Feature' as const,
      properties: { facility: f },
      geometry: {
        type: 'Point' as const,
        coordinates: [f.lng, f.lat] as [number, number],
      },
    }));
    sc.load(points);
    return sc;
  }, [facilities]);

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = map.getBounds();
    const zoom = Math.round(map.getZoom());

    const clusters = clusterIndex.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    clusters.forEach((item) => {
      const [lng, lat] = item.geometry.coordinates;
      const props = item.properties as {
        cluster?: boolean;
        cluster_id?: number;
        point_count?: number;
        facility?: CareFacility;
      };

      if (props.cluster && props.cluster_id !== undefined) {
        const count = props.point_count || 0;
        const size = count >= 30 ? 44 : count >= 10 ? 38 : 32;
        const icon = L.divIcon({
          className: 'care-cluster-icon',
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#0e8a8d;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(14,138,141,0.32);">${count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([lat, lng], { icon });
        marker.on('click', () => {
          const nextZoom = Math.min(clusterIndex.getClusterExpansionZoom(props.cluster_id!), 16);
          map.setView([lat, lng], nextZoom, { animate: true });
        });
        marker.addTo(layerGroup);
      } else if (props.facility) {
        const f = props.facility;
        const isSelected = selectedFacility?.id === f.id;
        const mStyle = TYPE_MARKER_STYLE[f.type] || TYPE_MARKER_STYLE.nursing;
        const gradeBadge = f.type === 'hospital' ? '병원' : f.grade === 'NEW' ? getGradeLabel(f, true) : `${f.grade}`;

        const icon = L.divIcon({
          className: 'care-pin-icon',
          html: isSelected
            ? `
            <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:9999px;background:#0e8a8d;color:#ffffff;border:2px solid #ffffff;box-shadow:0 6px 16px rgba(14,138,141,0.35);white-space:nowrap;transform:scale(1.06);">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:rgba(255,255,255,0.2);flex-shrink:0;">${mStyle.svg}</span>
              <span style="font-size:12px;font-weight:700;letter-spacing:-0.02em;max-width:140px;overflow:hidden;text-overflow:ellipsis;">${f.name}</span>
              <span style="font-size:11px;font-weight:800;color:#ccfbf1;">${gradeBadge}</span>
            </div>
          `
            : `
            <div style="display:inline-flex;align-items:center;gap:4px;padding:3px 7px 3px 3px;border-radius:9999px;background:#ffffff;color:#0f172a;border:1.5px solid ${mStyle.color};box-shadow:0 3px 8px rgba(15,23,42,0.16);white-space:nowrap;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${mStyle.color};flex-shrink:0;">${mStyle.svg}</span>
              <span style="font-size:11px;font-weight:800;color:${mStyle.color};">${gradeBadge}</span>
            </div>
          `,
          iconSize: isSelected ? [170, 34] : [54, 30],
          iconAnchor: isSelected ? [85, 17] : [27, 15],
        });

        const marker = L.marker([lat, lng], { icon, zIndexOffset: isSelected ? 900 : 100 });
        marker.on('click', () => {
          onSelectFacility(f);
        });
        marker.addTo(layerGroup);
      }
    });
  }, [clusterIndex, selectedFacility, onSelectFacility]);

  useEffect(() => {
    renderMarkersRef.current = renderMarkers;
  }, [renderMarkers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.5172, 127.0473],
      zoom: 11,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    const tileUrl = 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18,
      crossOrigin: true,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    layerGroupRef.current = layerGroup;

    map.on('moveend', () => {
      renderMarkersRef.current();
      setShowSearchHere(true);
      if (onBoundsChange) {
        const b = map.getBounds();
        onBoundsChange({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      }
    });
    map.on('zoomend', () => {
      renderMarkersRef.current();
      if (onBoundsChange) {
        const b = map.getBounds();
        onBoundsChange({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      }
    });

    renderMarkersRef.current();
    if (onBoundsChange) {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitBoundsTrigger || facilities.length === 0) return;
    const latLngs = facilities.map((f) => [f.lat, f.lng] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
  }, [fitBoundsTrigger]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !targetCenter) return;
    map.setView([targetCenter.lat, targetCenter.lng], targetCenter.zoom || 13, { animate: true });
    setShowSearchHere(false);
  }, [targetCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFacility) return;
    if (lastPannedIdRef.current !== selectedFacility.id) {
      lastPannedIdRef.current = selectedFacility.id;
      map.setView([selectedFacility.lat, selectedFacility.lng], Math.max(map.getZoom(), 14), {
        animate: true,
      });
    }
  }, [selectedFacility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userLocation) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#0f766e',
        color: '#ffffff',
        weight: 3,
        fillOpacity: 1,
      }).addTo(map);
      map.setView([userLocation.lat, userLocation.lng], 13, { animate: true });
    }
  }, [userLocation]);

  const toggleMapType = () => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;
    const next = mapType === 'BASE' ? 'HYBRID' : 'BASE';
    const url =
      next === 'BASE'
        ? 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png'
        : 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg';
    tileLayerRef.current.setUrl(url);
    setMapType(next);
  };

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />

      {showSearchHere && (
        <button
          onClick={() => {
            if (onSearchHere) onSearchHere();
            renderMarkers();
            if (onBoundsChange && mapRef.current) {
              const b = mapRef.current.getBounds();
              onBoundsChange({
                north: b.getNorth(),
                south: b.getSouth(),
                east: b.getEast(),
                west: b.getWest(),
              });
            }
            setShowSearchHere(false);
          }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 shadow-md hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0e8a8d]" />
          현 지도에서 검색
        </button>
      )}

      {/* 우측 지도 컨트롤 */}
      <div className="absolute right-3 bottom-6 z-[400] flex flex-col gap-1.5">
        <button
          onClick={onRequestUserLocation}
          title="내 위치 중심으로 이동"
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50"
        >
          <Crosshair className="w-4 h-4 text-teal-700" />
        </button>
        <button
          onClick={toggleMapType}
          title="일반/위성 지도 전환"
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50"
        >
          <Layers className="w-4 h-4" />
        </button>
        <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            title="확대"
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            title="축소"
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.setView([36.5, 127.8], 7, { animate: true })}
            title="전국 보기"
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 좌하단 시설 유형 범례 */}
      <div className="hidden sm:flex absolute left-3 bottom-4 z-[400] items-center gap-3 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur border border-slate-200 shadow-sm text-xs text-slate-700">
        {[
          { key: 'nursing', label: '요양원' },
          { key: 'daycare', label: '주간보호' },
          { key: 'hospital', label: '요양병원' },
          { key: 'silvertown', label: '실버타운' },
          { key: 'hospcare', label: '병원간병' },
          { key: 'homecare', label: '집간병' },
        ].map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: TYPE_MARKER_STYLE[item.key].color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
