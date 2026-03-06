import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  Droplets, 
  UserPlus, 
  Trash2, 
  Shuffle, 
  User,
  CheckCircle2,
  AlertCircle,
  PaintBucket,
  Music,
  Cloud,
  CloudOff,
  RefreshCw,
  RotateCcw,
  History,
  Clock
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  participatesInPao: boolean;
  participatesInAgua: boolean;
  participatesInBalde: boolean;
  participatesInMusica: boolean;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  type: 'pao' | 'agua' | 'balde' | 'musica';
  winners: string[];
}

const STORAGE_KEY = 'sorteio_participantes';
const STATE_KEY = 'sorteio_estado_completo';

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Mateus', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
  { id: '2', name: 'VT', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
  { id: '3', name: 'João', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
  { id: '4', name: 'Mikael', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
  { id: '5', name: 'Diogo', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
  { id: '6', name: 'Fie', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
  { id: '7', name: 'Iago', participatesInPao: true, participatesInAgua: true, participatesInBalde: true, participatesInMusica: true },
];

export default function App() {
  const [names, setNames] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PARTICIPANTS;
  });

  // Initialize other states from localStorage if available
  const getInitialState = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(STATE_KEY);
    if (!saved) return defaultValue;
    try {
      const state = JSON.parse(saved);
      return state[key] !== undefined ? state[key] : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [newName, setNewName] = useState('');
  const [paoDeQueijoWinners, setPaoDeQueijoWinners] = useState<string[]>(() => getInitialState('paoDeQueijoWinners', []));
  const [aguaWinners, setAguaWinners] = useState<string[]>(() => getInitialState('aguaWinners', []));
  const [baldeWinners, setBaldeWinners] = useState<string[]>(() => getInitialState('baldeWinners', []));
  const [musicaWinners, setMusicaWinners] = useState<string[]>(() => getInitialState('musicaWinners', []));
  
  const [excludedIdsPao, setExcludedIdsPao] = useState<string[]>(() => getInitialState('excludedIdsPao', []));
  const [excludedIdsAgua, setExcludedIdsAgua] = useState<string[]>(() => getInitialState('excludedIdsAgua', []));
  const [excludedIdsBalde, setExcludedIdsBalde] = useState<string[]>(() => getInitialState('excludedIdsBalde', []));
  const [excludedIdsMusica, setExcludedIdsMusica] = useState<string[]>(() => getInitialState('excludedIdsMusica', []));
  
  const [aguaMode, setAguaMode] = useState<'muita' | 'pouca'>(() => getInitialState('aguaMode', 'muita'));
  const [drawHistory, setDrawHistory] = useState<HistoryEntry[]>(() => getInitialState('drawHistory', []));

  const [isDrawingPao, setIsDrawingPao] = useState(false);
  const [isDrawingAgua, setIsDrawingAgua] = useState(false);
  const [isDrawingBalde, setIsDrawingBalde] = useState(false);
  const [isDrawingMusica, setIsDrawingMusica] = useState(false);
  
  const [cyclingNamePao, setCyclingNamePao] = useState<string>('');
  const [cyclingNameAgua, setCyclingNameAgua] = useState<string>('');
  const [cyclingNameBalde, setCyclingNameBalde] = useState<string>('');
  const [cyclingNameMusica, setCyclingNameMusica] = useState<string>('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [dbProvider, setDbProvider] = useState<'sqlite' | 'supabase' | null>(null);

  // Initial fetch from server
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          const text = await response.text();
          console.error(`Health check failed (${response.status}):`, text);
          return;
        }
        const data = await response.json();
        if (data.provider) setDbProvider(data.provider);
      } catch (e) {
        console.error('Failed to fetch health:', e);
      }
    };
    
    const fetchState = async () => {
      try {
        const response = await fetch('/api/state');
        if (response.status === 404) {
          console.warn('API not found. If you are on Vercel, ensure your deployment is configured correctly.');
          return;
        }
        
        if (!response.ok) {
          const text = await response.text();
          console.error(`Fetch state failed (${response.status}):`, text);
          return;
        }

        const data = await response.json();
        if (data) {
          if (data.names) setNames(data.names);
          if (data.paoDeQueijoWinners) setPaoDeQueijoWinners(data.paoDeQueijoWinners);
          if (data.aguaWinners) setAguaWinners(data.aguaWinners);
          if (data.baldeWinners) setBaldeWinners(data.baldeWinners);
          if (data.musicaWinners) setMusicaWinners(data.musicaWinners);
          if (data.excludedIdsPao) setExcludedIdsPao(data.excludedIdsPao);
          if (data.excludedIdsAgua) setExcludedIdsAgua(data.excludedIdsAgua);
          if (data.excludedIdsBalde) setExcludedIdsBalde(data.excludedIdsBalde);
          if (data.excludedIdsMusica) setExcludedIdsMusica(data.excludedIdsMusica);
          if (data.aguaMode) setAguaMode(data.aguaMode);
          if (data.drawHistory) setDrawHistory(data.drawHistory);
        }
      } catch (error) {
        console.error('Failed to fetch state from server:', error);
      }
    };
    
    fetchHealth();
    fetchState();
  }, []);

  // Persist names to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  }, [names]);

  // Persist all other state to localStorage and Server
  useEffect(() => {
    const stateToSave = {
      names,
      paoDeQueijoWinners,
      aguaWinners,
      baldeWinners,
      musicaWinners,
      excludedIdsPao,
      excludedIdsAgua,
      excludedIdsBalde,
      excludedIdsMusica,
      aguaMode,
      drawHistory
    };
    
    // Local storage persistence
    localStorage.setItem(STATE_KEY, JSON.stringify(stateToSave));

    // Server persistence with debounce
    const saveToServer = async () => {
      setIsSyncing(true);
      setSyncError(false);
      try {
        const response = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToSave),
        });
        if (!response.ok) throw new Error('Sync failed');
      } catch (error) {
        console.error('Failed to save state to server:', error);
        setSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeoutId = setTimeout(saveToServer, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    names,
    paoDeQueijoWinners, 
    aguaWinners, 
    baldeWinners, 
    musicaWinners, 
    excludedIdsPao, 
    excludedIdsAgua, 
    excludedIdsBalde, 
    excludedIdsMusica, 
    aguaMode,
    drawHistory
  ]);

  const addName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      setNames([...names, { 
        id: crypto.randomUUID(), 
        name: newName.trim(),
        participatesInPao: true,
        participatesInAgua: true,
        participatesInBalde: true,
        participatesInMusica: true
      }]);
      setNewName('');
    }
  };

  const toggleParticipation = (id: string, type: 'pao' | 'agua' | 'balde' | 'musica') => {
    setNames(names.map(n => {
      if (n.id === id) {
        return {
          ...n,
          participatesInPao: type === 'pao' ? !n.participatesInPao : n.participatesInPao,
          participatesInAgua: type === 'agua' ? !n.participatesInAgua : n.participatesInAgua,
          participatesInBalde: type === 'balde' ? !n.participatesInBalde : n.participatesInBalde,
          participatesInMusica: type === 'musica' ? !n.participatesInMusica : n.participatesInMusica,
        };
      }
      return n;
    }));
    
    // Clear from exclusion list if they are no longer participating
    if (type === 'pao') {
      setExcludedIdsPao(prev => prev.filter(excludedId => excludedId !== id));
    } else if (type === 'agua') {
      setExcludedIdsAgua(prev => prev.filter(excludedId => excludedId !== id));
    } else if (type === 'balde') {
      setExcludedIdsBalde(prev => prev.filter(excludedId => excludedId !== id));
    } else {
      setExcludedIdsMusica(prev => prev.filter(excludedId => excludedId !== id));
    }
  };

  const removeName = (id: string) => {
    setNames(names.filter(n => n.id !== id));
    setExcludedIdsPao(prev => prev.filter(excludedId => excludedId !== id));
    setExcludedIdsAgua(prev => prev.filter(excludedId => excludedId !== id));
    setExcludedIdsBalde(prev => prev.filter(excludedId => excludedId !== id));
    setExcludedIdsMusica(prev => prev.filter(excludedId => excludedId !== id));
  };

  const getSecureRandomInt = (max: number) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const addHistoryEntry = (type: 'pao' | 'agua' | 'balde' | 'musica', winners: string[]) => {
    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      winners
    };
    setDrawHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  const drawWinner = (type: 'pao' | 'agua' | 'balde' | 'musica') => {
    if (names.length === 0) return;

    const duration = 2000;
    const interval = 100;
    const steps = duration / interval;
    let currentStep = 0;

    if (type === 'pao') {
      const eligibleNames = names.filter(n => n.participatesInPao);
      if (eligibleNames.length === 0) return;

      let pool = eligibleNames.filter(n => !excludedIdsPao.includes(n.id));
      if (pool.length === 0) {
        pool = [...eligibleNames];
        setExcludedIdsPao([]);
      }

      setIsDrawingPao(true);
      setPaoDeQueijoWinners([]);
      
      const timer = setInterval(() => {
        const randomIndex = getSecureRandomInt(eligibleNames.length);
        setCyclingNamePao(eligibleNames[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);
          
          const winnerIndex = getSecureRandomInt(pool.length);
          const winner = pool[winnerIndex];
          
          setPaoDeQueijoWinners([winner.name]);
          addHistoryEntry('pao', [winner.name]);
          setExcludedIdsPao(prev => {
            const next = [...prev, winner.id];
            return next.length >= eligibleNames.length ? [] : next;
          });
          setIsDrawingPao(false);
        }
      }, interval);
    } else if (type === 'agua') {
      const eligibleNames = names.filter(n => n.participatesInAgua);
      if (eligibleNames.length === 0) return;

      const winnerCount = aguaMode === 'muita' ? 2 : 1;
      let pool = eligibleNames.filter(n => !excludedIdsAgua.includes(n.id));
      if (pool.length < Math.min(winnerCount, eligibleNames.length)) {
        pool = [...eligibleNames];
        setExcludedIdsAgua([]);
      }

      setIsDrawingAgua(true);
      setAguaWinners([]);

      const timer = setInterval(() => {
        const randomIndex = getSecureRandomInt(eligibleNames.length);
        setCyclingNameAgua(eligibleNames[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);
          
          const indices = new Set<number>();
          while (indices.size < Math.min(winnerCount, pool.length)) {
            indices.add(getSecureRandomInt(pool.length));
          }
          
          const selectedWinners = Array.from(indices).map(i => pool[i]);
          setAguaWinners(selectedWinners.map(w => w.name));
          addHistoryEntry('agua', selectedWinners.map(w => w.name));
          setExcludedIdsAgua(prev => {
            const next = [...prev, ...selectedWinners.map(w => w.id)];
            return next.length >= eligibleNames.length ? [] : next;
          });
          setIsDrawingAgua(false);
        }
      }, interval);
    } else if (type === 'balde') {
      const eligibleNames = names.filter(n => n.participatesInBalde);
      if (eligibleNames.length === 0) return;

      let pool = eligibleNames.filter(n => !excludedIdsBalde.includes(n.id));
      if (pool.length === 0) {
        pool = [...eligibleNames];
        setExcludedIdsBalde([]);
      }

      setIsDrawingBalde(true);
      setBaldeWinners([]);
      
      const timer = setInterval(() => {
        const randomIndex = getSecureRandomInt(eligibleNames.length);
        setCyclingNameBalde(eligibleNames[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);
          
          const winnerIndex = getSecureRandomInt(pool.length);
          const winner = pool[winnerIndex];
          
          setBaldeWinners([winner.name]);
          addHistoryEntry('balde', [winner.name]);
          setExcludedIdsBalde(prev => {
            const next = [...prev, winner.id];
            return next.length >= eligibleNames.length ? [] : next;
          });
          setIsDrawingBalde(false);
        }
      }, interval);
    } else {
      const eligibleNames = names.filter(n => n.participatesInMusica);
      if (eligibleNames.length === 0) return;

      let pool = eligibleNames.filter(n => !excludedIdsMusica.includes(n.id));
      if (pool.length === 0) {
        pool = [...eligibleNames];
        setExcludedIdsMusica([]);
      }

      setIsDrawingMusica(true);
      setMusicaWinners([]);
      
      const timer = setInterval(() => {
        const randomIndex = getSecureRandomInt(eligibleNames.length);
        setCyclingNameMusica(eligibleNames[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);
          
          const winnerIndex = getSecureRandomInt(pool.length);
          const winner = pool[winnerIndex];
          
          setMusicaWinners([winner.name]);
          addHistoryEntry('musica', [winner.name]);
          setExcludedIdsMusica(prev => {
            const next = [...prev, winner.id];
            return next.length >= eligibleNames.length ? [] : next;
          });
          setIsDrawingMusica(false);
        }
      }, interval);
    }
  };

  const resetCycle = (type: 'pao' | 'agua' | 'balde' | 'musica') => {
    if (type === 'pao') setExcludedIdsPao([]);
    else if (type === 'agua') setExcludedIdsAgua([]);
    else if (type === 'balde') setExcludedIdsBalde([]);
    else setExcludedIdsMusica([]);
  };

  const handleGeneralReset = () => {
    if (window.confirm('Deseja realizar um reset geral? Isso limpará os vencedores atuais, o histórico e reiniciará todos os ciclos (pools), mantendo os participantes e suas funções.')) {
      setPaoDeQueijoWinners([]);
      setAguaWinners([]);
      setBaldeWinners([]);
      setMusicaWinners([]);
      setExcludedIdsPao([]);
      setExcludedIdsAgua([]);
      setExcludedIdsBalde([]);
      setExcludedIdsMusica([]);
      setDrawHistory([]);
      // aguaMode is maintained as requested ("funções escolhidas serão mantidas")
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 md:mb-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4"
            >
              <Shuffle className="w-3 h-3" />
              <span>Sorteador Premium</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black tracking-tighter mb-2 font-display bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent"
            >
              Sorteio da Vez
            </motion.h1>
            <p className="text-zinc-500 text-sm md:text-base font-medium">Gerencie seus sorteios com precisão e estilo.</p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end items-center gap-3">
            <button
              onClick={handleGeneralReset}
              className="group flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/5 border border-red-500/10 text-[10px] font-bold uppercase tracking-wider text-red-500/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
              title="Reset Geral"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-45deg] transition-transform" />
              <span>Reset Geral</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900/50 border border-white/5 text-[10px] font-bold uppercase tracking-wider shadow-xl">
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span className="text-indigo-400">Sincronizando</span>
                </>
              ) : syncError ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400">Offline</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <span className="text-emerald-400/80">
                    Nuvem {dbProvider ? `(${dbProvider})` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Names List Section */}
          <section className="lg:col-span-4 glass-card rounded-[2rem] p-6 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight font-display">Participantes</h2>
              </div>
              <span className="px-2 py-1 bg-zinc-800/50 text-zinc-500 text-[10px] font-bold rounded-lg border border-white/5">
                {names.length} TOTAL
              </span>
            </div>

            <form onSubmit={addName} className="relative mb-8 group">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Adicionar novo participante..."
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-zinc-950/50 border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 text-sm font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all active:scale-90 shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] lg:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {names.map((person) => (
                  <motion.div
                    key={person.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-800/40 border border-white/5 rounded-2xl group transition-all duration-300"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-zinc-200 text-sm tracking-tight">{person.name}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleParticipation(person.id, 'pao')}
                          className={`p-1.5 rounded-lg transition-all ${
                            person.participatesInPao 
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]' 
                              : 'bg-zinc-950/50 text-zinc-700 border border-white/5 opacity-40 hover:opacity-100'
                          }`}
                          title="Participar do Pão de Queijo"
                        >
                          <Coffee className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleParticipation(person.id, 'agua')}
                          className={`p-1.5 rounded-lg transition-all ${
                            person.participatesInAgua 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                              : 'bg-zinc-950/50 text-zinc-700 border border-white/5 opacity-40 hover:opacity-100'
                          }`}
                          title="Participar da Água"
                        >
                          <Droplets className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleParticipation(person.id, 'balde')}
                          className={`p-1.5 rounded-lg transition-all ${
                            person.participatesInBalde 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                              : 'bg-zinc-950/50 text-zinc-700 border border-white/5 opacity-40 hover:opacity-100'
                          }`}
                          title="Participar do Balde"
                        >
                          <PaintBucket className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleParticipation(person.id, 'musica')}
                          className={`p-1.5 rounded-lg transition-all ${
                            person.participatesInMusica 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                              : 'bg-zinc-950/50 text-zinc-700 border border-white/5 opacity-40 hover:opacity-100'
                          }`}
                          title="Participar da Música"
                        >
                          <Music className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeName(person.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {names.length === 0 && (
                <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-900 rounded-[2rem]">
                  <User className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm font-medium italic">Nenhum participante.</p>
                </div>
              )}
            </div>
          </section>

          {/* Draw Sections */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
            {/* Pão de Queijo Section */}
            <section className="glass-card rounded-[2rem] p-6 relative overflow-hidden group flex flex-col min-h-[280px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-700" />
              
              <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                    <Coffee className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight font-display">Pão de Queijo</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((names.filter(n => n.participatesInPao).length - excludedIdsPao.length) / names.filter(n => n.participatesInPao).length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        {names.filter(n => n.participatesInPao).length - excludedIdsPao.length}/{names.filter(n => n.participatesInPao).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {excludedIdsPao.length > 0 && (
                    <button
                      onClick={() => resetCycle('pao')}
                      className="p-2 text-zinc-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all"
                      title="Resetar ciclo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('pao')}
                    disabled={isDrawingPao || names.length === 0}
                    className="p-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-orange-600/20 active:scale-90"
                  >
                    <Shuffle className={`w-5 h-5 ${isDrawingPao ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center inner-glass rounded-3xl relative z-10 p-4">
                <AnimatePresence mode="wait">
                  {isDrawingPao ? (
                    <motion.div
                      key="drawing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="text-3xl md:text-4xl font-black text-orange-500 tracking-tighter font-display drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                        {cyclingNamePao}
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-2 h-2 bg-orange-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : paoDeQueijoWinners.length > 0 ? (
                    <motion.div
                      key="winner"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-orange-500/60 mb-3"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">O escolhido é</span>
                      </motion.div>
                      <div className="flex flex-col gap-2">
                        {paoDeQueijoWinners.map((winner, idx) => (
                          <motion.div
                            key={winner}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
                            className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display drop-shadow-2xl"
                          >
                            {winner}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-zinc-800 flex flex-col items-center gap-4">
                      <div className="p-4 bg-zinc-900/50 rounded-full border border-white/5">
                        <Coffee className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Água Section */}
            <section className="glass-card rounded-[2rem] p-6 relative overflow-hidden group flex flex-col min-h-[280px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />

              <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <Droplets className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight font-display">Água</h2>
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((names.filter(n => n.participatesInAgua).length - excludedIdsAgua.length) / names.filter(n => n.participatesInAgua).length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                          {names.filter(n => n.participatesInAgua).length - excludedIdsAgua.length}/{names.filter(n => n.participatesInAgua).length}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setAguaMode('pouca')}
                          className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-wider transition-all ${
                            aguaMode === 'pouca' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-zinc-950/50 text-zinc-600 border border-white/5 hover:text-zinc-400'
                          }`}
                        >
                          Pouca (1)
                        </button>
                        <button
                          onClick={() => setAguaMode('muita')}
                          className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-wider transition-all ${
                            aguaMode === 'muita' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-zinc-950/50 text-zinc-600 border border-white/5 hover:text-zinc-400'
                          }`}
                        >
                          Muita (2)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {excludedIdsAgua.length > 0 && (
                    <button
                      onClick={() => resetCycle('agua')}
                      className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                      title="Resetar ciclo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('agua')}
                    disabled={isDrawingAgua || names.length === 0}
                    className="p-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/20 active:scale-90"
                  >
                    <Shuffle className={`w-5 h-5 ${isDrawingAgua ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center inner-glass rounded-3xl relative z-10 p-4">
                <AnimatePresence mode="wait">
                  {isDrawingAgua ? (
                    <motion.div
                      key="drawing-agua"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="text-3xl md:text-4xl font-black text-blue-500 tracking-tighter font-display drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        {cyclingNameAgua}
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : aguaWinners.length > 0 ? (
                    <motion.div
                      key="winner-agua"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-blue-500/60 mb-3"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                          {aguaWinners.length > 1 ? 'Os escolhidos são' : 'O escolhido é'}
                        </span>
                      </motion.div>
                      <div className="flex flex-col gap-2">
                        {aguaWinners.map((winner, idx) => (
                          <motion.div
                            key={winner}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-2xl"
                          >
                            {winner}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-zinc-800 flex flex-col items-center gap-4">
                      <div className="p-4 bg-zinc-900/50 rounded-full border border-white/5">
                        <Droplets className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Balde Section */}
            <section className="glass-card rounded-[2rem] p-6 relative overflow-hidden group flex flex-col min-h-[280px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-all duration-700" />
              
              <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <PaintBucket className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight font-display">Balde</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((names.filter(n => n.participatesInBalde).length - excludedIdsBalde.length) / names.filter(n => n.participatesInBalde).length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        {names.filter(n => n.participatesInBalde).length - excludedIdsBalde.length}/{names.filter(n => n.participatesInBalde).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {excludedIdsBalde.length > 0 && (
                    <button
                      onClick={() => resetCycle('balde')}
                      className="p-2 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-xl transition-all"
                      title="Resetar ciclo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('balde')}
                    disabled={isDrawingBalde || names.length === 0}
                    className="p-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-purple-600/20 active:scale-90"
                  >
                    <Shuffle className={`w-5 h-5 ${isDrawingBalde ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center inner-glass rounded-3xl relative z-10 p-4">
                <AnimatePresence mode="wait">
                  {isDrawingBalde ? (
                    <motion.div
                      key="drawing-balde"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="text-3xl md:text-4xl font-black text-purple-500 tracking-tighter font-display drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        {cyclingNameBalde}
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : baldeWinners.length > 0 ? (
                    <motion.div
                      key="winner-balde"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-purple-500/60 mb-3"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">O escolhido é</span>
                      </motion.div>
                      <div className="flex flex-col gap-2">
                        {baldeWinners.map((winner, idx) => (
                          <motion.div
                            key={winner}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
                            className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display drop-shadow-2xl"
                          >
                            {winner}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-zinc-800 flex flex-col items-center gap-4">
                      <div className="p-4 bg-zinc-900/50 rounded-full border border-white/5">
                        <PaintBucket className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Música Section */}
            <section className="glass-card rounded-[2rem] p-6 relative overflow-hidden group flex flex-col min-h-[280px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all duration-700" />
              
              <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Music className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight font-display">Música</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((names.filter(n => n.participatesInMusica).length - excludedIdsMusica.length) / names.filter(n => n.participatesInMusica).length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        {names.filter(n => n.participatesInMusica).length - excludedIdsMusica.length}/{names.filter(n => n.participatesInMusica).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {excludedIdsMusica.length > 0 && (
                    <button
                      onClick={() => resetCycle('musica')}
                      className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                      title="Resetar ciclo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('musica')}
                    disabled={isDrawingMusica || names.length === 0}
                    className="p-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-600/20 active:scale-90"
                  >
                    <Shuffle className={`w-5 h-5 ${isDrawingMusica ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center inner-glass rounded-3xl relative z-10 p-4">
                <AnimatePresence mode="wait">
                  {isDrawingMusica ? (
                    <motion.div
                      key="drawing-musica"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="text-3xl md:text-4xl font-black text-emerald-500 tracking-tighter font-display drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        {cyclingNameMusica}
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-2 h-2 bg-emerald-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : musicaWinners.length > 0 ? (
                    <motion.div
                      key="winner-musica"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-emerald-500/60 mb-3"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">O escolhido é</span>
                      </motion.div>
                      <div className="flex flex-col gap-2">
                        {musicaWinners.map((winner, idx) => (
                          <motion.div
                            key={winner}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
                            className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display drop-shadow-2xl"
                          >
                            {winner}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-zinc-800 flex flex-col items-center gap-4">
                      <div className="p-4 bg-zinc-900/50 rounded-full border border-white/5">
                        <Music className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>

        {/* Draw History Section */}
        <section className="mt-12 glass-card rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <History className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight font-display">Histórico de Sorteios</h2>
                <p className="text-zinc-500 text-xs font-medium">Registros das últimas atividades</p>
              </div>
            </div>
            {drawHistory.length > 0 && (
              <button
                onClick={() => setDrawHistory([])}
                className="px-4 py-2 bg-zinc-950/50 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 hover:bg-red-400/5 border border-white/5 rounded-xl transition-all"
              >
                Limpar Histórico
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {drawHistory.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 bg-zinc-950/30 border border-white/5 rounded-[1.5rem] flex flex-col gap-4 hover:bg-zinc-900/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        entry.type === 'pao' ? 'bg-orange-500/10 text-orange-400' :
                        entry.type === 'agua' ? 'bg-blue-500/10 text-blue-400' :
                        entry.type === 'balde' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {entry.type === 'pao' && <Coffee className="w-3.5 h-3.5" />}
                        {entry.type === 'agua' && <Droplets className="w-3.5 h-3.5" />}
                        {entry.type === 'balde' && <PaintBucket className="w-3.5 h-3.5" />}
                        {entry.type === 'musica' && <Music className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {entry.type === 'pao' && 'Pão de Queijo'}
                        {entry.type === 'agua' && 'Água'}
                        {entry.type === 'balde' && 'Balde'}
                        {entry.type === 'musica' && 'Música'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 group-hover:text-zinc-500 transition-colors">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.winners.map((winner) => (
                      <span key={winner} className="px-3 py-1 bg-zinc-900/80 text-zinc-200 text-[11px] font-bold rounded-lg border border-white/5 shadow-sm">
                        {winner}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {drawHistory.length === 0 && (
              <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
                <History className="w-12 h-12 text-zinc-900 mx-auto mb-4" />
                <p className="text-zinc-600 text-sm font-medium italic">Nenhum sorteio registrado ainda.</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer info */}
        <footer className="mt-16 text-center text-zinc-600 text-sm font-medium">
          <p className="flex items-center justify-center gap-2">
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            Adicione todos os participantes antes de começar o sorteio
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
          </p>
        </footer>
      </div>
    </div>
  );
}
