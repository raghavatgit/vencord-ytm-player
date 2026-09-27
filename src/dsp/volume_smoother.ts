export class VolumeSmoother {
  private currentVolume = 1.0;
  private smoothingFactor: number;

  constructor(smoothingFactor = 0.05) {
    this.smoothingFactor = smoothingFactor;
  }

  public step(targetVolume: number): number {
    this.currentVolume += (targetVolume - this.currentVolume) * this.smoothingFactor;
    return this.currentVolume;
  }
}
