export const islandLayoutScale = 1.85;
export const islandGround = { x: 20 * islandLayoutScale, z: 14 * islandLayoutScale };
export const islandPond = { x: 15.1 * islandLayoutScale, z: -4.3 * islandLayoutScale, radius: 3.2 };

export function pondDistance(x: number, z: number) {
  return Math.hypot(x - islandPond.x, z - islandPond.z);
}

export function pondRadiusAt(angle: number) {
  return islandPond.radius * (1 + 0.13 * Math.cos(2 * angle - 0.6) + 0.095 * Math.sin(3 * angle + 0.4) + 0.037 * Math.cos(5 * angle - 1.12));
}

export function pondBankDistance(x: number, z: number) {
  return pondDistance(x, z) - pondRadiusAt(Math.atan2(z - islandPond.z, x - islandPond.x));
}

function fade(from: number, to: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

const hills = [
  [-18, 7, 9, 7, 5.1], [11, 12, 7.2, 8, 5.7], [-25, -8, 9, 5.8, 2.6],
  [-10, -15.5, 10, 7, 7.2], [15, -15.5, 10, 6.4, 5.9], [23, 6.4, 7, 6.5, 4.5],
] as const;
const levelSites = [[-6.3, -4.45], [2.8, -5.95], [6, 0.95], [-6.75, 1.32], [-4.24, 1.32]] as const;

export function islandElevation(x: number, z: number) {
  const coast = Math.hypot(x / islandGround.x, z / islandGround.z);
  const shore = 1 - fade(0.76, 0.985, coast);
  if (shore === 0) return 0;

  let height = 0.37 + Math.sin(x * 0.23 - z * 0.18) * 0.23 + Math.cos(z * 0.39 + x * 0.14) * 0.17;
  for (const [hx, hz, width, depth, rise] of hills) {
    const dx = (x - hx) / width;
    const dz = (z - hz) / depth;
    height += rise * Math.exp(-1.75 * (dx * dx + dz * dz));
  }
  const byPond = fade(0.33, 2.65, pondBankDistance(x, z));
  const byPier = fade(1.6, 6.5, Math.hypot(x, Math.max(0, 20.9 - z)));
  let byBuilding = 1;
  for (const [siteX, siteZ] of levelSites) {
    const dx = x - siteX * islandLayoutScale;
    const dz = z - siteZ * islandLayoutScale;
    byBuilding = Math.min(byBuilding, fade(1.75, 4.4, Math.hypot(dx, dz)));
  }
  return Math.max(0, height) * shore * byPond * byPier * byBuilding;
}
