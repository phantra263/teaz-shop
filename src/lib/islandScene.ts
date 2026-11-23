import {
  BoxGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, DirectionalLight,
  Fog, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  OrthographicCamera, Plane, PlaneGeometry, Raycaster, RingGeometry, Scene, SphereGeometry,
  TubeGeometry, Vector2, Vector3, WebGLRenderer, type BufferGeometry,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { islandStops, type IslandStopId } from "../data/island";

const controlsByKey = new Map([
  ["w", [0, 1]], ["arrowup", [0, 1]], ["s", [0, -1]], ["arrowdown", [0, -1]],
  ["a", [-1, 0]], ["arrowleft", [-1, 0]], ["d", [1, 0]], ["arrowright", [1, 0]],
]);

export function mountIslandScene(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  markers: Readonly<Partial<Record<IslandStopId, HTMLButtonElement>>>,
  onArrive: (id: IslandStopId) => void,
  onCancelWalk: () => void,
) {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const renderer = new WebGLRenderer({ canvas, context: gl, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new Scene();
  scene.background = new Color("#9bd6cf");
  scene.fog = new Fog("#9bd6cf", 45, 105);
  const camera = new OrthographicCamera(-20, 20, 15, -15, 0.1, 160);
  camera.position.set(15, 22, 33);
  const orbit = new OrbitControls(camera, canvas);
  orbit.target.set(0, 0, -0.5);
  orbit.enablePan = false;
  orbit.enableDamping = true;
  orbit.minPolarAngle = 0.35;
  orbit.maxPolarAngle = 1.19;
  orbit.minZoom = 0.68;
  orbit.maxZoom = 2.2;
  orbit.update();

  const sun = new DirectionalLight("#fff2cc", 2.25);
  sun.position.set(-9, 18, 11);
  scene.add(sun, new HemisphereLight("#e5fff2", "#557560", 1.6));

  const materials = new Map<string, MeshStandardMaterial>();
  const geometries = new Set<BufferGeometry>();
  const box = new BoxGeometry();
  const round = new CylinderGeometry(1, 1, 1, 64);
  const trunk = new CylinderGeometry(0.1, 0.19, 1.35, 6);
  const foliage = new SphereGeometry(1, 8, 6);
  const roofShape = new ConeGeometry(1, 1, 4);
  const rockShape = new SphereGeometry(1, 5, 3);

  function solid(geometry: BufferGeometry, color: string, parent: Group | Scene, x: number, y: number, z: number) {
    let material = materials.get(color);
    if (!material) {
      material = new MeshStandardMaterial({ color, roughness: 0.85 });
      materials.set(color, material);
    }
    geometries.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function block(parent: Group | Scene, color: string, x: number, y: number, z: number, width: number, height: number, depth: number) {
    const mesh = solid(box, color, parent, x, y, z);
    mesh.scale.set(width, height, depth);
    return mesh;
  }

  const seaGeometry = new PlaneGeometry(150, 150);
  const seaMaterial = new MeshBasicMaterial({ color: "#66bdb8" });
  const sea = new Mesh(seaGeometry, seaMaterial);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.58;
  scene.add(sea);
  const reef = solid(round, "#77c6b1", scene, 0, -1.54, 0);
  reef.scale.set(17.2, 0.045, 13.05);
  const bank = solid(round, "#8c7862", scene, 0, -0.7, 0);
  bank.scale.set(14.35, 1.38, 10.55);
  const sand = solid(round, "#eed59b", scene, 0, -0.14, 0);
  sand.scale.set(14.8, 0.4, 10.9);
  const meadow = solid(round, "#779e56", scene, 0, 0, 0);
  meadow.scale.set(13.95, 0.18, 10.05);

  const foamGeometry = new RingGeometry(1, 1.018, 96, 1, 0.12, Math.PI * 1.74);
  const foamMaterial = new MeshBasicMaterial({ color: "#ddf8e5", transparent: true, opacity: 0.63, depthWrite: false });
  const foam = new Mesh(foamGeometry, foamMaterial);
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = -1.48;
  foam.scale.set(15.85, 11.85, 1);
  scene.add(foam);

  function path(points: readonly (readonly [number, number])[]) {
    const curve = new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)));
    const strip = solid(new TubeGeometry(curve, 32, 0.44, 6, false), "#dac297", scene, 0, 0.106, 0);
    strip.scale.y = 0.065;
  }
  path([[0, 8], [0, 5], [-1.3, 2.2], [-2.8, 0.2], [-6.3, -3.2]]);
  path([[-7.15, 2.7], [-5.3, 2.7], [-2.8, 0.2], [1.3, 0.1], [6, 2.4], [8, 2.55]]);
  path([[1.35, 0.15], [2.65, -1.8], [2.8, -4.6], [3.1, -6.6]]);

  function tree(x: number, z: number, size: number, color: string) {
    const plant = new Group();
    plant.position.set(x, 0.08, z);
    plant.scale.setScalar(size);
    scene.add(plant);
    solid(trunk, "#795641", plant, 0, 0.65, 0);
    solid(foliage, color, plant, 0, 1.63, 0).scale.set(0.72, 1, 0.72);
    solid(foliage, color, plant, 0.42, 1.23, 0).scale.set(0.53, 0.59, 0.51);
  }

  const treeLocations = [[-10.7, 2.8], [-10.2, -0.8], [-9.4, -4.5], [-8.4, -6.1], [-3.4, -7], [-0.6, -7.55], [5.9, -6.7], [8.7, -5.2], [10.8, -2.3], [10.7, 1.1], [10.5, 3.5], [8.8, 5.9], [4.7, 7.15], [-3.6, 7.15], [-7.8, 5.3], [0.7, -3.2], [-3.1, 4.4], [4.1, 3.8]];
  const treeColors = ["#376f50", "#467b4b", "#53875a"];
  treeLocations.forEach(([x, z], index) => tree(x, z, 0.78 + (index % 4) * 0.14, treeColors[index % treeColors.length]));

  for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
    for (let plantIndex = 0; plantIndex < 7; plantIndex++) {
      const leaf = solid(foliage, rowIndex % 2 ? "#477f51" : "#588952", scene, -4.8 + plantIndex * 0.55, 0.22, -5.15 - rowIndex * 0.62 + Math.sin(plantIndex * 0.56) * 0.25);
      leaf.scale.set(0.34, 0.23, 0.3);
    }
  }

  for (let index = 0; index < 21; index++) {
    const angle = index * 2.39996;
    const rock = solid(rockShape, index % 2 ? "#9e9a83" : "#b0a686", scene, Math.cos(angle) * 14.05, 0.14, Math.sin(angle) * 10.3);
    const size = 0.19 + (index % 4) * 0.085;
    rock.scale.set(size * 1.35, size, size);
    rock.rotation.y = angle;
  }

  for (let index = 0; index < 13; index++) {
    const z = 7.25 + index * 0.36;
    block(scene, index % 2 ? "#ac784e" : "#966039", 0, 0.27, z, 2.2, 0.16, 0.34);
    if (index % 3 === 0) for (const side of [-1, 1]) block(scene, "#675042", side * 0.94, -0.28, z, 0.17, 1.53, 0.2);
  }
  const boat = new Group();
  boat.position.set(2.12, -1.25, 11.1);
  boat.rotation.y = -0.24;
  scene.add(boat);
  solid(foliage, "#a25b3e", boat, 0, 0, 0).scale.set(0.66, 0.3, 1.52);
  block(boat, "#e8c989", 0, 0.16, 0, 0.92, 0.15, 1.5);
  block(boat, "#786143", 0, 0.82, 0, 0.075, 1.62, 0.075);
  const sail = solid(roofShape, "#fff0bf", boat, 0.29, 0.86, 0);
  sail.scale.set(0.62, 1.33, 0.1);

  function cabin(x: number, z: number, siding: string, roof: string) {
    const group = new Group();
    group.position.set(x, 0.09, z);
    scene.add(group);
    block(group, "#acb484", 0, 0.07, 0, 3.1, 0.14, 2.35);
    block(group, siding, 0, 0.98, 0, 2.6, 1.76, 1.92);
    const cap = solid(roofShape, roof, group, 0, 2.13, 0);
    cap.rotation.y = Math.PI / 4;
    cap.scale.set(2.14, 1.05, 1.66);
    block(group, "#604e3e", 0, 0.66, 0.98, 0.63, 1.13, 0.13);
    for (const side of [-1, 1]) {
      block(group, "#4d6b64", side * 0.79, 1.05, 0.98, 0.57, 0.59, 0.12);
      block(group, "#f4d795", side * 0.79, 1.05, 1.05, 0.38, 0.4, 0.025);
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

  for (const [index, x] of [-6.75, -4.24].entries()) {
    const stall = new Group();
    stall.position.set(x, 0.09, 1.32);
    scene.add(stall);
    const fabric = index ? "#d8965f" : "#669277";
    for (const dx of [-0.87, 0.87]) for (const dz of [-0.62, 0.62]) block(stall, "#8b6549", dx, 0.93, dz, 0.13, 1.82, 0.13);
    block(stall, "#b48758", 0, 0.53, 0.18, 1.84, 0.2, 0.91);
    for (let strip = 0; strip < 6; strip++) block(stall, strip % 2 ? "#f4dfb8" : fabric, -0.87 + strip * 0.346, 1.88, 0.08, 0.346, 0.14, 1.67);
    for (let boxIndex = 0; boxIndex < 3; boxIndex++) block(stall, boxIndex % 2 ? "#d49e65" : "#808d60", -0.57 + boxIndex * 0.48, 0.76, 0.15, 0.35, 0.26, 0.38);
  }

  const player = new Group();
  const spawn = islandStops[0];
  player.position.set(spawn.x, 0.16, spawn.z);
  player.scale.setScalar(1.23);
  scene.add(player);
  block(player, "#225447", 0, 0.52, 0, 0.45, 0.52, 0.29);
  solid(foliage, "#e8b386", player, 0, 0.92, 0).scale.set(0.24, 0.25, 0.23);
  solid(round, "#f1d594", player, 0, 1.09, 0).scale.set(0.34, 0.045, 0.33);
  solid(foliage, "#dabd7b", player, 0, 1.12, 0).scale.set(0.23, 0.13, 0.22);
  const leftLeg = block(player, "#4c493e", -0.12, 0.19, 0, 0.15, 0.34, 0.17);
  const rightLeg = block(player, "#4c493e", 0.12, 0.19, 0, 0.15, 0.34, 0.17);
  block(player, "#d0844c", 0, 0.56, -0.22, 0.34, 0.4, 0.18);
  solid(round, "#efe6b5", player, 0, -0.035, 0).scale.set(0.33, 0.023, 0.33);

  const cursor = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), -0.1);
  const ray = new Raycaster();
  const clickPoint = new Vector3();
  const movement = new Vector3();
  const heading = new Vector3();
  const right = new Vector3();
  const target = new Vector3();
  const projected = new Vector3();
  const keys = new Set<string>();
  let hasGoal = false;
  let targetStop: IslandStopId | undefined;
  let arrived: IslandStopId | undefined = "pier";
  let pointerStart: { id: number; x: number; y: number } | undefined;
  let frameBefore = 0;
  let elapsed = 0;
  let width = 1;
  let height = 1;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setDestination(x: number, z: number, stop?: IslandStopId) {
    const edgeFactor = Math.max(1, Math.hypot(x / 13.5, z / 9.65));
    target.set(x / edgeFactor, player.position.y, z / edgeFactor);
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
    if (ray.ray.intersectPlane(ground, clickPoint)) setDestination(clickPoint.x, clickPoint.z);
  }
  function clearKeys() { keys.clear(); }
  function keyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (event.altKey || event.ctrlKey || event.metaKey || !controlsByKey.has(key) || (event.target instanceof Element && event.target.closest("a,button,input,textarea,select,[contenteditable]"))) return;
    event.preventDefault();
    keys.add(key);
  }
  function keyUp(event: KeyboardEvent) { keys.delete(event.key.toLowerCase()); }

  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    const span = Math.max(13.8, 16.1 * height / width);
    const aspect = width / height;
    camera.left = -span * aspect;
    camera.right = span * aspect;
    camera.top = span;
    camera.bottom = -span;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  resize();

  function draw(frame: number) {
    const delta = frameBefore ? Math.min((frame - frameBefore) / 1000, 0.05) : 0;
    frameBefore = frame;
    elapsed += delta;
    orbit.update();
    movement.set(0, 0, 0);

    if (keys.size) {
      hasGoal = false;
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
      movement.subVectors(target, player.position);
      if (movement.length() < 0.08) {
        hasGoal = false;
        if (targetStop) {
          arrived = targetStop;
          onArrive(targetStop);
          targetStop = undefined;
        }
        movement.set(0, 0, 0);
      } else movement.clampLength(0, delta * 5.7);
    }

    if (movement.lengthSq() > 0.00001) {
      player.position.add(movement);
      const edgeFactor = Math.max(1, Math.hypot(player.position.x / 13.5, player.position.z / 9.65));
      player.position.x /= edgeFactor;
      player.position.z /= edgeFactor;
      player.rotation.y = Math.atan2(movement.x, movement.z);
      leftLeg.rotation.x = Math.sin(elapsed * 15) * 0.38;
      rightLeg.rotation.x = -leftLeg.rotation.x;
    } else {
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
    }

    const near = islandStops.find(({ x, z }) => Math.hypot(x - player.position.x, z - player.position.z) < 0.75);
    if (near && arrived !== near.id && !hasGoal) onArrive(near.id);
    arrived = near && !hasGoal ? near.id : undefined;

    if (!reduceMotion.matches) {
      boat.position.y = -1.25 + Math.sin(elapsed * 1.8) * 0.08;
      foamMaterial.opacity = 0.54 + Math.sin(elapsed * 1.3) * 0.12;
    }
    renderer.render(scene, camera);

    for (const stop of islandStops) {
      const element = markers[stop.id];
      if (!element) continue;
      projected.set(stop.x, stop.height, stop.z).project(camera);
      element.hidden = Math.abs(projected.x) > 0.93 || Math.abs(projected.y) > 0.91;
      element.style.left = `${(projected.x + 1) / 2 * width}px`;
      element.style.top = `${(1 - projected.y) / 2 * height}px`;
    }
  }

  const viewObserver = new IntersectionObserver(([entry]) => {
    frameBefore = 0;
    renderer.setAnimationLoop(entry.isIntersecting ? draw : null);
    if (!entry.isIntersecting) clearKeys();
  });
  viewObserver.observe(host);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointerup", pointerUp);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);

  return {
    walkTo(id: IslandStopId) {
      const stop = islandStops.find((point) => point.id === id);
      if (stop) setDestination(stop.x, stop.z, id);
    },
    dispose() {
      renderer.setAnimationLoop(null);
      orbit.dispose();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearKeys);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      seaGeometry.dispose();
      seaMaterial.dispose();
      foamGeometry.dispose();
      foamMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
