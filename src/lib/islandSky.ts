import {
  BackSide, Color, Group, Mesh, ShaderMaterial, SphereGeometry,
} from "three";
import { createIslandStone, createIslandStoneMaterial } from "./islandStone";

export function createIslandSky() {
  const domeGeometry = new SphereGeometry(130, 32, 16);
  const domeMaterial = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      zenith: { value: new Color("#619cce") },
      horizon: { value: new Color("#c0e2ea") },
      cloud: { value: new Color("#fff5e1") },
    },
    vertexShader: /* glsl */ `
      varying vec3 skyDirection;

      void main() {
        skyDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform vec3 zenith;
      uniform vec3 horizon;
      uniform vec3 cloud;
      varying vec3 skyDirection;

      float hash(vec2 point) {
        vec3 domain = fract(vec3(point.xyx) * 0.1031);
        domain += dot(domain, domain.yzx + 33.33);
        return fract((domain.x + domain.y) * domain.z);
      }

      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 blend = smoothstep(vec2(0.0), vec2(1.0), fract(point));
        return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
          mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), blend.x), blend.y);
      }

      void main() {
        vec3 direction = normalize(skyDirection);
        float height = max(0.0, direction.y);
        vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.68, height));
        vec2 p = direction.xz * (3.0 / (height + 0.37));
        p.x += time * 0.017;
        p += vec2(noise(p * 0.67 + 3.1), noise(p * 0.57 - 4.4)) * 0.77;
        float layers = noise(p) * 0.58 + noise(p * 2.04 + 5.8) * 0.28 + noise(p * 4.13 - 4.1) * 0.14;
        float clouds = smoothstep(0.47, 0.73, layers) * smoothstep(0.008, 0.105, height);
        color = mix(color, cloud, clouds * 0.94);
        float glow = pow(max(0.0, dot(direction, normalize(vec3(-0.66, 0.42, -0.79)))), 18.0);
        color = mix(color, cloud, glow * 0.35);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const dome = new Mesh(domeGeometry, domeMaterial);
  dome.renderOrder = -100;
  dome.frustumCulled = false;
  const cliffs = new Group();
  const ridges = [0.8, 1.9, 3.1, 4.7, 6.2].map((seed) => createIslandStone(seed, true));
  const stone = createIslandStoneMaterial("#c8d6e5");
  const green = createIslandStoneMaterial("#96b8a0");

  const stacks = [[-56, -48, 15, 13, 11], [-43, -56, 16, 23, 11], [-29, -58, 14, 16, 12], [-16, -67, 15, 18, 12], [5, -68, 16, 14, 11], [24, -61, 14, 22, 10], [40, -54, 16, 15, 12], [61, -21, 13, 18, 11], [-62, -11, 15, 14, 10], [15, -82, 19, 27, 15], [42, -70, 16, 19, 12]];
  stacks.forEach(([x, z, w, h, d], index) => {
    const peak = new Mesh(ridges[index % ridges.length], stone);
    peak.position.set(x, -2.1, z);
    peak.rotation.y = index * 2.17;
    peak.scale.set(w, h, d);
    cliffs.add(peak);
    for (const side of [-1, 1]) {
      const base = new Mesh(ridges[(index + 1) % ridges.length], green);
      base.position.set(x + side * w * 0.45, -1.95, z + d * 0.54);
      base.rotation.y = index * 1.24 + side * 1.38;
      base.scale.set(w * 0.78, h * (side < 0 ? 0.41 : 0.55), d * 0.94);
      cliffs.add(base);
    }
  });

  return {
    dome,
    cliffs,
    update(time: number) { domeMaterial.uniforms.time.value = time; },
    dispose() {
      domeGeometry.dispose();
      domeMaterial.dispose();
      ridges.forEach((geometry) => geometry.dispose());
      stone.dispose();
      green.dispose();
    },
  };
}
