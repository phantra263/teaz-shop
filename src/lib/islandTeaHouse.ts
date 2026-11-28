import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, Float32BufferAttribute, Group, Mesh,
  MeshStandardMaterial, PlaneGeometry, SphereGeometry, SRGBColorSpace, TorusGeometry, type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createTeaHouse() {
  const group = new Group();
  const parts: BufferGeometry[] = [];
  const box = new BoxGeometry();
  const cylinder = new CylinderGeometry(1, 1, 1, 12);
  const bowl = new CylinderGeometry(1, .62, 1, 16);
  const sphere = new SphereGeometry(1, 16, 10);
  const tile = new SphereGeometry(1, 8, 4);
  const handle = new TorusGeometry(1, .18, 6, 18);

  function piece(source: BufferGeometry, color: string, x: number, y: number, z: number,
    width: number, height: number, depth: number, pitch = 0, roll = 0) {
    const geo = source.clone();
    geo.scale(width, height, depth).rotateX(pitch).rotateZ(roll).translate(x, y, z);
    const tint = new Color(color);
    const colors = new Float32Array(geo.getAttribute("position").count * 3);
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    parts.push(geo);
  }

  // Raised sill, slatted counter and open shelves facing the landing.
  piece(box, "#897d67", 0, .08, 0, 2.34, .22, 1.26);
  for (const x of [-.98, .98]) for (const z of [-.42, .42]) {
    piece(box, "#805138", x, 1.19, z, .105, 2.12, .105);
    piece(box, "#585b51", x, .26, z, .16, .23, .16);
  }
  piece(box, "#644430", 0, .51, .06, 1.94, .69, .78);
  for (let i = 0; i < 17; i++) {
    piece(box, i % 3 === 0 ? "#b07849" : "#cc955f", (i - 8) * .111, .50, .469, .079, .57, .05);
  }
  piece(box, "#ad7a50", 0, .87, .10, 2.2, .105, 1.03);
  piece(box, "#926346", 0, 1.34, -.4, 1.89, .055, .24);
  for (let i = 0; i < 4; i++) {
    const x = -.60 + i * .32;
    piece(cylinder, i % 2 ? "#648d80" : "#cfb585", x, 1.48, -.39, .089, .22, .089);
    piece(cylinder, "#654934", x, 1.60, -.39, .094, .035, .094);
  }

  // Overlapping tile courses rise steeply at the ridge and flatten at the eaves.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      const z = .13 + row * .21;
      const y = 2.70 - row * .135 + row * row * .008;
      const slope = side * (.59 - row * .095);
      piece(box, "#34594f", 0, y, side * z, 2.56 + row * .07, .095, .33, slope);
      for (let col = -7; col <= 7; col++) {
        piece(tile, (col + row) % 3 ? "#537d6d" : "#69917a", col * .18, y + .053,
          side * z, .053, .045, .17, slope);
      }
    }
  }
  piece(box, "#704932", 0, 2.22, .43, 2.30, .14, .15);
  piece(cylinder, "#b88d59", 0, 2.79, 0, .065, 2.64, .065, 0, Math.PI / 2);
  for (const x of [-.49, .49]) piece(cylinder, "#a88a53", x, 2.08, .53, .015, .20, .015);
  piece(box, "#8d643f", 0, 1.89, .54, 1.37, .37, .07);

  // A pair of ribbed paper lanterns flanks the hanging sign.
  for (const x of [-1.10, 1.10]) {
    piece(cylinder, "#66503a", x, 2.16, .60, .012, .22, .012);
    piece(sphere, "#efb277", x, 1.91, .60, .126, .168, .126);
    for (const dy of [-.14, -.075, 0, .075, .14]) {
      const r = .128 * Math.sqrt(1 - (dy / .17) ** 2);
      piece(cylinder, "#af704b", x, 1.91 + dy, .60, r, .013, r);
    }
    piece(cylinder, "#a94e35", x, 1.70, .60, .016, .10, .016);
  }

  piece(box, "#604332", -.12, .945, .28, 1.19, .048, .44);
  piece(sphere, "#548175", -.35, 1.10, .25, .186, .145, .16);
  piece(handle, "#466c61", -.53, 1.13, .25, .085, .095, .09);
  piece(bowl, "#608879", -.16, 1.13, .25, .058, .19, .058, 0, -.93);
  piece(sphere, "#c89e64", -.35, 1.243, .25, .106, .027, .10);
  piece(sphere, "#426d61", -.35, 1.275, .25, .026, .024, .026);
  for (const x of [.06, .27]) {
    piece(bowl, "#f1e5c9", x, 1.019, .31, .077, .101, .077);
    piece(cylinder, "#9b6534", x, 1.070, .31, .063, .003, .063);
  }
  const geometry = mergeGeometries(parts);
  for (const geo of [...parts, box, cylinder, sphere, tile, bowl, handle]) geo.dispose();
  const wood = new MeshStandardMaterial({ vertexColors: true, roughness: .83 });
  const building = new Mesh(geometry, wood);
  building.receiveShadow = building.castShadow = true;
  group.add(building);

  const sign = document.createElement("canvas");
  sign.width = 640;
  sign.height = 160;
  const ctx = sign.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#204941";
    ctx.fillRect(0, 0, 640, 160);
    ctx.strokeStyle = ctx.fillStyle = "#ffe4ad";
    ctx.lineWidth = 3;
    ctx.strokeRect(9, 9, 622, 142);
    ctx.font = "bold 90px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Bến Trà", 320, 116);
  }
  const texture = new CanvasTexture(sign);
  texture.colorSpace = SRGBColorSpace;
  const signMaterial = new MeshStandardMaterial({ map: texture, roughness: .9 });
  const panel = new Mesh(new PlaneGeometry(1.31, .33), signMaterial);
  panel.position.set(0, 1.89, .577);
  group.add(panel);
  return { group, dispose() {
    geometry.dispose();
    wood.dispose();
    texture.dispose();
    panel.geometry.dispose();
    signMaterial.dispose();
  } };
}
