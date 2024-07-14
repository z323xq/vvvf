export class SPWMGenerator {
    private workletNode: AudioWorkletNode;
    private waveformData: Float32Array = new Float32Array(128);

    constructor(audioContext: AudioContext) {
        this.workletNode = new AudioWorkletNode(audioContext, 'spwm-processor');
        this.workletNode.connect(audioContext.destination);

        this.workletNode.port.onmessage = (event: MessageEvent) => {
            if (event.data.waveformData) {
                this.waveformData = event.data.waveformData;
            }
        };
    }

    updateParameters(mode: string, frequency: number, dcVoltage: number) {
        this.workletNode.port.postMessage({
            mode,
            frequency,
            dcVoltage
        });
    }

    getWaveformData(): Float32Array {
        return this.waveformData;
    }
}