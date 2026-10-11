// Real-time Web Audio API Synthesizer + FFT Analyser Engine
export type WaveformType = "sawtooth" | "square" | "triangle" | "sine";

class CyberSynthEngine {
  public ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public filter: BiquadFilterNode | null = null;
  public masterGain: GainNode | null = null;

  public waveform: WaveformType = "sawtooth";
  public cutoff: number = 2400;
  public resonance: number = 4;
  public volume: number = 0.25;
  public isLooping: boolean = false;
  public bpm: number = 128;

  private loopTimer: number | null = null;
  private stepIndex: number = 0;

  // Cyberpunk Minor Pentatonic / Dorian Arpeggio Sequence (Hz)
  private sequenceNotes = [
    130.81, // C3
    155.56, // Eb3
    196.00, // G3
    233.08, // Bb3
    261.63, // C4
    311.13, // Eb4
    392.00, // G4
    523.25, // C5
  ];

  public init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = this.cutoff;
      this.filter.Q.value = this.resonance;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setFilter(cutoff: number, q: number) {
    this.cutoff = cutoff;
    this.resonance = q;
    if (this.filter && this.ctx) {
      this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.02);
      this.filter.Q.setTargetAtTime(q, this.ctx.currentTime, 0.02);
    }
  }

  public triggerNote(freq: number, duration: number = 0.22) {
    try {
      this.init();
      if (!this.ctx || !this.filter) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = this.waveform;
      osc.frequency.setValueAtTime(freq, now);

      // Sub-octave bass layer
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(freq * 0.5, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.5, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(noteGain);
      subOsc.connect(noteGain);
      noteGain.connect(this.filter);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + duration);
      subOsc.stop(now + duration);
    } catch {}
  }

  public startArpLoop(bpm: number = this.bpm) {
    this.init();
    this.bpm = bpm;
    this.isLooping = true;
    this.scheduleNextStep();
  }

  private scheduleNextStep() {
    if (!this.isLooping) return;
    const intervalMs = (60 / this.bpm / 2) * 1000; // 8th notes

    const pattern = [0, 2, 4, 2, 5, 4, 7, 3];
    const noteIdx = pattern[this.stepIndex % pattern.length];
    const freq = this.sequenceNotes[noteIdx];

    this.triggerNote(freq, intervalMs / 1000 * 0.85);
    this.stepIndex++;

    this.loopTimer = window.setTimeout(() => {
      this.scheduleNextStep();
    }, intervalMs);
  }

  public stopArpLoop() {
    this.isLooping = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public updateBpm(newBpm: number) {
    this.bpm = newBpm;
  }
}

export const synth = new CyberSynthEngine();
