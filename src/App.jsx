import React, { useState, useEffect, useRef } from 'react';  
import {  
  Shield,  
  ShieldAlert,  
  ShieldCheck,  
  AlertTriangle,  
  Siren,  
  PhoneCall,  
  UserCheck,  
  Activity,  
  FileText,  
  BellRing,  
  CheckCircle2,  
  XCircle,  
  HelpCircle,  
  RotateCcw,  
  Zap,  
  Lock,  
  ArrowRight,  
  Eye,  
  Radio,  
  ExternalLink,  
  Info,  
  Clock,  
  Volume2,  
  VolumeX,  
  Send,  
  Users  
} from 'lucide-react';  
  
const SCAM_QUESTIONS = [  
  {  
    id: 'impersonation',  
    question: 'Who is contacting or demanding your attention?',  
    subtitle: 'Digital arrest scammers often impersonate government or law enforcement officials.',  
    options: [  
      { text: 'Police / CBI / TRAI / Customs / ED / RBI / Court', riskWeight: 30, flag: 'Law Enforcement / Regulatory Impersonation' },  
      { text: 'Bank / Courier Service / Telecom Provider', riskWeight: 15, flag: 'Service Provider Impersonation' },  
      { text: 'Unknown caller claiming an issue with my ID or phone number', riskWeight: 10, flag: 'Unverified Caller' },  
      { text: 'Known friend, relative, or verified business', riskWeight: 0, flag: null }  
    ]  
  },  
  {  
    id: 'threat',  
    question: 'What threats or accusations are being made?',  
    subtitle: 'Scammers instill fear by alleging involvement in serious legal crimes.',  
    options: [  
      { text: 'Threat of immediate arrest, court warrant, or money laundering charge', riskWeight: 25, flag: 'Coercive Legal / Arrest Threat' },  
      { text: 'Threat of SIM disconnection or bank account freeze within hours', riskWeight: 20, flag: 'Urgency / Service Cancellation Threat' },  
      { text: 'Unexplained package / illegal contraband seized in my name', riskWeight: 15, flag: 'Customs Contraband Allegation' },  
      { text: 'No specific threat or legal accusation made', riskWeight: 0, flag: null }  
    ]  
  },  
  {  
    id: 'isolation',  
    question: 'Are they demanding strict secrecy or continuous video surveillance?',  
    subtitle: 'A hallmark of "Digital Arrest" is forcing victims onto continuous Skype/WhatsApp video calls.',  
    options: [  
      { text: 'Forced continuous video call & strictly ordered NOT to tell anyone or hang up', riskWeight: 25, flag: 'Forced Isolation & Video Call Monitoring ("Digital Arrest")' },  
      { text: 'Told to go to a private room and avoid discussing with family/police', riskWeight: 15, flag: 'Isolation Demand' },  
      { text: 'They asked me to stay on line, but no threat against telling others', riskWeight: 5, flag: 'Sustained Line Control' },  
      { text: 'No restriction on talking to family or disconnecting', riskWeight: 0, flag: null }  
    ]  
  },  
  {  
    id: 'financial',  
    question: 'What financial or account requests have been made?',  
    subtitle: 'Legitimate law enforcement NEVER asks you to transfer funds for "verification".',  
    options: [  
      { text: 'Demand to transfer money immediately to a "RBI Safety Account" or test UPI ID', riskWeight: 25, flag: 'Safe Account Payment Transfer Demand' },  
      { text: 'Asking for online banking password, OTP, or full card details', riskWeight: 20, flag: 'Credential & OTP Harvesting' },  
      { text: 'Asking for personal financial details / bank balance statements', riskWeight: 10, flag: 'Financial Information Gathering' },  
      { text: 'No money or account details requested', riskWeight: 0, flag: null }  
    ]  
  }  
];  
  
const INITIAL_HISTORY = [  
  {  
    id: 101,  
    timestamp: 'Today, 02:15 PM',  
    score: 85,  
    riskLevel: 'High',  
    trigger: 'CBI Impersonation & Digital Arrest Demand',  
    resolved: false  
  },  
  {  
    id: 102,  
    timestamp: 'Yesterday, 11:30 AM',  
    score: 25,  
    riskLevel: 'Low',  
    trigger: 'Unverified SMS regarding courier package',  
    resolved: true  
  }  
];  
  
