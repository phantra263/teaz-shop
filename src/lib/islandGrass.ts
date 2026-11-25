import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedMesh, Object3D,
  ShaderMaterial, UniformsLib, UniformsUtils, Vector2, type Vector3,
} from "three";
import { islandWindShader } from "./islandWind";
import { islandBounds, islandCoastRatio, islandElevation, islandLandRadius, islandPond, pondBankDistance } from "./islandTerrain";
import type { FlowerPatch } from "./islandForestFloor";

const tileSize = 8;
const tileCells = 24;
const nearDistance = 13;
const farDistance = 34;

export function createIslandGrass(
  pathPoints: readonly Vector3[],
  clearings: readonly (readonly [number, number, number, number])[],
  trees: readonly (readonly [number, number])[],
  beds: readonly Vector3[],
  accents: readonly FlowerPatch[],
  layers: number,
) {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const heights: number[] = [];
  const bladeTones: number[] = [];
  const faces: number[] = [];
  for (let blade = 0; blade < 4; blade++) {
    const angle = blade * 2.39996;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const height = [1.07, 0.82, 0.94, 0.61][blade];
    const start = positions.length / 3;
    for (const [level, width, lean] of [[0, 0.066, 0.045], [0.46, 0.067, 0.13], [1, 0, 0.37 - blade * 0.032]]) {
      for (const side of width ? [-1, 1] : [0]) {
        positions.push(dx * lean - dz * width * side, level * height, dz * lean + dx * width * side);
        heights.push(level);
        bladeTones.push(0.85 + blade * 0.047 + side * 0.08);
      }
    }
    faces.push(start, start + 1, start + 2, start + 1, start + 3, start + 2, start + 2, start + 3, start + 4);
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("bladeHeight", new Float32BufferAttribute(heights, 1));
  geometry.setAttribute("bladeTone", new Float32BufferAttribute(bladeTones, 1));
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
      attribute float bladeTone;
      attribute float densityLayer;
      uniform float time;
      uniform float wind;
      uniform vec2 traveler;
      varying vec3 grassColor;
      ${islandWindShader}

      void main() {
        vec3 root = instanceMatrix[3].xyz;
        float distanceToCamera = length(root.xz - cameraPosition.xz);
        float fade = smoothstep(${nearDistance.toFixed(1)}, ${farDistance.toFixed(1)}, distanceToCamera);
        float coverage = clamp(1.0 + ${Number(layers - 1).toFixed(1)} * (1.0 - fade) - densityLayer, 0.0, 1.0);
        vec3 blade = position;
        blade.xz *= 1.0 + fade * 0.55;
        vec4 point = instanceMatrix * vec4(blade * coverage, 1.0);
        vec2 away = root.xz - traveler;
        float distanceToTraveler = length(away);
        float nearby = 1.0 - smoothstep(0.13, 0.61, distanceToTraveler);
        float gust = islandWindGust(time, root.xz);
        float flutter = sin(time * 4.6 - dot(root.xz, vec2(1.5, 1.2)));
        float reach = instanceMatrix[1].y;
        vec2 breeze = reach * vec2(0.12 + gust * 0.73 + flutter * 0.14, 0.06 + gust * 0.27);
        float tip = bladeHeight * bladeHeight;
        point.xz += (breeze * wind + away / max(distanceToTraveler, 0.01) * nearby * reach * 0.76) * tip * coverage;
        point.y -= nearby * reach * bladeHeight * 0.35 * coverage;
        float stripe = 0.93 + gust * wind * tip * 0.14;
        vec3 tint = mix(vec3(0.47, 0.62, 0.59), vec3(1.27, 1.19, 0.81), pow(bladeHeight, 0.67));
        grassColor = instanceColor * tint * bladeTone * stripe;
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
        gl_FragColor = vec4(grassColor * mix(vec3(0.48, 0.60, 0.68), vec3(1.0), getShadowMask()), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });

  const field = new Group();
  const tiles: { x: number; z: number; mesh: InstancedMesh; ends: number[] }[] = [];
  const tuft = new Object3D();
  const shadedGreen = new Color("#618d44");
  const sunnyGreen = new Color("#a9c85b");
  const grassTone = new Color();
  let seed = 4891;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let minZ = -islandBounds.z; minZ < islandBounds.z; minZ += tileSize) {
    for (let minX = -islandBounds.x; minX < islandBounds.x; minX += tileSize) {
      const x = minX + tileSize * 0.5;
      const z = minZ + tileSize * 0.5;
      const insideTile = (px: number, pz: number, margin: number) => Math.abs(px - x) <= tileSize * 0.5 + margin && Math.abs(pz - z) <= tileSize * 0.5 + margin;
      const nearestX = Math.max(0, Math.abs(x) - tileSize * 0.5);
      const nearestZ = Math.max(0, Math.abs(z) - tileSize * 0.5);
      if (Math.hypot(nearestX / islandBounds.x, nearestZ / islandBounds.z) >= 1) continue;
      const paths = pathPoints.filter((point) => insideTile(point.x, point.z, 0.75));
      const tea = beds.filter((point) => insideTile(point.x, point.z, 0.45));
      const localClearings = clearings.filter(([cx, cz, width, depth]) => insideTile(cx, cz, Math.max(width, depth)));
      const localTrees = trees.filter(([tx, tz]) => insideTile(tx, tz, 3));
      const flowers = accents.filter(({ x: px, z: pz, radius }) => insideTile(px, pz, radius * 0.9));
      const tileGeometry = geometry.clone();
      const capacity = tileCells ** 2 * layers;
      const mesh = new InstancedMesh(tileGeometry, material, capacity);
      const density = new Float32Array(capacity);
      const ends: number[] = [];
      let planted = 0;

      for (let layer = 0; layer < layers; layer++) {
        for (let index = 0; index < tileCells ** 2; index++) {
          const px = minX + (index % tileCells + random()) * tileSize / tileCells;
          const pz = minZ + (Math.floor(index / tileCells) + random()) * tileSize / tileCells;
          if (islandCoastRatio(px, pz) >= islandLandRadius - 0.014) continue;
          if (Math.abs(px - islandPond.x) < 4.65 && Math.abs(pz - islandPond.z) < 4.65 && pondBankDistance(px, pz) < 0.25) continue;
          if (localClearings.some(([cx, cz, width, depth]) => Math.abs(px - cx) < width && Math.abs(pz - cz) < depth)) continue;
          if (paths.some((point) => (point.x - px) ** 2 + (point.z - pz) ** 2 < 0.38)) continue;
          if (tea.some((point) => (point.x - px) ** 2 + (point.z - pz) ** 2 < 0.12)) continue;

          const hill = islandElevation(px, pz);
          const patch = 0.5 + Math.sin(px * 0.54 + pz * 0.66) * Math.cos(pz * 0.58 - px * 0.39) * 0.5;
          const flowerbed = flowers.some(({ x: fx, z: fz, radius }) => (fx - px) ** 2 + (fz - pz) ** 2 < radius * radius * 0.66);
          const size = (0.26 + random() * 0.35 + patch * 0.22 + Math.min(hill * 0.02, 0.12)) * (flowerbed ? 0.65 : 1);
          if (localTrees.some(([tx, tz]) => (tx - px) ** 2 + (tz - pz) ** 2 < 0.085)) continue;
          tuft.position.set(px, 0.065 + hill, pz);
          tuft.rotation.y = random() * Math.PI * 2;
          tuft.scale.set(size * 0.86, size, size * 0.86);
          tuft.updateMatrix();
          mesh.setMatrixAt(planted, tuft.matrix);
          const tint = Math.min(1, Math.max(0.02, patch * 0.52 + random() * 0.28 + hill * 0.027));
          grassTone.copy(shadedGreen).lerp(sunnyGreen, tint).multiplyScalar(0.91 + random() * 0.23);
          mesh.setColorAt(planted, grassTone);
          density[planted++] = layer;
        }
        ends.push(planted);
      }

      if (!planted) {
        tileGeometry.dispose();
        mesh.dispose();
        continue;
      }
      tileGeometry.setAttribute("densityLayer", new InstancedBufferAttribute(density, 1));
      mesh.receiveShadow = true;
      mesh.count = planted;
      mesh.computeBoundingSphere();
      if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.9;
      field.add(mesh);
      tiles.push({ x, z, mesh, ends });
    }
  }

  return {
    mesh: field,
    update(time: number, position: Vector3, animated: boolean, camera: Vector3, layerLimit: number) {
      material.uniforms.time.value = time;
      material.uniforms.wind.value = animated ? 1 : 0;
      material.uniforms.traveler.value.set(position.x, position.z);
      for (const { x, z, mesh, ends } of tiles) {
        if (layerLimit === 1) {
          mesh.count = ends[0];
          continue;
        }
        const distance = Math.hypot(Math.max(0, Math.abs(x - camera.x) - tileSize * 0.5), Math.max(0, Math.abs(z - camera.z) - tileSize * 0.5));
        const t = Math.max(0, Math.min(1, (distance - nearDistance) / (farDistance - nearDistance)));
        const visibleLayers = 1 + (layers - 1) * (1 - t * t * (3 - 2 * t));
        mesh.count = ends[Math.min(layerLimit, Math.ceil(visibleLayers)) - 1];
      }
    },
    dispose() {
      tiles.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.dispose();
      });
      geometry.dispose();
      material.dispose();
    },
  };
}
