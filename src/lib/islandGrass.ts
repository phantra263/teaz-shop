import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, Object3D,
  ShaderMaterial, UniformsLib, UniformsUtils, Vector2, type Vector3,
} from "three";
import { islandWindShader } from "./islandWind";
import { islandElevation, islandGround, islandLayoutScale, islandPond, pondDistance } from "./islandTerrain";
import type { FlowerPatch } from "./islandForestFloor";

export function createIslandGrass(
  pathPoints: readonly Vector3[],
  clearings: readonly (readonly [number, number, number, number])[],
  trees: readonly (readonly [number, number])[],
  beds: readonly Vector3[],
  accents: readonly FlowerPatch[],
) {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const heights: number[] = [];
  const faces: number[] = [];
  for (let blade = 0; blade < 3; blade++) {
    const angle = blade * Math.PI * 2 / 3;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const height = blade === 0 ? 1 : 0.72;
    const start = positions.length / 3;
    for (const [level, width, lean] of [[0, 0.082, 0.075], [0.51, 0.056, 0.15], [1, 0, 0.31]]) {
      for (const side of width ? [-1, 1] : [0]) {
        positions.push(dx * lean - dz * width * side, level * height, dz * lean + dx * width * side);
        heights.push(level);
      }
    }
    faces.push(start, start + 1, start + 2, start + 1, start + 3, start + 2, start + 2, start + 3, start + 4);
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("bladeHeight", new Float32BufferAttribute(heights, 1));
  geometry.setIndex(faces);

  const material = new ShaderMaterial({
    side: DoubleSide,
    fog: true,
    lights: true,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      UniformsLib.lights,
      { time: { value: 0 }, wind: { value: 0 }, traveler: { value: new Vector2() } },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      #include <shadowmap_pars_vertex>
      attribute float bladeHeight;
      uniform float time;
      uniform float wind;
      uniform vec2 traveler;
      varying vec3 grassColor;
      ${islandWindShader}

      void main() {
        vec3 root = instanceMatrix[3].xyz;
        vec4 point = instanceMatrix * vec4(position, 1.0);
        vec2 away = root.xz - traveler;
        float distanceToTraveler = length(away);
        float nearby = 1.0 - smoothstep(0.19, 0.85, distanceToTraveler);
        float gust = islandWindGust(time, root.xz);
        float flutter = sin(time * 4.6 - dot(root.xz, vec2(1.5, 1.2)));
        float reach = instanceMatrix[1].y;
        vec2 breeze = reach * vec2(0.18 + gust * 1.27 + flutter * 0.24, 0.08 + gust * 0.42);
        point.xz += (breeze + away / max(distanceToTraveler, 0.01) * nearby * 0.27) * bladeHeight * bladeHeight * wind;
        grassColor = instanceColor * (mix(0.56, 1.12, bladeHeight) + gust * wind * bladeHeight * 0.27);
        vec4 mvPosition = modelViewMatrix * point;
        vec4 worldPosition = modelMatrix * point;
        worldPosition.y += 0.04;
        gl_Position = projectionMatrix * mvPosition;
        #include <shadowmap_vertex>
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform bool receiveShadow;
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      varying vec3 grassColor;

      void main() {
        gl_FragColor = vec4(grassColor * mix(vec3(0.58, 0.68, 0.72), vec3(1.0), getShadowMask()), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });

  const meadowCount = Math.round(8800 * islandLayoutScale ** 2);
  const mesh = new InstancedMesh(geometry, material, meadowCount + accents.length * 72);
  mesh.receiveShadow = true;
  const tuft = new Object3D();
  const shades = ["#476f40", "#64984d", "#86ac52", "#b0c56e", "#a3b95b"].map((color) => new Color(color));
  const grassTone = new Color();
  let seed = 4891;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  let planted = 0;
  for (let index = 0; index < mesh.count; index++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    const accent = index < meadowCount ? undefined : accents[(index - meadowCount) % accents.length];
    const x = accent ? accent.x + Math.cos(angle) * radius * accent.radius * 1.43 : Math.cos(angle) * radius * (islandGround.x - 0.4);
    const z = accent ? accent.z + Math.sin(angle) * radius * accent.radius : Math.sin(angle) * radius * (islandGround.z - 0.35);
    const patch = Math.sin(x * 1.31 + z * 0.44) * Math.cos(z * 1.2 - x * 0.28);
    if (random() > (accent ? 0.91 : 0.64 + patch * 0.33) || Math.hypot(x / (islandGround.x - 0.4), z / (islandGround.z - 0.35)) > 1) continue;
    if (pondDistance(x, z) < islandPond.radius + 0.2) continue;
    if (clearings.some(([cx, cz, width, depth]) => Math.abs(x - cx) < width && Math.abs(z - cz) < depth)) continue;
    if (pathPoints.some((point) => (point.x - x) ** 2 + (point.z - z) ** 2 < 0.43)) continue;
    if (beds.some((point) => (point.x - x) ** 2 + (point.z - z) ** 2 < 0.1)) continue;

    const elevation = islandElevation(x, z);
    const size = accent ? 0.12 + random() * 0.32 : 0.14 + random() * 0.34 + Math.max(0, patch) * 0.13 + Math.min(elevation * 0.021, 0.13);
    tuft.position.set(x, 0.078 + elevation, z);
    tuft.rotation.y = random() * Math.PI * 2;
    tuft.scale.set(size * 1.38, size, size * 1.38);
    tuft.updateMatrix();
    mesh.setMatrixAt(planted, tuft.matrix);
    const uphill = islandElevation(x - 0.23, z + 0.25) - elevation;
    let shade = 0;
    for (const [tx, tz] of trees) {
      const distanceSquared = (x - tx - 0.7) ** 2 + (z - tz + 0.43) ** 2;
      shade = Math.max(shade, 1 - distanceSquared * 0.19);
    }
    grassTone.copy(shades[Math.floor(random() * shades.length)]).multiplyScalar(Math.max(0.63, Math.min(1.21, 1.02 - uphill * 0.76)) * (1 - shade * 0.42));
    mesh.setColorAt(planted, grassTone);
    planted++;
  }
  mesh.count = planted;
  mesh.computeBoundingSphere();
  if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.7;

  return {
    mesh,
    update(time: number, position: Vector3, animated: boolean) {
      material.uniforms.time.value = time;
      material.uniforms.wind.value = animated ? 1 : 0;
      material.uniforms.traveler.value.set(position.x, position.z);
    },
    dispose() {
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
