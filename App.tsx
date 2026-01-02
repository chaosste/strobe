
import React, { useState, useEffect, useRef, useMemo } from 'react';
import StrobeCanvas from './components/StrobeCanvas';
import { AppState, StrobeStyle } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.DISCLAIMER);
  const [frequency, setFrequency] = useState(10);
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
        console.warn("AudioContext closing error:", e);
      }
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

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
            setAudioLevel(average / 128);
            animationId = requestAnimationFrame(updateAudio);
          };
          updateAudio();
        } catch (err) {
          console.error("Audio initialization failed:", err);
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

  const uiWrapperStyle = useMemo(() => {
    if (!isActive) return { opacity: 1, filter: 'none' };
    return {
      opacity: 0.25,
      filter: 'grayscale(1) brightness(0.8)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none' as const
    };
  }, [isActive]);

  if (state === AppState.DISCLAIMER) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-900/40 rounded-[2rem] p-8 shadow-2xl text-center space-y-8">
          <div className="text-red-500 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Photosensitivity Warning</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              This app contains flashing lights. Please use with caution. Consult a physician if you have a history of seizures.
            </p>
          </div>
          <button 
            onClick={handleStart} 
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest"
          >
            Enter Interface
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
        style={style}
        audioLevel={audioLevel}
      />

      {/* Persistent Play/Pause Button - Outside the fading container for visibility */}
      <div className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-700 transform pointer-events-auto ${
            isActive 
            ? 'bg-red-500/20 text-red-500 border-2 border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.3)] scale-110' 
            : 'bg-white text-black shadow-2xl hover:scale-105'
          }`}
        >
          {isActive ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center" style={uiWrapperStyle}>
        <div className="w-full bg-zinc-900/50 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] border border-white/5 space-y-12">
          
          <header className="text-center space-y-1">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Strobe Core</h1>
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] font-bold">Manual Sync Mode</p>
          </header>

          {/* Spacer for the persistent button area */}
          <div className="h-28" />

          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Frequency</label>
                <span className="text-white font-mono text-xl">{style === StrobeStyle.AUDIO ? 'VOX' : `${frequency.toFixed(1)}Hz`}</span>
              </div>
              <input 
                type="range" min="0.5" max="60" step="0.5" value={frequency}
                onChange={(e) => { setFrequency(parseFloat(e.target.value)); setStyle(StrobeStyle.FIXED); }}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Object.values(StrobeStyle).map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`py-3 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border ${
                    style === s 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-zinc-800/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center items-center">
              {['#ffffff', '#ff3e3e', '#3eff3e', '#3e3eff', '#ffff3e'].map(c => (
                <button 
                  key={c} 
                  onClick={() => setColors([c, '#000000'])}
                  className={`w-8 h-8 rounded-full transition-all border-2 ${
                    colors[0] === c ? 'border-white scale-125' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
