import {
  CircleGeometry, CylinderGeometry, Group, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, SphereGeometry, Vector3,
} from "three";

type Drop = { p: Vector3; v: Vector3; life: number; splash: boolean };
type Bud = { start: Vector3; age: number; delay: number };
type Phase = "walk" | "water" | "harvest";

export function createTeaWork(
  rows: Vector3[][],
  traveler: Group,
  tend: { water: (row: number, from: Vector3) => void; harvest: (row: number, from: Vector3) => void },
) {
  const rightArm = traveler.getObjectByName("rightArm") as Group;
  const leftArm = traveler.getObjectByName("leftArm") as Group;
  const leftLeg = traveler.getObjectByName("leftLeg") as Group;
  const rightLeg = traveler.getObjectByName("rightLeg") as Group;

  const can = new Group();
  can.position.set(0.045, -0.25, 0.05);
  can.visible = false;
  rightArm.add(can);
  const metal = new MeshStandardMaterial({ color: "#79c3d4", roughness: 0.42, metalness: 0.18 });
  const cylinder = new CylinderGeometry(1, 1, 1, 10);
  const body = new Mesh(cylinder, metal);
  body.scale.set(0.075, 0.12, 0.075);
  can.add(body);
  const rim = new Mesh(cylinder, new MeshStandardMaterial({ color: "#e7f7fb", roughness: 0.3 }));
  rim.position.y = 0.055;
  rim.scale.set(0.05, 0.018, 0.05);
  can.add(rim);
  const spout = new Mesh(cylinder, metal);
  spout.position.set(0, 0.02, 0.09);
  spout.rotation.x = Math.PI / 2.4;
  spout.scale.set(0.018, 0.11, 0.018);
  can.add(spout);
  const spoutTip = new Object3D();
  spoutTip.position.set(0, 0.015, 0.16);
  can.add(spoutTip);

  const basket = new Group();
  basket.position.set(-0.16, 0.4, 0.1);
  basket.visible = false;
  traveler.add(basket);
  const weave = new MeshStandardMaterial({ color: "#b7844f", roughness: 0.9 });
  const bowl = new Mesh(cylinder, weave);
  bowl.scale.set(0.11, 0.07, 0.11);
  basket.add(bowl);
  const hold = new Object3D();
  hold.position.set(0, 0.08, 0);
  basket.add(hold);

  const group = new Group();
  const dropGeometry = new SphereGeometry(1, 6, 4);
  const dropMaterial = new MeshBasicMaterial({ color: "#9adff0", transparent: true, opacity: 0.82, depthWrite: false });
  const dropsMesh = new InstancedMesh(dropGeometry, dropMaterial, 42);
  dropsMesh.frustumCulled = false;
  dropsMesh.visible = false;
  const budMaterial = new MeshBasicMaterial({ color: "#c6e36a" });
  const budsMesh = new InstancedMesh(dropGeometry, budMaterial, 7);
  budsMesh.frustumCulled = false;
  budsMesh.visible = false;
  const rippleMaterial = new MeshBasicMaterial({ color: "#d7f4fb", transparent: true, opacity: 0, depthWrite: false });
  const ripple = new Mesh(new CircleGeometry(0.16, 14), rippleMaterial);
  ripple.rotation.x = -Math.PI / 2;
  ripple.visible = false;
  group.add(dropsMesh, budsMesh, ripple);

  const drops: Drop[] = [];
  const buds: Bud[] = [];
  const dummy = new Object3D();
  const hand = new Vector3();
  const caught = new Vector3();
  const aim = new Vector3();
  const stand = new Vector3();
  let active = false;
  let row = 0;
  let phase: Phase = "walk";
  let phaseTime = 0;
  let planted = false;
  let spawn = 0;
  let stuck = 0;
  let previousDistance = Infinity;
  let rippleLife = 0;

  function ordered(index: number) {
    const plants = rows[index] ?? [];
    return index % 2 === 0 ? plants : [...plants].reverse();
  }

  function place(index: number, end: boolean) {
    const plants = ordered(index);
    const plant = plants[end ? Math.min(3, plants.length - 1) : 1] ?? plants[0];
    if (!plant) return null;
    stand.set(plant.x, 0, plant.z + 0.62);
    aim.copy(plant);
    return stand;
  }

  function nextRow() {
    row = (row + 1) % Math.max(1, rows.length);
    phase = "walk";
    phaseTime = 0;
    planted = false;
    stuck = 0;
    previousDistance = Infinity;
    can.visible = false;
    basket.visible = false;
  }

  function start() {
    if (!rows.length) return;
    active = true;
    row = 0;
    phase = "walk";
    phaseTime = 0;
    planted = false;
    stuck = 0;
    previousDistance = Infinity;
  }

  function stop() {
    active = false;
    can.visible = false;
    basket.visible = false;
    dropsMesh.visible = false;
    budsMesh.visible = false;
    ripple.visible = false;
    drops.length = 0;
    buds.length = 0;
  }

  function steer(position: Vector3, delta: number, motion: boolean) {
    if (!active || !motion) return null;
    const spot = place(row, phase !== "walk");
    if (!spot) { nextRow(); return null; }
    phaseTime += delta;
    const distance = Math.hypot(spot.x - position.x, spot.z - position.z);
    if (distance < previousDistance - 0.012) { stuck = 0; previousDistance = distance; }
    else stuck += delta;

    if (phase === "walk" && (distance < 0.18 || stuck > 0.85)) {
      phase = "water";
      phaseTime = 0;
      planted = false;
      stuck = 0;
      previousDistance = Infinity;
    } else if (phase === "water" && ((distance < 0.22 && phaseTime > 1.25) || phaseTime > 2.4)) {
      phase = "harvest";
      phaseTime = 0;
      planted = false;
      stuck = 0;
      buds.length = 0;
      for (let index = 0; index < budsMesh.count; index++) {
        buds.push({
          start: aim.clone().add(new Vector3(Math.cos(index) * 0.08, 0.05 + index * 0.012, Math.sin(index) * 0.06)),
          age: 0,
          delay: index * 0.16,
        });
      }
    } else if (phase === "harvest" && phaseTime > 1.85) nextRow();

    if ((phase === "water" || phase === "harvest") && !planted) {
      const action = phase === "water" ? tend.water : tend.harvest;
      action(row, position);
      planted = true;
    }
    if (phase === "harvest") return null;
    return { x: spot.x, z: spot.z, speed: phase === "water" ? 0.62 : 1.65 };
  }

  function look() {
    return active && phase !== "walk" ? aim : null;
  }

  function pose(delta: number, motion: boolean) {
    if (!active) {
      can.visible = false;
      basket.visible = false;
      dropsMesh.visible = false;
      budsMesh.visible = false;
      ripple.visible = false;
      return;
    }
    const pouring = phase === "water" && motion;
    const picking = phase === "harvest" && motion;
    const pour = pouring ? Math.min(1, phaseTime / 0.28) : 0;
    const crouch = picking ? Math.min(1, phaseTime / 0.32) : 0;
    can.visible = pouring;
    basket.visible = picking;
    if (!pouring && !picking) traveler.rotation.x = 0;
    if (pouring) {
      rightArm.rotation.x = -1.22 * pour;
      rightArm.rotation.z = -0.28 * pour;
      traveler.rotation.x = 0.2 * pour;
      can.rotation.x = -0.55 * pour;
    }
    if (picking) {
      const pinch = Math.sin(phaseTime * 9) * 0.08;
      traveler.rotation.x = 0.62 * crouch;
      traveler.position.y = -0.1 * crouch;
      rightArm.rotation.x = -1.05 * crouch + pinch;
      rightArm.rotation.z = -0.2 * crouch;
      leftArm.rotation.x = -0.55 * crouch;
      leftLeg.rotation.x = 0.45 * crouch;
      rightLeg.rotation.x = 0.38 * crouch;
    }

    if (!pouring) {
      dropsMesh.visible = false;
      ripple.visible = false;
    } else {
      const step = Math.min(delta, 0.05);
      spoutTip.getWorldPosition(hand);
      spawn += step;
      while (spawn > 0.04 && drops.length < dropsMesh.count) {
        spawn -= 0.04;
        const velocity = aim.clone().sub(hand);
        velocity.y -= 0.15;
        velocity.normalize().multiplyScalar(2.15);
        velocity.x += (Math.random() - 0.5) * 0.28;
        velocity.z += (Math.random() - 0.5) * 0.28;
        velocity.y += 0.55;
        drops.push({ p: hand.clone(), v: velocity, life: 0, splash: false });
      }
      for (let index = drops.length - 1; index >= 0; index--) {
        const drop = drops[index];
        drop.life += step;
        drop.v.y -= (drop.splash ? 9 : 7.5) * step;
        drop.p.addScaledVector(drop.v, step);
        const hit = drop.p.distanceTo(aim) < 0.2 && drop.v.y < 0;
        if (!drop.splash && hit) {
          drop.splash = true;
          drop.life = 0;
          drop.v.set((drop.p.x - aim.x) * 6, 1.1 + Math.random() * 0.5, (drop.p.z - aim.z) * 6);
          ripple.position.set(aim.x, aim.y - 0.22, aim.z);
          ripple.visible = true;
          rippleLife = 0;
        }
        if (drop.life > (drop.splash ? 0.28 : 0.85) || drop.p.y < aim.y - 0.7) drops.splice(index, 1);
      }
      dropsMesh.visible = drops.length > 0;
      dummy.position.set(0, -10, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      for (let index = 0; index < dropsMesh.count; index++) {
        const drop = drops[index];
        if (drop) {
          dummy.position.copy(drop.p);
          const size = drop.splash ? 0.02 : 0.028 + Math.max(0, -drop.v.y) * 0.004;
          dummy.scale.set(size, drop.splash ? size : size * 1.7, size);
          dummy.updateMatrix();
        }
        dropsMesh.setMatrixAt(index, dummy.matrix);
        dummy.scale.setScalar(0);
        dummy.position.set(0, -10, 0);
        dummy.updateMatrix();
      }
      dropsMesh.instanceMatrix.needsUpdate = true;
      if (ripple.visible) {
        rippleLife += step;
        ripple.scale.setScalar(1 + rippleLife * 5);
        rippleMaterial.opacity = Math.max(0, 0.45 - rippleLife);
        if (rippleLife > 0.45) ripple.visible = false;
      }
    }

    if (!picking) budsMesh.visible = false;
    else {
      const step = Math.min(delta, 0.05);
      hold.getWorldPosition(caught);
      budsMesh.visible = true;
      for (let index = 0; index < buds.length; index++) {
        const bud = buds[index];
        bud.age += step;
        const flight = Math.max(0, Math.min(1, (bud.age - bud.delay) / 0.42));
        dummy.position.lerpVectors(bud.start, caught, flight);
        dummy.position.y += Math.sin(Math.PI * flight) * 0.32;
        const size = flight >= 1 ? 0 : 0.03 * (1 - flight * 0.25);
        dummy.scale.setScalar(size);
        dummy.updateMatrix();
        budsMesh.setMatrixAt(index, dummy.matrix);
      }
      budsMesh.instanceMatrix.needsUpdate = true;
    }
  }

  return {
    group,
    get active() { return active; },
    start,
    stop,
    steer,
    look,
    pose,
    dispose() {
      dropGeometry.dispose();
      cylinder.dispose();
      dropMaterial.dispose();
      budMaterial.dispose();
      rippleMaterial.dispose();
      metal.dispose();
      weave.dispose();
      rim.material.dispose();
    },
  };
}
