import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Search,
  Map,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  FileQuestion,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { t } from '../lib/i18n.js';

export const FindMyLandPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, user } = useAuthStore();

  const isOfficer = user && (user.role === 'OFFICER' || user.role === 'ADMIN');
  const isCitizen = user && user.role === 'CITIZEN';

  const [activeTab, setActiveTab] = useState<'survey' | 'qr' | 'gps'>('survey');
  const [searchQuery] = useState(searchParams.get('q') || '');
  const [surveyNumber, setSurveyNumber] = useState(searchParams.get('survey') || '');
  const [village, setVillage] = useState(searchParams.get('village') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [results, setResults] = useState<any[]>([]);
  const [myParcels, setMyParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [restrictedNotice, setRestrictedNotice] = useState<string | null>(null);

  // Fetch initial parcels strictly for active user
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      try {
        const res = await api.searchParcels({});
        if (res.success && res.data) {
          setMyParcels(res.data);
          const requestedSurvey = searchParams.get('survey') || searchParams.get('q');
          
          if (requestedSurvey) {
            setSurveyNumber(requestedSurvey);
            handleSearch(requestedSurvey, res.data);
          } else if (res.data.length > 0) {
            // Only auto-search if user has registered parcels in database
            const firstSurvey = res.data[0].surveyNumber;
            setSurveyNumber(firstSurvey);
            handleSearch(firstSurvey, res.data);
          } else {
            // New user with no land parcel in database: leave clean empty state
            setSurveyNumber('');
            setResults([]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initFetch();
  }, [user?.id]);

  const handleSearch = async (overrideSurvey?: string, existingList?: any[]) => {
    const surveyToUse = overrideSurvey !== undefined ? overrideSurvey : surveyNumber;
    setLoading(true);
    setHasSearched(true);
    setRestrictedNotice(null);

    try {
      const res = await api.searchParcels({
        survey: surveyToUse,
        village,
        district,
        q: searchQuery,
      });

      if (res.success) {
        if (res.data.length === 0 && isCitizen) {
          const list = existingList || myParcels;
          if (list.length > 0) {
            const authorizedSurvey = list.map((p: any) => p.surveyNumber).join(', ');
            setRestrictedNotice(
              `Access Restricted: Survey #${surveyToUse || 'entered'} is not registered under your account (${user?.name}). You are only authorized to access your own land record (${authorizedSurvey}).`
            );
          }
        }
        setResults(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (surveyVal: string) => {
    setSurveyNumber(surveyVal);
    handleSearch(surveyVal);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE6EC] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#123B5D] text-[#E8B84A] flex items-center justify-center font-bold text-xs shadow-soft">
              <Search className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-[#123B5D] tracking-tight">
              {t('landSearchTitle', language)}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667784] mt-1">
            {t('landSearchSub', language)}
          </p>
        </div>

        <button
          onClick={() => navigate('/documents/analyze')}
          className="px-4 py-2.5 bg-[#FFF9F0] hover:bg-[#FFF3E0] text-[#123B5D] border border-[#E8B84A] text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition self-start sm:self-auto cursor-pointer shadow-soft"
        >
          <Sparkles className="w-4 h-4 text-[#C7972D]" />
          <span>{t('understandDocument', language)}</span>
        </button>
      </div>

      {/* Role Protection Banner */}
      {isCitizen && myParcels.length > 0 && (
        <div className="p-3 bg-[#F5FAFC] border border-[#DDE6EC] rounded-xl text-xs text-[#243746] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-soft">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
            <div>
              <span className="font-bold text-[#123B5D]">भूमि स्वामी सुरक्षित अभिगम (Owner Secured Access): </span>
              <span className="text-[#667784]">
                खातेदार: <strong>{user?.name}</strong> • आप केवल अपनी पंजीकृत भूमि का विवरण एवं प्रतिकर स्थिति देख सकते हैं।
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white border border-[#DDE6EC] px-2.5 py-1 rounded text-[#123B5D] self-start sm:self-auto whitespace-nowrap shadow-soft">
            {myParcels.length} Registered Land(s)
          </span>
        </div>
      )}

      {/* Access Restriction Notice if citizen searched other land */}
      {restrictedNotice && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] flex items-start gap-2.5 shadow-soft">
          <Lock className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-[#B91C1C]">गोपनीयता एवं सुरक्षा प्रतिबंध (Access Restricted)</div>
            <div>{restrictedNotice}</div>
          </div>
        </div>
      )}

      {/* Search Form Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDE6EC] shadow-soft space-y-4">
        {/* Search Mode Tabs */}
        <div className="flex flex-wrap border-b border-[#DDE6EC] gap-1.5 sm:gap-2 pb-2">
          <button
            onClick={() => setActiveTab('survey')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer min-h-[40px] ${
              activeTab === 'survey'
                ? 'bg-[#EAF3F8] text-[#123B5D]'
                : 'text-[#667784] hover:text-[#123B5D]'
            }`}
          >
            {t('surveyNo', language)} / Khasra
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer min-h-[40px] ${
              activeTab === 'qr'
                ? 'bg-[#EAF3F8] text-[#123B5D]'
                : 'text-[#667784] hover:text-[#123B5D]'
            }`}
          >
            {t('caseReference', language)}
          </button>
          <button
            onClick={() => setActiveTab('gps')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer min-h-[40px] ${
              activeTab === 'gps'
                ? 'bg-[#EAF3F8] text-[#123B5D]'
                : 'text-[#667784] hover:text-[#123B5D]'
            }`}
          >
            {t('navGisMap', language)}
          </button>
        </div>

        {activeTab === 'survey' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                  {t('surveyNo', language)} / खसरा नं. *
                </label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('enterSurveyPlaceholder', language)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs font-medium focus:outline-none focus:border-[#123B5D] bg-[#F8FAFC] text-[#243746]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                  {t('village', language)} / स्थान
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. Chandanpura, Kolar, Misrod..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs font-medium focus:outline-none focus:border-[#123B5D] bg-[#F8FAFC] text-[#243746]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                  {t('district', language)} / ज़िला
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Bhopal"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs font-medium focus:outline-none focus:border-[#123B5D] bg-[#F8FAFC] text-[#243746]"
                />
              </div>
            </div>

            {/* Chips for Accessible Parcels */}
            {myParcels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#667784] pt-1">
                <span className="font-semibold text-[#123B5D]">
                  {isOfficer ? 'All Bhopal Places:' : 'My Registered Land:'}
                </span>
                {myParcels.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleChipClick(p.surveyNumber)}
                    className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#EAF3F8] border border-[#DDE6EC] rounded-md font-mono font-bold text-[#123B5D] cursor-pointer transition"
                  >
                    #{p.surveyNumber} ({p.village.split(' ')[0]})
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-2.5 bg-[#123B5D] hover:bg-[#1B4D78] text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 shadow-soft cursor-pointer disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
            >
              <Search className="w-4 h-4 text-[#E8B84A]" />
              <span>{loading ? t('searchingLandBtn', language) : t('searchLandBtn', language)}</span>
            </button>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-3 max-w-md">
            <label className="block text-xs font-semibold text-[#123B5D]">
              {t('caseReference', language)}
            </label>
            <input
              type="text"
              placeholder="e.g. ACQ-2026-MP-5583"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs font-mono font-bold bg-[#F8FAFC]"
            />
            <button
              onClick={() => navigate('/cases')}
              className="px-5 py-2.5 bg-[#123B5D] text-white text-xs font-semibold rounded-lg cursor-pointer shadow-soft"
            >
              {t('viewCase', language)}
            </button>
          </div>
        )}

        {activeTab === 'gps' && (
          <div className="space-y-3 max-w-md text-xs text-[#667784]">
            <p>
              Bhopal Cadastral GPS Coverage: <strong>23.2450° N, 77.4100° E</strong>.
            </p>
            <button
              onClick={() => navigate('/map')}
              className="px-5 py-2.5 bg-[#123B5D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-soft"
            >
              <Map className="w-4 h-4 text-[#E8B84A]" />
              <span>{t('viewOnGis', language)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDE6EC] pb-2">
          <h2 className="text-sm font-bold text-[#123B5D] uppercase tracking-wider">
            {t('searchResultsHeading', language)} ({results.length})
          </h2>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {results.map((parcel) => {
              const matchedCase = parcel.cases?.[0];
              const ownerUser = parcel.owner || matchedCase?.citizen;
              const ownerProfile = ownerUser?.profile;
              const ownerName = ownerUser?.name || matchedCase?.citizen?.name || (isCitizen ? user?.name : '—');
              const displayAreaAcres =
                parcel.recordedAreaAcres ||
                (parcel.recordedAreaHa ? (parcel.recordedAreaHa * 2.47105).toFixed(2) : '—');
              const displayAreaHa = parcel.recordedAreaHa || '—';
              const projectName = matchedCase?.project?.name || 'Highway / Infrastructure Acquisition';
              const compValue = matchedCase?.estimatedCompensationINR
                ? `₹${Number(matchedCase.estimatedCompensationINR).toLocaleString('en-IN')}`
                : '—';
              const parcelCode = parcel.parcelCode || (parcel.surveyNumber ? `MP-BH-${parcel.surveyNumber.replace('/', '')}` : '—');

              return (
                <div
                  key={parcel.id}
                  className="bg-white rounded-2xl border border-[#DDE6EC] shadow-soft p-5 sm:p-6 space-y-4 hover:border-[#123B5D] transition"
                >
                  {/* Card Header matching reference layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#123B5D] text-[#E8B84A] font-mono font-extrabold flex items-center justify-center text-xs shadow-soft">
                        #{parcel.surveyNumber}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded">
                            {parcelCode}
                          </span>
                          <h3 className="text-base font-extrabold text-[#123B5D]">
                            {t('surveyNo', language)} #{parcel.surveyNumber}
                          </h3>
                          <StatusBadge status={parcel.currentStatus} />
                        </div>
                        <p className="text-xs text-[#667784] mt-1">
                          स्थान (Village): <strong className="text-[#243746]">{parcel.village}</strong> • tehsil: <strong>{parcel.tehsil}</strong> • district: <strong>{parcel.district}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-[#667784] block">क्षेत्रफल (Area)</span>
                      <span className="text-lg font-black text-[#2E7D5B] font-mono">
                        {displayAreaAcres} acres
                      </span>
                      <span className="text-xs text-[#667784] block">({displayAreaHa} ha)</span>
                    </div>
                  </div>

                  {/* Connected User Schema / Citizen Dossier Details */}
                  {ownerUser && (
                    <div className="px-4 py-2.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold text-xs shadow-soft">
                          👤
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-[#0369A1]">
                              भूमि स्वामी (Land Owner): {ownerName}
                            </span>
                            {ownerProfile?.panStatus === 'VERIFIED' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F4EC] text-[#2E7D5B] border border-[#2E7D5B]/30">
                                ✓ KYC Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#0284C7] mt-0.5 flex flex-wrap gap-x-3">
                            <span>Phone: <strong className="text-[#0C4A6E]">{ownerUser.phone || '—'}</strong></span>
                            <span>Email: <strong className="text-[#0C4A6E]">{ownerUser.email || '—'}</strong></span>
                            {ownerProfile?.panNumber && (
                              <span>PAN: <strong className="text-[#0C4A6E] font-mono">{ownerProfile.panNumber}</strong></span>
                            )}
                            {ownerProfile?.aadhaarMasked && (
                              <span>Aadhaar: <strong className="text-[#0C4A6E] font-mono">{ownerProfile.aadhaarMasked}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white text-[#0369A1] px-2.5 py-1 rounded border border-[#BAE6FD] shadow-soft">
                        User ID: {ownerUser.id}
                      </span>
                    </div>
                  )}

                  {/* 8 Cadastral Detail Fields strictly from parcel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#DDE6EC] text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#667784] font-medium block">खातेदार (Owner)</span>
                      <span className="font-bold text-[#123B5D]">{ownerName}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#667784] font-medium block">भूमि प्रकार (Type)</span>
                      <span className="font-bold text-[#243746]">{parcel.landType}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#667784] font-medium block">खसरा नं. (Survey)</span>
                      <span className="font-mono font-bold text-[#123B5D]">{parcel.surveyNumber}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#667784] font-medium block">दस्तावेज़ (Docs)</span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        Under Review
                      </span>
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <span className="text-[11px] text-[#667784] font-medium block">परियोजना (Project)</span>
                      <span className="font-bold text-[#243746]">{projectName}</span>
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <span className="text-[11px] text-[#667784] font-medium block">प्रतिकर (Compensation)</span>
                      <span className="font-black text-[#D97706] font-mono text-sm">{compValue}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => {
                          if (matchedCase?.id) {
                            navigate(`/cases/${matchedCase.id}`);
                          } else {
                            navigate(`/cases?survey=${parcel.surveyNumber}`);
                          }
                        }}
                        className="px-4 py-2.5 bg-[#123B5D] hover:bg-[#1B4D78] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-soft transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#E8B84A]" />
                        <span>राजस्व अभिलेख खोलें / Open Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate(`/map?survey=${parcel.surveyNumber}`)}
                        className="px-4 py-2.5 bg-white border border-[#DDE6EC] hover:bg-[#F8FAFC] text-[#123B5D] font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-soft transition"
                      >
                        <Map className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>भू-स्थानिक नक्शा देखें / View on GIS</span>
                      </button>
                    </div>

                    <button
                      onClick={() => navigate(`/grievance/new?survey=${parcel.surveyNumber}`)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{t('serviceGrievanceTitle', language)}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="bg-white border border-[#DDE6EC] rounded-2xl p-8 text-center space-y-3 shadow-soft">
              <FileQuestion className="w-10 h-10 text-[#C7972D] mx-auto bg-[#FFF9F0] p-2 rounded-xl border border-[#E8B84A]/30" />
              <h3 className="text-sm font-bold text-[#123B5D]">
                {hasSearched ? 'कोई भूमि अभिलेख नहीं मिला' : 'वर्तमान में कोई भूमि अभिलेख उपलब्ध नहीं'}
              </h3>
              <p className="text-xs text-[#667784] max-w-md mx-auto leading-relaxed">
                {hasSearched
                  ? `दर्ज की गई खोज के लिए कोई भू-खंड उपलब्ध नहीं है। कृपया सही खसरा संख्या या ग्राम नाम दर्ज करें।`
                  : `इस खाते (${user?.email || 'User'}) के अंतर्गत कोई भूमि अभिलेख दर्ज नहीं है। भूमि की स्थिति जांचने के लिए ऊपर खसरा संख्या खोजें।`}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
