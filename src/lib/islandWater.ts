import { Color, Mesh, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector2 } from "three";
import { islandGround } from "./islandTerrain";

export function createIslandWater() {
  const geometry = new PlaneGeometry(260, 260);
  const material = new ShaderMaterial({
    fog: true,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        time: { value: 0 },
        coast: { value: new Vector2(islandGround.x + 0.2, islandGround.z + 0.45) },
        deepColor: { value: new Color("#469d9f") },
        shallowColor: { value: new Color("#84d7b6") },
        glintColor: { value: new Color("#d4f6dd") },
        foamColor: { value: new Color("#effbe5") },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 waterPosition;

      void main() {
        waterPosition = (modelMatrix * vec4(position, 1.0)).xz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      varying vec2 waterPosition;
      uniform float time;
      uniform vec2 coast;
      uniform vec3 deepColor;
      uniform vec3 shallowColor;
      uniform vec3 glintColor;
      uniform vec3 foamColor;

      void main() {
        vec2 p = waterPosition;
        float shore = (length(p / coast) - 1.0) * (coast.y + 1.0);
        shore += 0.12 * sin(p.x * 1.6 + p.y * 0.85);
        float shallows = 1.0 - smoothstep(0.0, 4.5, shore);
        float swell = sin(dot(p, vec2(0.95, 1.75)) - time * 1.35);
        float crossSwell = sin(dot(p, vec2(-1.35, 0.62)) + time * 0.92);
        float drift = sin(dot(p, vec2(0.58, -0.43)) + time * 0.39);
        float eddy = sin(dot(p, vec2(0.26, 0.72)) - time * 0.51);
        float ripple = sin(dot(p, vec2(1.48, 2.45)) + crossSwell * 0.64 + drift * 1.8 + eddy - time * 1.72);
        float sparkle = sin(dot(p, vec2(-2.13, 0.77)) + eddy * 1.2 + time * 0.7);
        float glint = smoothstep(0.86, 0.995, ripple) * smoothstep(-0.05, 0.8, crossSwell + sparkle * 0.45);

        vec3 color = mix(deepColor, shallowColor, shallows);
        color *= 1.0 + swell * 0.055 + crossSwell * 0.038;
        color = mix(color, glintColor, glint * mix(0.17, 0.39, shallows));

        float tide = sin(time * 1.02 + p.x * 0.3 + p.y * 0.2);
        float innerFoam = 1.0 - smoothstep(0.025, 0.185, abs(shore - 0.67 - tide * 0.16));
        float outerFoam = 1.0 - smoothstep(0.025, 0.12, abs(shore - 1.55 - tide * 0.23));
        float brokenEdge = smoothstep(-0.52, 0.4, sin(p.x * 1.1 - p.y * 0.91 + time * 0.7));
        color = mix(color, foamColor, innerFoam * (0.34 + 0.42 * brokenEdge) + outerFoam * brokenEdge * 0.31);

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
