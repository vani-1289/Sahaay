import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { ArrowRight } from 'lucide-react';
import { t } from '../lib/i18n.js';
import { RegistrationStepper } from '../components/auth/RegistrationStepper.js';
import { PanVerificationStep } from '../components/auth/PanVerificationStep.js';
import { FaceVerificationStep } from '../components/auth/FaceVerificationStep.js';
import { RegistrationCompleteStep } from '../components/auth/RegistrationCompleteStep.js';
import { FaceVerificationResult } from '../types/index.js';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRegister = searchParams.get('tab') === 'register' || searchParams.get('mode') === 'register';
  const [isRegister, setIsRegister] = useState(initialRegister);

  useEffect(() => {
    if (searchParams.get('tab') === 'register' || searchParams.get('mode') === 'register') {
      setIsRegister(true);
    } else if (searchParams.get('tab') === 'login' || searchParams.get('mode') === 'login') {
      setIsRegister(false);
    }
  }, [searchParams]);

  // Proactively wake up backend server on mount (mitigating cold starts on free tier)
  useEffect(() => {
    api.pingHealth().catch(() => {});
  }, []);

  // Login / Step 1 State
  const [loginRole, setLoginRole] = useState<'LAND_OWNER' | 'OFFICER'>('LAND_OWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Multi-step Registration State (Steps 1 to 6)
  const [regStep, setRegStep] = useState<number>(1);
  const [panNumber, setPanNumber] = useState('ABCPS1234K');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | Blob | null>(null);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResult | null>(null);

  const { setAuth, language } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.success) {
        setAuth(res.data.token, res.data.user);
        if (res.data.user.role === 'OFFICER') {
          navigate('/officer');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || t('authFailedError', language));
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required basic information fields.');
      return;
    }
    setRegStep(2);
  };

  const handleFinalRegister = async () => {
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
        village: village.trim(),
        district: district.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        panDocumentUrl: verificationResult?.panDocumentUrl || '/storage/documents/pan_demo.jpg',
        panStatus: 'VERIFIED',
        selfieUrl: verificationResult?.selfieUrl || '/storage/documents/selfie_demo.jpg',
        faceMatchScore: verificationResult?.matchScore || 96.5,
        faceMatchStatus: verificationResult?.status || 'VERIFIED',
      };

      const res = await api.register(payload);
      if (res.success) {
        setAuth(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || t('authFailedError', language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl bg-white border border-[#DDE6EC] rounded-2xl shadow-soft-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT 45% (5 cols): Authentic Scenic Rural Imagery with Mission Statement */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#123B5D] p-10 flex-col justify-between text-white overflow-hidden">
          <img
            src="/images/login_hero.jpg"
            alt="Indian rural landscape"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C2840] via-[#123B5D]/80 to-[#123B5D]/40"></div>

          {/* Top Brand Seal */}
          <div className="relative z-10 space-y-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#FDFBF7] p-1 border-2 border-[#E8B84A] shadow-soft flex items-center justify-center">
              <img
                src="/images/sahaay_logo.png"
                alt="SAHAAY Emblem"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {t('appName', language)}
            </h2>
            <p className="text-xs text-[#E8B84A] font-semibold">
              {t('tagline', language)}
            </p>
          </div>

          {/* Bottom Mission Card */}
          <div className="relative z-10 space-y-3 bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/15">
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "{t('heroDesc', language)}"
            </p>
            <div className="text-[11px] text-[#E8B84A] font-bold uppercase tracking-wider">
              {t('citizenPortal', language)}
            </div>
          </div>
        </div>

        {/* RIGHT 55% (7 cols): Clean, Comfortable Sign-In Portal */}
        <div className="lg:col-span-7 p-4 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5 sm:space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#123B5D] tracking-tight">
              {t('welcomeTitle', language)}
            </h1>
            <p className="text-xs sm:text-sm text-[#667784]">
              {t('welcomeSub', language)}
            </p>
          </div>

          {/* Form Tabs */}
          <div className="bg-white rounded-xl border border-[#DDE6EC] overflow-hidden">
            <div className="flex border-b border-[#DDE6EC] bg-[#F8FAFC]">
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`flex-1 text-center py-2.5 text-xs font-bold transition cursor-pointer ${
                  !isRegister
                    ? 'bg-white text-[#123B5D] border-t-2 border-t-[#123B5D]'
                    : 'text-[#667784] hover:text-[#243746]'
                }`}
              >
                {t('tabSignIn', language)}
              </button>
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`flex-1 text-center py-2.5 text-xs font-bold transition cursor-pointer ${
                  isRegister
                    ? 'bg-white text-[#123B5D] border-t-2 border-t-[#123B5D]'
                    : 'text-[#667784] hover:text-[#243746]'
                }`}
              >
                {t('tabRegister', language)}
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-[#FBECEC] border border-[#C62828]/30 rounded-lg p-3 text-xs text-[#C62828] font-medium">
                  {error}
                </div>
              )}

              {/* SIGN-IN TAB */}
              {!isRegister ? (
                <div className="space-y-4">
                  {/* Land Owner vs Land Officer Role Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F5F9] rounded-xl border border-[#DDE6EC]">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('LAND_OWNER');
                        setError('');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        loginRole === 'LAND_OWNER'
                          ? 'bg-[#123B5D] text-white shadow-soft'
                          : 'text-[#667784] hover:text-[#123B5D] hover:bg-white/60'
                      }`}
                    >
                      <span className="text-sm">🏡</span>
                      <span>Land Owner Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('OFFICER');
                        setError('');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        loginRole === 'OFFICER'
                          ? 'bg-[#0284C7] text-white shadow-soft'
                          : 'text-[#667784] hover:text-[#0284C7] hover:bg-white/60'
                      }`}
                    >
                      <span className="text-sm">🏛️</span>
                      <span>Land Officer Login</span>
                    </button>
                  </div>

                  {/* Role Context Information Banner */}
                  {loginRole === 'LAND_OWNER' ? (
                    <div className="p-3 bg-[#F5FAFC] border border-[#DDE6EC] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#123B5D] flex items-center gap-1.5">
                          <span>🏡</span>
                          <span>भूमि स्वामी / Citizen Portal</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('citizen@sahaay.demo');
                            setPassword('password123');
                          }}
                          className="text-[10px] font-bold text-[#123B5D] bg-[#E8B84A] px-2 py-0.5 rounded hover:bg-[#D4A538] transition cursor-pointer"
                        >
                          Quick Fill Citizen Demo
                        </button>
                      </div>
                      <p className="text-[11px] text-[#667784]">
                        Access your notified land parcel, 100% Solatium calculation, DBT status & digital locker.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0284C7] flex items-center gap-1.5">
                          <span>🏛️</span>
                          <span>Competent Land Acquisition Officer (CALAO)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('officer@sahaay.demo');
                            setPassword('password123');
                          }}
                          className="text-[10px] font-bold text-white bg-[#0284C7] px-2 py-0.5 rounded hover:bg-[#0369A1] transition cursor-pointer"
                        >
                          Quick Fill Officer Demo
                        </button>
                      </div>
                      <p className="text-[11px] text-[#0369A1]">
                        Administrative revenue access to review all 13 Bhopal parcels, verify claims, resolve Section 15 grievances & advance stages.
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                        {loginRole === 'LAND_OWNER'
                          ? 'Registered Land Owner Email / Mobile ID'
                          : 'Officer Official Email / Gov ID'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          loginRole === 'LAND_OWNER'
                            ? 'name@sahaay.demo or your email'
                            : 'officer@sahaay.demo'
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs sm:text-sm font-medium bg-[#F8FAFC] text-[#243746] focus:outline-none focus:border-[#123B5D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                        {loginRole === 'LAND_OWNER'
                          ? 'Passcode / Password'
                          : 'Officer Passcode / Password'}
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs sm:text-sm font-medium bg-[#F8FAFC] text-[#243746] focus:outline-none focus:border-[#123B5D]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full min-h-[46px] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-soft transition flex items-center justify-center space-x-2 disabled:opacity-70 mt-2 cursor-pointer ${
                        loginRole === 'OFFICER'
                          ? 'bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985]'
                          : 'bg-[#123B5D] hover:bg-[#1B4D78] active:bg-[#0C2840]'
                      }`}
                    >
                      {loading ? (
                        <span>{t('verifyingBtn', language)}</span>
                      ) : (
                        <>
                          <span>
                            {loginRole === 'LAND_OWNER'
                              ? 'Sign In as Land Owner'
                              : 'Sign In as Land Officer (CALAO)'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#E8B84A]" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* REGISTRATION TAB: 6-STEP FLOW */
                <div>
                  <RegistrationStepper currentStep={regStep} language={language} />

                  {/* STEP 1: Basic Information */}
                  {regStep === 1 && (
                    <form onSubmit={handleStep1Submit} className="space-y-4 animate-fadeIn">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-[#123B5D]">{t('regStep1Title', language)}</h3>
                        <p className="text-xs text-[#64748B]">{t('regStep1Desc', language)}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                          {t('fullNameLabel', language)} <span className="text-[#C62828]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t('fullNamePlaceholder', language)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs sm:text-sm font-medium bg-[#F8FAFC] text-[#243746] focus:outline-none focus:border-[#123B5D]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                            {t('villageLabel', language)}
                          </label>
                          <input
                            type="text"
                            value={village}
                            onChange={(e) => setVillage(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs font-medium bg-[#F8FAFC] text-[#243746]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                            {t('districtLabel', language)}
                          </label>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs font-medium bg-[#F8FAFC] text-[#243746]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                            {t('emailLabel', language)} <span className="text-[#C62828]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('emailPlaceholder', language)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs sm:text-sm font-medium bg-[#F8FAFC] text-[#243746] focus:outline-none focus:border-[#123B5D]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98XXX XXXXX"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs sm:text-sm font-medium bg-[#F8FAFC] text-[#243746] focus:outline-none focus:border-[#123B5D]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#123B5D] mb-1">
                          {t('passwordLabel', language)} <span className="text-[#C62828]">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('passwordPlaceholder', language)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE6EC] text-xs sm:text-sm font-medium bg-[#F8FAFC] text-[#243746] focus:outline-none focus:border-[#123B5D]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#123B5D] hover:bg-[#1B4D78] active:bg-[#0C2840] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-soft transition flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                      >
                        <span>{t('regNextStepBtn', language)}</span>
                        <ArrowRight className="w-4 h-4 text-[#E8B84A]" />
                      </button>
                    </form>
                  )}

                  {/* STEP 2: PAN Details */}
                  {regStep === 2 && (
                    <PanVerificationStep
                      step={2}
                      panNumber={panNumber}
                      setPanNumber={setPanNumber}
                      panFile={panFile}
                      setPanFile={setPanFile}
                      language={language}
                      onNext={() => setRegStep(3)}
                      onBack={() => setRegStep(1)}
                    />
                  )}

                  {/* STEP 3: PAN Document Upload */}
                  {regStep === 3 && (
                    <PanVerificationStep
                      step={3}
                      panNumber={panNumber}
                      setPanNumber={setPanNumber}
                      panFile={panFile}
                      setPanFile={setPanFile}
                      language={language}
                      onNext={() => setRegStep(4)}
                      onBack={() => setRegStep(2)}
                    />
                  )}

                  {/* STEP 4: Live Selfie Capture / Upload */}
                  {regStep === 4 && (
                    <FaceVerificationStep
                      step={4}
                      panFile={panFile}
                      selfieFile={selfieFile}
                      setSelfieFile={setSelfieFile}
                      verificationResult={verificationResult}
                      setVerificationResult={setVerificationResult}
                      language={language}
                      panNumber={panNumber}
                      onNext={() => setRegStep(5)}
                      onBack={() => setRegStep(3)}
                    />
                  )}

                  {/* STEP 5: Biometric Face Match Check */}
                  {regStep === 5 && (
                    <FaceVerificationStep
                      step={5}
                      panFile={panFile}
                      selfieFile={selfieFile}
                      setSelfieFile={setSelfieFile}
                      verificationResult={verificationResult}
                      setVerificationResult={setVerificationResult}
                      language={language}
                      panNumber={panNumber}
                      onNext={() => setRegStep(6)}
                      onBack={() => setRegStep(4)}
                    />
                  )}

                  {/* STEP 6: Registration & Identity Complete */}
                  {regStep === 6 && (
                    <RegistrationCompleteStep
                      name={name}
                      email={email}
                      panNumber={panNumber}
                      village={village}
                      district={district}
                      selfieFile={selfieFile}
                      verificationResult={verificationResult}
                      language={language}
                      onEnterDashboard={handleFinalRegister}
                      loading={loading}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[11px] text-[#667784]">
            {t('trustBadge', language)}
          </div>
        </div>
      </div>
    </div>
  );
};
