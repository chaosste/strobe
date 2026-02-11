# Strobe - High-Power Visual Sync

Strobe (StrobeAI) is a high-performance React + TypeScript strobe light application featuring frequency precision control, multiple flash patterns, audio reactivity, and safety-first design with photosensitivity warnings.

## Build, Test, and Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Architecture

### Application Overview

Strobe is a browser-based strobe light generator with precise frequency control (0.5-60Hz), multiple flash patterns, audio reactivity, and color customization. Designed for performance, entertainment, and visual experiments with safety considerations.

**Core capabilities:**
1. **Fixed Frequency** - Precise Hz control (0.5-60Hz)
2. **Random Pattern** - Probabilistic flashing
3. **Pulse Mode** - Smooth transitions between flashes
4. **Audio Reactive** - Real-time microphone input driving flash rate
5. **Color Selection** - 5 preset colors (white, red, green, blue, yellow)

### Project Structure

```
components/
└── StrobeCanvas.tsx          # Strobe rendering engine

services/
├── geminiService.ts          # AI integration (unused in current version)
├── proxyService.ts           # Secure proxy communication
└── geminiCachingService.ts   # Context caching for Gemini

App.tsx                       # Main application & controls
types.ts                      # TypeScript enums
vite.config.ts                # Vite configuration
```

### State Flow

**App states:**
1. `DISCLAIMER` - Photosensitivity warning screen
2. `IDLE` - Controls visible, strobe inactive
3. **Active** (when Play pressed) - Controls fade out, strobe running

**Strobe styles:**
```typescript
enum StrobeStyle {
  FIXED = 'FIXED',     // Constant frequency
  RANDOM = 'RANDOM',   // Probabilistic flash
  PULSE = 'PULSE',     // Smooth transitions
  AUDIO = 'AUDIO'      // Microphone reactivity
}
```

### Strobe Engine

**StrobeCanvas.tsx implements the core flashing logic:**

**Fixed mode:**
```typescript
cycleMs = 1000 / (frequency * 2)  // Half-period for on/off cycle
// Toggle isOn every cycleMs
// Color alternates between colors array and black
```

**Random mode:**
```typescript
// Each frame: probability check
if (Math.random() < (frequency / 60)) {
  toggle();
  randomize color index;
}
```

**Pulse mode:**
```typescript
// Same as fixed but with CSS transition
transition: 'background-color 0.15s ease-in-out'
```

**Audio mode:**
```typescript
effectiveFreq = audioLevel * 60  // Scale 0-1 to 0-60Hz
// Then use same logic as fixed mode
```

