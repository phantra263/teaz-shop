import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, Float32BufferAttribute, Group, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry, SRGBColorSpace,
  TextureLoader, type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Product } from "../data/site";

export function createMarketStall(product: Product) {
  const group = new Group();
  const shapes: BufferGeometry[] = [];
  const wood = "#866449";
  const palette = { "personal-care": "#397367", beauty: "#976373", home: "#ae6046" };
  const accent = palette[product.category];
  const box = new BoxGeometry();
  const jar = new CylinderGeometry(1, .94, 1, 16);
  const oval = new SphereGeometry(1, 12, 8);
  function piece(base: BufferGeometry, tint: string, x: number, y: number, z: number,
    w: number, h: number, d: number, pitch = 0) {
    const geometry = base.clone();
    geometry.scale(w, h, d).rotateX(pitch).translate(x, y, z);
    const color = new Color(tint);
    const colors = new Float32Array(geometry.getAttribute("position").count * 3);
    for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    shapes.push(geometry);
  }
  piece(box, wood, 0, .37, .06, 2.05, .69, 1);
  piece(box, "#d3ad79", 0, .75, .1, 2.22, .10, 1.10);
  for (const side of [-1, 1]) {
    piece(box, wood, side, 1.13, -.41, .10, 2.20, .10);
    piece(box, accent, side, .41, .57, .075, .56, .055);
  }
  for (let i = 0; i < 7; i++) {
    const tint = i % 2 ? "#f0dfbc" : accent;
    piece(box, tint, (i - 3) * .34, 2.15, .04, .34, .07, 1.5, .15);
    piece(box, tint, (i - 3) * .34, 1.99, .78, .34, .12, .04);
  }
  // The photo sits alongside the goods, leaving the front of the counter open.
  piece(box, "#e7c68e", -.68, 1.32, -.39, .58, .99, .06);
  if (product.category === "home") {
    for (let i = 0; i < 2; i++) {
      const x = -.13 + .6 * i;
      const height = i ? .11 : .25;
      piece(jar, "#e8cead", x, .80 + height / 2, .18, .27, height, .27);
      piece(jar, "#876851", x, .802 + height, .18, .239, .012, .239);
    }
    piece(box, "#5c4438", .48, .88, .51, .08, .07, .30);
  } else {
    const mist = product.category === "beauty";
    for (let i = 0; i < 3; i++) {
      const x = -.18 + i * .39;
      const z = i === 1 ? .29 : .06;
      piece(jar, mist ? "#deb450" : "#eee6ce", x, 1.04, z, .127, .48, .125);
      piece(jar, mist ? "#f6d995" : "#408870", x, 1.03, z, .13, .13, .128);
      piece(jar, mist ? "#c19b48" : "#387964", x, 1.32, z, .105, .10, .102);
      if (mist) piece(box, "#f5ebcf", x, 1.41, z + .02, .105, .09, .13);
      else piece(oval, "#ded7b5", x + .132, 1.01, z, .043, .14, .056);
    }
  }
  const geometry = mergeGeometries(shapes);
  for (const item of [...shapes, box, jar, oval]) item.dispose();
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: .82 });
  const structure = new Mesh(geometry, material);
  structure.castShadow = structure.receiveShadow = true;
  group.add(structure);

  const board = document.createElement("canvas");
  board.width = 640;
  board.height = 128;
  const ctx = board.getContext("2d");
  if (ctx) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 640, 128);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff5de";
    ctx.font = "bold 66px Georgia, serif";
    ctx.fillText(product.categoryLabel, 320, 86, 600);
  }
  const label = new CanvasTexture(board);
  const photo = new TextureLoader().load(product.cover);
  const panels = [
    { texture: label, width: 1.76, height: .35, x: 0, y: .43, z: .568 },
    { texture: photo, width: .52, height: .925, x: -.68, y: 1.32, z: -.355 },
  ].map(({ texture, width, height, x, y, z }) => {
    texture.colorSpace = SRGBColorSpace;
    const panel = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({ map: texture }));
    panel.position.set(x, y, z);
    group.add(panel);
    return panel;
  });
  return { group, dispose() {
    geometry.dispose();
    material.dispose();
    photo.dispose();
    label.dispose();
    for (const panel of panels) { panel.geometry.dispose(); panel.material.dispose(); }
  } };
}
