import {
  CapsuleGeometry, CircleGeometry, DirectionalLight, ExtrudeGeometry, Group,
  HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera,
  Path, Scene, Shape, TorusGeometry, WebGLRenderer,
} from "three";

export function mountHeroScene(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    premultipliedAlpha: true,
  });
  if (!context) return;

  const renderer = new WebGLRenderer({ canvas, context, alpha: true });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1.55, 1.55, 1.55, -1.55, 0.1, 20);
  camera.position.set(0, 0, 6);

  const magnifier = new Group();
  magnifier.scale.setScalar(1.17);
  scene.add(magnifier);

  const rimGeometry = new TorusGeometry(0.69, 0.087, 12, 48);
  const rimMaterial = new MeshStandardMaterial({ color: "#ccefa7", roughness: 0.33 });
  const rim = new Mesh(rimGeometry, rimMaterial);
  rim.position.set(-0.19, 0.26, 0);
  magnifier.add(rim);

  const lensGeometry = new CircleGeometry(0.63, 48);
  const lensMaterial = new MeshBasicMaterial({ color: "#c7f7bc", opacity: 0.19, transparent: true, depthWrite: false });
  const lens = new Mesh(lensGeometry, lensMaterial);
  lens.position.copy(rim.position);
  lens.position.z = 0.035;
  magnifier.add(lens);

  const handleGeometry = new CapsuleGeometry(0.135, 0.62, 6, 12);
  const handleMaterial = new MeshStandardMaterial({ color: "#70ab70", roughness: 0.48 });
  const handle = new Mesh(handleGeometry, handleMaterial);
  handle.position.set(0.56, -0.49, 0);
  handle.rotation.z = Math.PI / 4;
  magnifier.add(handle);

  const tagShape = new Shape();
  tagShape.moveTo(-0.4, -0.26);
  tagShape.lineTo(0.19, -0.26);
  tagShape.lineTo(0.43, 0);
  tagShape.lineTo(0.19, 0.26);
  tagShape.lineTo(-0.4, 0.26);
  tagShape.closePath();

  const hole = new Path();
  hole.absarc(0.22, 0, 0.063, 0, Math.PI * 2, true);
  tagShape.holes.push(hole);

  const tagGeometry = new ExtrudeGeometry(tagShape, { depth: 0.13, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, steps: 1 });
  const tagMaterial = new MeshStandardMaterial({ color: "#f2ac54", roughness: 0.39 });
  const tag = new Group();
  tag.add(new Mesh(tagGeometry, tagMaterial));
  tag.position.set(-0.2, 0.26, -0.19);
  magnifier.add(tag);

  const markGeometry = new CapsuleGeometry(0.033, 0.13, 4, 8);
  const markMaterial = new MeshStandardMaterial({ color: "#283c2d", roughness: 0.65 });
  const shortMark = new Mesh(markGeometry, markMaterial);
  shortMark.position.set(-0.22, -0.036, 0.157);
  shortMark.rotation.z = Math.PI / 4;
  const longMark = new Mesh(markGeometry, markMaterial);
  longMark.position.set(-0.075, 0.01, 0.157);
  longMark.rotation.z = -Math.PI / 4;
  longMark.scale.y = 1.55;
  tag.add(shortMark, longMark);

  const geometries = [rimGeometry, lensGeometry, handleGeometry, tagGeometry, markGeometry];
  const materials = [rimMaterial, lensMaterial, handleMaterial, tagMaterial, markMaterial];

  const light = new DirectionalLight("#fff3d6", 2.1);
  light.position.set(2, 4, 5);
  scene.add(light, new HemisphereLight("#e9ffd0", "#3e6a51", 1.7));

  const resize = () => {
    const size = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(size, size, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let active = false;
  let elapsed = 0;
  let previousFrame = 0;

  function draw(frame: number) {
    const delta = previousFrame ? frame - previousFrame : 0;
    if (previousFrame && delta < 32) return;
    previousFrame = frame;
    elapsed += Math.min(delta, 70) / 1000;
    magnifier.rotation.y = -0.23 + Math.sin(elapsed * 0.85) * 0.39;
    magnifier.rotation.x = 0.12 + Math.sin(elapsed * 0.7) * 0.14;
    magnifier.position.y = Math.sin(elapsed * 1.25) * 0.1;
    tag.rotation.z = 0.32 + Math.sin(elapsed * 1.1) * 0.12;
    renderer.render(scene, camera);
  }

  function setActive(next: boolean) {
    if (next === active) return;
    active = next;
    previousFrame = 0;
    renderer.setAnimationLoop(active ? draw : null);
  }

  return {
    setActive,
    dispose() {
      setActive(false);
      observer.disconnect();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
