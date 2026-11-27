import { useEffect, useRef } from "react";

export function ScrollLeaves({ subtle }: { subtle: boolean }) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = layer.current;
    if (!container) return;
    let previous: { x: number; y: number; time: number } | undefined;
    let distanceToNext = 0;
    let lastScrollLeaf = -Infinity;

    function dropLeaf(x: number, y: number, heading: number) {
      if (!container) return;
      if (container.childElementCount >= (subtle ? 28 : 72)) container.firstElementChild?.remove();
      const leaf = document.createElement("i");
      leaf.style.left = `${x}px`;
      leaf.style.top = `${y}px`;
      const glide = 12 + Math.random() * 20;
      leaf.style.setProperty("--glide-x", `${Math.cos(heading) * glide}px`);
      leaf.style.setProperty("--glide-y", `${Math.sin(heading) * glide}px`);
      leaf.style.setProperty("--leaf-drift", `${Math.random() * 46 - 23}px`);
      leaf.style.setProperty("--leaf-angle", `${heading + Math.PI / 4}rad`);
      leaf.style.setProperty("--leaf-size", `${8 + Math.random() * 5}px`);
      container.append(leaf);
      leaf.addEventListener("animationend", () => leaf.remove(), { once: true });
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const point = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      const start = previous;
      previous = point;
      if (!start || point.time - start.time > 180) {
        dropLeaf(point.x, point.y, 0);
        distanceToNext = subtle ? 22 : 14;
        return;
      }
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      const length = Math.hypot(dx, dy);
      if (!length) return;
      const speed = length / Math.max(1, point.time - start.time);
      const spacing = Math.max(subtle ? 22 : 14, speed * (subtle ? 42 : 28), length / 6);
      const heading = Math.atan2(dy, dx);
      while (distanceToNext <= length) {
        const fraction = distanceToNext / length;
        dropLeaf(start.x + dx * fraction, start.y + dy * fraction, heading);
        distanceToNext += spacing;
      }
      distanceToNext -= length;
    }
    function resetTrail() { previous = undefined; }
    function onScroll() {
      const now = performance.now();
      if (now - lastScrollLeaf < (subtle ? 200 : 90)) return;
      lastScrollLeaf = now;
      dropLeaf(Math.random() * window.innerWidth * .96, Math.random() * window.innerHeight * .64, Math.random() * Math.PI);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetTrail);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", resetTrail);
      window.removeEventListener("scroll", onScroll);
      container.replaceChildren();
    };
  }, [subtle]);

  return <div className="hub-scroll-leaves" ref={layer} aria-hidden="true" />;
}
