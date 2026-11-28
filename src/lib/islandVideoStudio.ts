import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, Float32BufferAttribute, Group, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3, type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createVideoStudio() {
  const group = new Group();
  const parts: BufferGeometry[] = [];
  const frame = "#344951", brass = "#c7aa72", wood = "#b98960";
  function finish(shape: BufferGeometry, color: string, x: number, y: number, z: number) {
    const colors = new Float32Array(shape.attributes.position.count * 3);
    const tint = new Color(color);
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
    shape.setAttribute("color", new Float32BufferAttribute(colors, 3));
    parts.push(shape.translate(x, y, z));
  }
  function box(color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
    finish(new BoxGeometry(w, h, d), color, x, y, z);
  }
  function rod(a: Vector3, b: Vector3, radius: number, color: string) {
    const direction = b.clone().sub(a);
    const shape = new CylinderGeometry(radius, radius, direction.length(), 8);
    shape.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
    finish(shape, color, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  }
  box(wood, 0, .12, 0, 4.25, .24, 2.15);
  box(frame, 0, 1.47, -.96, 4.12, 2.56, .12);
  for (const x of [-1.97, 1.97]) {
    box(frame, x, 1.48, .84, .1, 2.7, .1);
    box(frame, x, 2.8, 0, .13, .13, 2.06);
  }
  box(frame, 0, 2.8, .85, 4.12, .13, .13);
  // Two barn-door lamps on the overhead rig, angled towards the set.
  for (const x of [-1.22, 1.22]) {
    box(brass, x, 2.64, .65, .07, .34, .07);
    finish(new BoxGeometry(.46, .31, .32).rotateX(-.3), frame, x, 2.48, .62);
    finish(new BoxGeometry(.38, .23, .03).rotateX(-.3), "#ffe2ac", x, 2.44, .78);
  }
  // Three splayed tripod legs support a camera pointed into the set.
  const head = new Vector3(-1.26, 1.08, .55);
  for (let i = 0; i < 3; i++) {
    const angle = i * 2 * Math.PI / 3;
    rod(new Vector3(head.x + .36 * Math.cos(angle), .24, head.z + .36 * Math.sin(angle)), head, .034, frame);
  }
  box(frame, head.x, 1.24, head.z, .35, .31, .44);
  finish(new CylinderGeometry(.14, .16, .25, 16).rotateX(Math.PI / 2), "#192e36", head.x, 1.25, .23);
  box("#78aaae", head.x, 1.25, .78, .23, .17, .018);
  // Director's canvas chair beside the presenter mark.
  for (const x of [.68, 1.2]) {
    rod(new Vector3(x, .24, -.26), new Vector3(x, .83, .27), .04, brass);
    rod(new Vector3(x, .24, .27), new Vector3(x, 1.34, -.26), .04, brass);
  }
  box("#be6954", .94, .84, .02, .59, .07, .5);
  box("#be6954", .94, 1.17, -.23, .59, .26, .06);

  const geometry = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: .8 });
  const set = new Mesh(geometry, material);
  set.castShadow = set.receiveShadow = true;
  group.add(set);

  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#204c51";
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = "#e5b46f";
    ctx.beginPath();
    ctx.arc(755, 252, 148, 0, Math.PI * 2);
    ctx.fill();
    for (const [offset, color] of [[0, "#56877d"], [75, "#346a68"]] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 390 + offset);
      ctx.bezierCurveTo(340, 200 + offset, 550, 490 + offset, 960, 240 + offset);
      ctx.lineTo(960, 540); ctx.lineTo(0, 540); ctx.fill();
    }
    ctx.fillStyle = "#fff2d6";
    ctx.font = "bold 78px Georgia, serif";
    ctx.fillText("Trạm Video", 58, 222);
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("TeaZ", 62, 118);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const backdrop = new Mesh(new PlaneGeometry(3.94, 2.22), new MeshBasicMaterial({ map: texture }));
  backdrop.position.set(0, 1.49, -.89);
  group.add(backdrop);
  return { group, dispose() {
    geometry.dispose(); material.dispose();
    backdrop.geometry.dispose(); backdrop.material.dispose(); texture.dispose();
  } };
}
