"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Activity,
  Play,
  Square,
  Sliders,
  Volume2,
  Code2,
  Check,
  Copy,
  Radio,
  Disc,
  Waves,
  BarChart3,
  Zap,
} from "lucide-react";
import { synth, WaveformType } from "@/lib/synth";

type VisualMode = "SPECTRUM" | "WAVEFORM" | "REACTOR";

const SYNTH_PADS = [
  { label: "C3 // SUB", freq: 130.81, color: "from-rose-500 to-pink-600" },
  { label: "Eb3 // BASS", freq: 155.56, color: "from-pink-500 to-purple-600" },
  { label: "G3 // FIFTH", freq: 196.00, color: "from-purple-500 to-indigo-600" },
  { label: "Bb3 // SYNC", freq: 233.08, color: "from-indigo-500 to-blue-600" },
  { label: "C4 // LEAD", freq: 261.63, color: "from-blue-500 to-cyan-500" },
  { label: "Eb4 //ARP", freq: 311.13, color: "from-cyan-500 to-teal-500" },
  { label: "G4 // HARM", freq: 392.00, color: "from-teal-500 to-emerald-500" },
  { label: "C5 // PEAK", freq: 523.25, color: "from-emerald-500 to-lime-500" },
];

export const CyberVisualizer: React.FC = () => {
  const [visualMode, setVisualMode] = useState<VisualMode>("SPECTRUM");
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<WaveformType>("sawtooth");
  const [cutoff, setCutoff] = useState<number>(2400);
  const [resonance, setResonance] = useState<number>(5);
  const [bpm, setBpm] = useState<number>(128);
  const [activePad, setActivePad] = useState<number | null>(null);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup loop on unmount
  useEffect(() => {
    return () => {
      synth.stopArpLoop();
    };
  }, []);

  // Main 60fps Canvas Visualizer Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);

    const render = () => {
      phase += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Pull live FFT data if analyser exists
      if (synth.analyser) {
        synth.analyser.getByteFrequencyData(freqData);
        synth.analyser.getByteTimeDomainData(timeData);
      }

      // Check if audio is actively producing signal
      let totalEnergy = 0;
      for (let i = 0; i < freqData.length; i++) {
        totalEnergy += freqData[i];
      }
      const hasSignal = totalEnergy > 100;

      if (visualMode === "SPECTRUM") {
        const barCount = 48;
        const barWidth = (w - 40) / barCount;

        for (let i = 0; i < barCount; i++) {
          const val = hasSignal
            ? freqData[i] / 255
            : 0.12 + Math.sin(phase + i * 0.25) * 0.08 + Math.cos(phase * 0.5 - i * 0.1) * 0.04;

          const barHeight = Math.max(6, val * (h - 50));
          const x = 20 + i * barWidth;
          const y = h - 20 - barHeight;

          const grad = ctx.createLinearGradient(x, y, x, h - 20);
          grad.addColorStop(0, "#f43f5e");
          grad.addColorStop(0.5, "#a855f7");
          grad.addColorStop(1, "#06b6d4");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth - 4, barHeight, 4);
          ctx.fill();

          // Top Neon Cap
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, y - 4, barWidth - 4, 2);
        }
      } else if (visualMode === "WAVEFORM") {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#f43f5e";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 12;
        ctx.beginPath();

        const sliceWidth = w / 128;
        let x = 0;
        for (let i = 0; i < 128; i++) {
          const v = hasSignal
            ? (timeData[i] - 128) / 128
            : Math.sin(phase * 1.5 + i * 0.15) * 0.25 * Math.sin(i * 0.03);
          const y = h / 2 + v * (h * 0.38);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

        // Secondary Cyan Harmonic Shadow Wave
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#06b6d4";
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < 128; i++) {
          const v = hasSignal
            ? (timeData[i] - 128) / 128
            : Math.cos(phase + i * 0.12) * 0.18;
          const y = h / 2 + v * (h * 0.28);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.restore();
      } else if (visualMode === "REACTOR") {
        const cx = w / 2;
        const cy = h / 2;
        const baseR = 55;
        const spikes = 48;

        // Core pulsing circle
        const avgAmp = hasSignal ? totalEnergy / (128 * 255) : 0.15;
        const coreR = baseR + avgAmp * 35;

        const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, coreR);
        coreGrad.addColorStop(0, "rgba(244, 63, 94, 0.6)");
        coreGrad.addColorStop(0.6, "rgba(6, 182, 212, 0.2)");
        coreGrad.addColorStop(1, "rgba(6, 182, 212, 0)");

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2 + phase * 0.2;
          const amp = hasSignal
            ? (freqData[i] / 255) * 65
            : 12 + Math.sin(phase * 2 + i * 0.5) * 8;

          const x1 = cx + Math.cos(angle) * baseR;
          const y1 = cy + Math.sin(angle) * baseR;
          const x2 = cx + Math.cos(angle) * (baseR + amp);
          const y2 = cy + Math.sin(angle) * (baseR + amp);

          ctx.strokeStyle = i % 2 === 0 ? "#f43f5e" : "#22d3ee";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [visualMode]);

  const togglePlayArp = () => {
    if (isPlaying) {
      synth.stopArpLoop();
      setIsPlaying(false);
    } else {
      synth.startArpLoop(bpm);
      setIsPlaying(true);
      try {
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.6 },
          colors: ["#f43f5e", "#06b6d4", "#a855f7"],
        });
      } catch {}
    }
  };

  const handlePadTrigger = (freq: number, idx: number) => {
    setActivePad(idx);
    synth.triggerNote(freq, 0.35);
    setTimeout(() => setActivePad(null), 200);
  };

  const componentCode = `// Interactive Cyber Audio Visualizer Component
// Stack: Next.js 15, Web Audio API AnalyserNode, HTML5 Canvas, Tailwind CSS v4
import React, { useEffect, useRef } from 'react';

export function CyberVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playNote = (freq: number) => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-rose-500/30 text-white font-mono">
      <canvas ref={canvasRef} width={600} height={240} className="w-full rounded-2xl bg-slate-900 mb-4" />
      <button onClick={() => playNote(261.63)} className="px-5 py-2.5 bg-rose-500 rounded-xl font-bold">
        TRIGGER SYNTH PULSE
      </button>
    </div>
  );
}`;

  const handleCopyCode = async () => {
    synth.triggerNote(523.25, 0.1);
    try {
      await navigator.clipboard.writeText(componentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold font-mono tracking-wider text-slate-100 uppercase">
                Interactive Cyber Audio Visualizer
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                UI-05
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-Time Web Audio API FFT Spectrum Analyzer, Biquad Filter & Arpeggiator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-auto">
          <button
            onClick={togglePlayArp}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              isPlaying
                ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30"
                : "bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400"
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "STOP ARP LOOP" : "START CYBER ARP"}</span>
          </button>

          <button
            onClick={() => {
              synth.triggerNote(440, 0.1);
              setShowCodeModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono bg-gradient-to-r from-rose-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 text-white font-medium shadow-md transition-all cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            <span>Copy Component Code</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Visualizer Stage + Synth Pads */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Canvas Stage */}
          <div className="relative rounded-3xl overflow-hidden border border-rose-500/30 bg-slate-950/90 shadow-2xl">
            <div className="absolute top-3 left-4 flex items-center space-x-2 z-10">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? "bg-rose-500 animate-ping" : "bg-cyan-400"
                }`}
              />
              <span className="text-[10px] font-mono tracking-wider text-slate-300">
                FFT 256-BIN ANALYSER // {visualMode} MODE
              </span>
            </div>

            {/* Visual Mode Switcher Pills */}
            <div className="absolute top-3 right-4 flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 z-10">
              {(
                [
                  { id: "SPECTRUM", icon: BarChart3 },
                  { id: "WAVEFORM", icon: Waves },
                  { id: "REACTOR", icon: Disc },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      synth.triggerNote(330, 0.08);
                      setVisualMode(m.id);
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                      visualMode === m.id
                        ? "bg-rose-500 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.id}</span>
                  </button>
                );
              })}
            </div>

            <canvas
              ref={canvasRef}
              width={680}
              height={300}
              className="w-full h-[300px] block"
            />
          </div>

          {/* 8 Tactile Cyber Synth Pads */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-2 font-bold">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>TACTILE HARMONIC SYNTH PADS (CLICK TO PLAY)</span>
              </span>
              <span className="text-[10px] text-rose-400">POLYPHONIC TRIGGER</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SYNTH_PADS.map((pad, idx) => (
                <motion.button
                  key={pad.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handlePadTrigger(pad.freq, idx)}
                  className={`h-16 rounded-xl bg-gradient-to-br ${pad.color} p-3 flex flex-col justify-between text-left text-white shadow-lg cursor-pointer border ${
                    activePad === idx ? "border-white brightness-125" : "border-white/10"
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-80">{pad.freq} Hz</span>
                  <span className="text-xs font-mono font-bold tracking-wider">{pad.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Hardware Synth Parameters & Filter Rack */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200">
                <Sliders className="w-4 h-4 text-rose-400" />
                <span>OSCILLATOR & FILTER RACK</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">DSP ENGINE</span>
            </div>

            {/* Oscillator Waveform */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                <span>OSCILLATOR WAVEFORM</span>
                <span className="text-rose-400 font-bold uppercase">{waveform}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {(["sawtooth", "square", "triangle", "sine"] as WaveformType[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      synth.waveform = w;
                      setWaveform(w);
                      synth.triggerNote(261.63, 0.15);
                    }}
                    className={`py-2 rounded-lg text-[10px] font-mono uppercase transition cursor-pointer ${
                      waveform === w
                        ? "bg-rose-500 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {w.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Cutoff Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">LOWPASS FILTER CUTOFF</span>
                <span className="text-cyan-400 font-bold">{cutoff} HZ</span>
              </div>
              <input
                type="range"
                min="200"
                max="8000"
                step="100"
                value={cutoff}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCutoff(val);
                  synth.setFilter(val, resonance);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Filter Resonance Q Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">FILTER RESONANCE (Q PEAK)</span>
                <span className="text-purple-400 font-bold">{resonance} dB</span>
              </div>
              <input
                type="range"
                min="1"
                max="18"
                step="0.5"
                value={resonance}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setResonance(val);
                  synth.setFilter(cutoff, val);
                }}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Arpeggiator BPM Tempo Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">ARPEGGIATOR CLOCK TEMPO</span>
                <span className="text-emerald-400 font-bold">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="80"
                max="180"
                step="2"
                value={bpm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBpm(val);
                  synth.updateBpm(val);
                }}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Pipeline Telemetry */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 border-b border-slate-900 pb-2">
              <span>AUDIO GRAPH TOPOLOGY</span>
              <span className="text-emerald-400">48.0 kHz FLOAT32</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
              <span>Oscillator ➔ BiquadFilter ➔ Gain ➔ FFT</span>
              <span className="text-rose-400 font-bold">ZERO-ASSET</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Drawer */}
      <AnimatePresence>
        {showCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    CyberVisualizer.tsx
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-rose-500 hover:bg-rose-400 text-white font-bold transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                  <button
                    onClick={() => setShowCodeModal(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed">
                <pre>{componentCode}</pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
