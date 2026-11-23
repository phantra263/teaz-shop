import { useEffect, useRef } from "react";
import type { mountHeroScene } from "../lib/heroScene";

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let visible = false;
    let disposed = false;
    let loading = false;
    let scene: ReturnType<typeof mountHeroScene>;
    const sync = () => scene?.setActive(visible && !document.hidden);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
      if (!visible || loading) return;

      loading = true;
      void import("../lib/heroScene").then(({ mountHeroScene }) => {
        if (disposed) return;
        scene = mountHeroScene(canvas);
        sync();
      }).catch(() => {
        // The cover image remains visible when WebGL or the optional chunk is unavailable.
      });
    });

    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", sync);
      observer.disconnect();
      scene?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hub-hero-canvas" aria-hidden="true" />;
}