**Rendering:**
- `requestAnimationFrame` loop
- Direct `backgroundColor` manipulation
- No canvas element - pure DOM manipulation for performance
- Black (#000000) as "off" state

### Audio Reactivity

**Web Audio API integration:**
1. Request microphone permission
2. Create `AudioContext`
3. Create `AnalyserNode` with `fftSize = 256`
4. Connect mic stream to analyzer
5. Poll frequency data in animation loop
6. Average all frequency bins → `audioLevel` (0-1)
7. Scale to frequency (0-60Hz)

**Audio cleanup:**
- Proper AudioContext closure on component unmount
- Stream tracks stopped when mode changes
- Error handling falls back to FIXED mode

### UI/UX Design

**Photosensitivity warning:**
- Mandatory disclaimer screen on first launch
- Red color scheme with warning icon
- Explicit "Enter Interface" action required
- Complies with accessibility standards

**Controls interface:**
- Frequency slider (0.5-60Hz, 0.5Hz steps)
- Style buttons (FIXED, RANDOM, PULSE, AUDIO)
- Color selector (5 preset colors)
- Persistent play/pause button

**Play/pause button:**
- Always visible, centered
- Themed to selected color
- Scales on press (active:scale-90)
- When active: semi-transparent with glow
- When inactive: solid with shadow

**UI fade behavior:**
```typescript
opacity: isActive ? 0 : 1
visibility: isActive ? 'hidden' : 'visible'
pointerEvents: isActive ? 'none' : 'auto'
transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s'
```

**Responsive theming:**
- Button background color matches selected strobe color
- Button text color: white on dark colors, black on white/yellow
- Glow/shadow effects use selected color with opacity

### Color System

**Preset colors:**
```typescript
['#ffffff', '#ff3e3e', '#3eff3e', '#3e3eff', '#ffff3e']
// White,    Red,      Green,    Blue,     Yellow
```

**Color alternation:**
- `colors` array: `[selectedColor, '#000000']`
- Flash cycles between selected color and black
- `colorIndex` increments on each flash (only used if multiple colors)

### Performance Optimization

**No canvas rendering:**
- Direct DOM `backgroundColor` manipulation
- Avoids canvas context overhead
- Lower CPU usage for simple color flashing

**requestAnimationFrame:**
- Browser-optimized timing
- Automatic throttling when tab inactive
- Smooth 60fps animation loop

**Conditional transitions:**
- PULSE mode: 0.15s ease-in-out
- Other modes: No transition (instant toggle)

**Audio processing:**
- Single analyser node
- Efficient frequency bin averaging
- Cleanup on unmount prevents memory leaks

## Key Conventions

### Environment Variables

**Development (.env.local):**
```bash
VITE_PROXY_URL=https://gemini-proxy-572556903588.us-central1.run.app
```

**Note:** Proxy service present but not currently used in app (prepared for future AI features)

### TypeScript Configuration

- Target: `ES2022`
- Experimental decorators enabled
- `useDefineForClassFields: false`
- Path alias: `@/*` maps to project root
- Module resolution: `bundler`
- JSX: `react-jsx`

### Accessibility & Safety

**Photosensitivity warning:**
- First screen always shows disclaimer
- Cannot be bypassed
- Clear warning text and iconography
- User must explicitly consent to proceed

**Microphone permission:**
- Only requested when AUDIO mode selected
- Graceful fallback to FIXED if denied
- Proper error handling and console logging

**Visual design:**
- High contrast modes available
- Clear visual feedback for all interactions
- No unexpected flashes (requires explicit play action)

### State Management

**Local state only:**
- No localStorage persistence
- Session-based preferences
- Resets on page reload

**Refs for performance:**
```typescript
audioContextRef    // AudioContext instance
analyserRef        // AnalyserNode instance
lastToggleTimeRef  // Timing for fixed/pulse modes
colorIndexRef      // Current color in array
isOnRef            // Current on/off state
```

**useMemo for derived styles:**
- `uiWrapperStyle` - Computed from isActive
- `buttonStyle` - Computed from isActive + color

## Deployment

### Docker + nginx

**Dockerfile:**
- Multi-stage build (Node builder + nginx)
- Vite build → `/usr/share/nginx/html`
- nginx on port 8080 (Cloud Run standard)

**nginx.conf:**
- SPA routing (all routes → index.html)
- Static file serving

### Cloud Run

**cloudbuild.yaml:**
- Automated builds on push
- Deploy to Cloud Run
- Environment variables for proxy URL

**Production setup:**
```bash
npm run build
docker build -t strobe .
docker run -p 8080:8080 strobe
```

### HTTPS Requirement

**Microphone access:**
- Requires HTTPS in production
- `getUserMedia` blocked on insecure origins
- Cloud Run provides HTTPS by default

## Technical Details

### Frequency Calculation

**Fixed/Pulse/Audio modes:**
```typescript
cycleMs = 1000 / (frequency * 2)
// frequency = 10Hz → cycleMs = 50ms (on for 50ms, off for 50ms)
// Total period = 100ms = 10 cycles per second
```

**Random mode:**
```typescript
probability = frequency / 60
// frequency = 30Hz → 30/60 = 0.5 = 50% chance each frame (at 60fps)
// Higher frequency = higher probability of flash
```

**Audio mode:**
```typescript
effectiveFreq = audioLevel * 60
// audioLevel = 0.5 → 30Hz
// Scales linearly from 0Hz (silence) to 60Hz (loud)
```

### Audio Analysis

**Frequency bin averaging:**
```typescript
analyser.fftSize = 256
bufferLength = analyser.frequencyBinCount  // 128 bins
dataArray = new Uint8Array(bufferLength)   // 0-255 per bin
analyser.getByteFrequencyData(dataArray)
average = dataArray.reduce((a, b) => a + b) / bufferLength
audioLevel = average / 128  // Normalize to 0-1
```

**Update rate:**
- 60fps (requestAnimationFrame)
- Audio data fetched every frame
- Immediate response to volume changes

### Color Rendering

**Direct DOM manipulation:**
```typescript
canvasRef.current.style.backgroundColor = color
```

**Benefits:**
- Instant color change (no draw calls)
- GPU-accelerated compositing
- Minimal CPU overhead
- Works on all modern browsers

**Drawbacks:**
- Cannot render gradients or patterns
- Limited to solid colors
- No canvas-based effects

## Future AI Features (Prepared)

**Services present but unused:**
- `geminiService.ts` - AI integration placeholder
- `proxyService.ts` - Secure proxy for future API calls
- `geminiCachingService.ts` - Context caching

**Potential features:**
- AI-generated flash patterns
- Music beat detection and sync
- Scene-based lighting programs
- Visual effect sequences

## Important Notes

- **Project root**: `/Users/stephenbeale/Projects/strobe/`
- **Microphone access**: Required for AUDIO mode, HTTPS needed in production
- **Photosensitivity**: Mandatory warning - do not remove or bypass
- **Frequency range**: 0.5-60Hz (60Hz = visual flicker fusion threshold)
- **Browser compatibility**: Requires modern browser with Web Audio API
- **Performance**: Lightweight - runs at 60fps on most devices
- **Accessibility**: Consider users with photosensitive epilepsy
- **Proxy service**: Present but not actively used in current version
- **No persistence**: Settings reset on page reload
- **Safety first**: Always show disclaimer, clear stop mechanism (pause button)
