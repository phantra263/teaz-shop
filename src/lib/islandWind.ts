const speed = 2.25;
const east = 0.68;
const north = 0.27;

export function islandWindGust(time: number, x: number, z: number) {
  const wave = Math.sin(time * speed - x * east - z * north + Math.sin(z * 0.36) * 0.52);
  return Math.max(0, wave) ** 2;
}

export const islandWindShader = /* glsl */ `
  float islandWindGust(float time, vec2 position) {
    float wave = sin(time * ${speed} - position.x * ${east} - position.y * ${north} + sin(position.y * 0.36) * 0.52);
    float crest = max(0.0, wave);
    return crest * crest;
  }
`;
