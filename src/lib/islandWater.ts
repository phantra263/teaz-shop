import { Color, DataTexture, LinearFilter, Mesh, PlaneGeometry, RepeatWrapping, ShaderMaterial, UniformsLib, UniformsUtils, Vector2 } from "three";
import { islandCoastRadius, islandGround } from "./islandTerrain";

const coastSamples = 512;

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

export function createIslandWater() {
  const geometry = new PlaneGeometry(260, 260);
  const coastProfile = createCoastProfile();
  const material = new ShaderMaterial({
    fog: true,
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.fog),
      time: { value: 0 },
      coast: { value: new Vector2(islandGround.x, islandGround.z) },
      coastProfile: { value: coastProfile },
      deepColor: { value: new Color("#407f97") },
      shallowColor: { value: new Color("#83c8b3") },
      glintColor: { value: new Color("#c6e5e3") },
      foamColor: { value: new Color("#e1f2e6") },
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
      uniform vec3 deepColor;
      uniform vec3 shallowColor;
      uniform vec3 glintColor;
      uniform vec3 foamColor;

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
        float shallows = 1.0 - smoothstep(0.15, 5.65, shore);
        float swell = dot(p, vec2(0.38, 0.63)) - time * 0.53;
        float crossSwell = dot(p, vec2(-0.64, 0.30)) + time * 0.41;
        float drift = sin(dot(p, vec2(0.17, -0.23)) + time * 0.22);
        float ripple = dot(p, vec2(1.37, 1.74)) + sin(crossSwell) * 0.74 + drift * 1.21 - time * 0.79;
        float detail = 1.0 - smoothstep(0.45, 1.45, fwidth(ripple));
        vec2 slope = cos(swell) * vec2(0.038, 0.063) + cos(crossSwell) * vec2(-0.033, 0.019);
        slope += cos(ripple) * vec2(0.010, 0.018) * detail;
        vec3 normal = normalize(vec3(-slope.x, 1.0, -slope.y));
        vec3 sight = normalize(waterView);
        float reflection = pow(1.0 - clamp(dot(normal, sight), 0.0, 1.0), 2.4);
        float glint = smoothstep(0.49, 1.0, cos(ripple)) * (0.32 + 0.68 * smoothstep(-0.6, 1.0, sin(crossSwell) + drift * 0.41));
        vec3 color = mix(deepColor, shallowColor, shallows);
        color *= 1.0 + sin(swell) * 0.029 + sin(crossSwell) * 0.020;
        color = mix(color, glintColor, reflection * 0.25 + glint * detail * mix(0.077, 0.14, shallows));

        float foamPhase = shore * 2.48 + time * 0.75 + drift * 0.46;
        float crest = smoothstep(0.72, 0.98, cos(foamPhase));
        float shoreline = smoothstep(0.04, 0.29, shore) * (1.0 - smoothstep(0.52, 2.3, shore));
        float breaks = smoothstep(-0.55, 0.71, sin(dot(p, vec2(0.71, -0.64)) + drift * 0.94 + time * 0.19));
        float wash = exp(-abs(shore - 0.24) * 4.4) * (0.055 + breaks * 0.057);
        color = mix(color, foamColor, wash + crest * shoreline * (0.045 + breaks * 0.30));

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1.58;

  return {
    mesh,
    update(time: number) { material.uniforms.time.value = time; },
    dispose() {
      coastProfile.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
