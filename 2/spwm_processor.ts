/// <reference types="npm:@types/audioworklet" />

class SPWMProcessor extends AudioWorkletProcessor {
    private mode: string = 'auto';
    private frequency: number = 0;
    private dcVoltage: number = 750;
    private phase: number = 0;
    private carrierFrequency: number = 1000;
    private referenceAmplitude: number = 0.8;
    private waveformBuffer: Float32Array = new Float32Array(128);
    private bufferIndex: number = 0;

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent) => {
            const { mode, frequency, dcVoltage } = event.data;
            this.mode = mode;
            this.frequency = frequency;
            this.dcVoltage = dcVoltage;
            if (this.mode === 'sync') {
                this.carrierFrequency = this.frequency * this.calculatePulses(this.frequency) * 2;
            }
        };
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        const output = outputs[0];
        const channelData = output[0];

        for (let i = 0; i < channelData.length; i++) {
            const sample = this.generateSample();
            channelData[i] = sample;
            
            // Store samples in the waveform buffer
            this.waveformBuffer[this.bufferIndex] = sample;
            this.bufferIndex = (this.bufferIndex + 1) % this.waveformBuffer.length;
        }

        // Send waveform data to the main thread
        this.port.postMessage({ waveformData: this.waveformBuffer });

        return true;
    }

    private generateSample(): number {
        const carrierWave = Math.sin(2 * Math.PI * this.carrierFrequency * this.phase / this.frequency);
        const referenceWave = this.referenceAmplitude * Math.sin(2 * Math.PI * this.phase);
        
        const pwmOutput = referenceWave > carrierWave ? 1 : -1;
        
        this.phase += 2 * Math.PI * this.frequency / sampleRate;
        if (this.phase >= 2 * Math.PI) {
            this.phase -= 2 * Math.PI;
        }

        return pwmOutput * (this.dcVoltage / 1500);
    }

    private calculatePulses(frequency: number): number {
        return Math.max(3, Math.min(27, Math.floor(27 - (frequency / 2))));
    }
}

registerProcessor('spwm-processor', SPWMProcessor);