import {
  BoxGeometry, Group, Mesh, MeshStandardMaterial,
  SphereGeometry, MathUtils, Vector3, type Scene,
} from "three";
import { islandAnimalActions, type IslandAnimalAction } from "../data/islandInteractions";
import { islandStops } from "../data/island";
import { createIslandLotuses } from "./islandLotuses";
import { createIslandAnimals } from "./islandAnimals";
import { createLotusPond, pondWaterHeight } from "./islandPond";
import { islandElevation, islandLayoutScale, islandPond, pondBankDistance, pondRadiusAt } from "./islandTerrain";

export function createIslandWildlife(scene: Scene) {
  const habitat = new Group();
  scene.add(habitat);
  const sphere = new SphereGeometry(1, 12, 8);
  const box = new BoxGeometry();
  const animals = createIslandAnimals();
  const lotuses = createIslandLotuses();
  const materials = new Map<string, MeshStandardMaterial>();
  const lotusPond = createLotusPond();
  const pond = lotusPond.group;
  habitat.add(pond);
  pond.add(lotuses.group);

  function shape(parent: Group, geometry: typeof sphere | typeof box, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
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
    return { ...model, velocity: new Vector3() };
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
    lotuses.group.position.y = pondWaterHeight + .006 * Math.sin(time * 1.4);
    lotuses.group.rotation.y = .003 * Math.sin(time * .74);
    ducks.forEach(({ root: duck, head, velocity }, index) => {
      const interaction = reaction("duck");
      const weight = interaction ? MathUtils.smoothstep(interaction.influence, 0, 1) : 0;
      const stroke = time * (3.3 + index * .16) + index * 2.1;
      const patrol = time * .31 + .08 * Math.sin(time * .62 + index) - index * .56 + 2;
      const bank = interaction ? Math.atan2(interaction.center.z - islandPond.z, interaction.center.x - islandPond.x) : patrol;
      const angle = facing(interaction && !interaction.leaving ? interaction.duckAngles[index] : patrol, bank + (index - 1) * 0.24, weight);
      const radius = MathUtils.lerp(pondRadiusAt(angle) * (0.65 + index * 0.035), pondRadiusAt(angle) - 0.38, weight);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (delta > 0) {
        const blend = 1 - Math.exp(-7 * delta);
        velocity.x = MathUtils.lerp(velocity.x, (x - duck.position.x) / delta, blend);
        velocity.z = MathUtils.lerp(velocity.z, (z - duck.position.z) / delta, blend);
      }
      const speed = Math.min(1, velocity.length());
      const heading = speed > .05 ? Math.atan2(velocity.x, velocity.z) : weight > .5 ? Math.PI / 2 - bank : duck.rotation.y;
      duck.rotation.y = delta ? facing(duck.rotation.y, heading, 1 - Math.exp(-5 * delta)) : -angle;
      duck.position.set(x, pondWaterHeight - .028 + Math.sin(stroke) * .009, z);
      duck.rotation.z = Math.sin(stroke) * (.009 + speed * .021);
      duck.rotation.x = .018 * speed * Math.sin(stroke * 2);
      const dabble = Math.pow(Math.max(0, Math.sin(time * .86 + index * 2.2)), 12);
      head.rotation.x = .055 * Math.sin(stroke) + dabble * .65 + weight * .13;
      head.position.y = .274 - dabble * .084;
      head.rotation.y = .15 * Math.sin(time * 1.1 + index * 1.8);
      lotusPond.setSwimmer(index, x, z, velocity.x, velocity.z);
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
      lotuses.dispose();
      [sphere, box].forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
