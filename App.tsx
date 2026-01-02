
import React, { useState, useCallback, useEffect } from 'react';
import StrobeCanvas from './components/StrobeCanvas';
import { AppState, StrobePattern } from './types';
import { generateAIPattern } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.DISCLAIMER);
  const [frequency, setFrequency] = useState(10); // Hz
  const [intensity, setIntensity] = useState(1.0);
  const [colors, setColors] = useState(['#ffffff', '#000000']);
  const [isActive, setIsActive] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentPattern, setCurrentPattern] = useState<StrobePattern | null>(null);

  const handleStart = () => setState(AppState.IDLE);

  const toggleStrobe = () => {
    setIsActive(!isActive);
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const pattern = await generateAIPattern(aiPrompt);
      setCurrentPattern(pattern);
      setColors(pattern.colors);
      // We don't override the frequency entirely, but we apply the multiplier
      // setFrequency((prev) => Math.min(60, Math.max(1, prev * pattern.frequencyMultiplier)));
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (state === AppState.DISCLAIMER) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-900 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="text-red-500 flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">Safety Warning</h1>
          <p className="text-zinc-400 leading-relaxed">
            This application generates high-frequency flashing lights. It may trigger seizures in individuals with photosensitive epilepsy or other light-sensitive conditions.
          </p>
          <p className="text-zinc-500 text-sm">
            By proceeding, you acknowledge the risks and agree to use this tool responsibly.
          </p>
          <button 
            onClick={handleStart}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-red-900/20"
          >
            I UNDERSTAND - START
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden select-none">
      <StrobeCanvas 
        frequency={frequency} 
        colors={colors} 
        isActive={isActive} 
        intensity={intensity} 
      />

      {/* Control Overlay */}
      <div className={`relative z-10 p-6 md:p-10 transition-opacity duration-500 ${isActive ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        <div className="max-w-2xl mx-auto space-y-8">
          
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter">STROBE<span className="text-blue-500">AI</span></h1>
              <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">Pulse Engine v3.0</p>
            </div>
            <button 
              onClick={toggleStrobe}
              className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform active:scale-90 ${
                isActive 
                ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                : 'bg-white text-black shadow-white/20 shadow-xl'
              }`}
            >
              {isActive ? 'STOP STROBE' : 'START STROBE'}
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Manual Controls */}
            <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-6">
              <h2 className="text-zinc-300 font-bold uppercase text-xs tracking-widest">Manual Override</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <label className="text-zinc-400 font-medium">Frequency (Hz)</label>
                  <span className="text-white font-mono bg-zinc-800 px-2 rounded">{frequency} Hz</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  step="0.1"
                  value={frequency}
                  onChange={(e) => setFrequency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <label className="text-zinc-400 font-medium">Intensity</label>
                  <span className="text-white font-mono bg-zinc-800 px-2 rounded">{Math.round(intensity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="pt-4 flex gap-2 overflow-x-auto pb-2">
                {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map(c => (
                  <button
                    key={c}
                    onClick={() => setColors([c, '#000000'])}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${colors[0] === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* AI Pattern Generator */}
            <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
              <h2 className="text-zinc-300 font-bold uppercase text-xs tracking-widest">AI Pattern Engine</h2>
              <form onSubmit={handleAiGenerate} className="space-y-4">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'Deep space nebula pulse' or 'Fast emergency lights'"
                  className="w-full bg-black/50 border border-zinc-700 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none h-24"
                />
                <button 
                  type="submit"
                  disabled={isAiLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                  {isAiLoading ? 'RESONATING...' : 'GENERATE VIBE'}
                </button>
              </form>

              {currentPattern && (
                <div className="mt-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-tighter mb-1">Current Sync</p>
                  <h3 className="text-white font-bold">{currentPattern.name}</h3>
                  <p className="text-zinc-400 text-xs line-clamp-2">{currentPattern.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Indicator of Speed */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-zinc-900 z-50">
        <div 
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${(frequency / 60) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default App;
