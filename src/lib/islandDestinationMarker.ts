import { Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { islandElevation } from "./islandTerrain";

export function createIslandDestinationMarker() {
  const geometry = new PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { fade: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 surface;
      void main() {
        surface = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 surface;
      uniform float fade;

      void main() {
        vec2 axes = abs(surface);
        vec2 arm = vec2(max(axes.x, axes.y), min(axes.x, axes.y));
        float point = arm.x - 0.35;
        float edge = max(-point, max(arm.x - 0.77, arm.y - point * 0.42));
        float ring = abs(length(surface) - 0.30);
        float aa = max(fwidth(arm.x), 0.015);
        float arrows = 1.0 - smoothstep(0.0, aa, edge);
        float circle = 1.0 - smoothstep(0.022, 0.022 + aa, ring);
        float glow = (1.0 - smoothstep(0.0, 0.16, min(edge, ring))) * 0.38;
        float core = max(arrows, circle * 0.88);
        gl_FragColor = vec4(mix(vec3(0.10, 0.75, 0.26), vec3(0.73, 1.0, 0.47), core), max(core, glow) * fade);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(geometry, material);
  mesh.visible = false;
  const normal = new Vector3();
  const up = new Vector3(0, 1, 0);
  let elapsed = 0;
  let size = 1;

  return {
    mesh,
    show(x: number, z: number, overview: boolean) {
      elapsed = 0;
      size = overview ? 1.45 : 0.94;
      const height = islandElevation(x, z);
      normal.set(height - islandElevation(x + 0.2, z), 0.2, height - islandElevation(x, z + 0.2)).normalize();
      mesh.position.set(x, height + 0.42, z);
      mesh.quaternion.setFromUnitVectors(up, normal);
      mesh.visible = true;
    },
    update(delta: number, animated: boolean) {
      if (!mesh.visible) return;
      elapsed += delta;
      const progress = Math.min(elapsed / 0.62, 1);
      mesh.visible = progress < 1;
      mesh.scale.setScalar(size * (animated ? 1.30 - 0.49 * Math.sqrt(progress) : 1));
      material.uniforms.fade.value = animated ? 1 - progress ** 2 : 0.95;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
