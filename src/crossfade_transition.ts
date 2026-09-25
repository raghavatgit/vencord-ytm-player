// Dynamic Sigmoid Audio Crossfade
// Executes smooth S-curve audio crossfades between fading and incoming tracks.

export function applySigmoidalCrossfade(
    fadeNodeOut: GainNode,
    fadeNodeIn: GainNode,
    audioContext: AudioContext,
    durationSeconds = 4.0
): void {
    const now = audioContext.currentTime;
    const steps = 30;
    const curveOut = new Float32Array(steps);
    const curveIn = new Float32Array(steps);

    for (let i = 0; i < steps; i++) {
        const x = (i / (steps - 1)) * 10 - 5; // -5 to +5
        const sigmoid = 1 / (1 + Math.exp(-x));
        curveIn[i] = sigmoid;
        curveOut[i] = 1 - sigmoid;
    }

    fadeNodeOut.gain.setValueCurveAtTime(curveOut, now, durationSeconds);
    fadeNodeIn.gain.setValueCurveAtTime(curveIn, now, durationSeconds);
}
