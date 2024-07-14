export async function initializeAudio(audioContext: AudioContext) {
    await audioContext.audioWorklet.addModule('spwm_processor.ts');
}

export function updateAudio(generator: any, mode: string, speed: number, dcVoltage: number) {
    const frequency = speedToFrequency(speed);
    generator.updateParameters(mode, frequency, dcVoltage);
}

function speedToFrequency(speed: number): number {
    // This is a simplified conversion, you may want to adjust this based on your specific requirements
    return speed / 3.6; // Convert km/h to Hz (assuming 1 Hz ≈ 3.6 km/h)
}