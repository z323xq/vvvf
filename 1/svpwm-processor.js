class SVPWMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0;
        this.lastOutput = [0, 0, 0];
    }

    static get parameterDescriptors() {
        return [
            {name: 'frequency', defaultValue: 50, minValue: 1, maxValue: 100},
            {name: 'amplitude', defaultValue: 0.5, minValue: 0, maxValue: 1}
        ];
    }
    log(message) {
        this.port.postMessage({ type: 'log', message: message });
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const frequency = parameters.frequency[0];
        const amplitude = parameters.amplitude[0];

        this.log(`Processing: frequency = ${frequency}, amplitude = ${amplitude}`);

        for (let i = 0; i < output[0].length; i++) {
            this.phase += 2 * Math.PI * frequency / sampleRate;
            if (this.phase > 2 * Math.PI) {
                this.phase -= 2 * Math.PI;
            }

            const [a, b, c] = this.generateSVPWM(this.phase, amplitude);
            output[0][i] = (a + b + c) / 3;
        }

        this.log(`Output sample: ${output[0].slice(0, 5).join(', ')}...`);

        this.port.postMessage({
            type: 'waveform',
            data: output[0]
        });

        return true;
    }

    generateSVPWM(phase, amplitude) {
        const sector = Math.floor(phase / (Math.PI / 3)) % 6;
        const angle = phase - sector * Math.PI / 3;

        const X = amplitude * Math.sin(Math.PI / 3 - angle);
        const Y = amplitude * Math.sin(angle);

        let T1, T2;
        switch (sector) {
            case 0: T1 = X; T2 = Y; break;
            case 1: T1 = Y; T2 = -X; break;
            case 2: T1 = -X; T2 = X + Y; break;
            case 3: T1 = -Y; T2 = -X; break;
            case 4: T1 = X; T2 = -(X + Y); break;
            case 5: T1 = Y; T2 = X; break;
        }

        const T0 = 1 - T1 - T2;
        const halfT0 = T0 / 2;

        const newOutput = [0, 0, 0];
        switch (sector) {
            case 0: newOutput[0] = 1; newOutput[1] = T2 + halfT0; newOutput[2] = halfT0; break;
            case 1: newOutput[0] = T1 + halfT0; newOutput[1] = 1; newOutput[2] = halfT0; break;
            case 2: newOutput[0] = halfT0; newOutput[1] = 1; newOutput[2] = T2 + halfT0; break;
            case 3: newOutput[0] = halfT0; newOutput[1] = T1 + halfT0; newOutput[2] = 1; break;
            case 4: newOutput[0] = T2 + halfT0; newOutput[1] = halfT0; newOutput[2] = 1; break;
            case 5: newOutput[0] = 1; newOutput[1] = halfT0; newOutput[2] = T1 + halfT0; break;
        }

        for (let i = 0; i < 3; i++) {
            newOutput[i] = this.lastOutput[i] + (newOutput[i] - this.lastOutput[i]) * 0.1;
        }
        this.lastOutput = newOutput;

        return newOutput;
    }
}

registerProcessor('svpwm-processor', SVPWMProcessor);