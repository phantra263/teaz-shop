import { islandBounds, islandCoastRatio, islandGround, islandLandRadius, pondBankDistance } from "./islandTerrain";

type Point = { x: number; z: number };
type SolidKind = "tree" | "rock" | "building";
export type IslandObstacle = SolidKind | "water";
type Solid = { x: number; z: number; width: number; depth: number; cos: number; sin: number; reach: number; box: boolean; kind: SolidKind };

const playerRadius = 0.24;
const cellSize = 0.48;
const columnCount = Math.ceil(islandBounds.x * 2 / cellSize) + 1;
const rowCount = Math.ceil(islandBounds.z * 2 / cellSize) + 1;
const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

export function createIslandNavigation() {
  const solids: Solid[] = [];
  let grid: Uint8Array | undefined;

  function obstacleAt(x: number, z: number, padding = playerRadius): IslandObstacle | undefined {
    if (islandCoastRatio(x, z) > islandLandRadius - padding / islandGround.z || pondBankDistance(x, z) < padding) return "water";
    for (const solid of solids) {
      const dx = x - solid.x;
      const dz = z - solid.z;
      if (Math.abs(dx) > solid.reach + padding || Math.abs(dz) > solid.reach + padding) continue;
      const lx = Math.abs(dx * solid.cos - dz * solid.sin);
      const lz = Math.abs(dx * solid.sin + dz * solid.cos);
      if (solid.box) {
        if (Math.hypot(Math.max(0, lx - solid.width), Math.max(0, lz - solid.depth)) < padding) return solid.kind;
      } else if (Math.hypot(lx / (solid.width + padding), lz / (solid.depth + padding)) < 1) return solid.kind;
    }
    return undefined;
  }

  function clearSegment(a: Point, b: Point) {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.14));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      if (obstacleAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  function cellPoint(index: number): Point {
    return { x: index % columnCount * cellSize - islandBounds.x, z: Math.floor(index / columnCount) * cellSize - islandBounds.z };
  }

  function nearbyCell(point: Point, walkable: Uint8Array, link: boolean) {
    const cx = Math.round((point.x + islandBounds.x) / cellSize);
    const cz = Math.round((point.z + islandBounds.z) / cellSize);
    for (let ring = 0; ring <= 7; ring++) {
      let nearest = -1;
      let distance = Infinity;
      for (let z = Math.max(0, cz - ring); z <= Math.min(rowCount - 1, cz + ring); z++) {
        for (let x = Math.max(0, cx - ring); x <= Math.min(columnCount - 1, cx + ring); x++) {
          if (Math.max(Math.abs(x - cx), Math.abs(z - cz)) !== ring) continue;
          const index = z * columnCount + x;
          if (!walkable[index]) continue;
          const p = cellPoint(index);
          const score = (point.x - p.x) ** 2 + (point.z - p.z) ** 2;
          if (score < distance && (!link || clearSegment(point, p))) {
            nearest = index;
            distance = score;
          }
        }
      }
      if (nearest !== -1) return nearest;
    }
    return -1;
  }

  function route(start: Point, destination: Point): Point[] | undefined {
    let end = destination;
    if (obstacleAt(end.x, end.z)) {
      const length = Math.hypot(start.x - end.x, start.z - end.z);
      if (length < 0.16) return;
      for (let offset = 0.16; offset <= Math.min(length, 6); offset += 0.16) {
        const t = offset / length;
        const point = { x: destination.x + (start.x - destination.x) * t, z: destination.z + (start.z - destination.z) * t };
        if (!obstacleAt(point.x, point.z)) {
          end = point;
          break;
        }
      }
    }
    if (clearSegment(start, end)) return [end];
    const blockedEnd = !!obstacleAt(end.x, end.z);

    if (!grid) {
      grid = new Uint8Array(columnCount * rowCount);
      for (let index = 0; index < grid.length; index++) {
        const point = cellPoint(index);
        grid[index] = obstacleAt(point.x, point.z, playerRadius + 0.082) ? 0 : 1;
      }
    }
    const from = nearbyCell(start, grid, true);
    const to = nearbyCell(end, grid, !blockedEnd);
    if (from < 0 || to < 0) return;
    if (blockedEnd) end = cellPoint(to);
    const goal = cellPoint(to);
    const queue = new Set([from]);
    const previous = new Int32Array(grid.length).fill(-1);
    const cost = new Float32Array(grid.length).fill(Infinity);
    const score = new Float32Array(grid.length);
    cost[from] = 0;
    while (queue.size) {
      let current = -1;
      let best = Infinity;
      for (const index of queue) {
        if (score[index] < best) { current = index; best = score[index]; }
      }
      if (current === to) break;
      queue.delete(current);
      const x = current % columnCount;
      const z = Math.floor(current / columnCount);
      for (const [dx, dz] of directions) {
        const nx = x + dx;
        const nz = z + dz;
        if (nx < 0 || nx >= columnCount || nz < 0 || nz >= rowCount) continue;
        const next = nz * columnCount + nx;
        if (!grid[next]) continue;
        if (dx && dz && (!grid[current + dx] || !grid[current + dz * columnCount])) continue;
        const traveled = cost[current] + (dx && dz ? Math.SQRT2 : 1) * cellSize;
        if (traveled >= cost[next] - 0.0001 || !clearSegment(cellPoint(current), cellPoint(next))) continue;
        cost[next] = traveled;
        previous[next] = current;
        score[next] = traveled + Math.hypot(goal.x - cellPoint(next).x, goal.z - cellPoint(next).z);
        queue.add(next);
      }
    }
    if (from !== to && previous[to] < 0) return;

    const raw = [end];
    for (let index = to; index >= 0; index = previous[index]) raw.push(cellPoint(index));
    raw.reverse();
    const result: Point[] = [];
    let anchor = start;
    for (let index = 0; index < raw.length;) {
      let next = raw.length - 1;
      while (next > index && !clearSegment(anchor, raw[next])) next--;
      anchor = raw[next];
      result.push(anchor);
      index = next + 1;
    }
    return result;
  }

  return {
    addSolid(kind: SolidKind, x: number, z: number, width: number, depth: number, rotation = 0) {
      const box = kind === "building";
      solids.push({ kind, x, z, width, depth, cos: Math.cos(rotation), sin: Math.sin(rotation), reach: box ? Math.hypot(width, depth) : Math.max(width, depth), box });
      grid = undefined;
    },
    route,
    move(position: Point, dx: number, dz: number) {
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.085));
      const stepX = dx / steps;
      const stepZ = dz / steps;
      let blocked: IslandObstacle | undefined;
      for (let step = 0; step < steps; step++) {
        const hit = obstacleAt(position.x + stepX, position.z + stepZ);
        if (!hit) {
          position.x += stepX;
          position.z += stepZ;
        } else {
          blocked = hit;
          if (stepX && !obstacleAt(position.x + stepX, position.z)) position.x += stepX;
          if (stepZ && !obstacleAt(position.x, position.z + stepZ)) position.z += stepZ;
        }
      }
      return blocked;
    },
  };
}
