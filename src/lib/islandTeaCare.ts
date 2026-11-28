import { Group, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from "three";

export type TeaAction = "water" | "harvest";
type Stage = "dry" | "watering" | "ready" | "harvesting";
export type TeaPrompt = { row: number; stage: Stage; harvests: number };

export function createTeaCare(rows: Vector3[][], notify: (prompt: TeaPrompt | null) => void) {
  const group = new Group();
  const sprig = new SphereGeometry(1, 5, 3);
  const material = new MeshBasicMaterial({ color: "#b9d975" });
  const dropsMaterial = new MeshBasicMaterial();
  const tips = new InstancedMesh(sprig, material, rows.flat().length * 2);
  const particles = new InstancedMesh(sprig, dropsMaterial, 30);
  particles.frustumCulled = false;
  particles.visible = false;
  group.add(tips, particles);
  const transform = new Object3D();
  const stages: Stage[] = rows.map(() => "dry");
  const offsets: number[] = [];
  let offset = 0;
  for (const row of rows) { offsets.push(offset); offset += row.length * 2; }
  function showTips(row: number, growth: number) {
    rows[row].forEach((p, i) => {
      for (const [index, side] of [-1, 1].entries()) {
        transform.position.set(p.x + side * .055, p.y + .045 * growth, p.z);
        transform.rotation.set(.12, i * 1.7, -side * .62);
        transform.scale.set(.056 * growth, .15 * growth, .035 * growth);
        transform.updateMatrix();
        tips.setMatrixAt(offsets[row] + i * 2 + index, transform.matrix);
      }
    });
    tips.instanceMatrix.needsUpdate = true;
  }
  rows.forEach((_, row) => showTips(row, .35));
  let nearestRow = -1, harvests = 0, elapsed = 0, activeRow = -1, emitParticles = true;
  let published = "";
  const origin = new Vector3(), target = new Vector3(), nearest = new Vector3();
  function begin(row: number, action: TeaAction, from: Vector3, emit: boolean) {
    if (row < 0 || row >= rows.length || activeRow >= 0) return false;
    if (stages[row] !== (action === "water" ? "dry" : "ready")) return false;
    activeRow = row;
    stages[activeRow] = action === "water" ? "watering" : "harvesting";
    let best = rows[row][0];
    let bestDistance = Infinity;
    for (const plant of rows[row]) {
      const distance = (plant.x - from.x) ** 2 + (plant.z - from.z) ** 2;
      if (distance < bestDistance) { best = plant; bestDistance = distance; }
    }
    origin.copy(from);
    if (origin.y < 0.4) origin.y += 0.9;
    target.copy(best);
    elapsed = 0;
    emitParticles = emit;
    dropsMaterial.color.set(action === "water" ? "#8fd8ee" : "#d2ef78");
    return true;
  }
  function act(action: TeaAction, player: Vector3) {
    return begin(nearestRow, action, player, true);
  }
  function tendRow(row: number, action: TeaAction, from: Vector3) {
    return begin(row, action, from, false);
  }
  function update(dt: number, player: Vector3, available: boolean, motion: boolean) {
    if (activeRow >= 0) {
      elapsed += dt;
      const water = stages[activeRow] === "watering";
      const t = Math.min(1, elapsed / (water ? 1.65 : 1.1));
      particles.visible = emitParticles && motion && t < 1;
      if (particles.visible) {
        for (let i = 0; i < particles.count; i++) {
          const f = Math.max(0, Math.min(1, (t - .28 * i / particles.count) / .72));
          const fall = water ? f * f : f;
          transform.position.lerpVectors(water ? origin : target, water ? target : origin, fall);
          const arc = Math.sin(Math.PI * f);
          transform.position.y += arc * (water ? 0.16 * (1.15 - f) : 0.34);
          transform.position.x += arc * (water ? 0.05 : 0.08) * Math.cos(i * 2.4);
          transform.position.z += arc * (water ? 0.05 : 0.08) * Math.sin(i * 2.4);
          transform.rotation.set(f * 4, i, 0.2);
          const size = water ? 0.018 + arc * 0.012 : 0.03 * (1 - f * 0.35);
          transform.scale.set(size, water ? size * 1.8 : size, size);
          transform.updateMatrix();
          particles.setMatrixAt(i, transform.matrix);
        }
        particles.instanceMatrix.needsUpdate = true;
      }
      showTips(activeRow, water ? .35 + t : 1.35 - t);
      if (t === 1) {
        stages[activeRow] = water ? "ready" : "dry";
        if (!water) harvests++;
        activeRow = -1;
      }
    }
    nearestRow = -1;
    let distance = 1.5 ** 2;
    if (available) rows.forEach((row, index) => {
      row.forEach(p => {
        const d = (player.x - p.x) ** 2 + (player.z - p.z) ** 2;
        if (d < distance) { nearestRow = index; distance = d; nearest.copy(p); }
      });
    });
    const row = available && activeRow >= 0 ? activeRow : nearestRow;
    const key = row < 0 ? "" : [row, stages[row], harvests].join("/");
    if (key !== published) {
      published = key;
      notify(row < 0 ? null : { row, stage: stages[row], harvests });
    }
  }
  return { group, act, tendRow, update, dispose() {
    tips.dispose(); particles.dispose(); sprig.dispose(); material.dispose(); dropsMaterial.dispose();
  } };
}
