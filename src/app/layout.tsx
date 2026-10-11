import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UI-05 // Interactive Cyber Audio Visualizer",
  description: "Real-Time Web Audio API Synthesizer, FFT Spectrum Canvas & Arpeggiator Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-rose-500/30 selection:text-rose-200">
        {children}
      </body>
    </html>
  );
}
