import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  MapPin,
  ShieldAlert,
  ArrowRight,
  Search,
  CheckCircle2,
  RefreshCw,
  Layers,
  User,
  Sliders,
  LogOut,
  Lock,
  Globe,
  ShieldCheck,
  FileQuestion,
  FileText,
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../store/authStore.js';
import { t } from '../lib/i18n.js';

// Status color mapping matching standard portal indicators
const STATUS_COLORS: Record<string, string> = {
  Available: '#2E7D5B',
  'Under Verification': '#0284C7',
  'Under Acquisition': '#2563EB',
  Approved: '#123B5D',
  'Compensation Pending': '#EA580C',
  Acquired: '#D97706',
  Disputed: '#DC2626',
  Utilized: '#7C3AED',
};

// Map controller to smoothly pan/fly when parcel is clicked or searched
function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Generate a custom DivIcon with the status color and survey number
function createCustomPin(survey: string, status: string, isSelected: boolean) {
  const color = STATUS_COLORS[status] || '#123B5D';
  const size = isSelected ? 34 : 26;
  const border = isSelected ? '3px solid #E8B84A' : '2px solid #ffffff';
  const shadow = isSelected ? '0 0 10px rgba(18, 59, 93, 0.45)' : '0 2px 5px rgba(0,0,0,0.25)';

  return new L.DivIcon({
    className: 'custom-cadastral-pin',
    html: `
      <div style="
        background: ${color};
        color: #ffffff;
        border: ${border};
        border-radius: 6px;
        min-width: ${size}px;
        height: ${size}px;
        padding: 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${isSelected ? '12px' : '10px'};
        font-family: monospace;
        box-shadow: ${shadow};
        transform: translate(-50%, -50%);
        white-space: nowrap;
      ">
        ${isSelected ? '📍 ' : ''}${survey}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Generate realistic cadastral polygon around a centroid
function generateCadastralPolygon(lat: number, lng: number, survey: string): [number, number][] {
  let seed = 0;
  for (let i = 0; i < survey.length; i++) {
    seed = (seed << 5) - seed + survey.charCodeAt(i);
  }
  const factorX = 0.0035 + (Math.abs(seed % 10) / 10000);
  const factorY = 0.0030 + (Math.abs((seed >> 2) % 8) / 10000);

  return [
    [lat - factorY, lng - factorX],
    [lat + factorY * 0.9, lng - factorX * 0.85],
    [lat + factorY * 1.1, lng + factorX * 1.05],
    [lat - factorY * 0.8, lng + factorX * 0.9],
  ];
}

export const MyLandGISPage: React.FC = () => {
  const { language, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isOfficer = user && (user.role === 'OFFICER' || user.role === 'ADMIN');
  const isCitizen = user && user.role === 'CITIZEN';

  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [loading, setLoading] = useState(true);
  const [updatingDb, setUpdatingDb] = useState(false);
  const [dbSuccessMsg, setDbSuccessMsg] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCenter, setActiveCenter] = useState<[number, number]>([23.2450, 77.4100]);

  // Load parcels based on active user role strictly from database
  const loadParcels = useCallback(async (queryParam?: string) => {
    setLoading(true);
    try {
      const res = await api.searchParcels({});
      if (res.success && res.data) {
        setParcels(res.data);

        // Check if a specific survey requested via search or URL query
        const initialSurvey = queryParam || searchParams.get('survey') || searchParams.get('q');
        let initialParcel = null;

        if (initialSurvey && res.data.length > 0) {
          initialParcel = res.data.find(
            (p: any) =>
              p.surveyNumber.toLowerCase().includes(initialSurvey.toLowerCase()) ||
              (p.khasraNumber && p.khasraNumber.toLowerCase().includes(initialSurvey.toLowerCase())) ||
              p.village.toLowerCase().includes(initialSurvey.toLowerCase()) ||
              p.id === initialSurvey
          );
        }

        // If user has parcels, default to their first registered parcel
        if (!initialParcel && res.data.length > 0) {
          initialParcel = res.data[0];
        }

        if (initialParcel) {
          setSelectedParcel(initialParcel);
          if (initialParcel.centroidLat && initialParcel.centroidLng) {
            setActiveCenter([initialParcel.centroidLat, initialParcel.centroidLng]);
          }
        } else {
          // New user with no land parcel in database: leave strictly empty
          setSelectedParcel(null);
        }
      } else {
        setParcels([]);
        setSelectedParcel(null);
      }
    } catch (err) {
      console.error('Failed to load cadastral parcels:', err);
      setParcels([]);
      setSelectedParcel(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadParcels();
  }, [loadParcels, user?.id]);

  // When parcel is clicked on map or searched: select it and record update in database
  const handleParcelClick = async (parcel: any) => {
    setSelectedParcel(parcel);
    if (parcel.centroidLat && parcel.centroidLng) {
      setActiveCenter([parcel.centroidLat, parcel.centroidLng]);
    }

    try {
      setUpdatingDb(true);
      const res = await api.interactWithParcel(parcel.id, {
        action: 'PARCEL_CLICKED_ON_MAP',
      });
      if (res?.success) {
        setDbSuccessMsg(`DB Synced: Parcel #${parcel.surveyNumber} (${parcel.village}) loaded`);
        setTimeout(() => setDbSuccessMsg(''), 3000);
      }
      const freshRes = await api.getParcelById(parcel.id);
      if (freshRes?.success && freshRes.data) {
        setSelectedParcel(freshRes.data);
      }
    } catch (err) {
      console.error('Failed to synchronize parcel click with DB:', err);
    } finally {
      setUpdatingDb(false);
    }
  };

  // Allow officer or citizen to update parcel status directly in database
  const handleStatusChangeInDb = async (newStatus: string) => {
    if (!selectedParcel) return;
    setUpdatingDb(true);
    try {
      const res = await api.interactWithParcel(selectedParcel.id, {
        status: newStatus,
        action: `STATUS_UPDATED_TO_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      });
      if (res?.success) {
        setSelectedParcel((prev: any) => ({ ...prev, currentStatus: newStatus }));
        setParcels((prev) =>
          prev.map((p) => (p.id === selectedParcel.id ? { ...p, currentStatus: newStatus } : p))
        );
        setDbSuccessMsg(`Database updated: Status changed to "${newStatus}" for #${selectedParcel.surveyNumber}`);
        setTimeout(() => setDbSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error updating status in DB:', err);
    } finally {
      setUpdatingDb(false);
    }
  };

  // Search inside GIS map
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = searchInput.trim().toLowerCase();
    if (!term) return;

    const matched = parcels.find((p) => {
      const s = p.surveyNumber.toLowerCase();
      const k = (p.khasraNumber || '').toLowerCase();
      const v = p.village.toLowerCase();
      const id = p.id.toLowerCase();
      const code = (p.parcelCode || '').toLowerCase();
      const owner = (p.cases?.[0]?.citizen?.name || '').toLowerCase();
      return s.includes(term) || k.includes(term) || v.includes(term) || id.includes(term) || code.includes(term) || owner.includes(term);
    });

    if (matched) {
      handleParcelClick(matched);
    } else {
      if (isCitizen) {
        setDbSuccessMsg(`Access Restricted: Survey "${searchInput}" is not registered to your account.`);
        setTimeout(() => setDbSuccessMsg(''), 4000);
      }
    }
  };

  // Helper values strictly from selected parcel (no fallbacks to other users)
  const matchedCase = selectedParcel?.cases?.[0];
  const ownerName = matchedCase?.citizen?.name || (isCitizen ? user?.name : '—');
  const displayAreaAcres = selectedParcel?.recordedAreaAcres || (selectedParcel?.recordedAreaHa ? (selectedParcel.recordedAreaHa * 2.47105).toFixed(2) : '—');
  const displayAreaHa = selectedParcel?.recordedAreaHa || '—';
  const projectName = matchedCase?.project?.name || (selectedParcel ? 'Highway / Infrastructure Acquisition' : '—');
  const compValue = matchedCase?.estimatedCompensationINR
    ? `₹${Number(matchedCase.estimatedCompensationINR).toLocaleString('en-IN')}`
    : '—';
  const parcelCode = selectedParcel?.parcelCode || (selectedParcel?.surveyNumber ? `MP-BH-${selectedParcel.surveyNumber.replace('/', '')}` : '—');

  // Highway corridor overlay coordinates across Bhopal
  const projectCorridorCoordinates: [number, number][] = useMemo(() => [
    [23.160, 77.370],
    [23.190, 77.400],
    [23.270, 77.440],
    [23.340, 77.490],
    [23.345, 77.505],
    [23.272, 77.455],
    [23.188, 77.415],
    [23.155, 77.385],
  ], []);

  return (
    <div className="space-y-5">
      {/* Subtle & Clean Website-Themed Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDE6EC] shadow-soft flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#667784] uppercase tracking-wider">
              भू-स्थानिक सूचना प्रणाली (GIS)
            </span>
            {isOfficer ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF3F8] text-[#123B5D] border border-[#DDE6EC]">
                Officer Access • All Circles
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#059669]" />
                <span>Owner Protected View</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#123B5D] tracking-tight mt-0.5 flex items-center gap-2">
            भू-स्थानिक नक्शा / GIS Land Cadastral Map
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#667784]">
            <span className="font-semibold text-[#243746]">भू-स्थानिक कैडस्ट्रल नक्शा / GIS Land Map</span>
            <span>•</span>
            <span className="text-[#0284C7] font-medium">National Remote Sensing Centre (NRSC) / Bhunaksha Integration Prototype</span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] text-[#123B5D] font-bold border border-[#DDE6EC] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8B84A]"></span>
            <span>{isOfficer ? 'Administrator / नोडल अधिकारी' : `खातेदार / ${user?.name || 'Citizen'}`}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] text-[#667784] font-semibold border border-[#DDE6EC]">
            Bhopal Circle, MP
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#065F46] font-bold border border-[#A7F3D0] flex items-center gap-1">
            <span>{user?.name || 'Verified'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
          </div>
          <button
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#123B5D] font-semibold flex items-center gap-1 border border-[#DDE6EC] shadow-soft transition cursor-pointer"
            title="Toggle Cadastral / Satellite Layer"
          >
            <Layers className="w-3.5 h-3.5 text-[#C7972D]" />
            <span>{mapType === 'streets' ? 'Satellite View' : 'Cadastral View'}</span>
          </button>
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] font-semibold flex items-center gap-1 border border-[#FECACA] shadow-soft transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Role Protection Banner for Citizen */}
      {isCitizen && parcels.length > 0 && (
        <div className="p-3 bg-[#F5FAFC] border border-[#DDE6EC] rounded-xl text-xs text-[#243746] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-soft">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
            <div>
              <span className="font-bold text-[#123B5D]">भूमि स्वामी सुरक्षित अभिगम (Owner Secured Access): </span>
              <span className="text-[#667784]">
                खातेदार: <strong>{user?.name}</strong> • आप केवल अपनी पंजीकृत भूमि (खसरा <strong>#{parcels.map((p) => p.surveyNumber).join(', ')}</strong>) का भू-स्थानिक नक्शा देख रहे हैं।
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white border border-[#DDE6EC] px-2.5 py-1 rounded text-[#123B5D] self-start sm:self-auto whitespace-nowrap shadow-soft">
            {parcels.length} Registered Parcel(s)
          </span>
        </div>
      )}

      {/* Officer Mode Banner */}
      {isOfficer && (
        <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-xs text-[#0369A1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-soft">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0284C7] flex-shrink-0" />
            <div>
              <span className="font-bold">सक्षम प्राधिकारी अभिगम (Officer Jurisdiction): </span>
              <span className="text-[#0C4A6E]">
                भोपाल वृत्त के सभी {parcels.length} भू-खंडों का पूर्ण भू-स्थानिक कैडस्ट्रल विवरण उपलब्ध है।
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white border border-[#BAE6FD] px-2.5 py-1 rounded text-[#0284C7] self-start sm:self-auto whitespace-nowrap shadow-soft">
            {parcels.length} Bhopal Parcels Active
          </span>
        </div>
      )}

      {/* Database sync notification banner */}
      {dbSuccessMsg && (
        <div className="px-4 py-2.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-xl text-xs font-semibold flex items-center justify-between shadow-soft animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span>{dbSuccessMsg}</span>
          </div>
          <span className="text-[10px] bg-[#D1FAE5] px-2 py-0.5 rounded text-[#047857] font-mono font-bold">POSTGRESQL SYNCED</span>
        </div>
      )}

      {/* Main Map View Area */}
      <div className="bg-white rounded-2xl border border-[#DDE6EC] shadow-soft overflow-hidden h-[620px] sm:h-[680px] lg:h-[720px] relative">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-[#123B5D] animate-spin" />
              <span className="text-xs font-bold text-[#123B5D]">Loading Bhopal Cadastral Dataset...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={activeCenter}
          zoom={isCitizen && parcels.length > 0 ? 14 : 12}
          className="h-full w-full"
          zoomControl={false}
        >
          <MapController center={activeCenter} zoom={isCitizen && parcels.length > 0 ? 14 : 13} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | NRSC Cadastral'
            url={
              mapType === 'streets'
                ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            }
          />

          {/* Project Highway Expansion Corridor */}
          <Polygon
            positions={projectCorridorCoordinates}
            pathOptions={{
              color: '#123B5D',
              fillColor: '#123B5D',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6, 6',
            }}
          />

          {/* Render Land Parcels accessible to current user strictly */}
          {parcels.map((parcel) => {
            const isSelected = selectedParcel?.id === parcel.id;
            const status = parcel.currentStatus || 'Under Verification';
            const color = STATUS_COLORS[status] || '#123B5D';

            const lat = parcel.centroidLat || 23.25;
            const lng = parcel.centroidLng || 77.41;
            const polygonCoords = generateCadastralPolygon(lat, lng, parcel.surveyNumber);

            return (
              <React.Fragment key={parcel.id}>
                <Polygon
                  positions={polygonCoords}
                  eventHandlers={{
                    click: () => handleParcelClick(parcel),
                  }}
                  pathOptions={{
                    color: isSelected ? '#C7972D' : color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.65 : 0.35,
                    weight: isSelected ? 3.5 : 1.8,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs space-y-1">
                      <div className="font-extrabold text-[#123B5D]">
                        खसरा नं. #{parcel.surveyNumber}
                      </div>
                      <div className="text-[11px] text-[#475569]">
                        {parcel.village}, {parcel.district}
                      </div>
                      <div className="text-[11px] font-bold text-[#0F172A]">
                        {parcel.recordedAreaAcres || (parcel.recordedAreaHa * 2.47).toFixed(2)} acres ({parcel.recordedAreaHa} ha)
                      </div>
                      <div
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {status}
                      </div>
                    </div>
                  </Popup>
                </Polygon>

                <Marker
                  position={[lat, lng]}
                  icon={createCustomPin(parcel.surveyNumber, status, isSelected)}
                  eventHandlers={{
                    click: () => handleParcelClick(parcel),
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Top-Left In-Map Search Box */}
        {parcels.length > 0 && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[1000] flex flex-col gap-2 max-w-[280px] sm:max-w-md">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-soft border border-[#DDE6EC] p-1 overflow-hidden"
            >
              <div className="pl-3 pr-2 text-[#667784]">
                <Search className="w-4 h-4 text-[#123B5D]" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isOfficer ? "खसरा / Parcel ID / Village..." : `खसरा #${parcels[0]?.surveyNumber || ''}...`}
                className="w-full py-2 text-xs font-semibold text-[#243746] bg-transparent focus:outline-none placeholder-[#94A3B8]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#123B5D] hover:bg-[#1B4D78] text-white text-xs font-bold rounded-lg shadow-soft transition cursor-pointer whitespace-nowrap"
              >
                खोजें / Search
              </button>
            </form>

            {/* Quick Parcel Switcher for Accessible Parcels */}
            {parcels.length > 1 && (
              <div className="hidden sm:flex flex-wrap gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-[#DDE6EC] text-[10px] shadow-soft">
                <span className="text-[#667784] font-bold px-1 py-0.5">
                  {isOfficer ? 'Circles:' : 'Parcels:'}
                </span>
                {parcels.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearchInput(p.surveyNumber);
                      handleParcelClick(p);
                    }}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold transition cursor-pointer ${
                      selectedParcel?.id === p.id
                        ? 'bg-[#123B5D] text-white shadow-soft'
                        : 'bg-[#F8FAFC] hover:bg-[#EAF3F8] text-[#123B5D] border border-[#DDE6EC]'
                    }`}
                  >
                    #{p.surveyNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom-Left Status Legend Box with Subtle Clean Palette */}
        {parcels.length > 0 && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-[1000] bg-white/95 backdrop-blur-md border border-[#DDE6EC] p-3 sm:p-4 rounded-xl shadow-soft text-[11px] space-y-2 text-[#243746] max-w-[210px] sm:max-w-[230px]">
            <div className="font-extrabold text-[#123B5D] text-[11px] uppercase tracking-wider border-b border-[#DDE6EC] pb-1.5 flex items-center justify-between">
              <span>नक्शा स्थिति संकेतक</span>
              <span className="text-[9px] text-[#667784] font-mono">8 Types</span>
            </div>

            <div className="space-y-1 text-[11px]">
              {Object.entries(STATUS_COLORS).map(([name, col]) => (
                <div
                  key={name}
                  onClick={() => {
                    const firstOfStatus = parcels.find((p) => p.currentStatus === name);
                    if (firstOfStatus) handleParcelClick(firstOfStatus);
                  }}
                  className="flex items-center space-x-2 py-0.5 px-1 rounded hover:bg-[#F8FAFC] cursor-pointer transition"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-black/10"
                    style={{ backgroundColor: col }}
                  ></span>
                  <span className="text-[#243746] font-medium text-[11px] truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top-Right Dossier Detail Card OR Empty State for New User */}
        {selectedParcel ? (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] w-[310px] sm:w-[360px] bg-white/95 backdrop-blur-md border border-[#DDE6EC] rounded-2xl shadow-soft-lg p-4 sm:p-5 text-[#243746] space-y-3.5 animate-fade-in">
            {/* Card Header: Parcel Code & Status */}
            <div className="flex items-center justify-between border-b border-[#DDE6EC] pb-3">
              <div className="text-sm font-extrabold text-[#123B5D] tracking-wider font-mono">
                {parcelCode}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm"
                  style={{
                    backgroundColor: STATUS_COLORS[selectedParcel?.currentStatus || 'Approved'] || '#123B5D',
                    color: '#ffffff',
                  }}
                >
                  {selectedParcel?.currentStatus || 'Approved'}
                </span>
              </div>
            </div>

            {/* Details Table Rows strictly based on user's parcel */}
            <div className="space-y-2 text-xs divide-y divide-[#F1F5F9]">
              <div className="flex justify-between pt-1">
                <span className="text-[#667784] font-medium">खातेदार (Owner)</span>
                <span className="font-bold text-[#123B5D] text-right">{ownerName}</span>
              </div>

              <div className="flex justify-between pt-1.5">
                <span className="text-[#667784] font-medium">क्षेत्रफल (Area)</span>
                <span className="font-extrabold text-[#2E7D5B] font-mono text-right">
                  {displayAreaAcres} acres (एकड़) <span className="text-[#667784] font-normal">({displayAreaHa} ha)</span>
                </span>
              </div>

              <div className="flex justify-between pt-1.5">
                <span className="text-[#667784] font-medium">भूमि प्रकार (Type)</span>
                <span className="font-semibold text-[#243746] text-right">
                  {selectedParcel?.landType || 'Agricultural'}
                </span>
              </div>

              <div className="flex justify-between pt-1.5">
                <span className="text-[#667784] font-medium">स्थान (Village)</span>
                <span className="font-bold text-[#123B5D] text-right max-w-[190px] truncate">
                  {selectedParcel?.village}
                </span>
              </div>

              <div className="flex justify-between pt-1.5">
                <span className="text-[#667784] font-medium">खसरा नं. (Survey)</span>
                <span className="font-mono font-extrabold text-[#123B5D] text-right">
                  {selectedParcel?.surveyNumber}
                </span>
              </div>

              <div className="flex justify-between pt-1.5 items-center">
                <span className="text-[#667784] font-medium">दस्तावेज़ (Docs)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Under Review
                </span>
              </div>

              <div className="flex justify-between pt-1.5">
                <span className="text-[#667784] font-medium">परियोजना (Project)</span>
                <span className="font-semibold text-[#243746] text-right text-[11px] max-w-[190px] leading-tight">
                  {projectName}
                </span>
              </div>

              <div className="flex justify-between pt-1.5">
                <span className="text-[#667784] font-medium">प्रतिकर (Comp.)</span>
                <span className="font-extrabold text-[#D97706] font-mono text-right">
                  {compValue}
                </span>
              </div>
            </div>

            {/* Database Interactive Status Updater */}
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DDE6EC] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#667784] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#C7972D]" />
                  <span>अवस्था बदलें / Update DB Status</span>
                </span>
                {updatingDb && <span className="text-[#0284C7] animate-pulse">Syncing DB...</span>}
              </div>
              <select
                value={selectedParcel?.currentStatus || 'Approved'}
                onChange={(e) => handleStatusChangeInDb(e.target.value)}
                disabled={updatingDb}
                aria-label="Select Land Parcel Status in Database"
                className="w-full py-1.5 px-2.5 rounded-lg bg-white text-[#123B5D] text-xs font-semibold border border-[#DDE6EC] focus:outline-none cursor-pointer"
              >
                {Object.keys(STATUS_COLORS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  if (matchedCase?.id) {
                    navigate(`/cases/${matchedCase.id}`);
                  } else {
                    navigate(`/cases?survey=${selectedParcel?.surveyNumber}`);
                  }
                }}
                className="w-full py-2.5 px-4 bg-[#123B5D] hover:bg-[#1B4D78] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-soft"
              >
                <span>राजस्व अभिलेख खोलें / Open Dossier</span>
                <ArrowRight className="w-4 h-4 text-[#E8B84A]" />
              </button>

              <button
                onClick={() => navigate(`/grievance/new?survey=${selectedParcel?.surveyNumber}`)}
                className="w-full py-2 px-3 bg-white border border-[#DDE6EC] hover:bg-[#F8FAFC] text-[#667784] text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-soft"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#C7972D]" />
                <span>{t('serviceGrievanceTitle', language)}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty State strictly rendered when no land is registered for this user in DB */
          <div className="absolute top-4 right-4 z-[1000] w-[310px] sm:w-[350px] bg-white/95 backdrop-blur-md border border-[#DDE6EC] rounded-2xl shadow-soft p-6 text-center space-y-3.5 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] border border-[#E8B84A]/40 text-[#C7972D] flex items-center justify-center mx-auto shadow-soft">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#123B5D]">
                कोई भूमि अभिलेख उपलब्ध नहीं
              </h3>
              <p className="text-xs font-semibold text-[#667784] mt-0.5">
                No Land Parcels Registered
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DDE6EC] text-left text-xs space-y-1.5">
              <div className="text-[11px] text-[#667784]">खातेदार (Account):</div>
              <div className="font-bold text-[#123B5D]">{user?.name || 'User'}</div>
              <div className="text-[11px] text-[#667784]">ईमेल (Email):</div>
              <div className="font-mono text-[11px] text-[#243746] break-all">{user?.email || 'N/A'}</div>
            </div>
            <p className="text-xs text-[#667784] leading-relaxed">
              वर्तमान में इस खाते के अंतर्गत कोई अधिग्रहीत या अधिसूचित भूमि दर्ज नहीं है। यदि आपके पास खसरा संख्या है, तो 'अपनी भूमि खोजें' में जांचें।
            </p>
            <div className="pt-1 space-y-2">
              <button
                onClick={() => navigate('/find-land')}
                className="w-full py-2.5 px-4 bg-[#123B5D] hover:bg-[#1B4D78] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-soft"
              >
                <Search className="w-4 h-4 text-[#E8B84A]" />
                <span>अपनी भूमि खोजें / Search Land</span>
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full py-2 px-3 bg-white border border-[#DDE6EC] hover:bg-[#F8FAFC] text-[#667784] text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                सहायता केंद्र / Contact CALAO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
