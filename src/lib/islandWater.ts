import { Color, Mesh, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector2, Vector4 } from "three";
import { islandCoastBase, islandCoastDirections, islandGround } from "./islandTerrain";

export function createIslandWater() {
  const geometry = new PlaneGeometry(260, 260);
  const material = new ShaderMaterial({
    fog: true,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        time: { value: 0 },
        coast: { value: new Vector2(islandGround.x, islandGround.z) },
        coastFeatures: { value: islandCoastDirections.map(({ x, z, depth, sharpness }) => new Vector4(x, z, depth, sharpness)) },
        deepColor: { value: new Color("#407f97") },
        shallowColor: { value: new Color("#83c8b3") },
        glintColor: { value: new Color("#c6e5e3") },
        foamColor: { value: new Color("#e1f2e6") },
      },
    ]),
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
      uniform vec4 coastFeatures[${islandCoastDirections.length}];
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
        float coastRadius = ${islandCoastBase};
        float coastSlope = 0.0;
        for (int i = 0; i < ${islandCoastDirections.length}; i++) {
          vec4 feature = coastFeatures[i];
          float lobe = feature.z * exp(feature.w * (dot(direction, feature.xy) - 1.0));
          coastRadius += lobe;
          coastSlope += lobe * feature.w * dot(tangent, feature.xy);
        }
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
      geometry.dispose();
      material.dispose();
    },
  };
}
