export /**
 * Generates a deterministic pseudo-random number between 0 and 1 based on a seed.
 * This is widely used in shader code (GLSL) for generating noise.
 * The magic number 43758.5453123 is a canonical constant optimized to produce
 * a "random-looking" distribution of bits in the floating point mantissa when
 * multiplied by the sine of the seed.
 */
function deterministicRandom(seed: number): number {
  const raw = Math.sin(seed) * 43758.5453123;
  return raw - Math.floor(raw);
}
