import { Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, Mesh, PlaneGeometry, RepeatWrapping, ShaderMaterial, UniformsLib, UniformsUtils, Vector2, Vector3 } from "three";
import { islandCoastRadius, islandGround } from "./islandTerrain";
import { islandSunDirection } from "./islandSky";

const coastSamples = 512;
const waterLevel = -1.58;

function createCoastProfile() {
  const step = Math.PI * 2 / coastSamples;
  const radii = Array.from({ length: coastSamples }, (_, i) => islandCoastRadius(Math.cos(i * step), Math.sin(i * step)));
  const data = new Uint8Array(coastSamples * 4);
  for (let i = 0; i < coastSamples; i++) {
    const slope = (radii[(i + 1) % coastSamples] - radii[(i + coastSamples - 1) % coastSamples]) / (2 * step);
    // Pack radius [0, 2] and angular slope [-2, 2] into two bytes each.
    const radiusBits = Math.round(radii[i] * 32767.5);
    const slopeBits = Math.round((Math.max(-2, Math.min(2, slope)) + 2) * 16383.75);
    data.set([radiusBits >> 8, radiusBits & 255, slopeBits >> 8, slopeBits & 255], i * 4);
  }
  const texture = new DataTexture(data, coastSamples, 1);
  texture.wrapS = RepeatWrapping;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createRippleTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const waves = [
    [3, 8, 0.4, 0.18], [8, 11, 2.2, 0.17], [-6, 7, 4.1, 0.16],
    [12, 15, 1.3, 0.12], [-8, 13, 3.4, 0.11], [11, 19, 5.3, 0.09],
    [-9, 21, 2.6, 0.07], [12, 25, 0.8, 0.06], [15, -8, 4.5, 0.10],
  ].map(([x, z, phase, amplitude]) => {
    const length = Math.hypot(x, z);
    return { x, z, phase, amplitude, dx: amplitude * x / length, dz: amplitude * z / length };
  });
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      let slopeX = 0;
      let slopeZ = 0;
      let height = 0;
      for (const wave of waves) {
        const phase = (wave.x * x + wave.z * z) * 2 * Math.PI / size + wave.phase;
        const slope = Math.cos(phase);
        slopeX += slope * wave.dx;
        slopeZ += slope * wave.dz;
        height += Math.sin(phase) * wave.amplitude;
      }
      const offset = (z * size + x) * 4;
      data[offset] = Math.round(127.5 * (1 + slopeX));
      data[offset + 1] = Math.round(127.5 * (1 + slopeZ));
      data[offset + 2] = Math.round(127.5 * (1 + Math.max(-1, Math.min(1, height))));
      data[offset + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createIslandWater() {
  const geometry = new PlaneGeometry(380, 380);
  const coastProfile = createCoastProfile();
  const ripples = createRippleTexture();
  const material = new ShaderMaterial({
    fog: true,
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.fog),
      time: { value: 0 },
      coast: { value: new Vector2(islandGround.x, islandGround.z) },
      coastProfile: { value: coastProfile },
      ripples: { value: ripples },
      pier: { value: new Vector3() },
      boatHull: { value: new Vector3() },
      deepColor: { value: new Color("#16698f") },
      shallowsColor: { value: new Color("#39a9a3") },
      sandColor: { value: new Color("#81baa3") },
      foamColor: { value: new Color("#dbfaf0") },
      sunDirection: { value: islandSunDirection },
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 waterPosition;
      varying vec3 waterView;

      void main() {
        vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        waterPosition = worldPosition.xz;
        waterView = cameraPosition - worldPosition;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      varying vec2 waterPosition;
      varying vec3 waterView;
      uniform float time;
      uniform vec2 coast;
      uniform sampler2D coastProfile;
      uniform sampler2D ripples;
      uniform vec3 pier;
      uniform vec3 boatHull;
      uniform vec3 deepColor;
      uniform vec3 shallowsColor;
      uniform vec3 sandColor;
      uniform vec3 foamColor;
      uniform vec3 sunDirection;

      float pierReflection(vec2 p, vec3 ray) {
        float deckT = pier.z / ray.y;
        vec2 deck = p + ray.xz * deckT;
        float boards = step(abs(deck.x), 1.10) * step(pier.x, deck.y) * step(deck.y, pier.y);
        float post = 0.0;
        for (int side = 0; side < 2; side++) {
          float x = side == 0 ? -0.94 : 0.94;
          float rayX = abs(ray.x) > 0.001 ? ray.x : 0.001;
          float t = (x - p.x) / rayX;
          float z = p.y + ray.z * t;
          float column = abs(fract((z - pier.x) / 1.08 + 0.5) - 0.5);
          float edge = max(0.05, abs(ray.z / rayX) * 0.075);
          post = max(post, step(0.0, t) * step(t, deckT)
            * step(pier.x - 0.09, z) * step(z, pier.y + 0.09)
            * (1.0 - smoothstep(edge, edge + 0.075, column)));
        }
        return max(boards * 0.70, post);
      }

      void main() {
        vec2 p = waterPosition;
        vec2 ellipse = p / coast;
        float radius = max(length(ellipse), 0.0001);
        vec2 direction = ellipse / radius;
        vec2 tangent = vec2(-direction.y, direction.x);
        float angle = radius > 0.0001 ? atan(direction.y, direction.x) : 0.0;
        float sampleX = angle * 0.159154943 + 0.5 / ${coastSamples.toFixed(1)};
        vec4 profile = texture2D(coastProfile, vec2(sampleX, 0.5));
        // Each pair of channels contains one linearly interpolated 16-bit value.
        vec2 unpack = vec2(256.0, 1.0) / 257.0;
        float coastRadius = dot(profile.rg, unpack) * 2.0;
        float coastSlope = dot(profile.ba, unpack) * 4.0 - 2.0;
        vec2 coastGradient = (direction - tangent * coastSlope / radius) / coast;
        float shore = (radius - coastRadius) / max(length(coastGradient), 0.0001);
        vec2 drift = sin(vec2(p.x + p.y * 0.41, p.y - p.x * 0.72) * 0.18 + time * 0.09);
        vec3 swell = texture2D(ripples, p * 0.048 + drift * 0.037 + time * vec2(0.009, -0.014)).rgb * 2.0 - 1.0;
        mat2 rotation = mat2(0.57, 0.82, -0.82, 0.57);
        vec3 chop = texture2D(ripples, rotation * p * 0.105 + vec2(0.38, 0.27) + swell.rg * 0.017 - time * vec2(0.019, 0.012)).rgb * 2.0 - 1.0;
        vec2 slope = swell.rg * 0.24 + chop.rg * rotation * 0.18;
        vec3 normal = normalize(vec3(-slope.x, 1.0, -slope.y));
        vec3 sight = normalize(waterView);
        float angleToSurface = 1.0 - clamp(dot(normal, sight), 0.0, 1.0);
        float fresnel = angleToSurface * angleToSurface * angleToSurface;
        float depth = max(0.0, shore + swell.b * 0.62 + chop.b * 0.36);
        float shelf = 1.0 - smoothstep(0.7, 6.4, depth);
        float sand = 1.0 - smoothstep(0.05, 2.05, depth);
        vec3 color = mix(deepColor, shallowsColor, shelf);
        color = mix(color, sandColor, sand * 0.76);
        float lightThroughWater = (1.0 - smoothstep(0.025, 0.155, abs(swell.b + chop.b * 0.46))) * sand;
        color *= 1.0 + swell.b * 0.22 + chop.b * 0.14 + lightThroughWater * 0.23;

        vec3 reflected = reflect(-sight, normal);
        float skyLight = smoothstep(-0.12, 0.57, reflected.y + swell.b * 0.16);
        color = mix(color, vec3(0.33, 0.53, 0.70), (0.10 + skyLight * 0.44) * fresnel);
        vec3 halfVector = normalize(sight + sunDirection + vec3(0.0, 0.0001, 0.0));
        float sparkle = pow(max(0.0, dot(normal, halfVector)), 94.0);
        color = mix(color, vec3(0.90, 0.92, 0.84), sparkle * (0.09 + 0.36 * smoothstep(0.11, 0.52, chop.b)));
        color += vec3(0.06, 0.12, 0.14) * smoothstep(0.32, 0.69, swell.b + chop.b * 0.83) * (0.42 + fresnel * 0.58);

        if (abs(p.x) < 8.5 && p.y > pier.x - 5.0 && p.y < pier.y + 8.5 && reflected.y > 0.025) {
          vec2 origin = p + vec2(chop.r, swell.g) * 0.17;
          float structure = pierReflection(origin, reflected);
          vec2 hull = origin + reflected.xz * (boatHull.z / reflected.y) - boatHull.xy;
          float vessel = 1.0 - smoothstep(0.68, 1.04, length(hull / vec2(0.66, 1.48)));
          float strength = 0.21 + fresnel * 0.23;
          color = mix(color, vec3(0.053, 0.069, 0.056), structure * strength);
          color = mix(color, vec3(0.19, 0.10, 0.058), vessel * strength);
        }

        float lace = smoothstep(0.05, 0.51, swell.b + chop.b * 0.67);
        float wash = shore + swell.b * 0.31 + chop.b * 0.20 - 0.20 - sin(time * 0.76 + angle * 4.0) * 0.15;
        float foam = (1.0 - smoothstep(0.045, 0.28, abs(wash))) * lace;
        color = mix(color, foamColor, foam * 0.58);

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = waterLevel;

  return {
    mesh,
    setPier(start: number, end: number, deckHeight: number) {
      material.uniforms.pier.value.set(start, end, deckHeight - waterLevel);
    },
    update(time: number, boat: Vector3) {
      material.uniforms.time.value = time;
      material.uniforms.boatHull.value.set(boat.x, boat.z, boat.y - waterLevel + 0.12);
    },
    dispose() {
      coastProfile.dispose();
      ripples.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
