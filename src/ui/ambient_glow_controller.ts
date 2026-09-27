export class AmbientGlowController {
  public static calculateAccentColor(imgData: Uint8ClampedArray): string {
    let r = 0, g = 0, b = 0;
    const count = imgData.length / 4;
    for (let i = 0; i < imgData.length; i += 4) {
      r += imgData[i];
      g += imgData[i + 1];
      b += imgData[i + 2];
    }
    return `rgba(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)}, 0.4)`;
  }
}
