import {
  BoxGeometry, CanvasTexture, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, type Texture,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { shopeePriceTool } from "../data/tools";

export function createWorkshop() {
  const group = new Group();
  const pieces: BoxGeometry[] = [];
  const steel = "#304748", timber = "#c89465", copper = "#c16c40";
  function beam(color: string, x: number, y: number, z: number, w: number, h: number, d: number, pitch = 0) {
    const shape = new BoxGeometry(w, h, d);
    shape.rotateX(pitch).translate(x, y, z);
    const tint = new Color(color);
    const colors = new Float32Array(shape.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
    shape.setAttribute("color", new Float32BufferAttribute(colors, 3));
    pieces.push(shape);
  }
  beam("#878778", 0, .08, 0, 4.1, .16, 2.55);
  beam("#67807a", 0, 1.24, -1.06, 3.86, 2.35, .16);
  for (const side of [-1, 1]) {
    for (const z of [-1, .92]) beam(steel, side * 1.86, 1.34, z, .13, 2.56, .13);
    beam(timber, side * 1.86, .48, 0, .12, .74, 2);
  }
  // Open frontage, standing-seam metal roof and a bench spanning both work bays.
  beam("#52716f", 0, 2.67, -.04, 4.24, .13, 2.65, -.10);
  for (let seam = -4; seam <= 4; seam++) beam("#83a19a", seam * .46, 2.75, -.04, .045, .05, 2.65, -.10);
  beam(steel, 0, 2.59, 1.15, 4.16, .29, .12);
  beam(timber, 0, .94, .17, 3.56, .15, 1.05);
  for (const x of [-1.62, -.10, 1.62]) beam(steel, x, .51, .45, .11, .86, .11);
  beam("#687773", -1.05, .53, .10, 1.02, .67, .75);
  for (const y of [.39, .62]) beam(steel, -1.05, y, .5, .45, .035, .05);
  // Tool rack: hammer, screwdrivers and a small bench vise.
  beam("#865d46", -1.04, 1.74, -.81, 1.32, 1.05, .1);
  for (const x of [-1.43, -1.03, -.7]) beam(timber, x, 1.72, -.71, .065, .48, .07);
  beam(steel, -1.43, 1.97, -.71, .34, .13, .13);
  for (const x of [-1.03, -.7]) beam(copper, x, 1.61, -.71, .11, .24, .11);
  beam(steel, -1.25, 1.10, .37, .43, .20, .25);
  for (const x of [-1.4, -1.1]) beam("#97a59c", x, 1.25, .37, .12, .17, .28);
  // Demo station faces the path, with a monitor, stand and keyboard.
  beam(steel, .74, 1.20, -.15, .15, .39, .15);
  beam(steel, .74, 1.75, -.13, 1.56, .99, .12);
  beam("#435254", .74, 1.04, .42, .81, .05, .25);
  const geometry = mergeGeometries(pieces);
  pieces.forEach(piece => piece.dispose());
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: .8 });
  const frame = new Mesh(geometry, material);
  frame.castShadow = frame.receiveShadow = true;
  group.add(frame);

  const sign = document.createElement("canvas");
  sign.width = 1024;
  sign.height = 96;
  const ctx = sign.getContext("2d");
  if (ctx) {
    ctx.fillStyle = steel;
    ctx.fillRect(0, 0, sign.width, sign.height);
    ctx.fillStyle = "#ffe1a4";
    ctx.textAlign = "center";
    ctx.font = "bold 73px sans-serif";
    ctx.fillText("XƯỞNG TOOL", 512, 76);
  }
  function panel(texture: Texture, w: number, h: number, x: number, y: number, z: number) {
    texture.colorSpace = SRGBColorSpace;
    const mesh = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: texture }));
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  const panels = [
    panel(new CanvasTexture(sign), 3.05, .285, 0, 2.59, 1.217),
    panel(new TextureLoader().load(shopeePriceTool.cover), 1.46, .9125, .74, 1.75, -.063),
  ];
  return { group, dispose() {
    geometry.dispose();
    material.dispose();
    for (const mesh of panels) {
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
  } };
}
