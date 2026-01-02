
export interface StrobePattern {
  name: string;
  colors: string[];
  frequencyMultiplier: number; // 1.0 is default, 2.0 is double speed, etc.
  description: string;
}

export enum AppState {
  DISCLAIMER = 'DISCLAIMER',
  IDLE = 'IDLE',
  RUNNING = 'RUNNING'
}
