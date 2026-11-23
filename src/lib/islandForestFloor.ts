import {
  BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, InstancedMesh,
  MeshStandardMaterial, Object3D, SRGBColorSpace, Vector3,
} from "three";
import { islandElevation, islandGround, islandPond, pondDistance } from "./islandTerrain";

export function createMeadowTexture(trees: readonly (readonly [number, number])[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#7da15c";
  ctx.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 76; index++) {
    const x = (index * 137.51) % 512;
    const y = (index * 87.76) % 512;
    const patch = ctx.createRadialGradient(x, y, 0, x, y, 23 + (index % 8) * 4);
    patch.addColorStop(0, index % 3 ? "#487d474f" : "#d2b76a5c");
    patch.addColorStop(1, "#6f946000");
    ctx.fillStyle = patch;
    ctx.fillRect(x - 54, y - 54, 108, 108);
  }
  for (let index = 0; index < 5800; index++) {
    const x = (index * 217.61) % 512;
    const y = (index * 119.43 + Math.sin(index * 0.61) * 75 + 512) % 512;
    ctx.fillStyle = index % 3 ? "#34533d36" : "#d7bc772e";
    ctx.fillRect(x, y, 1 + index % 3, 1 + index % 2);
  }
  trees.forEach(([x, z], index) => {
    const px = (z / islandGround.z * 0.5 + 0.5) * 512;
    const py = (0.5 - x / islandGround.x * 0.5) * 512;
    const radius = 18 + (index % 4) * 2;
    const shade = ctx.createRadialGradient(px + 6, py + 5, 1, px + 6, py + 5, radius + 12);
    shade.addColorStop(0, "#203a36b0");
    shade.addColorStop(0.46, "#27453387");
    shade.addColorStop(1, "#36503500");
    ctx.fillStyle = shade;
    ctx.fillRect(px - 40, py - 40, 86, 86);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export type FlowerPatch = { x: number; z: number; radius: number; count: number };

export function createWoodlandFlowers(
  trees: readonly (readonly [number, number])[],
  patches: readonly FlowerPatch[],
  path: readonly Vector3[],
  beds: readonly Vector3[],
  clearings: readonly (readonly [number, number, number, number])[],
) {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const faces: number[] = [];
  const colors: number[] = [];
  const stemColor = new Color("#598444");
  const petalColor = new Color("#fff7e4");
  const petalBase = new Color("#cfbb9b");
  const centerColor = new Color("#efa849");

  function vertex(x: number, y: number, z: number, color: Color) {
    vertices.push(x, y, z);
    colors.push(color.r, color.g, color.b);
    return vertices.length / 3 - 1;
  }

  const stemBase = vertex(0, 0, 0, stemColor);
  const stemSide = vertex(0.038, 0, 0.022, stemColor);
  const stemTop = vertex(0.075, 0.78, 0, stemColor);
  faces.push(stemBase, stemSide, stemTop);
  for (const side of [-1, 1]) {
    const root = vertex(0.04, 0.36, 0, stemColor);
    const left = vertex(side * 0.24, 0.49, -0.075, stemColor);
    const tip = vertex(side * 0.4, 0.62, -0.02, stemColor);
    const right = vertex(side * 0.24, 0.6, 0.08, stemColor);
    faces.push(root, left, tip, root, tip, right);
  }
  const center = vertex(0.075, 0.887, 0, centerColor);
  for (let petal = 0; petal < 6; petal++) {
    const angle = petal / 6 * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const root = vertex(0.075 + dx * 0.026, 0.83, dz * 0.026, petalBase);
    const left = vertex(0.075 + dx * 0.169 - dz * 0.077, 0.836, dz * 0.169 + dx * 0.077, petalColor);
    const tip = vertex(0.075 + dx * 0.27, 0.887, dz * 0.27, petalColor);
    const right = vertex(0.075 + dx * 0.176 + dz * 0.073, 0.852, dz * 0.176 - dx * 0.073, petalColor);
    const nectar = vertex(0.075 + dx * 0.063, 0.86, dz * 0.063, centerColor);
    faces.push(root, left, tip, root, tip, right, center, root, nectar);
  }
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();

  const material = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.88 });
  const sites = [...trees.map(([x, z], index) => ({ x, z, radius: 1.7 + (index % 3) * 0.18, count: 23 })), ...patches];
  const mesh = new InstancedMesh(geometry, material, sites.reduce((total, patch) => total + patch.count, 0));
  mesh.receiveShadow = true;
  const transform = new Object3D();
  const tints = ["#fff5df", "#fff0a1", "#f4bbce", "#ccd0fc", "#f9e4ae"].map((color) => new Color(color));
  let count = 0;
  sites.forEach(({ x, z, radius, count: seedlings }, index) => {
    for (let flower = 0; flower < seedlings; flower++) {
      const angle = index * 2.43 + flower * 2.39996;
      const reach = radius * Math.sqrt((flower + 0.5) / seedlings) * (0.92 + Math.sin(flower * 1.9 + index) * 0.19);
      const px = x + Math.cos(angle) * reach;
      const pz = z + Math.sin(angle) * reach;
      if (Math.hypot(px / (islandGround.x - 0.4), pz / (islandGround.z - 0.3)) >= 1 || pondDistance(px, pz) < islandPond.radius + 0.25) continue;
      if (path.some(({ x: tx, z: tz }) => (tx - px) ** 2 + (tz - pz) ** 2 < 0.43) || beds.some(({ x: tx, z: tz }) => (tx - px) ** 2 + (tz - pz) ** 2 < 0.14)) continue;
      if (clearings.some(([cx, cz, width, depth]) => Math.abs(px - cx) < width && Math.abs(pz - cz) < depth)) continue;
      transform.position.set(px, 0.093 + islandElevation(px, pz), pz);
      transform.rotation.set(0.15 * Math.sin(angle), angle, 0.28 * Math.cos(angle));
      transform.scale.setScalar(0.15 + (1 + Math.sin(flower * 4.55 + index)) * 0.11 + (index >= trees.length ? 0.08 : 0));
      transform.updateMatrix();
      mesh.setMatrixAt(count, transform.matrix);
      mesh.setColorAt(count++, tints[(index + (flower % 5 === 0 ? 1 : 0)) % tints.length]);
    }
  });
  mesh.count = count;
  mesh.computeBoundingSphere();

  return {
    mesh,
    dispose() {
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

export function createWoodlandFerns(trees: readonly (readonly [number, number])[], path: readonly Vector3[]) {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const colors: number[] = [];
  const stem = new Color("#719454");
  const upperLeaf = new Color("#679e57");
  const lowerLeaf = new Color("#3a6547");

  for (let frond = 0; frond < 7; frond++) {
    const angle = frond * 2.39996;
    const forward = new Vector3(Math.cos(angle), 0, Math.sin(angle));
    const across = new Vector3(-forward.z, 0, forward.x);
    const length = 0.64 + (frond % 3) * 0.16;
    const frondPoint = (t: number) => forward.clone().multiplyScalar(t * length * 0.77).setY(Math.sin(t * 2.48) * length * 0.62);

    function triangle(a: Vector3, b: Vector3, c: Vector3, tint: Color) {
      for (const point of [a, b, c]) {
        vertices.push(point.x, point.y, point.z);
        colors.push(tint.r, tint.g, tint.b);
      }
    }

    for (let node = 0; node < 8; node++) {
      const t = node / 8;
      const joint = frondPoint(t);
      const next = frondPoint(t + 1 / 8);
      triangle(joint.clone().addScaledVector(across, -0.012), joint.clone().addScaledVector(across, 0.012), next, stem);
      if (node === 0) continue;
      for (const side of [-1, 1]) {
        const reach = Math.sin(t * Math.PI) * length * 0.25;
        const tip = next.clone().addScaledVector(across, side * reach).addScaledVector(forward, 0.06);
        tip.y -= reach * 0.23;
        const fold = joint.clone().lerp(tip, 0.47);
        fold.y += 0.022;
        triangle(joint, fold, tip, upperLeaf);
        triangle(fold, next, tip, lowerLeaf);
      }
    }
  }

  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 1 });
  const mesh = new InstancedMesh(geometry, material, trees.length * 3);
  const transform = new Object3D();
  let count = 0;
  trees.forEach(([x, z], index) => {
    for (let frond = 0; frond < 3; frond++) {
      const angle = index * 2.39996 + frond * 2.08;
      const px = x + Math.cos(angle) * (0.76 + frond * 0.27);
      const pz = z + Math.sin(angle) * (0.76 + frond * 0.27);
      if (Math.hypot(px / (islandGround.x - 0.7), pz / (islandGround.z - 0.6)) >= 1 || pondDistance(px, pz) < islandPond.radius + 0.4 || path.some(({ x: tx, z: tz }) => (tx - px) ** 2 + (tz - pz) ** 2 < 0.81)) continue;
      transform.position.set(px, 0.093 + islandElevation(px, pz), pz);
      transform.rotation.y = angle;
      transform.scale.setScalar(0.48 + (1 + Math.sin(index * 0.61 + frond)) * 0.23);
      transform.updateMatrix();
      mesh.setMatrixAt(count++, transform.matrix);
    }
  });
  mesh.count = count;
  mesh.computeBoundingSphere();

  return {
    mesh,
    dispose() {
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