export default function App() {  
  const [activeRole, setActiveRole] = useState('victim'); // 'victim' | 'family' | 'simulator'  
  const [currentRiskScore, setCurrentRiskScore] = useState(54);  
  const [panicActive, setPanicActive] = useState(false);  
  const [sirenMuted, setSirenMuted] = useState(false);  
  const [assessmentStep, setAssessmentStep] = useState(0);  
  const [answers, setAnswers] = useState({});  
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);  
  const [riskHistory, setRiskHistory] = useState(INITIAL_HISTORY);  
  const [familyAlerts, setFamilyAlerts] = useState([  
    {  
      id: 1,  
      time: 'Just now',  
      title: 'Medium Risk Detected',  
      desc: 'Victim scored 54/100 on recent threat assessment.',  
      severity: 'medium',  
      acknowledged: false  
    }  
  ]);  
  const [escalationStatus, setEscalationStatus] = useState('idle'); // 'idle' | 'escalated'  
  const [toastMessage, setToastMessage] = useState(null);  
  
  // Audio Ref for Siren synth using Web Audio API  
  const audioCtxRef = useRef(null);  
  const oscRef = useRef(null);  
  const sirenIntervalRef = useRef(null);  
  
  const startSirenAudio = () => {  
    if (sirenMuted) return;  
    try {  
      if (!audioCtxRef.current) {  
        const AudioContext = window.AudioContext || window.webkitAudioContext;  
        audioCtxRef.current = new AudioContext();  
      }  
      if (audioCtxRef.current.state === 'suspended') {  
        audioCtxRef.current.resume();  
      }  
  
      const ctx = audioCtxRef.current;  
      const osc = ctx.createOscillator();  
      const gain = ctx.createGain();  
  
      osc.type = 'sawtooth';  
      osc.frequency.setValueAtTime(600, ctx.currentTime);  
      gain.gain.setValueAtTime(0.1, ctx.currentTime);  
  
      osc.connect(gain);  
      gain.connect(ctx.destination);  
      osc.start();  
  
      oscRef.current = osc;  
  
      // Pitch sweep  
      let high = false;  
      sirenIntervalRef.current = setInterval(() => {  
        if (oscRef.current && ctx) {  
          oscRef.current.frequency.exponentialRampToValueAtTime(  
            high ? 600 : 1200,  
            ctx.currentTime + 0.3  
          );  
          high = !high;  
        }  
      }, 400);  
    } catch (e) {  
      console.log('Audio Context error:', e);  
    }  
  };  
  
  const stopSirenAudio = () => {  
    if (sirenIntervalRef.current) {  
      clearInterval(sirenIntervalRef.current);  
      sirenIntervalRef.current = null;  
    }  
    if (oscRef.current) {  
      try {  
        oscRef.current.stop();  
        oscRef.current.disconnect();  
      } catch (e) { }  
      oscRef.current = null;  
    }  
  };  
  
  useEffect(() => {  
    if (panicActive && !sirenMuted) {  
      startSirenAudio();  
    } else {  
      stopSirenAudio();  
    }  
    return () => stopSirenAudio();  
  }, [panicActive, sirenMuted]);  
  
  const triggerToast = (msg) => {  
    setToastMessage(msg);  
    setTimeout(() => setToastMessage(null), 4000);  
  };  
  
  const handleTogglePanic = () => {  
    const nextState = !panicActive;  
    setPanicActive(nextState);  
  
    if (nextState) {  
      setCurrentRiskScore(95);  
      const newAlert = {  
        id: Date.now(),  
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),  
        title: '🚨 PANIC SIREN ACTIVATED!',  
        desc: 'Victim triggered immediate SOS siren! Potential active Digital Arrest attack in progress.',  
        severity: 'critical',  
        acknowledged: false  
      };  
      setFamilyAlerts((prev) => [newAlert, ...prev]);  
      setRiskHistory((prev) => [  
        {  
          id: Date.now(),  
          timestamp: 'Just now',  
          score: 95,  
          riskLevel: 'High',  
          trigger: '🚨 Emergency Panic Siren Triggered',  
          resolved: false  
        },  
        ...prev  
      ]);  
      triggerToast('🚨 SOS Panic Siren Triggered! Trusted Family Members Have Been Notified!');  
    } else {  
      stopSirenAudio();  
      triggerToast('Panic siren deactivated.');  
    }  
  };  
  
  const handleSelectOption = (questionId, optionIndex) => {  
    setAnswers({ ...answers, [questionId]: optionIndex });  
  };  
  
  const calculateAssessment = () => {  
    let score = 0;  
    const flags = [];  
  
    SCAM_QUESTIONS.forEach((q) => {  
      const selectedIdx = answers[q.id];  
      if (selectedIdx !== undefined) {  
        const option = q.options[selectedIdx];  
        score += option.riskWeight;  
        if (option.flag) flags.push(option.flag);  
      }  
    });  
  
    // Cap score at 100  
    const finalScore = Math.min(100, score);  
    setCurrentRiskScore(finalScore);  
    setIsAssessmentOpen(false);  
  
    let riskLvl = 'Low';  
    if (finalScore >= 70) riskLvl = 'High';  
    else if (finalScore >= 40) riskLvl = 'Medium';  
  
    if (finalScore >= 70) {  
      const alertItem = {  
        id: Date.now(),  
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),  
        title: `⚠️ High Risk Scam Alert (${finalScore}/100)`,  
        desc: `High probability Digital Arrest threat detected. Flags: ${flags.slice(0, 2).join(', ')}`,  
        severity: 'high',  
        acknowledged: false  
      };  
      setFamilyAlerts((prev) => [alertItem, ...prev]);  
      triggerToast('⚠️ High Risk Scam Detected! Family contacts notified automatically.');  
    } else {  
      triggerToast('Assessment completed. Check your risk breakdown below.');  
    }  
  
    setRiskHistory((prev) => [  
      {  
        id: Date.now(),  
        timestamp: 'Just now',  
        score: finalScore,  
        riskLevel: riskLvl,  
        trigger: flags.length > 0 ? flags.join(' • ') : 'Standard Assessment - Safe',  
        resolved: finalScore < 40  
      },  
      ...prev  
    ]);  
  
    setAssessmentStep(0);  
  };  
  
  const getRiskDetails = (score) => {  
    if (score >= 70) {  
      return {  
        level: 'HIGH RISK',  
        color: 'text-red-500',  
        bgColor: 'bg-red-500/10',  
        borderColor: 'border-red-500/40',  
        ringColor: '#ef4444',  
        badge: '🚨 Active Threat / High Risk',  
        description: 'CRITICAL ALERT: Strong indicators of a Digital Arrest scam. Law enforcement NEVER holds victims on video calls or demands money transfers.'  
      };  
    }  
    if (score >= 40) {  
      return {  
        level: 'MEDIUM RISK',  
        color: 'text-amber-400',  
        bgColor: 'bg-amber-500/10',  
        borderColor: 'border-amber-500/40',  
        ringColor: '#f59e0b',  
        badge: '⚠️ Suspicious Activity',  
        description: 'MODERATE WARNING: The caller is displaying known high-pressure tactics. Do not share OTPs, bank accounts, or stay on coerced calls.'  
      };  
    }  
    return {  
      level: 'LOW RISK',  
      color: 'text-emerald-400',  
      bgColor: 'bg-emerald-500/10',  
      borderColor: 'border-emerald-500/40',  
      ringColor: '#10b981',  
      badge: '✅ Normal / Safe Status',  
      description: 'LOW RISK: No direct coercion detected. Remain vigilant and never disclose banking credentials to unverified callers.'  
    };  
  };  
  
  const riskInfo = getRiskDetails(currentRiskScore);  
  
  return (  
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">  
      {/* Dynamic Toast Notification */}  
      {toastMessage && (  
        <div className="fixed top-20 right-4 z-50 bg-slate-800 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">  
          <BellRing className="w-5 h-5 text-cyan-400 animate-pulse" />  
          <span className="text-sm font-medium">{toastMessage}</span>  
        </div>  
      )}  
  
      {/* Top Banner Navigation */}  
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">  
        <div className="flex items-center gap-3">  
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">  
            <Shield className="w-6 h-6 text-white" />  
          </div>  
          <div>  
            <div className="flex items-center gap-2">  
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">  
                ScamShield  
              </h1>  
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">  
                Digital Arrest Prevention  
              </span>  
            </div>  
            <p className="text-xs text-slate-400">Family Safety & Threat Radar Engine</p>  
          </div>  
        </div>  
  
        {/* Role Switcher Tabs */}  
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">  
          <button  
            onClick={() => setActiveRole('victim')}  
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRole === 'victim'  
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'  
              : 'text-slate-400 hover:text-slate-200'  
              }`}  
          >  
            <ShieldAlert className="w-4 h-4" />  
            Victim Dashboard  
          </button>  
          <button  
            onClick={() => setActiveRole('family')}  
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${activeRole === 'family'  
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'  
              : 'text-slate-400 hover:text-slate-200'  
              }`}  
          >  
            <Users className="w-4 h-4" />  
            Family Guard  
            {familyAlerts.some((a) => !a.acknowledged) && (  
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />  
            )}  
          </button>  
          <button  
            onClick={() => setActiveRole('simulator')}  
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRole === 'simulator'  
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'  
              : 'text-slate-400 hover:text-slate-200'  
              }`}  
          >  
            <Zap className="w-4 h-4" />  
            Attack Simulator  
          </button>  
        </div>  
  
        {/* Audio Siren Toggle & User Avatar */}  
        <div className="flex items-center gap-3">  
          <button  
            onClick={() => setSirenMuted(!sirenMuted)}  
            title={sirenMuted ? 'Unmute Siren Audio' : 'Mute Siren Audio'}  
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"  
          >  
            {sirenMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}  
          </button>  
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">  
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">  
              VP  
            </div>  
            <div className="text-left">  
              <p className="text-xs font-medium text-slate-200">Vaishali P.</p>  
              <p className="text-[10px] text-slate-400">Protected User</p>  
            </div>  
          </div>  
        </div>  
      </header>  
  
      { }  
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">  
        {/* Panic Alert Banner if active */}  
        {panicActive && (  
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border-2 border-red-500/80 shadow-2xl shadow-red-600/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">  
            <div className="flex items-center gap-4">  
              <div className="p-3 bg-red-600 text-white rounded-xl animate-bounce">  
                <Siren className="w-8 h-8" />  
              </div>  
              <div>  
                <h2 className="text-lg font-bold text-red-200">🚨 PANIC SIREN ACTIVATED</h2>  
                <p className="text-xs text-red-300">  
                  SOS signal dispatched! Audio alarm active. Emergency alert sent to family members.  
                </p>  
              </div>  
            </div>  
            <button  
              onClick={handleTogglePanic}  
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all"  
            >  
              STOP PANIC ALARM  
            </button>  
          </div>  
        )}  
  
        {/* ROLE 1: VICTIM DASHBOARD */}  
        {activeRole === 'victim' && (  
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  
            {/* Left Column: Risk Gauge & Quick Actions */}  
            <div className="lg:col-span-1 space-y-6">  
              {/* Risk Gauge Card */}  
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden">  
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">  
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />  
                  Live Monitoring  
                </div>  
  
                <h3 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">  
                  Current Risk Score  
                </h3>  
  
                {/* SVG Ring Circular Gauge */}  
                <div className="relative w-48 h-48 flex items-center justify-center my-2">  
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">  
                    <circle  
                      cx="50"  
                      cy="50"  
                      r="40"  
                      stroke="currentColor"  
                      strokeWidth="8"  
                      className="text-slate-800"  
                      fill="transparent"  
                    />  
                    <circle  
                      cx="50"  
                      cy="50"  
                      r="40"  
                      stroke={riskInfo.ringColor}  
                      strokeWidth="8"  
                      strokeDasharray={251.2}  
                      strokeDashoffset={251.2 - (251.2 * currentRiskScore) / 100}  
                      strokeLinecap="round"  
                      className="transition-all duration-1000 ease-out"  
                      fill="transparent"  
                    />  
                  </svg>  
                  <div className="absolute flex flex-col items-center justify-center">  
                    <span className="text-4xl font-extrabold text-white tracking-tight">  
                      {currentRiskScore}  
                    </span>  
                    <span className="text-xs font-medium text-slate-400">/ 100 Score</span>  
                  </div>  
                </div>  
  
                {/* Status Badge */}  
                <div className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold border ${riskInfo.bgColor} ${riskInfo.color} ${riskInfo.borderColor}`}>  
                  {riskInfo.badge}  
                </div>  
  
                <p className="mt-4 text-xs text-slate-400 leading-relaxed px-2">  
                  {riskInfo.description}  
                </p>  
  
                {/* Interactive Assessment Button */}  
                <button  
                  onClick={() => setIsAssessmentOpen(true)}  
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"  
                >  
                  <FileText className="w-4 h-4" />  
                  Analyze My Situation Now  
                </button>  
              </div>  
  
              {/* 🚨 Emergency Panic Button Card */}  
              <div className="bg-gradient-to-b from-red-950/40 to-slate-900 border border-red-900/40 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">  
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">  
                  <Siren className="w-6 h-6 animate-pulse" />  
                </div>  
                <h3 className="text-base font-bold text-red-200">Digital Arrest Panic Siren</h3>  
                <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">  
                  Being pressured onto a video call or threatened with arrest? Press below to sound an alert and call your trusted family contact.  
                </p>  
                <button  
                  onClick={handleTogglePanic}  
                  className={`w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-3 ${panicActive  
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'  
                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/50 animate-pulse'  
                    }`}  
                >  
                  <Siren className="w-5 h-5" />  
                  {panicActive ? 'Deactivate Panic Siren' : '🚨 Trigger Panic Siren'}  
                </button>  
              </div>  
            </div>  
  
            {/* Right Column: Threats Breakdown & Guidelines */}  
            <div className="lg:col-span-2 space-y-6">  
              {/* Digital Arrest Anti-Scam Rules Card */}  
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">  
                <div className="flex items-center justify-between mb-4">  
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">  
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />  
                    Golden Rules Against "Digital Arrest"  
                  </h3>  
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20 font-mono">  
                    VERIFIED SAFETY  
                  </span>  
                </div>  
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">  
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">  
                    <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0 mt-0.5">  
                      <XCircle className="w-4 h-4" />  
                    </div>  
                    <div>  
                      <h4 className="text-xs font-bold text-slate-200">No Video Call Arrests</h4>  
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">  
                        CBI, Police, or Customs NEVER conduct arrests or judicial proceedings via Skype, WhatsApp, or video call.  
                      </p>  
                    </div>  
                  </div>  
  
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">  
                    <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0 mt-0.5">  
                      <XCircle className="w-4 h-4" />  
                    </div>  
                    <div>  
                      <h4 className="text-xs font-bold text-slate-200">No "Safety Accounts"</h4>  
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">  
                        Government authorities will NEVER ask you to transfer funds to a private UPI or bank account to verify innocence.  
                      </p>  
                    </div>  
                  </div>  
  
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">  
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">  
                      <CheckCircle2 className="w-4 h-4" />  
                    </div>  
                    <div>  
                      <h4 className="text-xs font-bold text-slate-200">Disconnect & Call 1930</h4>  
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">  
                        Immediately disconnect coerced calls. Dial 1930 (Cybercrime Helpline) or visit your nearest local police station.  
                      </p>  
                    </div>  
                  </div>  
  
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">  
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">  
                      <CheckCircle2 className="w-4 h-4" />  
                    </div>  
                    <div>  
                      <h4 className="text-xs font-bold text-slate-200">Inform Family Immediately</h4>  
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">  
                        Scammers try to isolate you. Break isolation by alerting your family members right away.  
                      </p>  
                    </div>  
                  </div>  
                </div>  
              </div>  
  
              {/* Assessment History & Audit Logs */}  
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">  
                <div className="flex items-center justify-between mb-4">  
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">  
                    <Clock className="w-5 h-5 text-blue-400" />  
                    Risk Audit Log & Trigger History  
                  </h3>  
                  <span className="text-xs text-slate-400">{riskHistory.length} Recorded Entries</span>  
                </div>  
  
                <div className="space-y-3">  
                  {riskHistory.map((item) => (  
                    <div  
                      key={item.id}  
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-colors"  
                    >  
                      <div className="flex items-center gap-3">  
                        <div  
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${item.score >= 70  
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'  
                            : item.score >= 40  
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'  
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'  
                            }`}  
                        >  
                          {item.score}  
                        </div>  
                        <div>  
                          <p className="text-xs font-semibold text-slate-200">{item.trigger}</p>  
                          <p className="text-[10px] text-slate-400">{item.timestamp}</p>  
                        </div>  
                      </div>  
  
                      <div className="flex items-center gap-3">  
                        <span  
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.riskLevel === 'High'  
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'  
                            : item.riskLevel === 'Medium'  
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'  
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'  
                            }`}  
                        >  
                          {item.riskLevel} Risk  
                        </span>  
                        {item.resolved ? (  
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">  
                            <CheckCircle2 className="w-3 h-3" /> Resolved  
                          </span>  
                        ) : (  
                          <span className="text-[10px] text-red-400 flex items-center gap-1 animate-pulse">  
                            <AlertTriangle className="w-3 h-3" /> Action Recommended  
                          </span>  
                        )}  
                      </div>  
                    </div>  
                  ))}  
                </div>  
              </div>  
            </div>  
          </div>  
        )}  
  
        {/* ROLE 2: FAMILY MEMBER DASHBOARD */}  
        {activeRole === 'family' && (  
          <div className="space-y-6">  
            {/* Top Family Protection Alert Banner */}  
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">  
              <div className="flex items-center gap-4">  
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">  
                  <ShieldCheck className="w-8 h-8" />  
                </div>  
                <div>  
                  <div className="flex items-center gap-2">  
                    <h2 className="text-lg font-bold text-slate-100">Family Safety Guardian Hub</h2>  
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">  
                      Sync Active  
                    </span>  
                  </div>  
                  <p className="text-xs text-slate-400 mt-1">  
                    Monitoring <strong className="text-slate-200">Vaishali P. (Mother)</strong> for coercive digital threats and scam indicators.  
                  </p>  
                </div>  
              </div>  
  
              {/* Quick Contact & Escalation Actions */}  
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">  
                <button  
                  onClick={() => triggerToast('Calling Vaishali P. directly...')}  
                  className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"  
                >  
                  <PhoneCall className="w-4 h-4" />  
                  Call Victim Directly  
                </button>  
                <button  
                  onClick={() => {  
                    setEscalationStatus('escalated');  
                    triggerToast('Escalated report draft generated for 1930 Cybercrime Portal.');  
                  }}  
                  className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"  
                >  
                  <ExternalLink className="w-4 h-4" />  
                  Simulate 1930 Escalation  
                </button>  
              </div>  
            </div>  
  
            {/* Live Family Alerts Grid */}  
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  
              {/* Left 2 Cols: Incoming Alerts & Indicator Summary */}  
              <div className="lg:col-span-2 space-y-6">  
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">  
                  <div className="flex items-center justify-between mb-4">  
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">  
                      <BellRing className="w-5 h-5 text-cyan-400" />  
                      Real-Time Family Threat Alerts  
                    </h3>  
                    <span className="text-xs text-slate-400">{familyAlerts.length} total alerts</span>  
                  </div>  
  
                  {familyAlerts.length === 0 ? (  
                    <div className="text-center py-8 text-slate-500 text-xs">  
                      No current scam threats reported for your family member.  
                    </div>  
                  ) : (  
                    <div className="space-y-4">  
                      {familyAlerts.map((alert) => (  
                        <div  
                          key={alert.id}  
                          className={`p-4 rounded-xl border transition-all ${alert.severity === 'critical'  
                            ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/10'  
                            : alert.severity === 'high'  
                              ? 'bg-rose-950/20 border-rose-500/40'  
                              : 'bg-slate-950 border-slate-800'  
                            }`}  
                        >  
                          <div className="flex items-start justify-between gap-3">  
                            <div className="flex items-start gap-3">  
                              <div  
                                className={`p-2 rounded-lg mt-0.5 ${alert.severity === 'critical' || alert.severity === 'high'  
                                  ? 'bg-red-500/20 text-red-400'  
                                  : 'bg-amber-500/20 text-amber-400'  
                                  }`}  
                              >  
                                <AlertTriangle className="w-5 h-5" />  
                              </div>  
                              <div>  
                                <h4 className="text-sm font-bold text-slate-100">{alert.title}</h4>  
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">  
                                  {alert.desc}  
                                </p>  
                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">  
                                  <Clock className="w-3 h-3" /> Timestamp: {alert.time}  
                                </p>  
                              </div>  
                            </div>  
  
                            <button  
                              onClick={() => {  
                                setFamilyAlerts((prev) =>  
                                  prev.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a))  
                                );  
                                triggerToast('Alert marked as acknowledged.');  
                              }}  
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${alert.acknowledged  
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'  
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'  
                                }`}  
                            >  
                              {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}  
                            </button>  
                          </div>  
                        </div>  
                      ))}  
                    </div>  
                  )}  
                </div>  
  
                {/* Simulated 1930 Cybercrime Portal Escalation Modal/Box */}  
                {escalationStatus === 'escalated' && (  
                  <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">  
                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">  
                      Simulated Cybercrime Escalation  
                    </div>  
                    <div className="flex items-center gap-3 mb-4">  
                      <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">  
                        <FileText className="w-6 h-6" />  
                      </div>  
                      <div>  
                        <h3 className="text-base font-bold text-slate-100">  
                          National Cyber Crime Reporting Portal (1930) Draft  
                        </h3>  
                        <p className="text-xs text-slate-400">Auto-filled incident summary based on recorded threat indicators.</p>  
                      </div>  
                    </div>  
  
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 mb-4">  
                      <p><span className="text-purple-400">Incident Type:</span> Digital Arrest Impersonation & Extortion</p>  
                      <p><span className="text-purple-400">Victim Contact:</span> Vaishali P. (+91 98765 *****)</p>  
                      <p><span className="text-purple-400">Risk Score at Incident:</span> {currentRiskScore}/100</p>  
                      <p><span className="text-purple-400">Trigger Flags:</span> Law Enforcement Impersonation, Forced Isolation, Payment Demand</p>  
                      <p><span className="text-purple-400">Status:</span> Prepared for Helpline 1930 Transmission</p>  
                    </div>  
  
                    <div className="flex items-center gap-3 justify-end">  
                      <button  
                        onClick={() => setEscalationStatus('idle')}  
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"  
                      >  
                        Dismiss Draft  
                      </button>  
                      <button  
                        onClick={() => triggerToast('Report submitted to Simulated Cybercrime Desk!')}  
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg"  
                      >  
                        Submit Simulated Report  
                      </button>  
                    </div>  
                  </div>  
                )}  
              </div>  
  
              {/* Right Col: Victim Live Status & Quick Siren Control */}  
              <div className="lg:col-span-1 space-y-6">  
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">  
                  <div className="relative mb-3">  
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-500/50 flex items-center justify-center font-bold text-slate-200 text-xl">  
                      VP  
                    </div>  
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />  
                  </div>  
                  <h3 className="text-base font-bold text-slate-100">Vaishali P.</h3>  
                  <p className="text-xs text-slate-400">Primary Monitored Line</p>  
  
                  <div className="mt-4 w-full bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">  
                    <span className="text-slate-400">Live Risk Status:</span>  
                    <span className={`font-bold ${riskInfo.color}`}>{riskInfo.level}</span>  
                  </div>  
  
                  {/* Remote Siren Trigger for Family */}  
                  <div className="mt-6 w-full pt-6 border-t border-slate-800">  
                    <h4 className="text-xs font-bold text-slate-300 mb-2">Remote Family Interventions</h4>  
                    <p className="text-[11px] text-slate-400 mb-4">  
                      If you suspect your relative is trapped in a video call scam, trigger an immediate loud break-in siren on their phone.  
                    </p>  
                    <button  
                      onClick={handleTogglePanic}  
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"  
                    >  
                      <Siren className="w-4 h-4" />  
                      {panicActive ? 'Silence Remote Siren' : 'Sound Loud Siren on Victim Phone'}  
                    </button>  
                  </div>  
                </div>  
              </div>  
            </div>  
          </div>  
        )}  
  
        {/* ROLE 3: LIVE SCAM SIMULATOR */}  
        {activeRole === 'simulator' && (  
          <div className="space-y-6">  
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">  
              <div className="flex items-center gap-3 mb-4">  
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">  
                  <Zap className="w-6 h-6" />  
                </div>  
                <div>  
                  <h2 className="text-lg font-bold text-slate-100">Interactive Digital Arrest Attack Simulator</h2>  
                  <p className="text-xs text-slate-400">  
                    Test how ScamShield detects threats and notifies family members in real-time under mock scam scenarios.  
                  </p>  
                </div>  
              </div>  
  
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">  
                {/* Scenario 1 */}  
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-purple-500/50 transition-colors">  
                  <div>  
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">  
                      High Severity  
                    </span>  
                    <h3 className="text-sm font-bold text-slate-100 mt-3">Fake CBI Video Call Demand</h3>  
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">  
                      Simulates a fake officer demanding continuous Skype video monitoring and fund transfer to an "RBI safe account".  
                    </p>  
                  </div>  
                  <button  
                    onClick={() => {  
                      setCurrentRiskScore(88);  
                      setRiskHistory((prev) => [  
                        {  
                          id: Date.now(),  
                          timestamp: 'Just now (Simulated)',  
                          score: 88,  
                          riskLevel: 'High',  
                          trigger: 'Simulated: Fake CBI Video Call & Transfer Demand',  
                          resolved: false  
                        },  
                        ...prev  
                      ]);  
                      setFamilyAlerts((prev) => [  
                        {  
                          id: Date.now(),  
                          time: 'Just now',  
                          title: '🚨 SIMULATED HIGH RISK: CBI Video Arrest',  
                          desc: 'Scammer demanding video call isolation and money transfer.',  
                          severity: 'high',  
                          acknowledged: false  
                        },  
                        ...prev  
                      ]);  
                      triggerToast('Simulated Fake CBI Call Attack injected! Check Victim & Family views.');  
                    }}  
                    className="mt-4 w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all"  
                  >  
                    Inject CBI Scenario  
                  </button>  
                </div>  
  
                {/* Scenario 2 */}  
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-purple-500/50 transition-colors">  
                  <div>  
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">  
                      Medium Severity  
                    </span>  
                    <h3 className="text-sm font-bold text-slate-100 mt-3">Customs Package Illegal Parcel</h3>  
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">  
                      Simulates an automated call alleging an illegal passport or drugs seized at Mumbai airport.  
                    </p>  
                  </div>  
                  <button  
                    onClick={() => {  
                      setCurrentRiskScore(55);  
                      setRiskHistory((prev) => [  
                        {  
                          id: Date.now(),  
                          timestamp: 'Just now (Simulated)',  
                          score: 55,  
                          riskLevel: 'Medium',  
                          trigger: 'Simulated: Customs Seizure Threat',  
                          resolved: false  
                        },  
                        ...prev  
                      ]);  
                      setFamilyAlerts((prev) => [  
                        {  
                          id: Date.now(),  
                          time: 'Just now',  
                          title: '⚠️ SIMULATED MEDIUM RISK: Customs Threat',  
                          desc: 'Unverified caller alleging seized contraband.',  
                          severity: 'medium',  
                          acknowledged: false  
                        },  
                        ...prev  
                      ]);  
                      triggerToast('Simulated Customs Threat injected!');  
                    }}  
                    className="mt-4 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"  
                  >  
                    Inject Customs Scenario  
                  </button>  
                </div>  
  
                {/* Scenario 3 */}  
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-purple-500/50 transition-colors">  
                  <div>  
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">  
                      Reset / Clear  
                    </span>  
                    <h3 className="text-sm font-bold text-slate-100 mt-3">Reset to Safe State</h3>  
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">  
                      Clears high risk status and restores risk score back to normal safe levels.  
                    </p>  
                  </div>  
                  <button  
                    onClick={() => {  
                      setCurrentRiskScore(15);  
                      setPanicActive(false);  
                      triggerToast('System reset to safe baseline score (15/100).');  
                    }}  
                    className="mt-4 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"  
                  >  
                    Reset System State  
                  </button>  
                </div>  
              </div>  
            </div>  
          </div>  
        )}  
      </main>  
  
      { }  
      {isAssessmentOpen && (  
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">  
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">  
            {/* Header */}  
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">  
              <div className="flex items-center gap-2">  
                <ShieldAlert className="w-5 h-5 text-cyan-400" />  
                <h3 className="text-base font-bold text-slate-100">  
                  Scam Indicator Assessment ({assessmentStep + 1}/{SCAM_QUESTIONS.length})  
                </h3>  
              </div>  
              <button  
                onClick={() => setIsAssessmentOpen(false)}  
                className="text-slate-400 hover:text-slate-200 p-1"  
              >  
                ✕  
              </button>  
            </div>  
  
            {/* Current Question Body */}  
            <div className="py-6">  
              <h4 className="text-sm font-bold text-slate-100">  
                {SCAM_QUESTIONS[assessmentStep].question}  
              </h4>  
              <p className="text-xs text-slate-400 mt-1 mb-4">  
                {SCAM_QUESTIONS[assessmentStep].subtitle}  
              </p>  
  
              <div className="space-y-2.5">  
                {SCAM_QUESTIONS[assessmentStep].options.map((option, idx) => {  
                  const isSelected = answers[SCAM_QUESTIONS[assessmentStep].id] === idx;  
                  return (  
                    <button  
                      key={idx}  
                      onClick={() => handleSelectOption(SCAM_QUESTIONS[assessmentStep].id, idx)}  
                      className={`w-full text-left p-3.5 rounded-xl text-xs font-medium transition-all flex items-start gap-3 border ${isSelected  
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-md'  
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'  
                        }`}  
                    >  
                      <div  
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'  
                          }`}  
                      >  
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}  
                      </div>  
                      <span>{option.text}</span>  
                    </button>  
                  );  
                })}  
              </div>  
            </div>  
  
            {/* Modal Controls */}  
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">  
              <button  
                onClick={() => setAssessmentStep((prev) => Math.max(0, prev - 1))}  
                disabled={assessmentStep === 0}  
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 disabled:opacity-40"  
              >  
                Back  
              </button>  
  
              {assessmentStep < SCAM_QUESTIONS.length - 1 ? (  
                <button  
                  onClick={() => setAssessmentStep((prev) => prev + 1)}  
                  disabled={answers[SCAM_QUESTIONS[assessmentStep].id] === undefined}  
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg transition-all"  
                >  
                  Next Question  
                </button>  
              ) : (  
                <button  
                  onClick={calculateAssessment}  
                  disabled={answers[SCAM_QUESTIONS[assessmentStep].id] === undefined}  
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"  
                >  
                  Calculate Risk & Finish  
                </button>  
              )}  
            </div>  
          </div>  
        </div>  
      )}  
  
      {/* Footer */}  
      <footer className="border-t border-slate-800 py-4 px-8 text-center text-xs text-slate-500">  
        <p>ScamShield — Digital Arrest Scam Prevention & Family Safety System Prototype</p>  
      </footer>  
    </div>  
  );  
}