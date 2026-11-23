import {
  BoxGeometry, CircleGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  RingGeometry, SphereGeometry, MathUtils, Vector3, type Scene,
} from "three";
import { islandAnimalActions, type IslandAnimalAction } from "../data/islandInteractions";
import { islandStops } from "../data/island";
import { createIslandAnimals } from "./islandAnimals";
import { createLotusPond, pondWaterHeight } from "./islandPond";
import { islandElevation, islandLayoutScale, islandPond, pondBankDistance, pondRadiusAt } from "./islandTerrain";

export function createIslandWildlife(scene: Scene) {
  const habitat = new Group();
  scene.add(habitat);
  const sphere = new SphereGeometry(1, 12, 8);
  const box = new BoxGeometry();
  const animals = createIslandAnimals();
  const ring = new RingGeometry(1, 1.025, 48);
  const pad = new CircleGeometry(1, 17, 0.32, Math.PI * 1.83);
  const materials = new Map<string, MeshStandardMaterial>();
  const lotusPond = createLotusPond();
  const pond = lotusPond.group;
  habitat.add(pond);

  function shape(parent: Group, geometry: typeof sphere | typeof box | typeof pad, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
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

  const rippleMaterials: MeshBasicMaterial[] = [];

  for (let index = 0; index < 28; index++) {
    const angle = index * 2.39996;
    const radius = pondRadiusAt(angle) * (0.27 + (index % 8) * 0.073);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const width = 0.16 + (index % 4) * 0.042;
    const lilyPad = shape(pond, pad, index % 3 ? "#51864e" : "#79a35c", x, pondWaterHeight + 0.011 + index * 0.0003, z, width, width * 0.84, 1);
    lilyPad.rotation.set(-Math.PI / 2, 0, angle);
    lilyPad.receiveShadow = true;
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
      const radius = pondRadiusAt(angle) + 0.1 + Math.sin(stalk * 2.4) * 0.14;
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

  const grove = islandStops.find(({ id }) => id === "grove")!;
  const duration = { rabbit: 3.2, duck: 3.7, bird: 4.2, butterfly: 3.0 };
  const approach = { rabbit: 0.95, duck: 1.15, bird: 1.1, butterfly: 0.85 };
  let encounter: {
    action: IslandAnimalAction; subject: number; center: Vector3; heading: number;
    elapsed: number; influence: number; leaving: boolean; duckAngles: number[];
  } | undefined;

  function closest(player: Vector3, models: readonly { root: Group }[]) {
    let index = 0;
    let distance = Infinity;
    models.forEach(({ root }, candidate) => {
      const length = Math.hypot(root.position.x - player.x, root.position.z - player.z);
      if (length < distance) {
        distance = length;
        index = candidate;
      }
    });
    return { index, distance };
  }

  function nearbyActions(player: Vector3): readonly IslandAnimalAction[] {
    const byGrove = Math.hypot(player.x - grove.x, player.z - grove.z) <= 5.05;
    const byPond = pondBankDistance(player.x, player.z) <= 3.25;
    const available = {
      rabbit: byGrove && closest(player, rabbits).distance <= 4.85,
      duck: byPond,
      bird: byGrove,
      butterfly: (byGrove || byPond) && closest(player, butterflies).distance <= 4.35,
    };
    return islandAnimalActions.filter((action) => available[action]);
  }

  function interact(player: Vector3, action: IslandAnimalAction) {
    if (encounter || !nearbyActions(player).includes(action)) return;
    const subjects = action === "duck" ? null : action === "rabbit" ? rabbits : action === "bird" ? birds : butterflies;
    const subject = subjects ? closest(player, subjects).index : 0;
    const point = subjects?.[subject].root.position ?? islandPond;
    const heading = Math.atan2(point.x - player.x, point.z - player.z);
    const duckAngles = action === "duck" ? ducks.map(({ root }) => Math.atan2(root.position.z, root.position.x)) : [];
    encounter = { action, subject, center: player.clone(), heading, elapsed: 0, influence: 0, leaving: false, duckAngles };
    return heading;
  }

  function reaction(action: IslandAnimalAction, index?: number) {
    return encounter?.action === action && (index === undefined || encounter.subject === index) ? encounter : undefined;
  }

  function facing(from: number, to: number, blend: number) {
    const turn = to - from;
    return from + Math.atan2(Math.sin(turn), Math.cos(turn)) * blend;
  }

  function update(time: number, delta = 0, player?: Vector3) {
    if (encounter) {
      encounter.elapsed += delta;
      if (encounter.elapsed >= duration[encounter.action] || (player && encounter.center.distanceToSquared(player) > 1.3 ** 2)) encounter.leaving = true;
      const speed = encounter.leaving ? 1.6 : 1 / approach[encounter.action];
      encounter.influence = MathUtils.clamp(encounter.influence + delta * speed * (encounter.leaving ? -1 : 1), 0, 1);
      if (encounter.leaving && encounter.influence <= 0) encounter = undefined;
    }
    lotusPond.update(time);
    ducks.forEach(({ root: duck, head, wake }, index) => {
      const interaction = reaction("duck");
      const weight = interaction ? MathUtils.smoothstep(interaction.influence, 0, 1) : 0;
      const patrol = time * 0.72 - index * 0.5 + 2.0;
      const bank = interaction ? Math.atan2(interaction.center.z - islandPond.z, interaction.center.x - islandPond.x) : patrol;
      const angle = facing(interaction && !interaction.leaving ? interaction.duckAngles[index] : patrol, bank + (index - 1) * 0.24, weight);
      const radius = MathUtils.lerp(pondRadiusAt(angle) * (0.65 + index * 0.035), pondRadiusAt(angle) - 0.38, weight);
      duck.position.set(Math.cos(angle) * radius, pondWaterHeight - 0.009 + Math.sin(time * 5.4 + index) * 0.028, Math.sin(angle) * radius);
      duck.rotation.y = facing(-angle, Math.PI / 2 - bank, weight);
      duck.rotation.z = Math.sin(time * 4.4 + index) * 0.041;
      head.rotation.x = Math.sin(time * 3.2 + index) * 0.095 + weight * Math.sin((interaction?.elapsed ?? 0) * 6.0) * 0.24;
      head.rotation.y = Math.sin(time * 1.4 + index * 1.6) * 0.17;
      wake.forEach((ripple, layer) => {
        const wave = ((interaction?.elapsed ?? time) * 1.5 + layer * 0.5 + index * 0.17) % 1;
        const behind = angle - 0.135 - wave * 0.31;
        const wakeRadius = Math.min(radius, pondRadiusAt(behind) - 0.31);
        ripple.position.set(Math.cos(behind) * wakeRadius, pondWaterHeight + 0.008, Math.sin(behind) * wakeRadius);
        ripple.scale.set(0.13 + wave * 0.24, 0.095 + wave * 0.2, 1);
        ripple.rotation.z = -behind + 0.32;
        ripple.material.opacity = (1 - wave) * 0.49;
      });
    });
    rabbits.forEach(({ root, head, ears, hind, front }, index) => {
      const cycle = time * 1.48 + index * 0.71;
      const phase = cycle % 1;
      const jump = Math.min(1, phase / 0.72);
      const stride = jump * jump * (3 - 2 * jump);
      const angle = (Math.floor(cycle) + stride) * 0.44 + index * 2.07;
      const radius = 2.25 + index * 0.21;
      const interaction = reaction("rabbit", index);
      const weight = interaction ? MathUtils.smoothstep(interaction.influence, 0, 1) : 0;
      const moving = interaction && interaction.influence < 0.96;
      const hop = interaction ? (moving ? Math.abs(Math.sin(interaction.elapsed * 10)) : 0) : Math.sin(jump * Math.PI);
      const step = Math.sin(jump * Math.PI * 2);
      const patrolX = -13.8 * islandLayoutScale + Math.cos(angle) * radius;
      const patrolZ = -4.05 * islandLayoutScale + Math.sin(angle) * 1.67 + index * 0.43;
      const x = interaction ? MathUtils.lerp(patrolX, interaction.center.x + Math.sin(interaction.heading) * 0.83, weight) : patrolX;
      const z = interaction ? MathUtils.lerp(patrolZ, interaction.center.z + Math.cos(interaction.heading) * 0.83, weight) : patrolZ;
      root.position.set(x, 0.09 + hop * hop * 0.29 + islandElevation(x, z), z);
      const patrolFacing = Math.atan2(-Math.sin(angle) * radius, Math.cos(angle) * 1.67);
      root.rotation.y = interaction ? facing(patrolFacing, interaction.heading + Math.PI, weight) : patrolFacing;
      root.rotation.x = step * 0.16;
      head.rotation.x = -step * 0.15 * (1 - weight) + (1 - hop) * 0.03 * Math.sin(time * 5 + index) - weight * (0.12 + Math.sin((interaction?.elapsed ?? 0) * 9) * 0.07);
      head.rotation.y = (1 - hop) * Math.sin(time * 1.7 + index) * 0.13;
      ears.forEach((ear, side) => {
        ear.rotation.x = 0.13 + hop * 0.39 + Math.sin(time * (3.9 + side * 0.57) + index) * 0.09;
        ear.rotation.z = (side ? -1 : 1) * (0.15 + hop * 0.076);
      });
      hind.forEach((leg) => { leg.rotation.x = step * -0.57 + hop * 0.18; });
      front.forEach((leg) => { leg.rotation.x = step * 0.44 - hop * 0.29; });
    });
    birds.forEach(({ root, wings }, index) => {
      const interaction = reaction("bird", index);
      const weight = interaction ? MathUtils.smoothstep(interaction.influence, 0, 1) : 0;
      const angle = time * 0.45 - index * 0.19;
      const radius = index ? 15.3 + index * 0.57 : 5.1;
      const depth = index ? 11.2 : 4.7;
      const centerX = index ? -3 * islandLayoutScale : grove.x;
      const centerZ = index ? -2.4 * islandLayoutScale : grove.z;
      const altitude = index ? 9.4 + index * 0.31 : 5.2;
      const glide = 0.37 + 0.63 * (0.5 + Math.sin(time * 1.6 + index * 0.43) * 0.5);
      root.position.set(centerX + Math.cos(angle) * radius, altitude + Math.sin(angle * 2) * 0.75, centerZ + Math.sin(angle) * depth);
      root.rotation.y = Math.atan2(-Math.sin(angle) * radius, Math.cos(angle) * depth);
      root.rotation.z = 0.13 + Math.sin(angle * 1.1) * 0.16;
      if (interaction) {
        const arc = interaction.heading + interaction.elapsed * 1.65;
        const x = interaction.center.x + Math.sin(arc) * 2.6;
        const z = interaction.center.z + Math.cos(arc) * 2.6;
        root.position.set(MathUtils.lerp(root.position.x, x, weight), MathUtils.lerp(root.position.y, islandElevation(x, z) + 2.6, weight), MathUtils.lerp(root.position.z, z, weight));
        root.rotation.y = facing(root.rotation.y, arc + Math.PI / 2, weight);
      }
      const phase = (interaction?.elapsed ?? time) * 11.4 + index * 0.66;
      wings.forEach(({ pivot, tip }, side) => {
        const sign = side ? 1 : -1;
        pivot.rotation.z = sign * (0.08 + Math.sin(phase) * glide * 0.79);
        tip.rotation.z = sign * Math.sin(phase - 0.64) * glide * 0.34;
        tip.rotation.y = sign * (0.14 + Math.cos(phase) * glide * 0.12);
      });
    });
    butterflies.forEach(({ root, wings }, index) => {
      const interaction = reaction("butterfly", index);
      const weight = interaction ? MathUtils.smoothstep(interaction.influence, 0, 1) : 0;
      const angle = time * (0.8 + index * 0.06) + index * 2.39996;
      const flutter = time * 0.61 + index * 1.31;
      const x = (index < 3 ? -13.0 * islandLayoutScale : islandPond.x - 3.7) + Math.cos(angle) * 1.3 + Math.sin(flutter * 2.4) * 0.26;
      const z = (index < 3 ? -4.9 * islandLayoutScale : islandPond.z + 2.2) + Math.sin(angle) * 1.14;
      root.position.set(x, 0.87 + Math.sin(time * 2.1 + index) * 0.32 + islandElevation(x, z), z);
      root.rotation.y = Math.atan2(-Math.sin(angle) * 1.3, Math.cos(angle) * 1.14);
      root.rotation.x = Math.cos(flutter * 3.0) * 0.19;
      if (interaction) {
        const { center, heading } = interaction;
        const x = center.x + Math.cos(heading) * 0.29 + Math.sin(heading) * 0.31;
        const z = center.z - Math.sin(heading) * 0.29 + Math.cos(heading) * 0.31;
        root.position.set(MathUtils.lerp(root.position.x, x, weight), MathUtils.lerp(root.position.y, center.y + 0.78, weight), MathUtils.lerp(root.position.z, z, weight));
        root.rotation.y = facing(root.rotation.y, heading, weight);
      }
      const flap = MathUtils.lerp(0.18 + Math.sin((interaction?.elapsed ?? time) * 18 + index * 1.2) * 1.08, 0.38 + Math.sin((interaction?.elapsed ?? 0) * 3) * 0.13, weight);
      wings[0].rotation.z = -flap;
      wings[1].rotation.z = flap;
    });
  }

  update(0);
  return {
    update,
    nearbyActions,
    interact,
    get activeAction() { return encounter?.action ?? null; },
    dispose() {
      animals.dispose();
      lotusPond.dispose();
      [sphere, box, ring, pad].forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      rippleMaterials.forEach((material) => material.dispose());
    },
  };
}
