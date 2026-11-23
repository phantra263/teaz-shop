import { BufferGeometry, Color, Float32BufferAttribute, MeshStandardMaterial } from "three";

const boulderProfile = [[-0.24, 0.79], [0.03, 1], [0.38, 0.96], [0.73, 0.74], [0.91, 0.44], [0.98, 0.01]] as const;
const ridgeProfile = [[-0.2, 0.95], [0.01, 1], [0.16, 0.86], [0.29, 0.78], [0.43, 0.55], [0.57, 0.48], [0.72, 0.33], [0.89, 0.21], [1, 0.008]] as const;

export function createIslandStoneMaterial(color = "#ffffff") {
  const material = new MeshStandardMaterial({ color, vertexColors: true, roughness: 0.98 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 stonePosition;\nvarying float stoneHeight;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nstonePosition = (modelMatrix * vec4(position, 1.0)).xyz;\nstoneHeight = position.y;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", /* glsl */ `
      #include <common>
      varying vec3 stonePosition;
      varying float stoneHeight;

      vec2 stoneHash(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        q += dot(q, q.yzx + 33.33);
        return fract((q.xx + q.yz) * q.zy);
      }

      float stoneNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(p));
        return mix(mix(stoneHash(i).x, stoneHash(i + vec2(1.0, 0.0)).x, f.x),
          mix(stoneHash(i + vec2(0.0, 1.0)).x, stoneHash(i + vec2(1.0)).x, f.x), f.y);
      }

      float stoneFissure(vec2 p) {
        vec2 cell = floor(p);
        vec2 local = fract(p);
        float nearest = 8.0;
        float next = 8.0;
        for (int iy = -1; iy <= 1; iy++) {
          for (int ix = -1; ix <= 1; ix++) {
            vec2 neighbor = vec2(float(ix), float(iy));
            vec2 delta = neighbor + 0.13 + stoneHash(cell + neighbor) * 0.74 - local;
            float distanceSquared = dot(delta, delta);
            next = min(next, max(nearest, distanceSquared));
            nearest = min(nearest, distanceSquared);
          }
        }
        return next - nearest;
      }
    `)
      .replace("#include <color_fragment>", /* glsl */ `
        #include <color_fragment>
        vec2 mineral = vec2(stonePosition.x + stonePosition.z * 0.56, stonePosition.y - stonePosition.z * 0.62);
        vec2 warped = mineral + vec2(stoneNoise(mineral * 1.35 + 4.0), stoneNoise(mineral * 2.15 - 9.0)) * 0.36;
        float baseMottle = stoneNoise(warped * 1.17) * 0.64 + stoneNoise(warped * 3.53) * 0.36;
        float grainFade = 1.0 - smoothstep(0.09, 0.29, length(fwidth(mineral)));
        float chip = stoneNoise(warped * 13.3 + 8.2);
        float fissure = stoneFissure(warped * vec2(1.18, 1.72));
        float fractureEdge = 1.0 - smoothstep(0.022, 0.085 + 0.4 * length(fwidth(warped)), fissure);
        float fracture = fractureEdge * smoothstep(0.43, 0.69, stoneNoise(warped * 2.6 + 3.7)) * grainFade;
        float moss = smoothstep(0.47, 0.77, baseMottle + chip * 0.1) * smoothstep(0.33, 0.9, stoneHeight) * 0.52;
        vec3 greenStone = diffuseColor.rgb * vec3(0.72, 0.91, 0.65);
        diffuseColor.rgb = mix(diffuseColor.rgb, greenStone, moss);
        diffuseColor.rgb *= 0.83 + baseMottle * 0.33 + (chip - 0.5) * 0.16 * grainFade - fracture * 0.39;
      `);
  };
  return material;
}

export function createIslandStone(seed: number, ridge = false) {
  const geometry = new BufferGeometry();
  const profile = ridge ? ridgeProfile : boulderProfile;
  const segments = ridge ? 34 : 24;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const shadow = new Color(ridge ? "#47677c" : "#42535a");
  const quartz = new Color(ridge ? "#9daeb5" : "#c5c1a9");
  const moss = new Color(ridge ? "#719771" : "#6a864e");
  const tint = new Color();

  profile.forEach(([height, radius], layer) => {
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2;
      const fold = Math.cos(angle * 5 + seed + height * 0.5) * 0.16 + Math.sin(angle * 3 - seed * 0.73) * 0.18;
      const grit = Math.sin(angle * 11 + layer * 2.2 + seed) * 0.064;
      const r = radius * (1 + fold + grit);
      const tilt = height * (ridge ? 0.35 : 0.12);
      const y = height + radius * (0.06 * Math.sin(angle * 3 + seed) + 0.045 * Math.cos(angle * 8 + layer * 1.85));
      positions.push(Math.cos(angle) * r + Math.cos(seed) * tilt, y, Math.sin(angle) * r + Math.sin(seed) * tilt);
      const marbling = Math.sin(angle * 4.8 + height * 4.7 + seed) * Math.cos(height * 8.2 - angle * 3.3) * 0.13;
      tint.copy(shadow).lerp(quartz, Math.max(0.1, Math.min(0.92, 0.49 + y * 0.37 + marbling + fold * 0.56)));
      const mossPatch = (0.5 + 0.5 * Math.sin(angle * 2.4 + seed + height * 3.2)) ** 2;
      tint.lerp(moss, mossPatch * (ridge ? Math.max(0, 0.72 - y) : Math.max(0, y * 0.83)));
      colors.push(tint.r, tint.g, tint.b);
      if (layer === 0) continue;
      const current = layer * segments + segment;
      const next = layer * segments + (segment + 1) % segments;
      indices.push(current - segments, current, next - segments, next - segments, current, next);
    }
  });

  const last = (profile.length - 1) * segments;
  for (let segment = 1; segment < segments - 1; segment++) indices.push(last, last + segment + 1, last + segment);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
