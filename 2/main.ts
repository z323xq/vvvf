import { initializeAudio, updateAudio } from './util.ts';
import { SPWMGenerator } from './spwm_generator.ts';

let audioContext: AudioContext | null = null;
let spwmGenerator: SPWMGenerator | null = null;
let animationFrameId: number | null = null;

document.getElementById('startButton')?.addEventListener('click', async () => {
    if (!audioContext) {
        audioContext = new AudioContext();
        await initializeAudio(audioContext);
        spwmGenerator = new SPWMGenerator(audioContext);
        startAnimation();
    }
});

const modeSelect = document.getElementById('modeSelect') as HTMLSelectElement;
const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
const dcVoltageSlider = document.getElementById('dcVoltageSlider') as HTMLInputElement;
const speedValue = document.getElementById('speedValue');
const dcVoltageValue = document.getElementById('dcVoltageValue');

modeSelect.addEventListener('change', updateValues);
speedSlider.addEventListener('input', updateValues);
dcVoltageSlider.addEventListener('input', updateValues);

function updateValues() {
    const mode = modeSelect.value;
    const speed = parseInt(speedSlider.value);
    const dcVoltage = parseInt(dcVoltageSlider.value);
    
    if (speedValue) speedValue.textContent = speed.toString();
    if (dcVoltageValue) dcVoltageValue.textContent = dcVoltage.toString();
    
    if (spwmGenerator) {
        updateAudio(spwmGenerator, mode, speed, dcVoltage);
    }
}

// Canvas setup
const canvas = document.getElementById('waveformCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function drawWaveform() {
    if (!spwmGenerator) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    const waveformData = spwmGenerator.getWaveformData();
    const scaleX = canvas.width / waveformData.length;
    const scaleY = canvas.height / 2;

    for (let i = 0; i < waveformData.length; i++) {
        const x = i * scaleX;
        const y = (waveformData[i] * scaleY) + (canvas.height / 2);
        ctx.lineTo(x, y);
        console.log(waveformData[i])
    }

    ctx.strokeStyle = 'blue';
    ctx.stroke();
}

function startAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    function animate() {
        drawWaveform();
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}