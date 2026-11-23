import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, Object3D,
  ShaderMaterial, UniformsLib, UniformsUtils, Vector3, type Group,
} from "three";
import { islandWindShader } from "./islandWind";

export type FoliageCluster = { center: Vector3; spread: Vector3 };

function makeSprig() {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const midribs: number[] = [];
  const triangles: number[] = [];
  const leafShape = [[0, 0, 0], [-0.31, 0.28, -0.012], [-0.26, 0.63, -0.049],
    [0.035, 1, -0.056], [0.27, 0.64, -0.021], [0.31, 0.3, -0.038], [0, 0.48, 0.105]];

  for (let leaf = 0; leaf < 7; leaf++) {
    const side = leaf % 2 ? -1 : 1;
    const along = leaf === 6 ? 0.76 : 0.2 + Math.floor(leaf / 2) * 0.2 + side * 0.035;
    const angle = leaf === 6 ? -0.11 : side * (0.99 - along * 0.39);
    const length = 0.43 - along * 0.13 + Math.sin(leaf * 5.3) * 0.027;
    const start = positions.length / 3;
    const dx = Math.sin(angle);
    const dy = Math.cos(angle);
    for (const [index, [x, y, z]] of leafShape.entries()) {
      positions.push(along * 0.13 + (x * dy + y * dx) * length, along + (y * dy - x * dx) * length,
        z * length + Math.sin(leaf * 2.18) * y * 0.097 + along * along * 0.1);
      midribs.push(index === 6 ? 1 : 0);
    }
    for (let edge = 0; edge < 6; edge++) triangles.push(start + edge, start + 6, start + (edge + 1) % 6);
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("midrib", new Float32BufferAttribute(midribs, 1));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

export function createIslandLeaves() {
  const geometry = makeSprig();
  const material = new ShaderMaterial({
    fog: true,
    lights: true,
    side: DoubleSide,
    uniforms: UniformsUtils.merge([UniformsLib.fog, UniformsLib.lights, { time: { value: 0 }, wind: { value: 0 } }]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      #include <shadowmap_pars_vertex>
      uniform float time;
      uniform float wind;
      attribute float midrib;
      varying vec3 leafColor;
      varying float vein;
      ${islandWindShader}

      void main() {
        vec3 root = (modelMatrix * instanceMatrix[3]).xyz;
        float gust = islandWindGust(time, root.xz);
        float flutter = sin(time * 5.4 + dot(root, vec3(2.4, 6.3, 2.9)));
        vec3 leaf = position;
        leaf.z += flutter * position.y * position.y * wind * (0.15 + gust * 0.28);
        leaf.x += gust * position.y * position.y * wind * 0.26;
        vec3 facing = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        float toSun = dot(facing, normalize(vec3(-0.43, 0.66, 0.49)));
        float sunlit = clamp(abs(toSun) * 0.43 + 0.69, 0.0, 1.18);
        vec3 leafLight = mix(vec3(0.72, 0.91, 1.0), vec3(1.2, 1.16, 0.78), smoothstep(-0.4, 0.85, toSun));
        leafColor = instanceColor * leafLight * (sunlit + position.y * 0.16 + flutter * wind * 0.035);
        vein = midrib;
        vec4 point = instanceMatrix * vec4(leaf, 1.0);
        vec4 mvPosition = modelViewMatrix * point;
        vec4 worldPosition = modelMatrix * point;
        worldPosition.y += 0.045;
        vec3 transformedNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
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
      varying vec3 leafColor;
      varying float vein;

      void main() {
        vec3 light = mix(vec3(0.65, 0.78, 0.78), vec3(1.0), getShadowMask());
        gl_FragColor = vec4(leafColor * light * (0.98 + smoothstep(0.66, 1.0, vein) * 0.13), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });

  const trees: InstancedMesh[] = [];
  const sprig = new Object3D();
  const radial = new Vector3();
  const face = new Vector3();
  const forward = new Vector3(0, 0, 1);
  const shade = new Color();
  const pale = new Color("#c9cf69");

  return {
    plant(branch: Group, clusters: readonly FoliageCluster[], foliageColor: string, sprigScale = 1) {
      const counts = clusters.map(({ spread }) => Math.round(16 + spread.x * 33));
      const mesh = new InstancedMesh(geometry, material, counts.reduce((total, count) => total + count, 0));
      const seed = trees.length * 1.53;
      const base = new Color(foliageColor);
      let instance = 0;

      clusters.forEach(({ center, spread }, cluster) => {
        for (let index = 0; index < counts[cluster]; index++) {
          const y = 1 - 2 * (index + 0.5) / counts[cluster];
          const radius = Math.sqrt(1 - y * y);
          const angle = index * 2.39996 + cluster * 0.91 + seed;
          radial.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
          const scatter = 0.82 + Math.sin(index * 1.74 + seed + cluster) * 0.27;
          sprig.position.copy(radial).multiply(spread).multiplyScalar(scatter).add(center);
          face.copy(radial);
          face.y += 0.36 + Math.sin(index * 3.2) * 0.42;
          face.normalize();
          sprig.quaternion.setFromUnitVectors(forward, face);
          sprig.rotateZ(angle + Math.sin(index * 2.81 + seed) * 1.3);
          const length = (0.28 + 0.14 * (1 + Math.sin(index * 5.68 + seed)) * 0.5) * (cluster ? 1 : 1.12) * sprigScale;
          sprig.scale.set(length * (0.83 + 0.17 * Math.sin(angle)), length, length * 0.9);
          sprig.updateMatrix();
          mesh.setMatrixAt(instance, sprig.matrix);
          const top = (1 + y) * 0.5;
          shade.copy(base).lerp(pale, top * top * 0.22).multiplyScalar(0.66 + top * 0.38 + Math.sin(angle * 3.5) * 0.08);
          mesh.setColorAt(instance++, shade);
        }
      });
      mesh.computeBoundingSphere();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.28;
      branch.add(mesh);
      trees.push(mesh);
    },
    update(time: number, animated: boolean) {
      material.uniforms.time.value = time;
      material.uniforms.wind.value = animated ? 1 : 0;
    },
    dispose() {
      trees.forEach((mesh) => mesh.dispose());
      geometry.dispose();
      material.dispose();
    },
  };
}
