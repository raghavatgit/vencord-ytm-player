/**
 * Converts linear slider values (0 - 100) to perceptual logarithmic curves.
 * Human hearing perceives volume logarithmically; squaring the normalized value
 * produces smooth, natural acoustic attenuation.
 */
export function toPerceptualVolume(linearPercent: number): number {
  if (linearPercent <= 0) return 0;
  if (linearPercent >= 100) return 100;

  const normalized = linearPercent / 100.0;
  // Perceptual quadratic curve
  const perceptual = Math.pow(normalized, 2);
  return Math.round(perceptual * 100);
}

/**
 * Inverts a perceptual volume value back to linear slider position.
 */
export function toLinearVolume(perceptualPercent: number): number {
  if (perceptualPercent <= 0) return 0;
  if (perceptualPercent >= 100) return 100;

  const normalized = perceptualPercent / 100.0;
  const linear = Math.sqrt(normalized);
  return Math.round(linear * 100);
}
