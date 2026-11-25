import {
  AnimationClip, AnimationMixer, BoxGeometry, CapsuleGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, DirectionalLight,
  Fog, Group, HemisphereLight, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PCFShadowMap, PlaneGeometry, ShaderMaterial,
  NumberKeyframeTrack, OrthographicCamera, PerspectiveCamera, Plane, Raycaster, Scene, SphereGeometry, Spherical,
  Vector2, Vector3, WebGLRenderer, type BufferGeometry,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { islandStops, type IslandStopId } from "../data/island";
import type { IslandAnimalAction, IslandWildlifePrompt } from "../data/islandInteractions";
import { createIslandBark, createIslandBarkMaterial } from "./islandBark";
import { createIslandConifers } from "./islandConifers";
import { createMeadowTexture, createWoodlandFerns, createWoodlandFlowers, type FlowerPatch } from "./islandForestFloor";
import { createIslandGrass } from "./islandGrass";
import { createIslandLeaves, type FoliageCluster } from "./islandLeaves";
import { createIslandNavigation, type IslandObstacle } from "./islandNavigation";
import { createIslandRelief, createIslandShore, createIslandTrail } from "./islandRelief";
import { createIslandStone, createIslandStoneMaterial } from "./islandStone";
import { islandCoastPoint, islandCoastRatio, islandElevation, islandGround, islandLandRadius, islandLayoutScale, islandPond, pondRadiusAt } from "./islandTerrain";
import { createIslandSky } from "./islandSky";
import { createIslandWater } from "./islandWater";
import { createIslandWildlife } from "./islandWildlife";
import { islandWindGust } from "./islandWind";

const controlsByKey = new Map([
  ["w", [0, 1]], ["arrowup", [0, 1]], ["s", [0, -1]], ["arrowdown", [0, -1]],
  ["a", [-1, 0]], ["arrowleft", [-1, 0]], ["d", [1, 0]], ["arrowright", [1, 0]],
]);

export function mountIslandScene(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  map: HTMLCanvasElement | null,
  mapPlayer: HTMLSpanElement | null,
  markers: Readonly<Partial<Record<IslandStopId, HTMLButtonElement>>>,
  { onArrive, onCancelWalk, onWildlifeChange, onObstacle, onNearbyStop, initialMotion, initialStop }: {
    onArrive: (id: IslandStopId) => void;
    onCancelWalk: () => void;
    onWildlifeChange: (prompt: IslandWildlifePrompt) => void;
    onObstacle: (obstacle: IslandObstacle | null) => void;
    onNearbyStop: (id: IslandStopId | null) => void;
    initialMotion: boolean;
    initialStop: IslandStopId;
  },
) {
  const mobile = window.matchMedia("(pointer: coarse)").matches;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  let lightQuality = mobile || navigator.hardwareConcurrency <= 4 || (memory !== undefined && memory <= 4);
  const grassLayers = lightQuality ? 2 : 3;
  const gl = canvas.getContext("webgl2", { antialias: !lightQuality, alpha: false });
  if (!gl) return;

  const renderer = new WebGLRenderer({ canvas, context: gl });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new Scene();
  scene.background = new Color("#9bd6cf");
  const fog = new Fog("#b5dee5", 30, 93);
  scene.fog = fog;
  const overview = new OrthographicCamera(-20, 20, 15, -15, 0.1, 160);
  overview.position.set(15, 22, 33).multiplyScalar(islandLayoutScale);
  const explorer = new PerspectiveCamera(54, 1, 0.12, 185);
  let camera: OrthographicCamera | PerspectiveCamera = overview;
  const orbit = new OrbitControls<OrthographicCamera | PerspectiveCamera>(camera, canvas);
  orbit.target.set(0, 0, -0.5);
  orbit.enablePan = false;
  orbit.enableDamping = true;
  orbit.minPolarAngle = 0.35;
  orbit.maxPolarAngle = 1.19;
  orbit.minZoom = 0.68;
  orbit.maxZoom = 2.2;
  orbit.update();

  const sun = new DirectionalLight("#fff2cc", 2.62);
  sun.position.set(-34, 53, 37);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(lightQuality ? 1024 : 2048);
  sun.shadow.radius = 2.1;
  sun.shadow.bias = -0.00024;
  sun.shadow.normalBias = 0.065;
  const shadowSpan = islandGround.x + 5;
  Object.assign(sun.shadow.camera, { left: -shadowSpan, right: shadowSpan, top: shadowSpan, bottom: -shadowSpan, near: 1, far: 126 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, new HemisphereLight("#e5f3ff", "#4b6556", 1.29));

  const materials = new Map<string, MeshStandardMaterial>();
  const geometries = new Set<BufferGeometry>();
  const box = new BoxGeometry();
  const round = new CylinderGeometry(1, 1, 1, 64);
  const foliage = new SphereGeometry(1, 8, 6);
  const smooth = new SphereGeometry(1, 20, 14);
  const limb = new CapsuleGeometry(0.1, 0.14, 4, 10);
  const roofShape = new ConeGeometry(1, 1, 4);

  function solid(geometry: BufferGeometry, color: string, parent: Group | Scene, x: number, y: number, z: number) {
    let material = materials.get(color);
    if (!material) {
      material = new MeshStandardMaterial({ color, roughness: 0.85 });
      materials.set(color, material);
    }
    geometries.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function block(parent: Group | Scene, color: string, x: number, y: number, z: number, width: number, height: number, depth: number) {
    const mesh = solid(box, color, parent, x, y, z);
    mesh.scale.set(width, height, depth);
    return mesh;
  }

  const water = createIslandWater();
  scene.add(water.mesh);
  const sky = createIslandSky();
  sky.dome.visible = false;
  sky.cliffs.visible = false;
  scene.add(sky.dome, sky.cliffs);
  const wildlife = createIslandWildlife(scene);
  const navigation = createIslandNavigation();
  const shore = solid(createIslandShore(), "#fffdf9", scene, 0, 0, 0);
  shore.material.vertexColors = true;
  const meadowShape = createIslandRelief();
  const meadow = solid(meadowShape, "#ffffff", scene, 0, 0, 0);
  meadow.material.vertexColors = true;
  const pathMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.96 });

  const pathPoints: Vector3[] = [];
  const mapPaths: Vector3[][] = [];
  const pierStart = islandStops[0].z + 0.15;
  const pierEnd = islandCoastPoint(Math.PI / 2).z + 1.7;
  const grassClearings: [number, number, number, number][] = [
    [0, (pierStart + pierEnd) / 2, 1.27, (pierEnd - pierStart) / 2],
  ];

  function path(points: readonly (readonly [number, number])[]) {
    const curve = new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x * islandLayoutScale, 0, z * islandLayoutScale)));
    const samples = curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.18));
    pathPoints.push(...samples);
    mapPaths.push(samples);
    const shape = createIslandTrail(samples);
    geometries.add(shape);
    const strip = new Mesh(shape, pathMaterial);
    strip.receiveShadow = true;
    scene.add(strip);
  }
  path([[0, 11.5], [0.5, 8.4], [0, 5], [-1.3, 2.2], [-2.8, 0.2], [-6.3, -3.2]]);
  path([[-7.15, 2.7], [-5.3, 2.7], [-2.8, 0.2], [1.3, 0.1], [6, 2.4], [8, 2.55]]);
  path([[1.35, 0.15], [2.65, -1.8], [2.8, -4.6], [3.1, -6.6]]);
  path([[-6.3, -3.2], [-8.2, -2.7], [-10.7, -3.3], [-13.4, -4.1], [-15.1, -2.9]]);
  path([[8, 2.55], [10.1, 0.7], [11.5, -0.4], [12.4, -3.65]]);

  const mapX = (x: number) => 50 + x / islandGround.x * 44;
  const mapY = (z: number) => 50 + z / islandGround.z * 40;
  const mapContext = map?.getContext("2d");
  if (mapContext && map) {
    mapContext.scale(map.width / 100, map.height / 100);
    mapContext.fillStyle = "#23474a";
    mapContext.fillRect(0, 0, 100, 100);
    mapContext.beginPath();
    for (let index = 0; index < 128; index++) {
      const { x, z } = islandCoastPoint(index * Math.PI * 2 / 128);
      if (index === 0) mapContext.moveTo(mapX(x), mapY(z));
      else mapContext.lineTo(mapX(x), mapY(z));
    }
    mapContext.closePath();
    mapContext.fillStyle = "#6b8d61";
    mapContext.strokeStyle = "#d8bb83";
    mapContext.lineWidth = 1.8;
    mapContext.fill();
    mapContext.stroke();
    mapContext.strokeStyle = "#cbb488";
    mapContext.lineWidth = 1.5;
    mapContext.lineCap = "round";
    for (const points of mapPaths) {
      mapContext.beginPath();
      points.forEach(({ x, z }, index) => index ? mapContext.lineTo(mapX(x), mapY(z)) : mapContext.moveTo(mapX(x), mapY(z)));
      mapContext.stroke();
    }
    mapContext.fillStyle = "#4c8a88";
    mapContext.beginPath();
    for (let index = 0; index < 48; index++) {
      const angle = index * Math.PI * 2 / 48;
      const radius = pondRadiusAt(angle);
      const x = mapX(islandPond.x + Math.cos(angle) * radius);
      const z = mapY(islandPond.z + Math.sin(angle) * radius);
      if (index) mapContext.lineTo(x, z);
      else mapContext.moveTo(x, z);
    }
    mapContext.closePath();
    mapContext.fill();
    for (const stop of islandStops) {
      mapContext.fillStyle = "#f4e5bd";
      mapContext.beginPath();
      mapContext.arc(mapX(stop.x), mapY(stop.z), 1.7, 0, Math.PI * 2);
      mapContext.fill();
    }
  }

  const leaves = createIslandLeaves();
  const bark = createIslandBarkMaterial();
  const conifers = createIslandConifers(bark);
  const canopies: { branch: Group; x: number; z: number }[] = [];

  function tree(x: number, z: number, size: number, color: string, index: number) {
    navigation.addSolid("tree", x, z, 0.31 * size, 0.31 * size);
    const plant = new Group();
    plant.position.set(x, 0.08 + islandElevation(x, z), z);
    plant.scale.setScalar(size);
    plant.rotation.y = index * 2.39996;
    scene.add(plant);

    function wood(parent: Group, points: readonly (readonly [number, number, number])[], base: number, tip: number) {
      const geometry = createIslandBark(points, base, tip, index, true);
      geometries.add(geometry);
      const limb = new Mesh(geometry, bark);
      limb.castShadow = true;
      limb.receiveShadow = true;
      parent.add(limb);
    }

    const bend = Math.sin(index * 2.4) * 0.28;
    const lift = 1.55 + 0.15 * Math.cos(index * 1.38);
    wood(plant, [[0, -0.12, 0], [-bend * 0.2, 0.46, -0.08], [bend * 0.61, 1.03, -0.045], [bend, lift + 0.16, 0.025]], 0.275, 0.097);
    for (let root = 0; root < 4; root++) {
      const angle = root * Math.PI / 2 + index * 0.42;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);
      const length = 0.48 + 0.24 * (1 + Math.sin(root * 2.7 + index));
      wood(plant, [[0, 0.16, 0], [dx * 0.31, 0.045, dz * 0.31], [dx * length, -0.078, dz * length]], 0.14, 0.012);
    }

    const branch = new Group();
    branch.position.set(bend, lift, 0.025);
    plant.add(branch);
    wood(branch, [[-bend * 0.22, -0.31, -0.027], [bend * 0.24 + 0.02, 0.31, 0.08], [-bend * 0.4, 0.76, -0.08], [0.24, 1.41, -0.25]], 0.11, 0.024);
    const crown: FoliageCluster[] = [
      { center: new Vector3(0.19, 1.44, -0.14), spread: new Vector3(0.72, 0.38, 0.67) },
    ];
    for (let limb = 0; limb < 4; limb++) {
      const angle = limb * 1.64 + index * 0.67 + Math.sin(index + limb * 2.2) * 0.31;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);
      const reach = 1.07 + 0.3 * Math.sin(index + limb * 3.41);
      const top = 0.87 + 0.48 * (0.5 + 0.5 * Math.cos(index * 1.3 + limb * 3.7));
      const side = limb % 2 ? -1 : 1;
      const forkX = dx * reach * 0.73 + dz * side * 0.54;
      const forkZ = dz * reach * 0.73 - dx * side * 0.54;
      wood(branch, [[0.025, 0.09 + limb * 0.11, 0], [dx * reach * 0.37, top * 0.37, dz * reach * 0.37],
        [dx * reach * 0.74 + dz * 0.085, top * 0.69, dz * reach * 0.72], [dx * reach, top, dz * reach]], 0.095 - limb * 0.011, 0.014);
      wood(branch, [[dx * reach * 0.43, top * 0.43, dz * reach * 0.42],
        [dx * reach * 0.62 + dz * side * 0.28, top * 0.7, dz * reach * 0.6 - dx * side * 0.29],
        [forkX, top + 0.22 - limb * 0.042, forkZ]], 0.051 - limb * 0.006, 0.009);
      crown.push({ center: new Vector3(dx * (reach + 0.07), top + 0.18, dz * (reach + 0.06)),
        spread: new Vector3(0.57 + Math.abs(dz) * 0.22, 0.35 + limb * 0.035, 0.56 + Math.abs(dx) * 0.19) });
      crown.push({ center: new Vector3(forkX, top + 0.22 - limb * 0.03, forkZ),
        spread: new Vector3(0.44 + Math.abs(dx) * 0.12, 0.3, 0.42 + Math.abs(dz) * 0.12) });
    }
    leaves.plant(branch, crown, color);
    canopies.push({ branch, x, z });
  }

  const treeLocations: (readonly [number, number])[] = [
    [-10.7, 2.8], [-10.2, -0.8], [-9.4, -4.5], [-8.4, -6.1], [-3.4, -7], [-0.6, -7.55], [5.9, -6.7], [8.7, -5.2],
    [10.8, -2.3], [10.7, 1.1], [10.5, 3.5], [8.8, 5.9], [4.7, 7.15], [-3.6, 7.15], [-7.8, 5.3], [0.7, -3.2], [-3.1, 4.4], [4.1, 3.8],
    [-16.9, -3.9], [-15.4, -6.3], [-12.7, -7.4], [-16.8, -0.9], [-15.6, 2.5], [-13.8, 6.3], [-6.8, 9.7], [-2.4, 10.5],
    [3.5, 10.4], [9.2, 9], [13.7, 6.3], [14.4, 3.5], [18.1, 0.3], [14.3, -7.6], [10.4, -8.9], [5.1, -10.3], [0.7, -10.4],
  ].map(([x, z]) => [x * islandLayoutScale, z * islandLayoutScale] as const)
    .filter(([x, z]) => islandCoastRatio(x, z) < 0.93);
  const treeColors = ["#74a052", "#83a850", "#619452", "#92b45d"];
  treeLocations.forEach(([x, z], index) => tree(x, z, 0.81 + (index % 4) * 0.14 + (z > 3 ? 0.15 : 0), treeColors[index % treeColors.length], index));
  const meadowTexture = createMeadowTexture(treeLocations);
  if (meadowTexture) meadow.material.map = meadowTexture;
  const ferns = createWoodlandFerns(treeLocations, pathPoints);
  scene.add(ferns.mesh);

  const pines = [[-17.8, 1.2], [-12, 8.7], [-8, -10.1], [-11.2, -9.5], [6.3, 11], [11.4, 7.4], [17.8, 1.2], [11.8, -8.7],
    [-15.2, -4.5], [-14.5, -8.3], [-13.4, 0.5], [-11.5, 3.8], [-6.2, -7.2], [-4.5, -10.3], [1.9, -9.1], [6.5, -8.9],
    [7.7, -2.7], [12, 2.4], [9.7, 5.9], [4.8, 6], [-6.5, 6.5], [-3.7, 3.5], [2, 4.7], [2.7, 8.4]];
  for (const [index, [localX, localZ]] of pines.entries()) {
    const x = localX * islandLayoutScale;
    const z = localZ * islandLayoutScale;
    if (islandCoastRatio(x, z) > 0.93) continue;
    const pine = new Group();
    pine.position.set(x, 0.08 + islandElevation(x, z), z);
    pine.scale.set(0.86 + (index % 3) * 0.12, 1.02 + (index % 4) * 0.16, 0.86 + (index % 3) * 0.12);
    navigation.addSolid("tree", x, z, 0.22 * pine.scale.x, 0.22 * pine.scale.z);
    pine.rotation.y = index * 1.24;
    scene.add(pine);
    const branch = new Group();
    branch.position.y = 0.57;
    pine.add(branch);
    conifers.plant(pine, branch, index);
    canopies.push({ branch, x, z });
  }

  for (let index = 0; index < 24; index++) {
    const angle = index * 2.39996;
    const x = -14.1 * islandLayoutScale + Math.cos(angle) * (1.6 + index % 4 * 0.36);
    const z = -5.0 * islandLayoutScale + Math.sin(angle) * (0.85 + index % 5 * 0.21);
    const size = 0.12 + index % 5 * 0.04;
    const base = 0.09 + islandElevation(x, z);
    solid(round, "#ead5af", scene, x, base + size * 0.47, z).scale.set(size * 0.22, size, size * 0.22);
    solid(foliage, index % 2 ? "#b45e48" : "#d18956", scene, x, base + size, z).scale.set(size * 0.71, size * 0.34, size * 0.71);
  }

  treeLocations.forEach(([x, z], index) => {
    const petals = index % 3 === 0 ? "#ead195" : "#e5af97";
    for (let tuft = 0; tuft < 3; tuft++) {
      const angle = index * 2.4 + tuft * 2.1;
      const stemX = x + Math.cos(angle) * (0.67 + tuft * 0.22);
      const stemZ = z + Math.sin(angle) * (0.67 + tuft * 0.22);
      if (islandCoastRatio(stemX, stemZ) >= islandLandRadius) continue;
      const elevation = islandElevation(stemX, stemZ);
      solid(foliage, "#517d47", scene, stemX, 0.17 + elevation, stemZ).scale.set(0.2, 0.15, 0.16);
      solid(foliage, petals, scene, stemX + 0.045, 0.32 + elevation, stemZ).scale.set(0.087, 0.058, 0.082);
    }
  });

  const teaOrigin = { x: -4.8 * islandLayoutScale, z: -5.15 * islandLayoutScale };
  const teaBeds: Vector3[] = [];
  const teaCanopies: FoliageCluster[][] = [[], []];
  const teaField = new Group();
  scene.add(teaField);
  const teaStem = new CylinderGeometry(0.35, 1, 1, 7);
  const teaStemMaterial = new MeshStandardMaterial({ color: "#766345", roughness: 0.97 });
  const teaStems = new InstancedMesh(teaStem, teaStemMaterial, 4 * 8 * 3);
  teaStems.receiveShadow = true;
  teaField.add(teaStems);
  const teaTransform = new Object3D();
  let stemsPlanted = 0;
  for (let row = 0; row < 4; row++) {
    const centers: Vector3[] = [];
    for (let plant = 0; plant < 8; plant++) {
      const x = teaOrigin.x + plant * 0.59 + row % 2 * 0.24 + Math.sin(row * 2.17 + plant * 1.4) * 0.052;
      const z = teaOrigin.z - row * 0.77 + Math.sin(plant * 0.54 + row * 0.2) * 0.245;
      const growth = 0.94 + Math.sin(plant * 2.7 + row * 3.1) * 0.16;
      const groundY = 0.09 + islandElevation(x, z);
      centers.push(new Vector3(x, 0, z));
      for (let stem = 0; stem < 3; stem++) {
        const angle = stem * 2.39996 + plant * 0.82 + row;
        const dx = Math.cos(angle);
        const dz = Math.sin(angle);
        teaTransform.position.set(x + dx * 0.061, groundY + 0.13 * growth, z + dz * 0.061);
        teaTransform.rotation.set(dz * 0.39, angle, -dx * 0.39, "YXZ");
        teaTransform.scale.set(0.027, 0.31 * growth, 0.027);
        teaTransform.updateMatrix();
        teaStems.setMatrixAt(stemsPlanted++, teaTransform.matrix);
        teaCanopies[(stem + row) % 2].push({ center: new Vector3(x + dx * 0.135, groundY + (stem === 0 ? 0.39 : 0.27) * growth, z + dz * 0.128),
          spread: new Vector3(0.147 * growth, 0.102 * growth, 0.148 * growth) });
      }
    }
    const curve = new CatmullRomCurve3(centers);
    const samples = curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.19));
    teaBeds.push(...samples);
    const bed = createIslandTrail(samples, { width: 0.25, center: "#7b6649", edge: "#797f51" });
    geometries.add(bed);
    const soil = new Mesh(bed, pathMaterial);
    soil.receiveShadow = true;
    scene.add(soil);
  }
  leaves.plant(teaField, teaCanopies[0], "#4b8444", 0.51);
  leaves.plant(teaField, teaCanopies[1], "#76a04a", 0.47);

  const flowerPatches: FlowerPatch[] = [
    { x: teaOrigin.x - 0.55, z: teaOrigin.z - 1.35, radius: 0.78, count: 24 },
    { x: teaOrigin.x + 1.02, z: teaOrigin.z + 0.84, radius: 0.95, count: 28 },
    { x: teaOrigin.x + 3.08, z: teaOrigin.z + 0.65, radius: 0.91, count: 25 },
    { x: teaOrigin.x + 4.74, z: teaOrigin.z - 1.29, radius: 0.92, count: 24 },
    { x: teaOrigin.x + 3.64, z: teaOrigin.z - 3.03, radius: 0.79, count: 19 },
  ];
  mapPaths.forEach((points, trailIndex) => {
    for (let index = 8; index < points.length - 4; index += 13) {
      const { x, z } = points[index];
      const tangent = points[index + 2].clone().sub(points[index - 2]).normalize();
      const side = (index + trailIndex) % 2 ? -1 : 1;
      const offset = side * (1.08 + Math.sin(index * 0.74 + trailIndex) * 0.34);
      flowerPatches.push({ x: x + tangent.z * offset, z: z - tangent.x * offset, radius: 0.72 + Math.abs(Math.sin(index * 1.6)) * 0.47, count: 11 + index % 9 });
    }
  });

  const stones = [0.46, 1.74, 2.93, 4.56, 5.8].map((seed) => createIslandStone(seed));
  const stoneMaterial = createIslandStoneMaterial();
  stones.forEach((geometry) => geometries.add(geometry));

  function placeStone(index: number, x: number, z: number, width: number, height: number, depth: number, base = 0.085 + islandElevation(x, z)) {
    const stone = new Mesh(stones[index % stones.length], stoneMaterial);
    stone.position.set(x, base, z);
    stone.scale.set(width, height, depth);
    stone.rotation.y = index * 2.39996;
    if (height > 0.27) navigation.addSolid("rock", x, z, width * 1.14, depth * 1.14, stone.rotation.y);
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);
  }

  for (let index = 0; index < 64; index++) {
    const angle = index * 2.39996;
    const rocky = 0.5 - Math.cos(angle * 3 - 0.6) * 0.5;
    if (rocky < 0.57 && index % 5 !== 0) continue;
    const { x, z } = islandCoastPoint(angle, 0.981 + 0.013 * Math.sin(index * 1.9));
    if (z > pierStart && Math.abs(x) < 1.6) continue;
    const size = 0.35 + (index % 5) * (0.10 + rocky * 0.16);
    placeStone(index, x, z, size * 1.35, size * 0.75, size, -0.42 - Math.sin(index * 1.9) * 0.42);
    if (rocky > 0.83 && index % 3 === 1) {
      const outlying = islandCoastPoint(angle + 0.014, 1.035 + index % 4 * 0.008);
      placeStone(index + 2, outlying.x, outlying.z, size * 0.92, size * 0.68, size * 0.65, -1.73);
    }
  }
  const outcrops = [[4.2, 16.5, 2.05], [-4.7, 15.5, 1.2], [8.6, 13.3, 2.8], [-12.4, 9.8, 2.15], [-18.5, 1.9, 2.45], [-26.4, -11.8, 2.6],
    [-7.2, -15.8, 2.6], [10.1, -14.4, 2.7], [19.6, -13.1, 1.6], [22.2, 7.2, 2.1], [30.3, -2.6, 1.4], [29.3, 3.8, 1.8]];
  outcrops.forEach(([x, z, size], index) => {
    if (islandCoastRatio(x, z) > 0.925) return;
    placeStone(index, x, z, size, size * (0.74 + index % 3 * 0.11), size * 0.69);
    placeStone(index + 2, x + size * 0.7, z + size * 0.48, size * 0.52, size * 0.4, size * 0.42);
    placeStone(index + 3, x - size * 0.88, z + size * 0.47, size * 0.37, size * 0.27, size * 0.24);
  });

  const plankCount = Math.ceil((pierEnd - pierStart) / 0.36);
  for (let index = 0; index < plankCount; index++) {
    const z = pierStart + index * 0.36;
    block(scene, index % 2 ? "#ac784e" : "#966039", 0, 0.27, z, 2.2, 0.16, 0.34);
    if (index % 3 === 0) for (const side of [-1, 1]) block(scene, "#675042", side * 0.94, -0.28, z, 0.17, 1.53, 0.2);
  }
  const boat = new Group();
  boat.position.set(2.12, -1.25, pierEnd - 0.6);
  boat.rotation.y = -0.24;
  scene.add(boat);
  solid(foliage, "#a25b3e", boat, 0, 0, 0).scale.set(0.66, 0.3, 1.52);
  block(boat, "#e8c989", 0, 0.16, 0, 0.92, 0.15, 1.5);
  block(boat, "#786143", 0, 0.82, 0, 0.075, 1.62, 0.075);
  const sail = solid(roofShape, "#fff0bf", boat, 0.29, 0.86, 0);
  sail.scale.set(0.62, 1.33, 0.1);

  function cabin(localX: number, localZ: number, siding: string, roof: string) {
    const x = localX * islandLayoutScale;
    const z = localZ * islandLayoutScale;
    navigation.addSolid("building", x, z, 1.34, 1.02);
    grassClearings.push([x, z, 1.65, 1.33]);
    const group = new Group();
    group.position.set(x, 0.09 + islandElevation(x, z), z);
    scene.add(group);
    block(group, "#acb484", 0, 0.07, 0, 3.1, 0.14, 2.35);
    block(group, siding, 0, 0.98, 0, 2.6, 1.76, 1.92);
    const gable = solid(roofShape, siding, group, 0, 2.11, 0);
    gable.rotation.y = Math.PI / 4;
    gable.scale.set(1.84, 0.82, 1.36);
    const roofLight = `#${new Color(roof).lerp(new Color("#f5c895"), 0.17).getHexString()}`;
    for (const side of [-1, 1]) {
      const roofPanel = new Group();
      roofPanel.position.set(side * 0.78, 2.22, 0);
      roofPanel.rotation.z = -side * 0.48;
      group.add(roofPanel);
      block(roofPanel, roof, 0, 0, 0, 1.8, 0.15, 2.54);
      for (let board = 0; board < 11; board++) {
        const row = block(roofPanel, board % 3 === 0 ? roofLight : roof, 0, 0.09, -1.16 + board * 0.232, 1.77, 0.055, 0.206);
        row.position.x = board % 2 ? 0.015 : -0.015;
      }
      for (const end of [-1, 1]) block(roofPanel, "#684a39", 0, -0.018, end * 1.28, 1.86, 0.16, 0.08);
    }
    block(group, roofLight, 0, 2.66, 0, 0.19, 0.12, 2.65);
    block(group, "#604e3e", 0, 0.66, 0.98, 0.63, 1.13, 0.13);
    block(group, "#886349", 0, 0.64, 1.06, 0.44, 0.97, 0.07);
    solid(smooth, "#e2b463", group, 0.16, 0.61, 1.11).scale.setScalar(0.039);
    block(group, "#a99070", 0, 0.13, 1.19, 0.89, 0.23, 0.4);
    for (const side of [-1, 1]) {
      block(group, "#4d6b64", side * 0.79, 1.05, 0.98, 0.57, 0.59, 0.12);
      block(group, "#f4d795", side * 0.79, 1.05, 1.05, 0.38, 0.4, 0.025);
      block(group, "#7a6249", side * 0.79, 1.05, 1.073, 0.035, 0.4, 0.024);
      block(group, "#7a6249", side * 0.79, 1.05, 1.073, 0.4, 0.035, 0.024);
      block(group, "#855538", side * 0.79, 0.7, 1.09, 0.6, 0.13, 0.29);
      for (let flower = 0; flower < 3; flower++) {
        const flowerX = side * 0.79 + (flower - 1) * 0.16;
        solid(foliage, "#4f784e", group, flowerX, 0.8, 1.14).scale.set(0.11, 0.09, 0.105);
        solid(foliage, "#e9a677", group, flowerX, 0.88, 1.17).scale.setScalar(0.066);
      }
      for (const end of [-1, 1]) block(group, "#92664a", side * 1.27, 0.99, end * 0.94, 0.12, 1.76, 0.12);
    }
    return group;
  }

  const lab = cabin(-6.3, -4.45, "#f1dfb3", "#3e7771");
  block(lab, "#294951", 0, 1.55, 1.11, 1.14, 0.49, 0.14);
  [0.13, 0.2, 0.14, 0.31].forEach((height, index) => block(lab, "#a9e3b3", -0.35 + index * 0.22, 1.36 + height / 2, 1.19, 0.13, height, 0.028));
  const house = cabin(2.8, -5.95, "#ecd1a0", "#be7951");
  block(house, "#875e4e", 0.79, 2.34, -0.43, 0.33, 0.9, 0.35);
  const media = cabin(6, 0.95, "#ead8af", "#7776a0");
  block(media, "#56716e", 0.72, 2.72, 0, 0.08, 0.95, 0.08);
  solid(foliage, "#f3cc8a", media, 0.72, 3.21, 0).scale.setScalar(0.17);

  for (const [index, localX] of [-6.75, -4.24].entries()) {
    const x = localX * islandLayoutScale;
    const z = 1.32 * islandLayoutScale;
    navigation.addSolid("building", x, z + 0.07, 0.94, 0.73);
    grassClearings.push([x, z, 1.03, 0.92]);
    const stall = new Group();
    stall.position.set(x, 0.09 + islandElevation(x, z), z);
    scene.add(stall);
    const fabric = index ? "#d8965f" : "#669277";
    for (const dx of [-0.87, 0.87]) for (const dz of [-0.62, 0.62]) block(stall, "#8b6549", dx, 0.93, dz, 0.13, 1.82, 0.13);
    block(stall, "#b48758", 0, 0.53, 0.18, 1.84, 0.2, 0.91);
    for (let strip = 0; strip < 6; strip++) block(stall, strip % 2 ? "#f4dfb8" : fabric, -0.87 + strip * 0.346, 1.88, 0.08, 0.346, 0.14, 1.67);
    for (let boxIndex = 0; boxIndex < 3; boxIndex++) block(stall, boxIndex % 2 ? "#d49e65" : "#808d60", -0.57 + boxIndex * 0.48, 0.76, 0.15, 0.35, 0.26, 0.38);
  }

  const player = new Group();
  const spawn = islandStops.find(({ id }) => id === initialStop) ?? islandStops[0];
  player.position.set(spawn.x, 0.16 + islandElevation(spawn.x, spawn.z), spawn.z);
  player.rotation.y = Math.PI;
  player.scale.setScalar(1.12);
  scene.add(player);
  const grass = createIslandGrass(pathPoints, grassClearings, treeLocations, teaBeds, flowerPatches, grassLayers);
  const flowers = createWoodlandFlowers(treeLocations, flowerPatches, pathPoints, teaBeds, grassClearings);
  scene.add(grass.mesh, flowers.mesh);
  const traveler = new Group();
  traveler.name = "traveler";
  player.add(traveler);
  const skin = "#d89f74";
  const jacket = "#397960";
  const trousers = "#414952";
  const boots = "#634737";
  const scarf = "#d98353";

  solid(smooth, jacket, traveler, 0, 0.59, 0).scale.set(0.245, 0.27, 0.155);
  solid(smooth, "#275646", traveler, 0, 0.42, 0).scale.set(0.205, 0.095, 0.139);
  block(traveler, "#c9ad83", 0, 0.57, 0.157, 0.019, 0.275, 0.018);
  solid(round, scarf, traveler, 0, 0.79, 0.018).scale.set(0.165, 0.075, 0.14);
  block(traveler, "#ba6341", 0.09, 0.724, 0.144, 0.082, 0.15, 0.033).rotation.z = 0.17;

  solid(smooth, "#523a31", traveler, 0, 0.969, -0.05).scale.set(0.242, 0.232, 0.22);
  solid(smooth, skin, traveler, 0, 0.966, 0.035).scale.set(0.21, 0.21, 0.201);
  solid(smooth, skin, traveler, 0, 0.95, 0.228).scale.set(0.041, 0.038, 0.043);
  for (const side of [-1, 1]) {
    solid(smooth, skin, traveler, side * 0.198, 0.943, 0.038).scale.set(0.048, 0.065, 0.041);
    solid(smooth, "#322d26", traveler, side * 0.071, 0.993, 0.225).scale.set(0.022, 0.025, 0.012);
    solid(smooth, "#eee2c8", traveler, side * 0.071 - 0.006, 1, 0.235).scale.setScalar(0.007);
    block(traveler, "#765239", side * 0.15, 0.63, 0.119, 0.061, 0.27, 0.055).rotation.z = side * 0.15;
  }
  solid(round, "#e7c787", traveler, 0, 1.108, 0.003).scale.set(0.325, 0.038, 0.31);
  solid(smooth, "#d6ab6e", traveler, 0, 1.145, -0.015).scale.set(0.231, 0.113, 0.21);
  solid(round, "#74543a", traveler, 0, 1.132, -0.015).scale.set(0.235, 0.031, 0.214);
  solid(smooth, "#e3b270", traveler, 0, 0.58, -0.176).scale.set(0.198, 0.212, 0.129);
  solid(smooth, "#b67b4f", traveler, 0, 0.66, -0.247).scale.set(0.18, 0.109, 0.065);
  block(traveler, "#584536", 0, 0.595, -0.305, 0.053, 0.071, 0.025);

  for (const [side, direction] of [["left", -1], ["right", 1]] as const) {
    const arm = new Group();
    arm.name = `${side}Arm`;
    arm.position.set(direction * 0.218, 0.71, 0);
    traveler.add(arm);
    const sleeve = solid(limb, jacket, arm, direction * 0.021, -0.103, 0);
    sleeve.scale.set(0.71, 0.79, 0.73);
    sleeve.rotation.z = direction * 0.17;
    solid(smooth, skin, arm, direction * 0.045, -0.235, 0.007).scale.set(0.061, 0.066, 0.06);

    const leg = new Group();
    leg.name = `${side}Leg`;
    leg.position.set(direction * 0.105, 0.4, 0);
    traveler.add(leg);
    solid(limb, trousers, leg, 0, -0.137, 0).scale.set(0.79, 0.93, 0.81);
    solid(smooth, boots, leg, 0, -0.326, 0.046).scale.set(0.092, 0.066, 0.135);
    solid(smooth, "#d4bc96", leg, 0, -0.371, 0.047).scale.set(0.093, 0.031, 0.134);
  }
  const contactGeometry = new PlaneGeometry(0.95, 0.72);
  const contactMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 shadowPosition;
      void main() {
        shadowPosition = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 shadowPosition;
      void main() {
        float opacity = 0.39 * (1.0 - smoothstep(0.11, 1.0, length(shadowPosition)));
        gl_FragColor = vec4(0.07, 0.13, 0.12, opacity);
      }
    `,
  });
  const contactShadow = new Mesh(contactGeometry, contactMaterial);
  scene.add(contactShadow);
  const dustMaterial = new MeshBasicMaterial({ color: "#cbbb94", transparent: true, opacity: 0, depthWrite: false });
  const dust = new Group();
  const particles = Array.from({ length: 6 }, () => new Mesh(foliage, dustMaterial));
  dust.add(...particles);
  dust.visible = false;
  scene.add(dust);

  const walkDuration = 0.64;
  const steps = [0, 0.16, 0.32, 0.48, walkDuration];
  const walk = new AnimationClip("Walk", walkDuration, [
    new NumberKeyframeTrack("leftLeg.rotation[x]", steps, [0, -0.48, 0, 0.48, 0]),
    new NumberKeyframeTrack("rightLeg.rotation[x]", steps, [0, 0.48, 0, -0.48, 0]),
    new NumberKeyframeTrack("leftArm.rotation[x]", steps, [0, 0.32, 0, -0.32, 0]),
    new NumberKeyframeTrack("rightArm.rotation[x]", steps, [0, -0.32, 0, 0.32, 0]),
    new NumberKeyframeTrack("traveler.position[y]", steps, [0, 0.046, 0, 0.046, 0]),
  ]);
  const idle = new AnimationClip("Idle", 2.8, [
    new NumberKeyframeTrack("traveler.position[y]", [0, 1.4, 2.8], [0, 0.015, 0]),
  ]);
  const mixer = new AnimationMixer(player);
  const walkAction = mixer.clipAction(walk);
  const idleAction = mixer.clipAction(idle);
  const gestures = {
    rabbit: mixer.clipAction(new AnimationClip("Kneel", 1, [
      new NumberKeyframeTrack("traveler.scale[y]", [0, 1], [0.72, 0.72]),
      new NumberKeyframeTrack("traveler.rotation[x]", [0, 1], [0.17, 0.17]),
      new NumberKeyframeTrack("rightArm.rotation[x]", [0, 1], [-0.96, -0.96]),
    ])),
    duck: mixer.clipAction(new AnimationClip("Wave", 1.24, [
      new NumberKeyframeTrack("rightArm.rotation[x]", [0, 1.24], [-1.75, -1.75]),
      new NumberKeyframeTrack("rightArm.rotation[z]", [0, 0.31, 0.62, 0.93, 1.24], [0.31, 0.67, 0.31, 0.67, 0.31]),
    ])),
    bird: mixer.clipAction(new AnimationClip("Call bird", 1, [
      new NumberKeyframeTrack("rightArm.rotation[x]", [0, 1], [-2.28, -2.28]),
      new NumberKeyframeTrack("rightArm.rotation[z]", [0, 1], [-0.55, -0.55]),
      new NumberKeyframeTrack("traveler.rotation[x]", [0, 1], [-0.07, -0.07]),
    ])),
    butterfly: mixer.clipAction(new AnimationClip("Offer hand", 1, [
      new NumberKeyframeTrack("rightArm.rotation[x]", [0, 1], [-1.5, -1.5]),
    ])),
  };
  let activeAction = idleAction.play();

  const cursor = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), -0.1);
  const ray = new Raycaster();
  const clickPoint = new Vector3();
  const movement = new Vector3();
  const heading = new Vector3();
  const right = new Vector3();
  const target = new Vector3();
  const waypoints: Vector3[] = [];
  const projected = new Vector3();
  const viewCenter = new Vector3();
  const viewShift = new Vector3();
  const shadowNormal = new Vector3();
  const planeNormal = new Vector3(0, 0, 1);
  const cameraOrbit = new Spherical();
  const keys = new Set<string>();
  let closeView = false;
  const overviewTarget = new Vector3(0, 0, -0.5);
  let hasGoal = false;
  let targetStop: IslandStopId | undefined;
  let arrived: IslandStopId | undefined = spawn.id;
  let nearbyStop: IslandStopId | null = null;
  let pointerStart: { id: number; x: number; y: number } | undefined;
  let frameBefore = 0;
  let nextFrame = 0;
  let sampleTime = 0;
  let sampleFrames = 0;
  let slowSamples = 0;
  let weatherTime = 0;
  let width = 1;
  let height = 1;
  let animateWeather = initialMotion;
  let viewVisible = false;
  let promptKey = "";
  let gestureHeading: number | undefined;
  let obstacle: IslandObstacle | null = null;
  let feedbackTime = 0;
  let dustTime = 0;
  let stalledTime = 0;

  function bump(kind: IslandObstacle) {
    if (obstacle === kind) return;
    obstacle = kind;
    feedbackTime = 0.9;
    onObstacle(kind);
    if (!animateWeather || kind === "water") return;
    const x = player.position.x + Math.sin(player.rotation.y) * 0.21;
    const z = player.position.z + Math.cos(player.rotation.y) * 0.21;
    dust.position.set(x, 0.155 + islandElevation(x, z), z);
    dustTime = 0.44;
  }

  function publishWildlife(prompt: IslandWildlifePrompt) {
    const nextKey = `${prompt.active ?? ""}:${prompt.nearby.join(",")}`;
    if (nextKey === promptKey) return;
    promptKey = nextKey;
    onWildlifeChange(prompt);
  }

  function interact(action?: IslandAnimalAction) {
    if (!viewVisible || !closeView || hasGoal || keys.size) return false;
    const nearby = wildlife.nearbyActions(player.position);
    const selected = action ?? nearby[0];
    if (!selected) return false;
    const heading = wildlife.interact(player.position, selected);
    if (heading === undefined) return false;
    gestureHeading = heading;
    publishWildlife({ nearby, active: selected });
    return true;
  }

  function setDestination(x: number, z: number, stop?: IslandStopId) {
    const edge = Math.max(1, islandCoastRatio(x, z) / (islandLandRadius - 0.018));
    const route = navigation.route(player.position, { x: x / edge, z: z / edge });
    const destination = route?.pop();
    waypoints.length = 0;
    stalledTime = 0;
    if (!destination || !route) {
      hasGoal = false;
      targetStop = undefined;
      onCancelWalk();
      return;
    }
    target.set(destination.x, 0, destination.z);
    waypoints.push(...route.map((point) => new Vector3(point.x, 0, point.z)));
    if (!stop && targetStop) onCancelWalk();
    targetStop = stop;
    hasGoal = true;
  }

  function pointerDown(event: PointerEvent) {
    pointerStart = event.isPrimary && event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY } : undefined;
  }
  function pointerUp(event: PointerEvent) {
    const start = pointerStart;
    pointerStart = undefined;
    if (!start || start.id !== event.pointerId || Math.hypot(start.x - event.clientX, start.y - event.clientY) > 7) return;
    const bounds = canvas.getBoundingClientRect();
    cursor.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    ray.setFromCamera(cursor, camera);
    const hit = ray.intersectObject(meadow, false)[0];
    if (hit) setDestination(hit.point.x, hit.point.z);
    else if (ray.ray.intersectPlane(ground, clickPoint)) setDestination(clickPoint.x, clickPoint.z);
  }
  function clearKeys() { keys.clear(); }
  function keyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (!viewVisible || event.altKey || event.ctrlKey || event.metaKey) return;
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest("input,textarea,select,[contenteditable]")) return;
    if (key === "e" && !event.repeat && interact()) {
      event.preventDefault();
      return;
    }
    if (!controlsByKey.has(key)) return;
    event.preventDefault();
    keys.add(key);
  }
  function keyUp(event: KeyboardEvent) { keys.delete(event.key.toLowerCase()); }

  function resizeBuffer() {
    const pixelBudget = lightQuality ? 650_000 : 1_200_000;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, lightQuality ? 0.9 : 1.25, Math.sqrt(pixelBudget / (width * height)));
    renderer.setDrawingBufferSize(width, height, pixelRatio);
  }
  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    const span = Math.max(17.3, 22 * height / width) * islandLayoutScale;
    const aspect = width / height;
    overview.left = -span * aspect;
    overview.right = span * aspect;
    overview.top = span;
    overview.bottom = -span;
    overview.updateProjectionMatrix();
    explorer.aspect = aspect;
    explorer.fov = aspect < 0.9 ? 66 : 54;
    explorer.updateProjectionMatrix();
    resizeBuffer();
  };
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  resize();

  function draw(frame: number) {
    const targetInterval = lightQuality || !closeView || !animateWeather ? 1000 / 30 : 1000 / 60;
    if (frame + 1 < nextFrame) return;
    nextFrame = Math.max(frame, nextFrame + targetInterval);
    const frameTime = frameBefore ? (frame - frameBefore) / 1000 : 0;
    const delta = Math.min(frameTime, 0.085);
    frameBefore = frame;
    if (!lightQuality && frameTime > 0 && frameTime < 0.25) {
      sampleTime += frameTime;
      sampleFrames++;
      if (sampleTime >= 1.5) {
        slowSamples = sampleFrames / sampleTime < 24 ? slowSamples + 1 : 0;
        sampleTime = 0;
        sampleFrames = 0;
        if (slowSamples >= 2) {
          lightQuality = true;
          resizeBuffer();
        }
      }
    }
    orbit.update();
    movement.set(0, 0, 0);

    if (keys.size) {
      hasGoal = false;
      waypoints.length = 0;
      if (targetStop) {
        targetStop = undefined;
        onCancelWalk();
      }
      camera.getWorldDirection(heading);
      heading.y = 0;
      heading.normalize();
      right.set(-heading.z, 0, heading.x);
      for (const key of keys) {
        const direction = controlsByKey.get(key);
        if (direction) movement.addScaledVector(right, direction[0]).addScaledVector(heading, direction[1]);
      }
      movement.normalize().multiplyScalar(delta * 5.7);
    } else if (hasGoal) {
      movement.subVectors(waypoints[0] ?? target, player.position);
      movement.y = 0;
      if (movement.length() < 0.08) {
        if (waypoints.length) waypoints.shift();
        else {
          hasGoal = false;
          if (targetStop) {
            arrived = targetStop;
            onArrive(targetStop);
            targetStop = undefined;
          }
        }
        movement.set(0, 0, 0);
      } else movement.clampLength(0, delta * 5.7);
    }

    const attempted = movement.lengthSq() > 0.00001;
    let isWalking = false;
    let hit: IslandObstacle | undefined;
    if (attempted) {
      const px = player.position.x;
      const pz = player.position.z;
      hit = navigation.move(player.position, movement.x, movement.z);
      const dx = player.position.x - px;
      const dz = player.position.z - pz;
      isWalking = dx * dx + dz * dz > 0.00001;
      player.position.y = 0.16 + islandElevation(player.position.x, player.position.z);
      const turn = (isWalking ? Math.atan2(dx, dz) : Math.atan2(movement.x, movement.z)) - player.rotation.y;
      player.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - Math.exp(-17 * delta));
    }
    if (hit) {
      bump(hit);
      feedbackTime = 0.9;
    } else if (obstacle && (feedbackTime -= delta) <= 0) {
      obstacle = null;
      onObstacle(null);
    }
    stalledTime = hasGoal && attempted && !isWalking ? stalledTime + delta : 0;
    if (stalledTime > 0.4) {
      hasGoal = false;
      targetStop = undefined;
      waypoints.length = 0;
      onCancelWalk();
    }
    const encounter = wildlife.activeAction;
    if (!isWalking && encounter && gestureHeading !== undefined) {
      const turn = gestureHeading - player.rotation.y;
      player.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - Math.exp(-15 * delta));
    }
    const nextAction = isWalking ? walkAction : encounter ? gestures[encounter] : idleAction;
    if (nextAction !== activeAction) {
      nextAction.reset().crossFadeFrom(activeAction, 0.14, false).play();
      activeAction = nextAction;
    }
    mixer.update(delta);
    if (dustTime > 0) {
      dustTime = Math.max(0, dustTime - delta);
      const progress = 1 - dustTime / 0.44;
      dust.visible = dustTime > 0;
      dustMaterial.opacity = 0.33 * (1 - progress);
      particles.forEach((particle, index) => {
        const angle = index * 2.39996;
        const spread = 0.025 + progress * (0.14 + index * 0.027);
        particle.position.set(Math.cos(angle) * spread, progress * (0.21 + index * 0.023), Math.sin(angle) * spread);
        particle.scale.setScalar(0.037 + progress * 0.028);
      });
    }

    const shadowX = player.position.x + 0.14;
    const shadowZ = player.position.z - 0.12;
    const shadowHeight = islandElevation(shadowX, shadowZ);
    contactShadow.position.set(shadowX, 0.181 + shadowHeight, shadowZ);
    shadowNormal.set(shadowHeight - islandElevation(shadowX + 0.12, shadowZ), 0.12, shadowHeight - islandElevation(shadowX, shadowZ + 0.12)).normalize();
    contactShadow.quaternion.setFromUnitVectors(planeNormal, shadowNormal);

    if (closeView) viewCenter.copy(player.position).y += 1.36;
    else viewCenter.copy(overviewTarget);
    viewShift.subVectors(viewCenter, orbit.target).multiplyScalar(1 - Math.exp(-12 * delta));
    orbit.target.add(viewShift);
    camera.position.add(viewShift);
    if (closeView) {
      const cameraFloor = islandElevation(camera.position.x, camera.position.z) + 0.58;
      if (camera.position.y < cameraFloor) {
        camera.position.y = cameraFloor;
        camera.lookAt(orbit.target);
      }
    }

    const near = islandStops.find(({ x, z }) => Math.hypot(x - player.position.x, z - player.position.z) < 0.75);
    if (near && arrived !== near.id && !hasGoal) onArrive(near.id);
    arrived = near && !hasGoal ? near.id : undefined;
    const front = hasGoal ? null : islandStops.find(({ id, x, z }) => Math.hypot(x - player.position.x, z - player.position.z) < (id === nearbyStop ? 2.75 : 1.85))?.id ?? null;
    if (front !== nearbyStop) {
      nearbyStop = front;
      onNearbyStop(front);
    }

    if (animateWeather) {
      weatherTime += Math.min(frameTime, 0.25);
      water.update(weatherTime);
      sky.update(weatherTime);
      boat.position.y = -1.25 + Math.sin(weatherTime * 1.8) * 0.08;
      boat.rotation.z = Math.sin(weatherTime * 1.5) * 0.075;
      boat.rotation.x = Math.cos(weatherTime * 1.1) * 0.036;
      const sway = 1 - Math.exp(-5.5 * delta);
      for (const { branch, x, z } of canopies) {
        const gust = islandWindGust(weatherTime - 0.17, x, z);
        const flutter = 0.021 * Math.sin(weatherTime * 4.1 + z * 0.8 + x * 0.55);
        branch.rotation.z += (-0.038 - 0.29 * gust + flutter - branch.rotation.z) * sway;
        branch.rotation.x += (0.024 + 0.065 * gust - flutter - branch.rotation.x) * sway;
      }
    }
    wildlife.update(weatherTime, Math.min(frameTime, 0.25), player.position);
    if (!wildlife.activeAction) gestureHeading = undefined;
    publishWildlife({
      active: closeView ? wildlife.activeAction : null,
      nearby: closeView && !isWalking && !hasGoal ? wildlife.nearbyActions(player.position) : [],
    });
    const layerLimit = closeView ? Math.min(grassLayers, lightQuality ? 2 : 3) : 1;
    grass.update(weatherTime, player.position, animateWeather, camera.position, layerLimit);
    leaves.update(weatherTime, animateWeather);
    if (closeView) sky.dome.position.copy(camera.position);
    renderer.render(scene, camera);

    if (mapPlayer) {
      mapPlayer.style.left = `${mapX(player.position.x)}%`;
      mapPlayer.style.top = `${mapY(player.position.z)}%`;
      mapPlayer.style.rotate = `${Math.PI - player.rotation.y}rad`;
    }

    if (closeView) return;

    for (const stop of islandStops) {
      const element = markers[stop.id];
      if (!element) continue;
      projected.set(stop.x, stop.height + islandElevation(stop.x, stop.z), stop.z).project(camera);
      element.hidden = Math.abs(projected.x) > 0.93 || Math.abs(projected.y) > 0.91;
      element.style.left = `${(projected.x + 1) / 2 * width}px`;
      element.style.top = `${(1 - projected.y) / 2 * height}px`;
    }
  }

  let inViewport = false;
  function syncAnimation() {
    viewVisible = inViewport && !document.hidden;
    frameBefore = 0;
    nextFrame = 0;
    sampleTime = 0;
    sampleFrames = 0;
    slowSamples = 0;
    renderer.setAnimationLoop(viewVisible ? draw : null);
    if (!viewVisible) clearKeys();
  }
  const viewObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    syncAnimation();
  });
  viewObserver.observe(host);
  document.addEventListener("visibilitychange", syncAnimation);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointerup", pointerUp);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);

  return {
    interact,
    setMotion(enabled: boolean) { animateWeather = enabled; },
    setCloseView(enabled: boolean) {
      if (enabled === closeView) return;
      closeView = enabled;
      camera = enabled ? explorer : overview;
      orbit.object = camera;
      orbit.minDistance = enabled ? 3.6 : 0;
      orbit.maxDistance = enabled ? 11 : Infinity;
      orbit.maxPolarAngle = enabled ? 1.56 : 1.19;
      if (enabled) {
        orbit.target.copy(player.position).y += 1.36;
        const heading = Math.PI + player.rotation.y;
        cameraOrbit.set(7.6, 1.36, heading + 0.28);
        camera.position.copy(viewShift.setFromSpherical(cameraOrbit).add(orbit.target));
      } else orbit.target.copy(overviewTarget);
      sky.dome.visible = enabled;
      sky.cliffs.visible = enabled;
      fog.color.set(enabled ? "#b5dee5" : "#9bd6cf");
      fog.near = enabled ? 34 : 83;
      fog.far = enabled ? 118 : 155;
      orbit.update();
    },
    walkTo(id: IslandStopId) {
      const stop = islandStops.find((point) => point.id === id);
      if (stop) setDestination(stop.x, stop.z, id);
    },
    dispose() {
      renderer.setAnimationLoop(null);
      mixer.stopAllAction();
      mixer.uncacheRoot(player);
      orbit.dispose();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearKeys);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      water.dispose();
      sky.dispose();
      wildlife.dispose();
      grass.dispose();
      leaves.dispose();
      conifers.dispose();
      flowers.dispose();
      teaStems.dispose();
      teaStem.dispose();
      teaStemMaterial.dispose();
      ferns.dispose();
      meadowTexture?.dispose();
      bark.dispose();
      pathMaterial.dispose();
      stoneMaterial.dispose();
      contactGeometry.dispose();
      contactMaterial.dispose();
      dustMaterial.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
