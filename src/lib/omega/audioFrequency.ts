/**
 * src/lib/omega/audioFrequency.ts
 * Real-time Web Audio API frequency analysis engine and speech recognition integration
 * for Omega AI voice interaction.
 */

export interface AudioFrequencyMetrics {
  averageVolume: number;      // 0 - 100%
  peakFrequencyHz: number;    // Estimated dominant frequency in Hz
  decibels: number;           // Approx dB level (-100 to 0)
  isVoiceDetected: boolean;   // True if energy crosses human voice threshold
}

export class AudioFrequencyEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private timeDataArray: Uint8Array | null = null;
  private isRunning: boolean = false;
  private simulationInterval: any = null;
  private isSimulated: boolean = false;

  public async start(): Promise<{ analyser: AnalyserNode | null; isSimulated: boolean }> {
    this.stop();

    try {
      // 1. Check if AudioContext is available
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Web Audio API not supported in this environment");
      }

      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // 2. Request user microphone stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128; // 64 frequency bins
        this.analyser.smoothingTimeConstant = 0.82;

        this.sourceNode.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        this.timeDataArray = new Uint8Array(bufferLength);
        this.isRunning = true;
        this.isSimulated = false;

        return { analyser: this.analyser, isSimulated: false };
      } else {
        throw new Error("navigator.mediaDevices.getUserMedia not available");
      }
    } catch (err) {
      console.warn("[Omega Audio Engine] Falling back to simulated audio frequency:", err);
      // Fallback: create an internal audio context with simulated activity so the UI doesn't break
      this.isSimulated = true;
      this.isRunning = true;
      const bufferLength = 32;
      this.dataArray = new Uint8Array(bufferLength);
      this.timeDataArray = new Uint8Array(bufferLength);
      this.startSimulation();
      return { analyser: null, isSimulated: true };
    }
  }

  private startSimulation() {
    let tick = 0;
    this.simulationInterval = setInterval(() => {
      if (!this.isRunning || !this.dataArray) return;
      tick += 0.15;
      for (let i = 0; i < this.dataArray.length; i++) {
        // Natural voice harmonic simulation
        const base = Math.sin(tick * 2 + i * 0.3) * 40 + 60;
        const voicePeak = Math.sin(tick * 3 + i * 0.5) * 50;
        const noise = (Math.random() - 0.5) * 25;
        this.dataArray[i] = Math.max(10, Math.min(255, Math.floor(base + voicePeak + noise)));
      }
    }, 40);
  }

  public getFrequencyData(): Uint8Array {
    if (!this.isRunning || !this.dataArray) {
      return new Uint8Array(32);
    }

    if (this.analyser && !this.isSimulated) {
      this.analyser.getByteFrequencyData(this.dataArray);
    }
    return this.dataArray;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.isRunning || !this.timeDataArray) {
      return new Uint8Array(32).fill(128);
    }

    if (this.analyser && !this.isSimulated) {
      this.analyser.getByteTimeDomainData(this.timeDataArray);
    }
    return this.timeDataArray;
  }

  public getMetrics(): AudioFrequencyMetrics {
    const freq = this.getFrequencyData();
    if (!freq || freq.length === 0) {
      return { averageVolume: 0, peakFrequencyHz: 0, decibels: -100, isVoiceDetected: false };
    }

    let sum = 0;
    let maxVal = 0;
    let maxIdx = 0;

    for (let i = 0; i < freq.length; i++) {
      sum += freq[i];
      if (freq[i] > maxVal) {
        maxVal = freq[i];
        maxIdx = i;
      }
    }

    const avg = sum / freq.length;
    const averageVolume = Math.min(100, Math.round((avg / 255) * 100));

    // Approximate Hz based on sample rate and bin size
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const fftSize = this.analyser?.fftSize || 128;
    const peakFrequencyHz = Math.round((maxIdx * sampleRate) / fftSize);

    // Approximate dB
    const decibels = avg > 0 ? Math.round(20 * Math.log10(avg / 255)) : -100;
    const isVoiceDetected = averageVolume > 12;

    return {
      averageVolume,
      peakFrequencyHz,
      decibels,
      isVoiceDetected,
    };
  }

  public stop() {
    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.sourceNode = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {
        // ignore
      }
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public isAudioRunning(): boolean {
    return this.isRunning;
  }

  public isSimulatedAudio(): boolean {
    return this.isSimulated;
  }
}
