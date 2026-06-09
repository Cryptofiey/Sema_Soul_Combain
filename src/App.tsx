import React, { useState, useEffect } from "react";
import { 
  Brain, Shield, Crosshair, Award, Zap, RefreshCw, 
  Cpu, Play, Lock, AlertTriangle, Code, User, Compass,
  ChevronRight, Sparkles, Flame, Eye, Database, Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LobeType, Neuron, Synapse, Biochemistry, EntityDNA, CorridorLayer, AcademyLesson, SimulationState, SemanticTree, SemanticNode } from "./types";

export default function App() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [activeTab, setActiveTab] = useState<"brain" | "environment" | "learning" | "crystallize">("crystallize");
  const [isResetting, setIsResetting] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  // Semantic Crystallization State
  const [phantomTask, setPhantomTask] = useState("");
  const [semanticTree, setSemanticTree] = useState<SemanticTree | null>(null);
  const [isCrystallizing, setIsCrystallizing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SemanticNode | null>(null);

  // Interceptor State
  const [rightPanelTab, setRightPanelTab] = useState<"viewer" | "interceptor">("interceptor");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isIntercepting, setIsIntercepting] = useState(false);

  const handleCrystallize = async () => {
    if (!phantomTask.trim()) return;
    setIsCrystallizing(true);
    setSemanticTree(null);
    setSelectedNode(null);
    setChatMessages([]);
    try {
      const res = await fetch("/api/crystallize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: phantomTask })
      });
      const data = await res.json();
      if (data.success) {
        setSemanticTree(data.tree);
        setChatMessages([{
          id: Date.now().toString(),
          role: "agent",
          content: `Я кристаллизован под задачу: "${phantomTask}". Моя точка сборки зафиксирована. Базовые ветви активны.`
        }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCrystallizing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !semanticTree || isIntercepting) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsIntercepting(true);
    setRightPanelTab("interceptor");

    try {
      const res = await fetch("/api/interceptor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, tree: semanticTree })
      });
      const data = await res.json();
      
      if (data.success) {
        setSemanticTree({ ...semanticTree, nodes: data.updatedNodes });
        
        const combineMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "combine",
          content: data.interceptorLog.action,
          interceptorLog: data.interceptorLog
        };
        
        const agentMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "agent",
          content: data.agentResponse
        };

        setChatMessages(prev => [...prev, combineMsg, agentMsg]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsIntercepting(false);
    }
  };

  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await fetch("/api/state");
        if (response.ok) {
          const data = await response.json();
          setState(data);
          setOfflineMode(false);
        } else setOfflineMode(true);
      } catch (err) {
        setOfflineMode(true);
      }
    };
    fetchState();
    const intervalId = setInterval(fetchState, 1500);
    return () => clearInterval(intervalId);
  }, []);

  const injectChemical = async (type: "adrenaline" | "energy") => {
    if (!state) return;
    setIsInjecting(true);
    try {
      const field = type === "adrenaline" ? "adrenaline" : "energy";
      const value = type === "adrenaline" ? 95.0 : 100.0;
      
      const updatedBio = { 
        ...state.biochemistry, 
        [field]: value,
        pain: type === "adrenaline" ? Math.min(100, state.biochemistry.pain + 15) : state.biochemistry.pain,
        pleasure: type === "energy" ? Math.min(100, state.biochemistry.pleasure + 20) : state.biochemistry.pleasure
      };

      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ biochemistry: updatedBio })
      });
      if (response.ok) {
        const data = await response.json();
        setState(data.state);
      }
    } catch (err) {} finally { setTimeout(() => setIsInjecting(false), 800); }
  };

  const handleEntityDNAChange = async (entIndex: number, field: keyof EntityDNA, value: number) => {
    if (!state) return;
    const entitiesCopy = [...state.entities];
    const targetEnt = { ...entitiesCopy[entIndex] };
    
    if (field === "volatility") {
      targetEnt.volatility = value;
      targetEnt.volatilityGap = Math.max(0, value - targetEnt.aggression);
    } else if (field === "aggression") {
      targetEnt.aggression = value;
      targetEnt.volatilityGap = Math.max(0, targetEnt.volatility - value);
    } else {
      // @ts-ignore
      targetEnt[field] = value;
    }
    entitiesCopy[entIndex] = targetEnt;
    
    try {
      const response = await fetch("/api/state", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entities: entitiesCopy })
      });
      if (response.ok) {
        setState(prev => prev ? { ...prev, entities: entitiesCopy } : null);
      }
    } catch (err) {}
  };

  const runAcademyLesson = async (lessonId: string) => {
    setTrainingId(lessonId);
    try {
      const response = await fetch("/api/academy/start-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId })
      });
      if (response.ok) {
        const data = await response.json();
        setState(data.state);
      }
    } catch (err) {} finally { setTrainingId(null); }
  };

  const resetNeuralMatrix = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/api/state/reset", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setState(data.state);
      }
    } catch (err) {} finally { setTimeout(() => setIsResetting(false), 1000); }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="mb-4">
          <Cpu className="w-12 h-12 text-cyan-500" />
        </motion.div>
        <p className="text-sm font-mono text-cyan-400 tracking-widest animate-pulse">BOOTING NEURO-MATRICES...</p>
      </div>
    );
  }

  const bio = state.biochemistry;
  const currentActiveLesson = state.academyLessons.find(l => l.id === state.activeLessonId || l.status === "active");

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 font-sans pb-16 relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 pt-6 relative z-10">
        
        <section className="flex flex-col md:flex-row md:items-center justify-between border border-slate-800/80 bg-slate-900/40 rounded-2xl p-4 md:p-5 backdrop-blur-md mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-sans">
                  UNIVERSAL GENERAL INTELLIGENCE (UGI) ARCHITECTURE
                </h1>
                <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Proto-Biological Core
                </span>
                {offlineMode && <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 font-mono px-2 py-0.5 rounded-full uppercase">OFFLINE</span>}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Biological emulation engine fusing dynamic Hebbian tuning with LLM-guided Neo-cortical reasoning.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-400">PHYSICS TICK:</span>
              <span className="text-slate-200 font-bold">{state.tick}</span>
            </div>
            <button onClick={resetNeuralMatrix} disabled={isResetting} className="bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition px-3 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-55">
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? "animate-spin" : ""}`} />
              <span>Reset Hebbian Net</span>
            </button>
          </div>
        </section>

        <section className="bg-slate-900/20 border border-slate-800/65 rounded-2xl p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-semibold tracking-wide text-amber-100 uppercase">Somatic/Chemical State</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => injectChemical("adrenaline")} disabled={isInjecting} className="text-[10px] font-mono bg-red-950/40 hover:bg-red-900/30 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-md transition flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> System Anomaly Shock
              </button>
              <button onClick={() => injectChemical("energy")} disabled={isInjecting} className="text-[10px] font-mono bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md transition flex items-center gap-1.5">
                <Flame className="w-3 h-3" /> Core Energy Bump
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: "Energy Reserves", value: bio.energy, color: "bg-emerald-500", textCol: "text-emerald-400" },
              { label: "Epistemic Curiosity", value: bio.curiosity, color: "bg-cyan-500", textCol: "text-cyan-400" },
              { label: "Pain Interface", value: bio.pain, color: "bg-red-500", textCol: "text-red-400" },
              { label: "Reward Feedback", value: bio.pleasure, color: "bg-pink-500", textCol: "text-pink-400" },
              { label: "Stagnation/Boredom", value: bio.boredom, color: "bg-indigo-500", textCol: "text-indigo-400" },
              { label: "Threat/Adrenaline", value: bio.adrenaline, color: "bg-amber-500", textCol: "text-amber-400" },
            ].map((chem, idx) => (
              <div key={idx} className={`p-3 rounded-xl border border-slate-800/60 bg-slate-950/40 flex flex-col justify-between`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">{chem.label}</span>
                </div>
                <div>
                  <span className={`text-base font-bold font-mono tracking-tight ${chem.textCol}`}>{chem.value.toFixed(1)}%</span>
                  <div className="w-full bg-slate-800/50 rounded-full h-1 mt-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${chem.value}%` }} transition={{ type: "spring", stiffness: 80 }} className={`h-full ${chem.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex border-b border-slate-800 mb-6 bg-slate-950/40 p-1 rounded-xl">
          <button onClick={() => setActiveTab("crystallize")} className={`flex-1 py-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "crystallize" ? "bg-purple-900/50 text-white shadow-[0_0_12px_-4px_rgba(147,51,234,0.4)] border border-purple-500/30" : "text-slate-400 hover:text-slate-200"}`}>
            <Sparkles className="w-4 h-4 text-purple-400" /> <span className="text-purple-100">Crystallization Matrix</span>
          </button>
          <button onClick={() => setActiveTab("brain")} className={`flex-1 py-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "brain" ? "bg-slate-800/80 text-white shadow-[0_0_12px_-4px_rgba(255,255,255,0.2)]" : "text-slate-400 hover:text-slate-200"}`}>
            <Brain className="w-4 h-4" /> <span>Lobed Neuro-Matrix</span>
          </button>
          <button onClick={() => setActiveTab("environment")} className={`flex-1 py-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "environment" ? "bg-slate-800/80 text-white shadow-[0_0_12px_-4px_rgba(255,255,255,0.2)]" : "text-slate-400 hover:text-slate-200"}`}>
            <Crosshair className="w-4 h-4" /> <span>Action Corridors & Entities</span>
          </button>
          <button onClick={() => setActiveTab("learning")} className={`flex-1 py-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "learning" ? "bg-slate-800/80 text-white shadow-[0_0_12px_-4px_rgba(255,255,255,0.2)]" : "text-slate-400 hover:text-slate-200"}`}>
            <Award className="w-4 h-4" /> <span>Neocortical Academy Simulation</span>
          </button>
        </div>

        <main className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === "crystallize" && (
              <motion.div
                key="crystallize"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Input Section */}
                <div className="border border-purple-500/30 bg-purple-950/20 p-5 md:p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/5 pointer-events-none" />
                  <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase mb-2 flex items-center gap-2 font-mono relative z-10">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Модуль Семантической Кристаллизации (Смещение Точки Сборки)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-5 relative z-10">
                    Задайте цель, чтобы сгенерировать восходящее древо (от фундаментального мировоззрения до инструментальной фокусировки). Файловая структура и её имена выступят якорями для перевода когнитивного состояния ИИ в нужную фантомную личность.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <input 
                      type="text"
                      placeholder="Например: Починить архитектуру React-приложения, или Собрать трубы..."
                      className="flex-1 bg-slate-900/80 border border-slate-700/80 focus:border-purple-500/80 rounded-xl px-4 py-3 text-sm outline-none text-slate-200 font-mono transition shadow-inner"
                      value={phantomTask}
                      onChange={(e) => setPhantomTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCrystallize()}
                    />
                    <button 
                      onClick={handleCrystallize}
                      disabled={isCrystallizing || !phantomTask.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold font-mono uppercase tracking-wider text-xs transition shadow-[0_0_15px_-3px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
                    >
                      {isCrystallizing ? (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 shrink-0" />
                      )}
                      <span>Кристаллизация</span>
                    </button>
                  </div>
                </div>

                {/* Tree Rendering Section */}
                {semanticTree && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tree Visualizer */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="border border-slate-800/80 bg-slate-900/40 p-4 md:p-5 rounded-2xl h-[600px] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"><Database className="w-32 h-32 text-purple-400" /></div>
                        
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4 text-center font-mono z-10">
                          Вектор Идентичности:<br/>
                          <span className="text-purple-400 text-sm mt-1 block">{semanticTree.phantomName}</span>
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-5 pr-2 flex flex-col-reverse relative z-10 scrollbar-thin">
                          {/* Connecting line */}
                          <div className="absolute left-[23px] top-6 bottom-6 w-px bg-slate-700/80" />

                          {[1, 2, 3, 4, 5].map((layerIndex) => {
                            const nodesInLayer = semanticTree.nodes.filter(n => n.layer === layerIndex);
                            if (nodesInLayer.length === 0) return null;
                            
                            const layerName = nodesInLayer[0].layerName;
                            
                            let accent = "slate";
                            if (layerIndex === 1) accent = "red";
                            if (layerIndex === 2) accent = "orange";
                            if (layerIndex === 3) accent = "yellow";
                            if (layerIndex === 4) accent = "emerald";
                            if (layerIndex === 5) accent = "cyan";
                            
                            return (
                              <div key={layerIndex} className="relative z-10 pl-14">
                                {/* Layer Node Anchor */}
                                <div className={`absolute left-0 top-3 w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center font-bold font-mono text-xs z-20 text-${accent}-400 border-${accent}-500/30`}>
                                  L{layerIndex}
                                </div>
                                
                                <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-2">
                                  {layerName}
                                </div>

                                <div className="space-y-2.5">
                                  {nodesInLayer.map(node => {
                                    const isSelected = selectedNode?.id === node.id;
                                    return (
                                      <div 
                                        key={node.id}
                                        onClick={() => { setSelectedNode(node); setRightPanelTab("viewer"); }}
                                        className={`
                                          p-3 rounded-lg border bg-slate-950/90 cursor-pointer transition-all hover:-translate-y-0.5 relative
                                          ${isSelected 
                                            ? `border-${accent}-500 shadow-[0_0_15px_-3px_var(--tw-shadow-color)] shadow-${accent}-500/30 ring-1 ring-${accent}-500/50` 
                                            : 'border-slate-800 hover:border-slate-600'}
                                          ${!node.isActive ? 'opacity-40 grayscale hover:grayscale-0' : ''}
                                        `}
                                      >
                                        {!node.isActive && (
                                          <div className="absolute -top-2 -right-2 bg-slate-800 border border-slate-700 text-[9px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded shadow">Inactive</div>
                                        )}
                                        <div className={`text-xs font-mono flex items-center gap-2 truncate ${isSelected ? `text-${accent}-200` : 'text-slate-300'}`}>
                                          <Code className={`w-3.5 h-3.5 shrink-0 ${isSelected ? `text-${accent}-400` : 'text-slate-500'}`} />
                                          {node.filename}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                          {node.concept}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Content Viewer & Interceptor Chat */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      {/* Tabs */}
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 px-1">
                        <button 
                          onClick={() => setRightPanelTab("interceptor")}
                          className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors ${rightPanelTab === "interceptor" ? "bg-purple-900/40 text-purple-300 border border-purple-500/30" : "text-slate-500 hover:bg-slate-800/50"}`}
                        >
                          <Activity className="w-4 h-4" /> Оркестратор / Чат
                        </button>
                        <button 
                          onClick={() => setRightPanelTab("viewer")}
                          className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors ${rightPanelTab === "viewer" ? "bg-cyan-900/40 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:bg-slate-800/50"}`}
                        >
                          <Eye className="w-4 h-4" /> Просмотр Узла
                        </button>
                      </div>

                      {rightPanelTab === "viewer" && (
                        selectedNode ? (
                          <div className="border border-slate-800/80 bg-[#0f111a] rounded-2xl flex flex-col h-[550px] shadow-2xl relative overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-[#161925]">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5 mr-2">
                                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                </div>
                                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                                  <span className="text-slate-200 bg-slate-800/70 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
                                    <Code className="w-3 h-3 text-purple-400" />
                                    {selectedNode.filename}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${selectedNode.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                                {selectedNode.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>

                            {/* Code/Text View */}
                            <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] leading-relaxed text-slate-300 scrollbar-thin">
                              <div className="text-slate-500 mb-5 pb-3 border-b border-slate-800/60 text-[11px] flex justify-between select-none">
                                <span className="max-w-[70%] line-clamp-1">// CONCEPT: {selectedNode.concept}</span>
                                <span className="text-cyan-400/70">// LAYER: {selectedNode.layer} | BRANCH: {selectedNode.branch}</span>
                              </div>
                              <div className="whitespace-pre-wrap">
                                {selectedNode.content}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-slate-800/50 bg-slate-900/10 border-dashed rounded-2xl flex flex-col items-center justify-center h-[550px] text-slate-500 relative overflow-hidden">
                            <Sparkles className="w-16 h-16 mb-5 opacity-20 text-cyan-400 animate-pulse" />
                            <p className="text-sm font-mono max-w-sm text-center leading-relaxed">
                              Обзор узлов отключен.<br/><br/> Выберите узел в матрице слева для детализации.
                            </p>
                          </div>
                        )
                      )}

                      {rightPanelTab === "interceptor" && (
                        <div className="border border-slate-800/80 bg-slate-900/40 rounded-2xl flex flex-col h-[550px] shadow-lg relative overflow-hidden">
                          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                            {chatMessages.map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                {msg.role === "combine" && (
                                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 max-w-[85%] mb-2 shadow-inner">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Activity className="w-4 h-4 text-purple-400" />
                                      <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-widest">Interceptor Combine</span>
                                    </div>
                                    <div className="text-xs text-slate-300 font-mono mb-2">{msg.content}</div>
                                    {msg.interceptorLog && msg.interceptorLog.changes.length > 0 && (
                                      <ul className="text-[10px] text-purple-200/70 list-disc list-inside bg-purple-950/30 p-2 rounded border border-purple-800/30">
                                        {msg.interceptorLog.changes.map((c, i) => (
                                          <li key={i}>{c}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                                
                                {msg.role === "agent" && (
                                  <div className="flex items-start gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                      <Brain className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div className="bg-slate-800/70 border border-slate-700/50 text-slate-200 text-sm p-3 rounded-2xl rounded-tl-sm">
                                      {msg.content}
                                    </div>
                                  </div>
                                )}

                                {msg.role === "user" && (
                                  <div className="bg-blue-600/80 text-white text-sm p-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                                    {msg.content}
                                  </div>
                                )}
                              </div>
                            ))}
                            {isIntercepting && (
                              <div className="flex items-start gap-3 max-w-[85%]">
                                <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-xl flex items-center gap-3">
                                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                                  <span className="text-xs font-mono text-purple-300">Оркестратор анализирует сдвиг контекста...</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-3 border-t border-slate-800 bg-slate-950">
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="Отправить сообщение агенту..."
                                className="flex-1 bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono outline-none"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                disabled={isIntercepting}
                              />
                              <button 
                                onClick={handleSendMessage}
                                disabled={isIntercepting || !chatInput.trim()}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white w-12 flex items-center justify-center rounded-xl transition"
                              >
                                <Send className="w-5 h-5 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "brain" && (
              <motion.div key="brain" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="border border-slate-800/80 bg-slate-900/40 p-4 md:p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase mb-4 flex items-center gap-2 font-mono">
                      <Brain className="w-4 h-4 text-cyan-400" /> Lobed Processing Architecture
                    </h3>
                    <div className="space-y-4">
                      {[
                        { type: LobeType.PERCEPTION, name: "Perception Filter", color: "border-cyan-500/25 bg-cyan-950/5 text-cyan-400" },
                        { type: LobeType.DRIVES, name: "Survival Instincts & Drives", color: "border-pink-500/25 bg-pink-950/5 text-pink-400" },
                        { type: LobeType.ATTENTION, name: "Spatial Attention Hub", color: "border-amber-500/25 bg-amber-950/5 text-amber-400" },
                        { type: LobeType.CONCEPT, name: "Concept / Semantic Binding", color: "border-purple-500/25 bg-purple-950/5 text-purple-400" },
                        { type: LobeType.DECISION, name: "Motor constraints & Actions", color: "border-emerald-500/25 bg-emerald-950/5 text-emerald-400" },
                        { type: LobeType.META, name: "Meta-Awareness & Auditing", color: "border-indigo-500/25 bg-indigo-950/5 text-indigo-400" },
                      ].map((lobeDef) => {
                        const lobeNeurons = state.neurons.filter(n => n.lobe === lobeDef.type);
                        return (
                          <div key={lobeDef.type} className={`p-3 rounded-xl border ${lobeDef.color} backdrop-blur-sm`}>
                            <span className="text-[10px] font-mono tracking-widest font-bold uppercase block mb-2 opacity-80">{lobeDef.name}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {lobeNeurons.map((neuron) => (
                                <div key={neuron.id} className="bg-slate-950/60 border border-slate-900 p-2 rounded-lg flex flex-col justify-between">
                                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-200">{neuron.name}</span><span className="text-[10px] font-mono text-slate-400">{neuron.id}</span></div>
                                  <div className="mt-2"><div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5"><span>Activation:</span><span className="font-bold text-slate-200">{neuron.activation.toFixed(2)}</span></div><div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden"><div className="h-full bg-current transition-all duration-300" style={{ width: `${neuron.activation * 100}%` }} /></div></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-slate-800/80 bg-slate-900/40 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase flex items-center gap-2 font-mono"><Cpu className="w-4 h-4 text-purple-400" /> Synaptic Plasticity Matrix</h3></div>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-sans">Dynamic Hebbian connections wire logic structures permanently avoiding pure transformer stasis. "Neurons firing together, wire together."</p>

                    <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                      {state.synapses.map((synapse, idx) => {
                        const fromNode = state.neurons.find(n => n.id === synapse.sourceId);
                        const toNode = state.neurons.find(n => n.id === synapse.targetId);
                        return (
                          <div key={idx} className="bg-slate-950/60 border border-slate-800/70 p-2.5 rounded-xl hover:border-slate-700 transition">
                            <div className="flex items-center justify-between text-xs font-mono mb-2"><span className="text-cyan-400 font-semibold">{fromNode ? fromNode.name : synapse.sourceId}</span><ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mx-1" /><span className="text-emerald-400 font-semibold">{toNode ? toNode.name : synapse.targetId}</span></div>
                            <div className="space-y-1 text-[10px] font-mono">
                              <div className="flex justify-between mb-0.5 text-slate-400"><span>Weight Density:</span><span className={`font-bold ${synapse.weight > 0 ? "text-emerald-400" : "text-rose-400"}`}>{synapse.weight > 0 ? "+" : ""}{synapse.weight.toFixed(3)}</span></div>
                              <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden relative"><div className={`h-full absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${synapse.weight > 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.abs(synapse.weight) * 50}%`, left: synapse.weight >= 0 ? '50%' : 'auto', right: synapse.weight < 0 ? '50%' : 'auto' }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "environment" && (
              <motion.div key="environment" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="border border-slate-800/80 bg-slate-900/40 p-4 md:p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase mb-5 flex items-center gap-2 font-mono"><Crosshair className="w-4 h-4 text-emerald-400" /> Layered Decision Filtering Corridors (L1–L5)</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {state.decisionCorridor.map((layer) => (
                      <div key={layer.level} className="bg-slate-950/70 border border-slate-900 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-800 transition">
                        <div className="flex items-center justify-between mb-2"><span className="text-xs font-mono font-bold bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-slate-700">{layer.level}</span><span className="text-[10px] text-slate-500 font-mono">Conf: <b className="text-emerald-400">{layer.confidence}%</b></span></div>
                        <div className="mb-2"><h4 className="text-xs font-bold text-white truncate">{layer.name}</h4><p className="text-[10px] text-slate-400 mt-0.5 line-clamp-3 leading-relaxed">{layer.description}</p></div>
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80 font-mono text-[10px] text-cyan-350 select-all leading-relaxed whitespace-pre-wrap"><span className="text-slate-500 font-bold mr-1">{">>"}</span> {layer.output}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-800/80 bg-slate-900/40 p-4 md:p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase flex items-center gap-2 font-mono"><User className="w-4 h-4 text-cyan-400" /> Environmental Actors & DNA Structures</h3><span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded">Feeds L4 Mutation Models</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.entities.map((ent, idx) => {
                      let archColor = "text-amber-400 border-amber-900 bg-amber-950/30";
                      let archDesc = "A passive node hoarding resources conservatively without escalating tension.";
                      if (ent.archetype === "STRIKER") { archColor = "text-red-400 border-red-900 bg-red-950/30"; archDesc = "Aggressive environmental disturber leveraging broad chaos matrices."; } 
                      else if (ent.archetype === "OBSERVER") { archColor = "text-cyan-400 border-cyan-900 bg-cyan-950/30"; archDesc = "Hyper-conservative entity maximizing absolute safety before committing."; } 
                      else if (ent.archetype === "MIMIC") { archColor = "text-yellow-400 border-yellow-900 bg-yellow-950/30"; archDesc = "High-compliance entity echoing environmental states unconditionally."; }

                      return (
                        <div key={idx} className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div><h4 className="text-sm font-bold text-white font-mono">{ent.name}</h4><p className="text-[10px] text-slate-400 font-sans mt-0.5">{archDesc}</p></div>
                            <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold tracking-widest ${archColor}`}>{ent.archetype}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1.5 text-[11px] font-mono">
                            <div><div className="flex justify-between text-slate-400 mb-1"><span>Volatility:</span><span className="text-slate-200 font-bold">{ent.volatility}%</span></div><input type="range" min="2" max="99" value={ent.volatility} onChange={(e) => handleEntityDNAChange(idx, "volatility", parseInt(e.target.value))} className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer" /></div>
                            <div><div className="flex justify-between text-slate-400 mb-1"><span>Aggression Limit:</span><span className="text-slate-200 font-bold">{ent.aggression}%</span></div><input type="range" min="1" max="95" value={ent.aggression} onChange={(e) => handleEntityDNAChange(idx, "aggression", parseInt(e.target.value))} className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer" /></div>
                            <div><div className="flex justify-between text-slate-400 mb-1"><span>Signal Probity:</span><span className="text-slate-200 font-bold">{ent.honestyIndex.toFixed(2)}</span></div><input type="range" min="0" max="1" step="0.05" value={ent.honestyIndex} onChange={(e) => handleEntityDNAChange(idx, "honestyIndex", parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg cursor-pointer" /></div>
                            <div><div className="flex justify-between text-slate-400 mb-1"><span>Resolution Threat:</span><span className="text-slate-200 font-bold">{ent.adaptationThreat.toFixed(2)}</span></div><input type="range" min="0.05" max="1.0" step="0.05" value={ent.adaptationThreat} onChange={(e) => handleEntityDNAChange(idx, "adaptationThreat", parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer" /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "learning" && (
              <motion.div key="learning" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="border border-slate-800/80 bg-slate-900/40 p-4 md:p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase mb-4 flex items-center gap-2 font-mono"><Award className="w-4.5 h-4.5 text-amber-400" /> Neocortical Academy Simulation</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">The biological framework submits highly restricted task parameters to a powerful LLM 'Neocortex', retrieving semantic understanding to generate physical plasticity outcomes.</p>
                    <div className="space-y-3">
                      {state.academyLessons.map((lesson) => {
                        const isLocked = lesson.status === "locked";
                        const isActive = lesson.status === "active";
                        const isCompleted = lesson.status === "completed";
                        const isTrainingCurrent = trainingId === lesson.id;
                        let accentBorder = "border-slate-800 bg-slate-950/20";
                        if (isCompleted) accentBorder = "border-emerald-500/30 bg-emerald-950/5";
                        if (isActive || isTrainingCurrent) accentBorder = "border-cyan-500/40 bg-cyan-950/10";
                        return (
                          <div key={lesson.id} className={`p-3.5 rounded-xl border ${accentBorder} transition relative overflow-hidden flex flex-col justify-between`}>
                            <div className="flex items-start justify-between gap-2"><div><span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">{lesson.topic}</span><h4 className="text-xs font-bold text-slate-200">{lesson.title}</h4></div><span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Diff: {lesson.difficulty}</span></div>
                            <p className="text-[11px] text-slate-450 mt-2 line-clamp-2 leading-relaxed">{lesson.prompt}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <span className={`text-[10px] font-mono leading-none flex items-center gap-1 font-bold ${isCompleted ? "text-emerald-400" : (isLocked ? "text-slate-500" : "text-cyan-400")}`}>{isCompleted && <Award className="w-3.5 h-3.5" />}{isCompleted ? "ASSIMILATED" : (isLocked ? "LOCKED" : "READY")}</span>
                              <button onClick={() => runAcademyLesson(lesson.id)} disabled={isLocked || isTrainingCurrent || state.activeLessonId !== null} className={`text-[10px] font-mono px-3 py-1.5 rounded-md flex items-center gap-1.5 transition active:scale-95 ${isCompleted ? "bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300" : (isLocked ? "bg-slate-900 border border-slate-950 text-slate-500 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold")}`}>
                                {isTrainingCurrent ? <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" /> : <Play className="w-3 h-3" />}
                                <span>{isCompleted ? "Re-Run" : (isTrainingCurrent ? "Processing..." : "Initiate")}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="border border-slate-800/80 bg-slate-950 rounded-2xl p-4 md:p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 font-mono"><div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-cyan-400" /><span className="text-xs uppercase font-bold tracking-widest text-slate-300">Synaptic / Neocortical Channel Log</span></div><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /></div>
                    <div className="min-h-[420px] max-h-[500px] overflow-y-auto bg-slate-950 border border-slate-900/60 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 space-y-3.5 scrollbar-thin">
                      {currentActiveLesson ? (
                        <>
                          <div className="text-slate-500 text-[10px] mb-2 border-b border-slate-900 pb-1 flex justify-between items-center"><span>ACTIVE ENGAGEMENT: {currentActiveLesson.title}</span><span>topic: {currentActiveLesson.topic}</span></div>
                          {currentActiveLesson.outputLog.map((logLine, idx) => {
                            let textClass = "text-slate-300";
                            if (logLine.startsWith("[Neocortex ")) textClass = "text-amber-350 border-l-2 border-amber-500/50 pl-2 py-0.5";
                            else if (logLine.startsWith("[Somatic Core ")) textClass = "text-cyan-300 border-l-2 border-cyan-500/50 pl-2 py-0.5 whitespace-pre-wrap";
                            else if (logLine.startsWith("[Synaptic Growth]")) textClass = "text-emerald-400 font-bold bg-emerald-950/10 px-1 py-0.5 rounded";
                            else if (logLine.startsWith("[Neuro-Plasticity]")) textClass = "text-indigo-400 font-semibold";
                            else if (logLine.startsWith("[Internal Loop]")) textClass = "text-cyan-400/80";

                            return <div key={idx} className={textClass}>{logLine}</div>;
                          })}
                          {trainingId !== null && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-cyan-400 italic animate-pulse">
                              [Biological Framework] Isolating semantic concepts... Awaiting Neocortical translation...
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <div className="h-80 flex flex-col items-center justify-center text-slate-500 text-center space-y-2"><Terminal className="w-8 h-8 text-slate-700" /><p className="max-w-xs text-xs">Neocortical channel inactive. Select an integration module and 'Initiate' to engage the Gemini Semantic Core.</p></div>
                      )}
                    </div>

                    {currentActiveLesson && currentActiveLesson.status === "completed" && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3.5 p-3.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-sans leading-normal flex items-start gap-2.5">
                        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <h4 className="font-bold">Synaptic Wiring Complete:</h4>
                          <p className="text-slate-350 text-[11px] mt-0.5">Integration success generated <b>+90% Reward Feedback</b>, mitigating base <b>Pain down to 5.0%</b>. The semantic understanding passed by the Neocortex has permanently altered physical concept lobar wiring.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <section className="mt-8 border border-slate-800/80 bg-slate-900/30 p-4 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center gap-2"><Database className="w-3.5 h-3.5 text-slate-400" /> Bio-Engine Telemetry Log</h3>
            <span className="text-[9px] font-mono text-slate-500">Live environmental and internal state streaming</span>
          </div>
          <div className="space-y-1.5 font-mono text-[10px] max-h-32 overflow-y-auto text-slate-400">
            {state.overmindFeed.map((feedItem, idx) => (
              <div key={idx} className="flex gap-2 items-start py-0.5 hover:text-slate-305 transition"><span className="text-cyan-500 select-none shrink-0 font-bold font-sans">⚡</span><span className="whitespace-pre-wrap leading-relaxed">{feedItem}</span></div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
