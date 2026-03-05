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
  RotateCcw
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  participatesInPao: boolean;
  participatesInAgua: boolean;
  participatesInBalde: boolean;
  participatesInMusica: boolean;
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
      aguaMode
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
    aguaMode
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
    if (window.confirm('Deseja realizar um reset geral? Isso limpará os vencedores atuais e reiniciará todos os ciclos (pools), mantendo os participantes e suas funções.')) {
      setPaoDeQueijoWinners([]);
      setAguaWinners([]);
      setBaldeWinners([]);
      setMusicaWinners([]);
      setExcludedIdsPao([]);
      setExcludedIdsAgua([]);
      setExcludedIdsBalde([]);
      setExcludedIdsMusica([]);
      // aguaMode is maintained as requested ("funções escolhidas serão mantidas")
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8 selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
          <header className="mb-6 md:mb-8 text-center relative">
            <div className="absolute top-0 right-0 flex items-center gap-3">
              <button
                onClick={handleGeneralReset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                title="Reset Geral"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Geral</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 text-[10px] font-bold uppercase tracking-wider">
                {isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span className="text-indigo-400">Sincronizando...</span>
                </>
              ) : syncError ? (
                <>
                  <CloudOff className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Erro na Nuvem</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">
                    Nuvem Ativa {dbProvider ? `(${dbProvider})` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
          >
            Sorteio da Vez
          </motion.h1>
          <p className="text-zinc-500 text-sm font-medium">Quem será o escolhido hoje?</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Names List Section */}
          <section className="lg:col-span-4 bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-6 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Participantes</h2>
            </div>

            <form onSubmit={addName} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Novo nome..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800/50 border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {names.map((person) => (
                  <motion.div
                    key={person.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3.5 bg-zinc-800/30 hover:bg-zinc-800/50 border border-white/5 rounded-2xl group transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-300">{person.name}</span>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => toggleParticipation(person.id, 'pao')}
                          className={`p-1 rounded-md transition-all ${
                            person.participatesInPao 
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                              : 'bg-zinc-900 text-zinc-600 border border-white/5 opacity-40'
                          }`}
                          title="Participar do Pão de Queijo"
                        >
                          <Coffee className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleParticipation(person.id, 'agua')}
                          className={`p-1 rounded-md transition-all ${
                            person.participatesInAgua 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-zinc-900 text-zinc-600 border border-white/5 opacity-40'
                          }`}
                          title="Participar da Água"
                        >
                          <Droplets className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleParticipation(person.id, 'balde')}
                          className={`p-1 rounded-md transition-all ${
                            person.participatesInBalde 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                              : 'bg-zinc-900 text-zinc-600 border border-white/5 opacity-40'
                          }`}
                          title="Participar do Balde"
                        >
                          <PaintBucket className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleParticipation(person.id, 'musica')}
                          className={`p-1 rounded-md transition-all ${
                            person.participatesInMusica 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-zinc-900 text-zinc-600 border border-white/5 opacity-40'
                          }`}
                          title="Participar da Música"
                        >
                          <Music className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeName(person.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {names.length === 0 && (
                <div className="text-center py-8 px-4 border-2 border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-600 text-sm italic">Nenhum participante adicionado.</p>
                </div>
              )}
            </div>
          </section>

          {/* Draw Sections */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
            {/* Pão de Queijo Section */}
            <section className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-4 md:p-5 relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-orange-500/10 transition-all duration-700" />
              
              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <Coffee className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Pão de Queijo</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold uppercase tracking-wider">
                        {names.filter(n => n.participatesInPao).length - excludedIdsPao.length}/{names.filter(n => n.participatesInPao).length} pool
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {excludedIdsPao.length > 0 && (
                    <button
                      onClick={() => resetCycle('pao')}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Resetar ciclo"
                    >
                      <Shuffle className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('pao')}
                    disabled={isDrawingPao || names.length === 0}
                    className="p-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                  >
                    <Shuffle className={`w-4 h-4 ${isDrawingPao ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[120px] flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 relative z-10">
                <AnimatePresence mode="wait">
                  {isDrawingPao ? (
                    <motion.div
                      key="drawing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="text-2xl md:text-3xl font-black text-orange-500 tracking-tighter">
                        {cyclingNamePao}
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : paoDeQueijoWinners.length > 0 ? (
                    <motion.div
                      key="winner"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-4"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-orange-500 mb-4"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">O escolhido é</span>
                      </motion.div>
                      <div className="flex flex-col gap-1">
                        {paoDeQueijoWinners.map((winner, idx) => (
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
                    <div className="text-zinc-700 flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium uppercase tracking-widest opacity-40">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Água Section */}
            <section className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-4 md:p-5 relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all duration-700" />

              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Droplets className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Água</h2>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold uppercase tracking-wider">
                          {names.filter(n => n.participatesInAgua).length - excludedIdsAgua.length}/{names.filter(n => n.participatesInAgua).length} pool
                        </span>
                      </div>
                      <div className="flex gap-1 mt-0.5">
                        <button
                          onClick={() => setAguaMode('pouca')}
                          className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-all ${
                            aguaMode === 'pouca' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-zinc-800/50 text-zinc-600 border border-white/5'
                          }`}
                        >
                          Pouca (1)
                        </button>
                        <button
                          onClick={() => setAguaMode('muita')}
                          className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-all ${
                            aguaMode === 'muita' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-zinc-800/50 text-zinc-600 border border-white/5'
                          }`}
                        >
                          Muita (2)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {excludedIdsAgua.length > 0 && (
                    <button
                      onClick={() => resetCycle('agua')}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Resetar ciclo"
                    >
                      <Shuffle className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('agua')}
                    disabled={isDrawingAgua || names.length === 0}
                    className="p-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    <Shuffle className={`w-4 h-4 ${isDrawingAgua ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[120px] flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 relative z-10">
                <AnimatePresence mode="wait">
                  {isDrawingAgua ? (
                    <motion.div
                      key="drawing-agua"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="text-2xl md:text-3xl font-black text-blue-500 tracking-tighter">
                        {cyclingNameAgua}
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : aguaWinners.length > 0 ? (
                    <motion.div
                      key="winner-agua"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-4"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-blue-500 mb-4"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">
                          {aguaWinners.length > 1 ? 'Os escolhidos são' : 'O escolhido é'}
                        </span>
                      </motion.div>
                      <div className="flex flex-col gap-1">
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
                    <div className="text-zinc-700 flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium uppercase tracking-widest opacity-40">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Balde Section */}
            <section className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-4 md:p-5 relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-purple-500/10 transition-all duration-700" />
              
              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <PaintBucket className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Balde</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold uppercase tracking-wider">
                        {names.filter(n => n.participatesInBalde).length - excludedIdsBalde.length}/{names.filter(n => n.participatesInBalde).length} pool
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {excludedIdsBalde.length > 0 && (
                    <button
                      onClick={() => resetCycle('balde')}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Resetar ciclo"
                    >
                      <Shuffle className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('balde')}
                    disabled={isDrawingBalde || names.length === 0}
                    className="p-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                  >
                    <Shuffle className={`w-4 h-4 ${isDrawingBalde ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[120px] flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 relative z-10">
                <AnimatePresence mode="wait">
                  {isDrawingBalde ? (
                    <motion.div
                      key="drawing-balde"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="text-2xl md:text-3xl font-black text-purple-500 tracking-tighter">
                        {cyclingNameBalde}
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : baldeWinners.length > 0 ? (
                    <motion.div
                      key="winner-balde"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-4"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-purple-500 mb-4"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">O escolhido é</span>
                      </motion.div>
                      <div className="flex flex-col gap-1">
                        {baldeWinners.map((winner, idx) => (
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
                    <div className="text-zinc-700 flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium uppercase tracking-widest opacity-40">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Música Section */}
            <section className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-4 md:p-5 relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all duration-700" />
              
              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Music className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Música</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold uppercase tracking-wider">
                        {names.filter(n => n.participatesInMusica).length - excludedIdsMusica.length}/{names.filter(n => n.participatesInMusica).length} pool
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {excludedIdsMusica.length > 0 && (
                    <button
                      onClick={() => resetCycle('musica')}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Resetar ciclo"
                    >
                      <Shuffle className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  )}
                  <button
                    onClick={() => drawWinner('musica')}
                    disabled={isDrawingMusica || names.length === 0}
                    className="p-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    <Shuffle className={`w-4 h-4 ${isDrawingMusica ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[120px] flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 relative z-10">
                <AnimatePresence mode="wait">
                  {isDrawingMusica ? (
                    <motion.div
                      key="drawing-musica"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="text-2xl md:text-3xl font-black text-emerald-500 tracking-tighter">
                        {cyclingNameMusica}
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : musicaWinners.length > 0 ? (
                    <motion.div
                      key="winner-musica"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-4"
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-emerald-500 mb-4"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">O DJ é</span>
                      </motion.div>
                      <div className="flex flex-col gap-1">
                        {musicaWinners.map((winner, idx) => (
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
                    <div className="text-zinc-700 flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium uppercase tracking-widest opacity-40">Aguardando sorteio</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>

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
