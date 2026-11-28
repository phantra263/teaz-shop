import {
  BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, ShaderMaterial, UniformsLib, UniformsUtils, Vector4,
} from "three";
import { createIslandStone, createIslandStoneMaterial } from "./islandStone";
import { islandElevation, islandPond, pondRadiusAt } from "./islandTerrain";

export const pondWaterHeight = 0.139;

export function createLotusPond() {
  const group = new Group();
  group.position.set(islandPond.x, 0, islandPond.z);
  const segments = 100;
  const waterGeometry = new BufferGeometry();
  const points = [0, pondWaterHeight, 0];
  const depths = [1];
  const triangles: number[] = [];

  for (let ring = 1; ring <= 10; ring++) {
    for (let index = 0; index < segments; index++) {
      const angle = index * Math.PI * 2 / segments;
      const radius = pondRadiusAt(angle) * ring / 10;
      points.push(Math.cos(angle) * radius, pondWaterHeight, Math.sin(angle) * radius);
      depths.push(1 - ring / 10);
      const vertex = 1 + (ring - 1) * segments + index;
      const next = 1 + (ring - 1) * segments + (index + 1) % segments;
      if (ring === 1) triangles.push(0, next, vertex);
      else triangles.push(vertex - segments, next - segments, vertex, next - segments, next, vertex);
    }
  }
  waterGeometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  waterGeometry.setAttribute("depthFromBank", new Float32BufferAttribute(depths, 1));
  waterGeometry.setIndex(triangles);

  const waterMaterial = new ShaderMaterial({
    fog: true,
    uniforms: UniformsUtils.merge([UniformsLib.fog, {
      time: { value: 0 }, silver: { value: new Color("#c0e4d8") }, shoal: { value: new Color("#7aaea0") }, deep: { value: new Color("#245e64") },
      swimmers: { value: Array.from({ length: 3 }, () => new Vector4()) },
    }]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      attribute float depthFromBank;
      varying float shoreDepth;
      varying vec2 waterPoint;
      varying vec3 viewDelta;
      void main() {
        shoreDepth = depthFromBank;
        waterPoint = position.xz;
        viewDelta = cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform float time;
      uniform vec3 silver;
      uniform vec3 shoal;
      uniform vec3 deep;
      uniform vec4 swimmers[3]; // Pond-local xz and forward velocity.
      varying float shoreDepth;
      varying vec2 waterPoint;
      varying vec3 viewDelta;
      void main() {
        vec2 p = waterPoint;
        float drift = sin(dot(p, vec2(2.6, -2.1)) + time * 0.76);
        float swell = sin(dot(p, vec2(3.3, 4.1)) + drift * 0.61 - time * 1.08);
        float ripple = sin(dot(p, vec2(9.8, 7.8)) - time * 1.47 + swell * 0.87);
        float fractured = smoothstep(0.38, 0.98, sin(dot(p, vec2(-4.9, 4.2)) + drift));
        float depth = smoothstep(0.025, 0.71, shoreDepth + drift * 0.022);
        vec3 color = mix(shoal, deep, depth) * (1.0 + swell * 0.072);
        float wake = 0.0;
        float contact = 0.0;
        for (int i = 0; i < 3; i++) {
          vec2 offset = p - swimmers[i].xy;
          float speed = length(swimmers[i].zw);
          vec2 forward = swimmers[i].zw / max(speed, 0.001);
          float aft = -dot(offset, forward);
          float side = abs(dot(offset, vec2(forward.y, -forward.x)));
          float crest = side - (0.13 + aft * 0.34);
          wake += exp(-abs(crest) * 30.0) * smoothstep(0.0, 0.23, aft)
            * (1.0 - smoothstep(0.35, 1.45, aft)) * smoothstep(0.03, 0.65, speed)
            * (0.7 + 0.3 * sin(aft * 23.0 - time * 3.2));
          contact = max(contact, exp(-dot(offset, offset) * 15.0));
        }
        vec3 normal = normalize(vec3(.055 * drift + .027 * ripple, 1.0, .048 * swell - .02 * ripple));
        vec3 view = normalize(viewDelta);
        vec3 reflected = reflect(-view, normal);
        float fresnel = .06 + .82 * pow(1.0 - clamp(dot(normal, view), 0.0, 1.0), 3.0);
        float horizon = .16 + .07 * sin(reflected.x * 15.0 + reflected.z * 8.0);
        vec3 sky = mix(vec3(.08,.19,.14), vec3(.58,.75,.79),
          smoothstep(horizon - .08, horizon + .12, reflected.y));
        color = mix(color, sky, fresnel) * (1.0 - contact * .32);
        float glint = pow(max(dot(reflected, normalize(vec3(.42,.55,-.72))), 0.0), 72.0);
        float strand = 1.0 - smoothstep(0.008, 0.037, abs(shoreDepth - 0.042 - sin(time * 1.25 + drift) * 0.017));
        color = mix(color, silver, clamp(glint * .64 + wake * .46 + strand * (.08 + .12 * fractured), 0.0, .85));
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  group.add(new Mesh(waterGeometry, waterMaterial));

  const bankGeometry = new BufferGeometry();
  const bankPositions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const wetSand = new Color("#7c775c");
  const sand = new Color("#c2af7d");
  const moss = new Color("#758b55");
  const shade = new Color();
  for (const [band, offset] of [-0.025, 0.14, 0.32, 0.54].entries()) {
    for (let index = 0; index < segments; index++) {
      const angle = index * Math.PI * 2 / segments;
      const radius = pondRadiusAt(angle) + offset * (1 + Math.sin(angle * 7.3 + 0.5) * 0.23);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = islandElevation(islandPond.x + x, islandPond.z + z) + (band === 0 ? 0.128 : band === 3 ? 0.093 : 0.15);
      bankPositions.push(x, height, z);
      shade.copy(wetSand).lerp(sand, band === 1 ? 0.7 : 0.4).lerp(moss, band === 3 ? 0.83 : 0.13 + 0.14 * Math.sin(angle * 4.1));
      shade.multiplyScalar(0.96 + 0.1 * Math.sin(angle * 19.7 + band));
      colors.push(shade.r, shade.g, shade.b);
      if (band) {
        const vertex = band * segments + index;
        const next = band * segments + (index + 1) % segments;
        indices.push(vertex - segments, next - segments, vertex, next - segments, next, vertex);
      }
    }
  }
  bankGeometry.setAttribute("position", new Float32BufferAttribute(bankPositions, 3));
  bankGeometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  bankGeometry.setIndex(indices);
  bankGeometry.computeVertexNormals();
  const bankMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.94 });
  const bank = new Mesh(bankGeometry, bankMaterial);
  bank.receiveShadow = true;
  group.add(bank);

  const pebbleGeometry = createIslandStone(2.15);
  const pebbleMaterial = createIslandStoneMaterial("#b5c5a4");
  for (let index = 0; index < 24; index++) {
    const angle = index * 2.39996;
    if (Math.sin(angle * 2.8 + 0.2) < -0.28) continue;
    const radius = pondRadiusAt(angle) + 0.29;
    const pebble = new Mesh(pebbleGeometry, pebbleMaterial);
    const size = 0.1 + (index % 5) * 0.035;
    pebble.position.set(Math.cos(angle) * radius, 0.15, Math.sin(angle) * radius);
    pebble.scale.set(size * 1.37, size * 0.62, size);
    pebble.rotation.y = angle;
    pebble.receiveShadow = true;
    group.add(pebble);
  }
  return {
    group,
    update(time: number) { waterMaterial.uniforms.time.value = time; },
    setSwimmer(index: number, x: number, z: number, vx: number, vz: number) {
      waterMaterial.uniforms.swimmers.value[index].set(x, z, vx, vz);
    },
    dispose() {
      [waterGeometry, waterMaterial, bankGeometry, bankMaterial, pebbleGeometry, pebbleMaterial].forEach((resource) => resource.dispose());
    },
  };
}
