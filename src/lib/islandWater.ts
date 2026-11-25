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

function createNoiseField(columns: number, rows: number) {
  const values = Float32Array.from({ length: columns * rows }, () => Math.random() * 2 - 1);
  return (u: number, v: number) => {
    const x = u * columns;
    const z = v * rows;
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const blendX = fx * fx * (3 - 2 * fx);
    const blendZ = fz * fz * (3 - 2 * fz);
    const a = iz * columns;
    const b = (iz + 1) % rows * columns;
    const next = (ix + 1) % columns;
    const front = values[a + ix] * (1 - blendX) + values[a + next] * blendX;
    const back = values[b + ix] * (1 - blendX) + values[b + next] * blendX;
    return front * (1 - blendZ) + back * blendZ;
  };
}

function createRippleTexture() {
  const size = 256;
  const height = new Float32Array(size * size);
  const data = new Uint8Array(height.length * 4);
  const ridges = createNoiseField(19, 46);
  const windChop = createNoiseField(47, 88);
  const gusts = createNoiseField(13, 11);
  const encode = (value: number) => Math.round(127.5 * (1 + Math.max(-1, Math.min(1, value))));

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = z / size;
      height[z * size + x] = ridges(u, v) * 0.67 + windChop(u, v) * 0.33;
    }
  }
  // Store uneven surface slopes, elevation, and a broad wind field in one mipmapped texture.
  for (let z = 0; z < size; z++) {
    const above = (z + size - 1) % size * size;
    const below = (z + 1) % size * size;
    for (let x = 0; x < size; x++) {
      const index = z * size + x;
      const row = z * size;
      const slopeX = height[row + (x + 1) % size] - height[row + (x + size - 1) % size];
      const slopeZ = height[below + x] - height[above + x];
      data[index * 4] = encode(slopeX * 3.1);
      data[index * 4 + 1] = encode(slopeZ * 2.1);
      data[index * 4 + 2] = encode(height[index]);
      data[index * 4 + 3] = encode(gusts(x / size, z / size));
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
        vec4 field = texture2D(ripples, p * 0.0042 + time * vec2(0.0008, -0.0011)) * 2.0 - 1.0;
        vec2 shift = vec2(field.a, field.b) * 0.068;
        float wind = smoothstep(-0.48, 0.62, field.a);
        vec3 swell = texture2D(ripples, p * 0.036 + shift + time * vec2(0.006, -0.013)).rgb * 2.0 - 1.0;
        mat2 rotation = mat2(0.57, 0.82, -0.82, 0.57);
        vec3 chop = texture2D(ripples, rotation * p * 0.076 - shift.yx + vec2(0.38, 0.27) + swell.rg * 0.009 - time * vec2(0.018, 0.013)).rgb * 2.0 - 1.0;
        vec2 slope = swell.rg * 0.16 + chop.rg * rotation * mix(0.045, 0.12, wind);
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
        color *= 1.0 + field.a * 0.075 + swell.b * 0.16 + chop.b * 0.09 + lightThroughWater * 0.20;

        vec3 reflected = reflect(-sight, normal);
        float skyLight = smoothstep(-0.12, 0.57, reflected.y + swell.b * 0.16);
        color = mix(color, vec3(0.33, 0.53, 0.70), (0.10 + skyLight * 0.44) * fresnel);
        vec3 halfVector = normalize(sight + sunDirection + vec3(0.0, 0.0001, 0.0));
        float sparkle = pow(max(0.0, dot(normal, halfVector)), 94.0);
        float glint = smoothstep(-0.05, 0.65, chop.b + field.a * 0.28);
        color = mix(color, vec3(0.90, 0.92, 0.84), sparkle * (0.07 + 0.23 * glint));

        if (abs(p.x) < 8.5 && p.y > pier.x - 5.0 && p.y < pier.y + 8.5 && reflected.y > 0.025) {
          vec2 origin = p + vec2(chop.r, swell.g) * 0.17;
          float structure = pierReflection(origin, reflected);
          vec2 hull = origin + reflected.xz * (boatHull.z / reflected.y) - boatHull.xy;
          float vessel = 1.0 - smoothstep(0.68, 1.04, length(hull / vec2(0.66, 1.48)));
          float strength = 0.21 + fresnel * 0.23;
          color = mix(color, vec3(0.053, 0.069, 0.056), structure * strength);
          color = mix(color, vec3(0.19, 0.10, 0.058), vessel * strength);
        }

        float lace = smoothstep(-0.13, 0.5, swell.b + chop.b * 0.56 + field.a * 0.18);
        float wash = shore + swell.b * 0.35 + chop.b * 0.18 - 0.22 + field.a * 0.18;
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
