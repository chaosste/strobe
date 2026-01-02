
import React, { useState, useEffect, useRef, useMemo } from 'react';
import StrobeCanvas from './components/StrobeCanvas';
import { AppState, StrobeStyle } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.DISCLAIMER);
  const [frequency, setFrequency] = useState(10);
  const [intensity, setIntensity] = useState(1.0);
  const [colors, setColors] = useState(['#ffffff', '#000000']);
  const [style, setStyle] = useState<StrobeStyle>(StrobeStyle.FIXED);
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const handleStart = () => setState(AppState.IDLE);

  const safeCloseAudioContext = async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        console.error("Error closing audio context", e);
      }
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  // Audio Processing Setup
  useEffect(() => {
    let isMounted = true;
    let animationId: number;

    if (style === StrobeStyle.AUDIO && isActive) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isMounted) return;
          
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = ctx.createAnalyser();
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          
          audioContextRef.current = ctx;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateAudio = () => {
            if (!isMounted || !analyserRef.current || !isActive) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            setAudioLevel(average / 128); // Normalize to ~0-1
            animationId = requestAnimationFrame(updateAudio);
          };
          updateAudio();
        } catch (err) {
          console.error("Audio access denied", err);
          if (isMounted) setStyle(StrobeStyle.FIXED);
        }
      };
      initAudio();
    } else {
      safeCloseAudioContext();
    }

    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      safeCloseAudioContext();
    };
  }, [style, isActive]);

  const toggleStrobe = () => {
    setIsActive(!isActive);
  };

  // UI monochrome style for the overall container background/filter
  const uiColorStyle = useMemo(() => {
    if (!isActive) return {};
    return {
      filter: `grayscale(1) brightness(0.6)`,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  }, [isActive]);

  if (state === AppState.DISCLAIMER) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-3xl p-8 shadow-2xl text-center space-y-8">
          <div className="text-red-500 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Safety Protocol</h1>
            <p className="text-zinc-400 leading-relaxed text-sm">
              This system generates high-frequency light pulses. Do not use if you have a history of photosensitive epilepsy or light-triggered migraines.
            </p>
          </div>
          <button 
            onClick={handleStart} 
            className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all transform active:scale-95 shadow-xl shadow-red-900/20 uppercase tracking-widest text-sm"
          >
            Acknowledge & Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden select-none flex items-center justify-center">
      <StrobeCanvas 
        frequency={frequency} 
        colors={colors} 
        isActive={isActive} 
        intensity={intensity}
        style={style}
        audioLevel={audioLevel}
      />

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center" style={uiColorStyle}>
        {/* Main Panel */}
        <div className={`w-full bg-zinc-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-10 transition-all duration-700 ${isActive ? 'bg-transparent border-transparent shadow-none' : ''}`}>
          
          {/* Header - Fades out */}
          <header className={`text-center space-y-2 transition-opacity duration-700 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <h1 className="text-5xl font-black text-white italic tracking-tighter">
              STROBE<span className="text-blue-500">CORE</span>
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold">Precision Pulse Interface</p>
          </header>

          {/* Button - Always visible, higher opacity */}
          <div className="flex justify-center relative z-20">
            <button 
              onClick={toggleStrobe}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 transform active:scale-90 ${
                isActive 
                ? 'bg-red-500/30 text-red-500 border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.4)] opacity-100 scale-110' 
                : 'bg-white text-black shadow-white/20 shadow-2xl hover:scale-105 opacity-100'
              }`}
            >
              {isActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          </div>

          {/* Settings Section - Fades out */}
          <div className={`space-y-8 transition-opacity duration-700 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-zinc-400 text-xs font-black uppercase tracking-widest">Flicker Speed</label>
                <span className="text-white font-mono text-lg bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  {style === StrobeStyle.AUDIO ? 'VOX' : `${frequency.toFixed(1)}Hz`}
                </span>
              </div>
              <input 
                type="range" min="0.1" max="60" step="0.1" value={frequency}
                onChange={(e) => { setFrequency(parseFloat(e.target.value)); setStyle(StrobeStyle.FIXED); }}
                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Object.values(StrobeStyle).map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                    style === s 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                    : 'bg-zinc-800/50 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-zinc-400 text-xs font-black uppercase tracking-widest block text-center">Chrome Selection</label>
              <div className="flex gap-4 justify-center items-center">
                {['#ffffff', '#ff3e3e', '#3eff3e', '#3e3eff', '#ffff3e'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => setColors([c, '#000000'])}
                    className={`w-10 h-10 rounded-full transition-all border-2 flex items-center justify-center ${
                      colors[0] === c ? 'border-white scale-125 shadow-lg shadow-white/10' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {colors[0] === c && <div className="w-2 h-2 bg-black/20 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
