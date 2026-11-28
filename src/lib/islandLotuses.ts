import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedMesh,
  MeshStandardMaterial, Object3D, SphereGeometry,
} from "three";
import { pondRadiusAt } from "./islandTerrain";

export function createIslandLotuses() {
  const group = new Group();
  const material = new MeshStandardMaterial({ side: DoubleSide, roughness: .78, vertexColors: true });
  const pad = new BufferGeometry();
  const vertices = [0, -.04, 0];
  const colors = new Color("#a3b974").toArray();
  const indices: number[] = [];
  for (let i = 0; i <= 32; i++) {
    const a = .12 + i / 32 * (Math.PI * 2 - .24);
    const r = 1 + .038 * Math.sin(a * 5);
    vertices.push(Math.cos(a) * r, .05 + .035 * Math.sin(a * 4), Math.sin(a) * r);
    colors.push(...new Color(i % 4 === 0 ? "#b5ce84" : "#639b78").toArray());
    if (i) indices.push(0, i + 1, i);
  }
  pad.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  pad.setAttribute("color", new Float32BufferAttribute(colors, 3));
  pad.setIndex(indices);
  pad.computeVertexNormals();

  const petal = new BufferGeometry();
  petal.setAttribute("position", new Float32BufferAttribute([
    0,0,0, -.35,.24,.52, 0,.13,.56, .35,.24,.52, 0,.7,1,
  ], 3));
  petal.setAttribute("color", new Float32BufferAttribute(
    ["#e8ab86","#ffcfdb","#fff1e4","#ffcfdb","#d96b95"].flatMap(hex => new Color(hex).toArray()), 3));
  petal.setIndex([0,1,2, 0,2,3, 1,4,2, 2,4,3]);
  petal.computeVertexNormals();
  const heart = new SphereGeometry(1, 8, 5);
  const gold = new Color("#edbf5c");
  heart.setAttribute("color", new Float32BufferAttribute(
    Array.from({ length: heart.getAttribute("position").count }, () => gold.toArray()).flat(), 3));

  const clusters = [2.7, 3.9, 5.1, .35, 1.35];
  function batch(geometry: BufferGeometry, count: number) {
    const mesh = new InstancedMesh(geometry, material, count);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const pads = batch(pad, clusters.length * 6);
  const petals = batch(petal, clusters.length * 2 * 15);
  const hearts = batch(heart, clusters.length * 2);
  const stamp = new Object3D();
  let flower = 0;
  clusters.forEach((angle, cluster) => {
    for (let i = 0; i < 6; i++) {
      const a = angle + (i - 2.5) * .095;
      const radius = pondRadiusAt(a) * (.84 + .06 * Math.sin(i * 2 + cluster));
      const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
      const size = .18 + .045 * (i % 3);
      stamp.position.set(x, .018 + i * .002, z);
      stamp.rotation.set(0, i * 2.4 + angle, 0);
      stamp.scale.set(size, size, size * .9);
      stamp.updateMatrix();
      pads.setMatrixAt(cluster * 6 + i, stamp.matrix);
      if (i !== 1 && i !== 4) continue;
      for (let j = 0; j < 15; j++) {
        const inner = j >= 9;
        stamp.position.set(x, inner ? .078 : .055, z);
        stamp.rotation.set(0, angle + (inner ? (j - 9) / 6 + .045 : j / 9) * Math.PI * 2, 0);
        stamp.scale.set(.16, inner ? .23 : .13, inner ? .115 : .18);
        stamp.updateMatrix();
        petals.setMatrixAt(flower * 15 + j, stamp.matrix);
      }
      stamp.position.set(x, .116, z);
      stamp.scale.set(.048, .034, .048);
      stamp.updateMatrix();
      hearts.setMatrixAt(flower++, stamp.matrix);
    }
  });
  return {
    group,
    dispose() {
      for (const mesh of [pads, petals, hearts]) { mesh.dispose(); mesh.geometry.dispose(); }
      material.dispose();
    },
  };
}
