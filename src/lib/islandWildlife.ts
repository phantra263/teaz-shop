import {
  BoxGeometry, CircleGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  RingGeometry, SphereGeometry, type Scene,
} from "three";
import { createIslandAnimals } from "./islandAnimals";
import { islandElevation, islandLayoutScale, islandPond } from "./islandTerrain";

export function createIslandWildlife(scene: Scene) {
  const habitat = new Group();
  scene.add(habitat);
  const sphere = new SphereGeometry(1, 12, 8);
  const box = new BoxGeometry();
  const animals = createIslandAnimals();
  const disc = new CircleGeometry(1, 48);
  const ring = new RingGeometry(1, 1.025, 48);
  const pad = new CircleGeometry(1, 17, 0.32, Math.PI * 1.83);
  const materials = new Map<string, MeshStandardMaterial>();
  const pond = new Group();
  pond.position.set(islandPond.x, 0, islandPond.z);
  habitat.add(pond);

  function shape(parent: Group, geometry: typeof sphere | typeof box | typeof disc, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
    let material = materials.get(color);
    if (!material) {
      material = new MeshStandardMaterial({ color, roughness: 0.84 });
      materials.set(color, material);
    }
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }

  function flat(parent: Group, geometry: typeof disc, color: string, x: number, y: number, z: number, size: number) {
    const mesh = shape(parent, geometry, color, x, y, z, size, size, 1);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  flat(pond, disc, "#927a51", 0, 0.101, 0, islandPond.radius + 0.15);
  flat(pond, disc, "#70afa0", 0, 0.105, 0, islandPond.radius);
  flat(pond, disc, "#4d908c", 0, 0.107, 0, islandPond.radius * 0.83);
  const rippleMaterials: MeshBasicMaterial[] = [];
  const ripples = Array.from({ length: 3 }, () => {
    const material = new MeshBasicMaterial({ color: "#c6ecd9", transparent: true, opacity: 0.27, depthWrite: false });
    rippleMaterials.push(material);
    const mesh = new Mesh(ring, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.114;
    pond.add(mesh);
    return mesh;
  });

  for (let index = 0; index < 28; index++) {
    const angle = index * 2.39996;
    const radius = 0.69 + (index % 7) * 0.24;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    flat(pond, pad, index % 3 ? "#50874c" : "#72a75c", x, 0.125 + index * 0.0003, z, 0.16 + (index % 4) * 0.042).rotation.z = angle;
    if (index % 3) continue;
    for (let petal = 0; petal < 5; petal++) {
      const direction = petal * Math.PI * 0.4;
      const piece = shape(pond, sphere, "#e8a2b9", x + Math.cos(direction) * 0.064, 0.173, z + Math.sin(direction) * 0.064, 0.09, 0.043, 0.044);
      piece.rotation.y = -direction;
    }
    shape(pond, sphere, "#f3ce68", x, 0.204, z, 0.051, 0.027, 0.051);
  }

  for (const base of [0.1, 1.26, 2.05, 4.14, 5.13]) {
    for (let stalk = 0; stalk < 6; stalk++) {
      const angle = base + stalk * 0.046;
      const radius = islandPond.radius + Math.sin(stalk * 2.4) * 0.14;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 0.31 + (stalk % 4) * 0.13;
      shape(pond, box, "#548252", x, 0.11 + height / 2, z, 0.024, height, 0.024).rotation.z = Math.sin(stalk) * 0.1;
      shape(pond, sphere, "#846240", x, 0.11 + height, z, 0.045, 0.097, 0.047);
    }
  }

  const ducks = Array.from({ length: 3 }, (_, index) => {
    const model = animals.duck(index);
    pond.add(model.root);
    const wake = [0, 1].map(() => {
      const material = new MeshBasicMaterial({ color: "#e0f3e8", transparent: true, opacity: 0.36, depthWrite: false });
      rippleMaterials.push(material);
      const ripple = new Mesh(ring, material);
      ripple.rotation.x = -Math.PI / 2;
      pond.add(ripple);
      return ripple;
    });
    return { ...model, wake };
  });

  const rabbits = Array.from({ length: 3 }, (_, index) => animals.rabbit(index));
  const birds = Array.from({ length: 5 }, (_, index) => animals.bird(index));
  const butterflies = Array.from({ length: 6 }, (_, index) => animals.butterfly(index));
  [...rabbits, ...birds, ...butterflies].forEach(({ root }) => habitat.add(root));

  function update(time: number) {
    ripples.forEach((mesh, index) => {
      const wave = (time * 0.25 + index / ripples.length) % 1;
      mesh.scale.setScalar(0.4 + wave * (islandPond.radius - 0.5));
      rippleMaterials[index].opacity = Math.sin(wave * Math.PI) * 0.32;
    });
    ducks.forEach(({ root: duck, head, wake }, index) => {
      const angle = time * 0.72 - index * 0.5 + 2.0;
      const radius = 2.15 + index * 0.12;
      duck.position.set(Math.cos(angle) * radius, 0.12 + Math.sin(time * 5.4 + index) * 0.036, Math.sin(angle) * radius);
      duck.rotation.y = -angle;
      duck.rotation.z = Math.sin(time * 4.4 + index) * 0.041;
      head.rotation.x = Math.sin(time * 3.2 + index) * 0.095;
      head.rotation.y = Math.sin(time * 1.4 + index * 1.6) * 0.17;
      wake.forEach((ripple, layer) => {
        const wave = (time * 1.5 + layer * 0.5 + index * 0.17) % 1;
        const behind = angle - 0.135 - wave * 0.31;
        ripple.position.set(Math.cos(behind) * radius, 0.139, Math.sin(behind) * radius);
        ripple.scale.set(0.12 + wave * 0.24, 0.12 + wave * 0.24, 1);
        ripple.material.opacity = (1 - wave) * 0.63;
      });
    });
    rabbits.forEach(({ root, head, ears, hind, front }, index) => {
      const cycle = time * 1.48 + index * 0.71;
      const phase = cycle % 1;
      const jump = Math.min(1, phase / 0.72);
      const stride = jump * jump * (3 - 2 * jump);
      const angle = (Math.floor(cycle) + stride) * 0.44 + index * 2.07;
      const radius = 2.25 + index * 0.21;
      const hop = Math.sin(jump * Math.PI);
      const step = Math.sin(jump * Math.PI * 2);
      const x = -13.8 * islandLayoutScale + Math.cos(angle) * radius;
      const z = -4.05 * islandLayoutScale + Math.sin(angle) * 1.67 + index * 0.43;
      root.position.set(x, 0.09 + hop * hop * 0.29 + islandElevation(x, z), z);
      root.rotation.y = Math.atan2(-Math.sin(angle) * radius, Math.cos(angle) * 1.67);
      root.rotation.x = step * 0.16;
      head.rotation.x = -step * 0.15 + (1 - hop) * 0.03 * Math.sin(time * 5 + index);
      head.rotation.y = (1 - hop) * Math.sin(time * 1.7 + index) * 0.13;
      ears.forEach((ear, side) => {
        ear.rotation.x = 0.13 + hop * 0.39 + Math.sin(time * (3.9 + side * 0.57) + index) * 0.09;
        ear.rotation.z = (side ? -1 : 1) * (0.15 + hop * 0.076);
      });
      hind.forEach((leg) => { leg.rotation.x = step * -0.57 + hop * 0.18; });
      front.forEach((leg) => { leg.rotation.x = step * 0.44 - hop * 0.29; });
    });
    birds.forEach(({ root, wings }, index) => {
      const angle = time * 0.45 - index * 0.19;
      const radius = 15.3 + index * 0.57;
      const glide = 0.37 + 0.63 * (0.5 + Math.sin(time * 1.6 + index * 0.43) * 0.5);
      root.position.set(-3 * islandLayoutScale + Math.cos(angle) * radius, 9.4 + index * 0.31 + Math.sin(angle * 2) * 0.75, -2.4 * islandLayoutScale + Math.sin(angle) * 11.2);
      root.rotation.y = Math.atan2(-Math.sin(angle) * radius, Math.cos(angle) * 11.2);
      root.rotation.z = 0.13 + Math.sin(angle * 1.1) * 0.16;
      const phase = time * 11.4 + index * 0.66;
      wings.forEach(({ pivot, tip }, side) => {
        const sign = side ? 1 : -1;
        pivot.rotation.z = sign * (0.08 + Math.sin(phase) * glide * 0.79);
        tip.rotation.z = sign * Math.sin(phase - 0.64) * glide * 0.34;
        tip.rotation.y = sign * (0.14 + Math.cos(phase) * glide * 0.12);
      });
    });
    butterflies.forEach(({ root, wings }, index) => {
      const angle = time * (0.8 + index * 0.06) + index * 2.39996;
      const flutter = time * 0.61 + index * 1.31;
      const x = (index < 3 ? -13.0 * islandLayoutScale : islandPond.x - 3.7) + Math.cos(angle) * 1.3 + Math.sin(flutter * 2.4) * 0.26;
      const z = (index < 3 ? -4.9 * islandLayoutScale : islandPond.z + 2.2) + Math.sin(angle) * 1.14;
      root.position.set(x, 0.87 + Math.sin(time * 2.1 + index) * 0.32 + islandElevation(x, z), z);
      root.rotation.y = Math.atan2(-Math.sin(angle) * 1.3, Math.cos(angle) * 1.14);
      root.rotation.x = Math.cos(flutter * 3.0) * 0.19;
      const flap = 0.18 + Math.sin(time * 18 + index * 1.2) * 1.08;
      wings[0].rotation.z = -flap;
      wings[1].rotation.z = flap;
    });
  }

  update(0);
  return {
    update,
    dispose() {
      animals.dispose();
      [sphere, box, disc, ring, pad].forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      rippleMaterials.forEach((material) => material.dispose());
    },
  };
}
