import {
  BufferGeometry, CanvasTexture, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh,
  MeshStandardMaterial, PlaneGeometry, Quaternion, SphereGeometry, SRGBColorSpace, Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

type Section = readonly [z: number, y: number, width: number, height: number];
type Point = readonly [x: number, y: number, z: number];

export function createIslandAnimals() {
  const sphere = new SphereGeometry(1, 16, 12);
  const spindle = new CylinderGeometry(0.45, 1, 1, 6);
  const furAndFeathers = new MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
  const glass = new MeshStandardMaterial({ vertexColors: true, roughness: 0.27 });
  const resources: { dispose(): void }[] = [sphere, spindle, furAndFeathers, glass];
  const up = new Vector3(0, 1, 0);
  const alignment = new Quaternion();

  function assembly(parent: Group, material = furAndFeathers) {
    const shapes: BufferGeometry[] = [];

    function paint(source: BufferGeometry, base: string, accent = base, grain = 0) {
      const top = new Color(base);
      const lower = new Color(accent);
      const tint = new Color();
      const points = source.getAttribute("position");
      source.computeBoundingBox();
      const bounds = source.boundingBox!;
      const depth = Math.max(0.001, bounds.max.y - bounds.min.y);
      const colors: number[] = [];
      for (let index = 0; index < points.count; index++) {
        const y = (points.getY(index) - bounds.min.y) / depth;
        const fleck = Math.sin(points.getX(index) * 98 + points.getZ(index) * 77) * Math.cos(points.getY(index) * 149) * grain;
        tint.copy(lower).lerp(top, Math.min(1, y * 1.85)).multiplyScalar(1 + fleck);
        colors.push(tint.r, tint.g, tint.b);
      }
      source.deleteAttribute("uv");
      source.setAttribute("color", new Float32BufferAttribute(colors, 3));
      shapes.push(source);
    }

    function oval(at: Point, size: Point, color: string, angle = 0, underside = color, grain = 0) {
      const geometry = sphere.toNonIndexed();
      geometry.scale(...size).rotateX(angle).translate(...at);
      paint(geometry, color, underside, grain);
    }

    function taper(start: Point, end: Point, radius: number, color: string) {
      const a = new Vector3(...start);
      const b = new Vector3(...end);
      const direction = b.clone().sub(a);
      const midpoint = a.addScaledVector(direction, 0.5);
      const geometry = spindle.toNonIndexed();
      geometry.scale(radius, direction.length(), radius);
      geometry.applyQuaternion(alignment.setFromUnitVectors(up, direction.normalize()));
      geometry.translate(midpoint.x, midpoint.y, midpoint.z);
      paint(geometry, color);
    }

    function profile(sections: readonly Section[], color: string, underside: string, grain = 0) {
      const shape = new BufferGeometry();
      const vertices: number[] = [];
      const faces: number[] = [];
      const sides = 20;
      sections.forEach(([z, y, width, height], section) => {
        for (let side = 0; side < sides; side++) {
          const angle = side * Math.PI * 2 / sides;
          vertices.push(Math.cos(angle) * width, y + Math.sin(angle) * height, z);
          if (section === 0) continue;
          const current = section * sides + side;
          const next = section * sides + (side + 1) % sides;
          faces.push(current - sides, next - sides, current, current, next - sides, next);
        }
      });
      shape.setAttribute("position", new Float32BufferAttribute(vertices, 3));
      shape.setIndex(faces);
      shape.computeVertexNormals();
      const surface = shape.toNonIndexed();
      shape.dispose();
      paint(surface, color, underside, grain);
    }

    function finish() {
      const geometry = mergeGeometries(shapes);
      shapes.forEach((shape) => shape.dispose());
      const mesh = new Mesh(geometry, material);
      mesh.receiveShadow = true;
      parent.add(mesh);
      resources.push(geometry);
    }

    return { oval, taper, profile, finish };
  }

  function groupAt(parent: Group, at: Point) {
    const group = new Group();
    group.position.set(...at);
    parent.add(group);
    return group;
  }

  function eyes(parent: Group, at: Point, pupil: string, size: number) {
    const group = assembly(parent, glass);
    for (const side of [-1, 1]) {
      group.oval([side * at[0], at[1], at[2]], [size * 0.66, size * 1.02, size], pupil);
      group.oval([side * (at[0] + size * 0.41), at[1] + size * 0.38, at[2] + size * 0.36], [size * 0.22, size * 0.29, size * 0.22], "#fff4dc");
    }
    group.finish();
  }

  function rabbit(index: number) {
    const root = new Group();
    const coat = ["#937053", "#d9c8ab", "#7c7d77"][index];
    const chest = ["#ceb395", "#f3e5ce", "#bfb9af"][index];
    const body = assembly(root);
    body.profile([[-0.39, 0.22, 0.012, 0.013], [-0.34, 0.24, 0.15, 0.135], [-0.23, 0.26, 0.205, 0.195],
      [-0.04, 0.253, 0.178, 0.172], [0.13, 0.273, 0.131, 0.138], [0.245, 0.31, 0.088, 0.098], [0.29, 0.34, 0.012, 0.013]], coat, chest, 0.075);
    body.oval([0, 0.24, -0.404], [0.077, 0.07, 0.093], chest, 0.36, "#ebe0cc");
    body.finish();

    const head = groupAt(root, [0, 0.347, 0.196]);
    const face = assembly(head);
    face.profile([[-0.106, 0.009, 0.022, 0.034], [-0.051, 0.049, 0.105, 0.116], [0.046, 0.048, 0.126, 0.116],
      [0.133, 0.012, 0.087, 0.081], [0.201, -0.013, 0.047, 0.038], [0.221, -0.017, 0.009, 0.014]], coat, chest, 0.065);
    face.oval([0, -0.007, 0.217], [0.026, 0.017, 0.015], "#5d4943");
    for (const side of [-1, 1]) {
      face.oval([side * 0.038, -0.024, 0.172], [0.041, 0.027, 0.042], chest);
      for (let whisker = 0; whisker < 3; whisker++) {
        face.taper([side * 0.057, -0.013 - whisker * 0.01, 0.17], [side * (0.139 + whisker * 0.01), 0.019 - whisker * 0.031, 0.193 - whisker * 0.022], 0.0018, "#e3d9bc");
      }
    }
    face.finish();
    eyes(head, [0.101, 0.072, 0.093], "#35261f", 0.029);

    const ears = [-1, 1].map((side) => {
      const ear = groupAt(head, [side * 0.068, 0.115, -0.003]);
      const detail = assembly(ear);
      detail.oval([0, 0.134, -0.012], [0.045, 0.166, 0.038], coat, -0.15, chest);
      detail.oval([0, 0.147, 0.014], [0.027, 0.129, 0.015], "#b78275", -0.14, "#875e5c");
      detail.finish();
      return ear;
    });
    const hind = [-1, 1].map((side) => {
      const hip = groupAt(root, [side * 0.126, 0.2, -0.192]);
      const leg = assembly(hip);
      leg.oval([side * 0.028, -0.012, -0.023], [0.104, 0.154, 0.138], coat, -0.39, chest);
      leg.oval([side * 0.018, -0.151, 0.065], [0.056, 0.049, 0.133], coat, 0.05, chest);
      for (let toe = -1; toe <= 1; toe++) leg.oval([toe * 0.023, -0.148, 0.162], [0.022, 0.019, 0.035], chest);
      leg.finish();
      return hip;
    });
    const front = [-1, 1].map((side) => {
      const shoulder = groupAt(root, [side * 0.082, 0.192, 0.131]);
      const leg = assembly(shoulder);
      leg.oval([0, -0.076, 0.02], [0.04, 0.102, 0.05], coat, -0.23, chest);
      leg.oval([0, -0.151, 0.066], [0.045, 0.035, 0.072], coat, 0.12, chest);
      leg.finish();
      return shoulder;
    });
    root.scale.setScalar(0.94 + index * 0.088);
    return { root, head, ears, hind, front };
  }

  function duck(index: number) {
    const root = new Group();
    const drake = index === 0;
    const wingTint = drake ? "#8b8576" : "#91724c";
    const plumage = drake ? "#ada591" : "#a1845b";
    const breast = drake ? "#7d4939" : "#c3a57b";
    const headTint = drake ? "#35715a" : "#886747";
    const body = assembly(root);
    body.profile([[-0.438, 0.125, 0.012, 0.019], [-0.327, 0.119, 0.109, 0.05], [-0.228, 0.111, 0.164, 0.106],
      [-0.071, 0.1, 0.225, 0.135], [0.087, 0.097, 0.193, 0.131], [0.224, 0.108, 0.126, 0.109], [0.294, 0.117, 0.018, 0.034]], plumage, "#d1c1a5", 0.08);
    body.oval([0, 0.116, 0.172], [0.151, 0.118, 0.153], breast, -0.35);
    body.oval([0, 0.215, 0.202], [0.087, 0.137, 0.091], headTint, -0.33, breast);
    if (drake) body.oval([0, 0.242, 0.214], [0.089, 0.023, 0.089], "#f2e9d8", -0.26);
    for (const side of [-1, 1]) {
      body.oval([side * 0.142, 0.145, -0.075], [0.094, 0.078, 0.25], wingTint, -0.12, "#79694f", 0.13);
      for (let feather = 0; feather < 6; feather++) {
        const x = side * (0.153 + Math.sin(feather * 0.54) * 0.06);
        body.oval([x, 0.158 + feather * 0.004, -0.154 + feather * 0.04], [0.032, 0.014, 0.122], drake ? "#a49d8d" : "#bb9561", -0.15, "#6a5749");
      }
      body.oval([side * 0.208, 0.153, -0.118], [0.025, 0.023, 0.087], "#435075", 0.12, "#303450");
      body.oval([side * 0.206, 0.169, -0.108], [0.023, 0.009, 0.099], "#e2d9c1");
      body.oval([side * 0.041, 0.143, -0.35], [0.048, 0.018, 0.091], drake ? "#383736" : "#695444", 0.23);
    }
    body.finish();
    const head = groupAt(root, [0, 0.274, 0.194]);
    const face = assembly(head);
    face.profile([[-0.103, 0.058, 0.011, 0.016], [-0.066, 0.076, 0.076, 0.085], [0.034, 0.078, 0.101, 0.098],
      [0.109, 0.061, 0.082, 0.072], [0.157, 0.044, 0.043, 0.047], [0.174, 0.035, 0.012, 0.016]], headTint, drake ? "#1f5049" : "#bc9d74", 0.07);
    face.profile([[0.12, 0.023, 0.037, 0.029], [0.163, 0.007, 0.063, 0.024], [0.248, -0.003, 0.055, 0.019], [0.287, -0.004, 0.032, 0.012],
      [0.301, -0.007, 0.007, 0.007]], drake ? "#dba949" : "#bc8751", "#75522e");
    for (const side of [-1, 1]) {
      face.oval([side * 0.043, 0.025, 0.186], [0.006, 0.004, 0.012], "#473423");
      if (!drake) face.oval([side * 0.079, 0.108, 0.059], [0.015, 0.011, 0.07], "#be9d75");
    }
    face.finish();
    eyes(head, [0.077, 0.084, 0.087], "#2e2923", 0.02);
    root.scale.setScalar(drake ? 1.19 : 0.91 + index * 0.025);
    return { root, head };
  }

  function bird(index: number) {
    const root = new Group();
    const color = index % 2 ? "#79787c" : "#897260";
    const body = assembly(root);
    body.profile([[-0.326, 0.023, 0.014, 0.01], [-0.16, 0.003, 0.068, 0.054], [0.023, 0.008, 0.112, 0.089],
      [0.147, 0.032, 0.078, 0.074], [0.232, 0.061, 0.061, 0.055], [0.273, 0.055, 0.027, 0.026]], color, "#e2d4b9", 0.075);
    body.profile([[0.245, 0.047, 0.024, 0.018], [0.279, 0.044, 0.023, 0.016], [0.343, 0.039, 0.001, 0.001]], "#b59258", "#746040");
    for (let index = -2; index <= 2; index++) body.oval([index * 0.033, 0.025, -0.283], [0.023, 0.013, 0.145 - Math.abs(index) * 0.019], "#56535b", 0.07);
    body.finish();
    eyes(root, [0.048, 0.072, 0.224], "#2c2826", 0.017);
    const wings = [-1, 1].map((side) => {
      const pivot = groupAt(root, [side * 0.08, 0.04, 0.033]);
      const inner = assembly(pivot);
      inner.oval([side * 0.169, 0.005, 0.014], [0.222, 0.048, 0.102], color, 0.075, "#cabba1");
      for (let feather = 0; feather < 6; feather++) {
        inner.oval([side * (0.068 + feather * 0.047), 0.003, -0.079], [0.037, 0.018, 0.132 - feather * 0.005], feather % 2 ? "#78717a" : color, -0.06, "#9f938a");
      }
      inner.finish();
      const tip = groupAt(pivot, [side * 0.299, -0.002, -0.04]);
      const outer = assembly(tip);
      for (let feather = 0; feather < 7; feather++) {
        outer.oval([side * (0.074 + feather * 0.034), -0.008 + feather * 0.009, -0.095 + feather * 0.014], [0.067 + feather * 0.008, 0.015, 0.126 - feather * 0.005], feather % 2 ? "#655e69" : "#716877", 0.09, "#a2988e");
      }
      outer.finish();
      return { pivot, tip };
    });
    root.scale.setScalar(1.01 + index * 0.065);
    return { root, wings };
  }

  const wingPlane = new PlaneGeometry(0.295, 0.34);
  resources.push(wingPlane);
  const wingMaterials = [["#d87843", "#f1bc66"], ["#b97992", "#eab4b8"], ["#6480ac", "#b7c5df"]].map(([dark, light]) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 160;
    const brush = canvas.getContext("2d");
    if (!brush) {
      const fallback = new MeshStandardMaterial({ color: light, side: DoubleSide });
      resources.push(fallback);
      return fallback;
    }
    const outline = new Path2D("M 5 78 C 10 62 39 23 67 13 Q 108 -5 146 10 Q 159 23 148 47 Q 136 76 101 86 C 136 90 141 121 120 139 Q 107 153 83 145 L 68 151 Q 39 139 31 121 Z");
    const gradient = brush.createRadialGradient(52, 78, 4, 52, 78, 103);
    gradient.addColorStop(0, "#45372f");
    gradient.addColorStop(0.34, dark);
    gradient.addColorStop(0.88, light);
    gradient.addColorStop(1, dark);
    brush.fillStyle = gradient;
    brush.fill(outline);
    brush.save();
    brush.clip(outline);
    brush.strokeStyle = "#4a352f";
    brush.lineWidth = 13;
    brush.stroke(outline);
    brush.lineWidth = 2.3;
    for (const [x, y] of [[153, 22], [132, 64], [104, 87], [129, 121], [93, 149], [66, 146]]) {
      brush.beginPath();
      brush.moveTo(9, 80);
      brush.quadraticCurveTo(x * 0.5, y * 0.72 + 15, x, y);
      brush.stroke();
    }
    brush.fillStyle = "#f8e4c5";
    for (const [x, y, r] of [[129, 27, 4.6], [117, 45, 3.8], [105, 59, 3], [117, 108, 5], [101, 130, 4.2], [80, 138, 3.3]]) {
      brush.beginPath();
      brush.ellipse(x, y, r * 1.64, r, -0.4, 0, Math.PI * 2);
      brush.fill();
    }
    brush.restore();
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const material = new MeshStandardMaterial({ map: texture, alphaTest: 0.45, side: DoubleSide, roughness: 0.77 });
    resources.push(texture, material);
    return material;
  });

  function butterfly(index: number) {
    const root = new Group();
    const abdomen = assembly(root);
    abdomen.oval([0, 0, -0.032], [0.023, 0.021, 0.119], "#4c3b30", 0, "#74543b");
    abdomen.oval([0, 0.007, 0.088], [0.028, 0.027, 0.029], "#3f342d");
    for (const side of [-1, 1]) {
      abdomen.taper([side * 0.008, 0.018, 0.103], [side * 0.038, 0.048, 0.153], 0.0035, "#625347");
      abdomen.taper([side * 0.038, 0.048, 0.153], [side * 0.056, 0.051, 0.183], 0.0029, "#5c4f40");
      abdomen.oval([side * 0.055, 0.051, 0.184], [0.006, 0.005, 0.009], "#524237");
    }
    abdomen.finish();
    const wings = [-1, 1].map((side) => {
      const pivot = groupAt(root, [side * 0.012, 0.008, 0]);
      const wing = new Mesh(wingPlane, wingMaterials[index % wingMaterials.length]);
      wing.rotation.x = -Math.PI / 2;
      wing.position.x = side * 0.143;
      wing.scale.x = side;
      pivot.add(wing);
      return pivot;
    });
    root.scale.setScalar(0.87 + (index % 3) * 0.065);
    return { root, wings };
  }

  return { rabbit, duck, bird, butterfly, dispose() { resources.forEach((resource) => resource.dispose()); } };
}
