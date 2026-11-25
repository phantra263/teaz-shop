import {
  BackSide, BufferGeometry, Color, Float32BufferAttribute, Mesh, MeshBasicMaterial, ShaderMaterial, SphereGeometry, Vector3,
} from "three";

export const islandSunDirection = new Vector3(0.51, 0.46, -0.73).normalize();

function createMountainRanges() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const mist = new Color("#e4cdd5");
  const tint = new Color();
  const pine = new Color("#496d64");
  const meadow = new Color("#749478");
  const terrain = [
    { distance: 104, height: 29, rock: "#8796bc", haze: 0.33, ranges: [[-3.07, 1.05], [-1.89, 1.55], [-0.19, 1.04], [1.38, 1.29], [2.64, 0.79]] },
    { distance: 81, height: 23, rock: "#7188a7", haze: 0.16, ranges: [[-2.95, 0.83], [-1.73, 1.05], [-0.38, 0.98], [0.89, 0.78], [2.03, 1.05]] },
    { distance: 61, height: 16, rock: "#7c889d", haze: 0.06, ranges: [[-2.76, 0.78], [-1.31, 0.78], [0.23, 0.64], [1.83, 0.91], [2.96, 0.41]] },
  ];

  terrain.forEach(({ distance, height, rock, haze, ranges }, layer) => {
    const stone = new Color(rock);
    ranges.forEach(([center, arc], range) => {
      const seed = range * 1.73 + layer * 2.41;
      const segments = 52;
      const rows = 16;
      const first = positions.length / 3;
      for (let column = 0; column <= segments; column++) {
        const u = column / segments;
        const shoulder = Math.sin(Math.PI * u) ** 0.69;
        const peak = shoulder * (0.63 + Math.sin(u * 11.8 + seed) * 0.19 + Math.cos(u * 23.7 - seed) * 0.11 + Math.sin(u * 71 + seed) * 0.045);
        for (let row = 0; row <= rows; row++) {
          const v = row / rows;
          const flank = Math.sin(Math.PI * v) ** 0.73;
          const angle = center + (u - 0.5) * arc * (1.17 - 0.17 * flank) + Math.sin(v * 5 + u * 8 + seed) * 0.034 * flank;
          const radius = distance + (v - 0.5) * (24 + layer * 2) + Math.sin(u * 19 + seed) * 2.3 * flank;
          const ravine = Math.sin(u * 45 + Math.sin(v * 4 + u * 9) * 1.4 + seed);
          const ridge = Math.sin(u * 105 + v * 6 + seed);
          const elevation = height * flank * Math.max(0, peak + shoulder * (ravine * 0.072 + ridge * 0.021));
          positions.push(Math.cos(angle) * radius, elevation - 1.92, Math.sin(angle) * radius);
          const greenery = layer === 2 ? Math.max(0, 1 - elevation / 12) * (ravine * 0.16 + 0.7) : 0;
          const valleyMist = Math.max(0, 1 - elevation / 10);
          const light = 0.91 + 0.11 * Math.cos(u * 45 + v * 2 + seed) + ridge * 0.044;
          tint.copy(stone).lerp(pine, greenery).lerp(meadow, greenery * (0.27 + ridge * 0.13))
            .multiplyScalar(light).lerp(mist, haze + valleyMist * (layer === 2 ? 0.16 : 0.39));
          colors.push(tint.r, tint.g, tint.b);
          if (column === 0 || row === 0) continue;
          const index = first + column * (rows + 1) + row;
          indices.push(index - rows - 2, index, index - rows - 1, index - rows - 2, index - 1, index);
        }
      }
    });
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  const normal = new Vector3();
  const litStone = new Color("#f9deb2");
  for (let vertex = 0; vertex < normals.count; vertex++) {
    normal.fromBufferAttribute(normals, vertex);
    const height = positions[vertex * 3 + 1];
    const exposure = Math.max(0, normal.dot(islandSunDirection));
    const shade = 0.82 + exposure * 0.24 + normal.y * 0.06;
    const warmLight = Math.max(0, exposure - 0.27) * Math.min(1, Math.max(0, height / 10)) * 0.18;
    const offset = vertex * 3;
    tint.setRGB(colors[offset], colors[offset + 1], colors[offset + 2]).multiplyScalar(shade).lerp(litStone, warmLight);
    colors[offset] = tint.r;
    colors[offset + 1] = tint.g;
    colors[offset + 2] = tint.b;
  }
  geometry.deleteAttribute("normal");
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, fog: false }));
}

export function createIslandSky() {
  const domeGeometry = new SphereGeometry(130, 32, 16);
  const domeMaterial = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      zenith: { value: new Color("#7f91bf") },
      horizon: { value: new Color("#ecd5cd") },
      cloud: { value: new Color("#ffe6a9") },
      sunDirection: { value: islandSunDirection },
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
      uniform vec3 sunDirection;
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
        float facingSun = max(0.0, dot(direction, sunDirection));
        float clouds = smoothstep(0.43, 0.70, layers) * smoothstep(0.008, 0.10, height);
        vec3 cloudLight = mix(vec3(0.63, 0.49, 0.59), cloud, smoothstep(0.44, 0.72, layers) * 0.52 + facingSun * 0.44);
        color = mix(color, cloudLight, clouds * 0.93);
        float glow = pow(facingSun, 15.0);
        color = mix(color, cloud, glow * 0.67);
        color = mix(color, vec3(1.0, 0.98, 0.82), smoothstep(0.9990, 0.99975, facingSun) * 0.96);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const dome = new Mesh(domeGeometry, domeMaterial);
  dome.renderOrder = -100;
  dome.frustumCulled = false;
  const cliffs = createMountainRanges();

  return {
    dome,
    cliffs,
    update(time: number) { domeMaterial.uniforms.time.value = time; },
    dispose() {
      domeGeometry.dispose();
      domeMaterial.dispose();
      cliffs.geometry.dispose();
      cliffs.material.dispose();
    },
  };
}
