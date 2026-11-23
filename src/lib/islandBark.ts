import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, MeshStandardMaterial, Vector3 } from "three";

export function createIslandBarkMaterial() {
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.96 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 barkPosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nbarkPosition = position;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 barkPosition;")
      .replace("#include <color_fragment>", /* glsl */ `
        #include <color_fragment>
        vec3 bark = barkPosition;
        float grain = bark.x * 43.0 + bark.z * 38.0 + sin(bark.z * 9.0 - bark.y * 2.8) * 2.4;
        float groove = smoothstep(0.62, 0.96, cos(grain + sin(bark.y * 5.8 + bark.x * 14.0)));
        float detail = 1.0 - smoothstep(0.34, 1.45, fwidth(grain));
        diffuseColor.rgb *= 1.0 + detail * (0.073 * sin(grain * 1.3 + bark.y * 18.0) - 0.29 * groove);
      `);
  };
  return material;
}

export function createIslandBark(points: readonly (readonly [number, number, number])[], base: number, tip: number, seed: number, broadleaf = false) {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
  const rings = base > 0.11 ? 17 : 10;
  const sides = base > 0.11 ? 16 : 10;
  const { normals, binormals } = curve.computeFrenetFrames(rings, false);
  const positions: number[] = [];
  const colors: number[] = [];
  const triangles: number[] = [];
  const point = new Vector3();
  const center = new Vector3();
  const bark = new Color(broadleaf ? "#8e8064" : "#907057");
  const dark = new Color(broadleaf ? "#515748" : "#513f35");
  const moss = new Color(broadleaf ? "#617450" : "#65704a");
  const color = new Color();

  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    curve.getPointAt(t, center);
    const radius = tip + (base - tip) * (1 - t) ** 1.17;
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const ridges = Math.sin(angle * 6 + t * 2.7 + seed) * 0.38 + Math.cos(angle * 3 - t * 1.6) * 0.44 + Math.sin(angle * 11 + t * 3.2) * 0.18;
      const width = radius * (1 + ridges * 0.16);
      point.copy(center).addScaledVector(normals[ring], Math.cos(angle) * width).addScaledVector(binormals[ring], Math.sin(angle) * width);
      positions.push(point.x, point.y, point.z);
      const flecks = Math.sin(t * 39 + angle * 7 + seed) * 0.12;
      color.copy(bark).lerp(dark, Math.max(0, Math.min(1, 0.49 + ridges * 0.38 + flecks)));
      color.lerp(moss, (1 - t) ** 3 * (0.27 + 0.24 * Math.sin(angle * 2 + seed)));
      colors.push(color.r, color.g, color.b);
      if (ring === rings) continue;
      const current = ring * sides + side;
      const next = ring * sides + (side + 1) % sides;
      triangles.push(current, next, current + sides, next, next + sides, current + sides);
    }
  }

  for (let side = 1; side < sides - 1; side++) {
    const end = rings * sides;
    triangles.push(0, side + 1, side, end, end + side, end + side + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}
