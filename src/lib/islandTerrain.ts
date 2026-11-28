export const islandLayoutScale = 1.85;
export const islandGround = { x: 20 * islandLayoutScale, z: 14 * islandLayoutScale };
export const islandBounds = { x: islandGround.x * 1.30, z: islandGround.z * 1.38 };
export const islandMarket = { x: -5.3 * islandLayoutScale, z: 2.7 * islandLayoutScale };
export const islandPond = { x: 15.1 * islandLayoutScale, z: -4.3 * islandLayoutScale, radius: 3.2 };
export const islandLandRadius = 0.972;

// Angles on the normalized terrain ellipse, followed by the depth and sharpness of each cove or headland.
export const islandCoastFeatures = [
  [0.39, -0.13, 24],
  [0.77, 0.32, 8],
  [1.05, 0.055, 11],
  [1.6, -0.09, 20],
  [2.21, -0.24, 14],
  [2.78, 0.30, 8],
  [3.45, -0.075, 18],
  [4.02, 0.053, 11],
  [4.57, -0.29, 18],
  [5.17, 0.055, 11],
  [5.36, -0.16, 38],
  [6.04, 0.042, 24],
] as const;
export const islandCoastBase = 0.957;
export const islandCoastDirections = islandCoastFeatures.map(([angle, depth, sharpness]) => ({
  x: Math.cos(angle), z: Math.sin(angle), depth, sharpness,
}));

export function islandCoastRadius(dx: number, dz: number) {
  let radius = islandCoastBase;
  for (const feature of islandCoastDirections) {
    radius += feature.depth * Math.exp(feature.sharpness * (dx * feature.x + dz * feature.z - 1));
  }
  return radius;
}

export function islandCoastPoint(angle: number, fraction = 1) {
  const dx = Math.cos(angle);
  const dz = Math.sin(angle);
  const radius = islandCoastRadius(dx, dz) * fraction;
  return { x: dx * islandGround.x * radius, z: dz * islandGround.z * radius };
}

export function islandCoastRatio(x: number, z: number) {
  const dx = x / islandGround.x;
  const dz = z / islandGround.z;
  const radius = Math.hypot(dx, dz);
  return radius === 0 ? 0 : radius / islandCoastRadius(dx / radius, dz / radius);
}

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
  [-31, 8, 8, 6.5, 4.8], [22, 20, 6.8, 5, 4.9], [-25, -8, 9, 5.8, 2.6],
  [-10, -15.5, 10, 7, 7.2], [15, -15.5, 10, 6.4, 5.9], [32, 9, 6, 5, 3.8],
] as const;
const levelSites = [[-6.3, -4.45], [2.8, -5.95]] as const;

export function islandElevation(x: number, z: number) {
  const coast = islandCoastRatio(x, z);
  const shore = 1 - fade(0.75, islandLandRadius, coast);
  if (shore === 0) return 0;

  let height = 0.37 + Math.sin(x * 0.23 - z * 0.18) * 0.23 + Math.cos(z * 0.39 + x * 0.14) * 0.17;
  for (const [hx, hz, width, depth, rise] of hills) {
    const dx = (x - hx) / width;
    const dz = (z - hz) / depth;
    height += rise * Math.exp(-1.75 * (dx * dx + dz * dz));
  }
  // Shape the north hillside into broad planting shelves with rounded risers.
  if (x > -14 && x < 5 && z < -6 && z > -21) {
    const field = (1 - fade(4.7, 8.5, Math.abs(x + 4.4))) * (1 - fade(3.4, 7, Math.abs(z + 12.6)));
    const contour = (-9.53 - z + .55 * Math.sin((x + 8.88) / 2.45)) / 1.04;
    const step = Math.floor(contour + .5);
    const shelf = .72 + .34 * (step + fade(.12, .47, contour - step));
    height += (Math.max(.2, shelf) - height) * field;
  }
  const byPond = fade(0.33, 2.65, pondBankDistance(x, z));
  const byPier = fade(1.6, 6.5, Math.hypot(x, Math.max(0, 20.9 - z)));
  // A shared, level terrace covers the counters, approach and camera orbit.
  const marketRadius = Math.hypot((x - islandMarket.x) / 10, (z - islandMarket.z) / 8);
  const studioRadius = Math.hypot((x - 6 * islandLayoutScale) / 12, (z - 2.4 * islandLayoutScale) / 11);
  let byBuilding = Math.min(fade(0.75, 1.5, marketRadius), fade(0.78, 1.46, studioRadius));
  for (const [siteX, siteZ] of levelSites) {
    const dx = x - siteX * islandLayoutScale;
    const dz = z - siteZ * islandLayoutScale;
    byBuilding = Math.min(byBuilding, fade(1.75, 4.4, Math.hypot(dx, dz)));
  }
  return Math.max(0, height) * shore * byPond * byPier * byBuilding;
}
