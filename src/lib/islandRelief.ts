import { BufferGeometry, Color, Float32BufferAttribute, type Vector3 } from "three";
import { islandElevation, islandGround } from "./islandTerrain";

export function createIslandRelief() {
  const geometry = new BufferGeometry();
  const radialSegments = 192;
  const bands = 88;
  const positions = [0, islandElevation(0, 0) + 0.09, 0];
  const colors = [1, 1, 1];
  const uv = [0.5, 0.5];
  const indices: number[] = [];
  const shade = new Color();
  const grass = new Color("#f5efcf");
  const moss = new Color("#adc5a2");
  const sunlit = new Color("#fff8d5");

  for (let band = 1; band <= bands; band++) {
    const radius = band / bands;
    for (let segment = 0; segment < radialSegments; segment++) {
      const angle = segment / radialSegments * Math.PI * 2;
      const x = Math.cos(angle) * radius * islandGround.x;
      const z = Math.sin(angle) * radius * islandGround.z;
      const elevation = islandElevation(x, z);
      const grain = 0.5 + 0.25 * Math.sin(x * 0.31 + z * 0.21) + 0.25 * Math.cos(x * 0.62 - z * 0.32);
      shade.copy(grass).lerp(moss, grain * 0.61).lerp(sunlit, Math.min(elevation * 0.095, 0.55));
      positions.push(x, elevation + 0.09, z);
      colors.push(shade.r, shade.g, shade.b);
      uv.push(z / islandGround.z * 0.5 + 0.5, x / islandGround.x * 0.5 + 0.5);

      const next = (band - 1) * radialSegments + (segment + 1) % radialSegments + 1;
      const vertex = (band - 1) * radialSegments + segment + 1;
      if (band === 1) indices.push(0, next, vertex);
      else indices.push(vertex - radialSegments, next - radialSegments, vertex, next - radialSegments, next, vertex);
    }
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createIslandTrail(points: readonly Vector3[], style = { width: 0.51, center: "#d3b887", edge: "#a6a36b" }) {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const dirt = new Color(style.center);
  const edge = new Color(style.edge);
  const tint = new Color();
  const sections = [-1, -0.72, 0, 0.72, 1];

  points.forEach(({ x, z }, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    const length = Math.hypot(after.x - before.x, after.z - before.z);
    const width = style.width * (1 + 0.145 * Math.sin(z * 1.7 + x * 0.45));
    sections.forEach((offset, section) => {
      const px = x + (after.z - before.z) / length * width * offset;
      const pz = z - (after.x - before.x) / length * width * offset;
      positions.push(px, 0.153 + islandElevation(px, pz), pz);
      const streak = 0.11 + 0.11 * Math.sin(px * 22 + pz * 11);
      tint.copy(dirt).lerp(edge, Math.abs(offset) ** 4 * 0.66 + streak);
      colors.push(tint.r, tint.g, tint.b);
      if (index === 0 || section === 0) return;
      const vertex = index * sections.length + section;
      indices.push(vertex - 1, vertex, vertex - sections.length, vertex - 1, vertex - sections.length, vertex - sections.length - 1);
    });
  });
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
