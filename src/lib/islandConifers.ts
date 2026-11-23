import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, Mesh, MeshStandardMaterial, Object3D,
  type Group,
} from "three";
import { createIslandBark } from "./islandBark";

export function createIslandConifers(bark: MeshStandardMaterial) {
  const twig = new BufferGeometry();
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const stem = new Color("#767654");
  const needle = new Color("#4a8858");
  const tip = new Color("#88aa66");
  const blueNeedle = new Color("#35755e");

  function vertex(x: number, y: number, z: number, color: Color) {
    vertices.push(x, y, z);
    colors.push(color.r, color.g, color.b);
    return vertices.length / 3 - 1;
  }

  for (let segment = 0; segment < 12; segment++) {
    const t = segment / 12;
    const y = -0.095 * Math.sin(t * 2.7) + t * 0.14;
    const base = vertex(t, y, -0.021 * (1 - t), stem);
    vertex(t, y, 0.021 * (1 - t), stem);
    vertex(t + 0.092, y + 0.007, 0, stem);
    indices.push(base, base + 1, base + 2);

    for (const side of [-1, 1]) {
      const span = (0.08 + Math.sin(t * Math.PI) * 0.245) * (0.85 + (segment % 3) * 0.11);
      for (let needleIndex = 0; needleIndex < 5; needleIndex++) {
        const reach = (needleIndex + 1) / 5;
        const attach = t + reach * 0.12;
        const spread = side * span * reach;
        const height = y + 0.07 + 0.06 * Math.sin(segment + side + needleIndex * 0.6);
        const width = 0.037 * (1 - t * 0.58);
        const start = vertex(attach - 0.07, height, spread * 0.38, blueNeedle);
        vertex(attach - width, height + 0.043, spread, needle);
        vertex(attach + 0.15 + 0.045 * reach, height + 0.05, spread * 1.18, tip);
        vertex(attach + width, height - 0.021, spread * 0.73, needle);
        indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
      }
    }
  }
  twig.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  twig.setAttribute("color", new Float32BufferAttribute(colors, 3));
  twig.setIndex(indices);
  twig.computeVertexNormals();
  const pineMaterial = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.9 });
  const trunk = createIslandBark([[0, -0.14, 0], [0.025, 0.62, -0.03], [-0.034, 1.47, 0.02], [0.1, 2.66, 0]], 0.19, 0.022, 2.7);
  const boughs: InstancedMesh[] = [];
  const transform = new Object3D();
  const tint = new Color();
  const tones = ["#adcbb0", "#c6d5a5", "#e7ecb4", "#9ebfba"].map((color) => new Color(color));

  return {
    plant(pine: Group, crown: Group, seed: number) {
      const wood = new Mesh(trunk, bark);
      wood.castShadow = true;
      wood.receiveShadow = true;
      pine.add(wood);
      const branches = new InstancedMesh(twig, pineMaterial, 53);
      let count = 0;

      for (let tier = 0; tier < 9; tier++) {
        const around = tier < 4 ? 7 : 5;
        const level = tier / 8;
        for (let branch = 0; branch < around; branch++) {
          const phase = branch / around * Math.PI * 2 + tier * 0.76 + seed;
          const jitter = Math.sin(tier * 5.3 + branch * 2.4 + seed * 1.9);
          const length = (1.29 - level * 1.08) * (0.88 + jitter * 0.16);
          transform.position.set(Math.cos(phase) * 0.052, tier * 0.245 + jitter * 0.087, Math.sin(phase) * 0.052);
          transform.rotation.set((branch % 2 ? -1 : 1) * 0.34 + jitter * 0.12, -phase, -0.24 + level * 0.63 + jitter * 0.13, "YXZ");
          transform.scale.set(length, length * 1.32, length * (1.04 + jitter * 0.25));
          transform.updateMatrix();
          branches.setMatrixAt(count, transform.matrix);
          tint.copy(tones[(seed + tier + branch) % tones.length]).multiplyScalar(0.81 + level * 0.22 + jitter * 0.075);
          branches.setColorAt(count++, tint);
        }
      }
      branches.count = count;
      branches.computeBoundingSphere();
      branches.castShadow = true;
      branches.receiveShadow = true;
      crown.add(branches);
      boughs.push(branches);
    },
    dispose() {
      boughs.forEach((mesh) => mesh.dispose());
      trunk.dispose();
      twig.dispose();
      pineMaterial.dispose();
    },
  };
}
