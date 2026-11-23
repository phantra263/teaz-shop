import { useEffect, useRef, useState } from "react";
import { Compass, Flag, House, MapPin, Radio, ShoppingBag, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { islandStops, type IslandStopId } from "../data/island";
import type { mountIslandScene } from "../lib/islandScene";
import "./shop.css";
import "./island.css";

const icons = { pier: Flag, market: ShoppingBag, lab: Wrench, studio: Radio, house: House };

export default function IslandPage() {
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const markerElements = useRef<Partial<Record<IslandStopId, HTMLButtonElement>>>({});
  const scene = useRef<ReturnType<typeof mountIslandScene>>(undefined);
  const [sceneStatus, setSceneStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [selected, setSelected] = useState<IslandStopId>("pier");
  const [walking, setWalking] = useState(false);
  const stop = islandStops.find(({ id }) => id === selected) ?? islandStops[0];
  const StopIcon = icons[stop.id];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Đảo Trà | TeaZ Review";
    window.scrollTo(0, 0);
    const host = viewport.current;
    const surface = canvas.current;
    if (!host || !surface) return;
    let disposed = false;

    void import("../lib/islandScene").then(({ mountIslandScene }) => {
      if (disposed) return;
      scene.current = mountIslandScene(host, surface, markerElements.current, (id) => {
        setSelected(id);
        setWalking(false);
      }, () => setWalking(false));
      setSceneStatus(scene.current ? "ready" : "fallback");
    }).catch(() => {
      if (!disposed) setSceneStatus("fallback");
    });

    return () => {
      disposed = true;
      scene.current?.dispose();
      scene.current = undefined;
      document.title = previousTitle;
    };
  }, []);

  function visit(id: IslandStopId) {
    setSelected(id);
    if (scene.current) {
      setWalking(true);
      scene.current.walkTo(id);
    }
  }

  return (
    <div className="hub island-shell">
      <header className="island-header">
        <Link className="hub-brand" to="/">
          <img src="/avatar.png" width="42" height="42" alt="" />
          <span>TeaZ <strong>Review</strong></span>
        </Link>
        <a href="#dia-diem" className="hub-button hub-button-secondary"><Compass size={17} aria-hidden="true" /> Địa điểm</a>
      </header>
      <main>
        <div className="island-stage" ref={viewport} data-scene-status={sceneStatus}>
          <canvas ref={canvas} className="island-canvas" aria-hidden="true" />
          <div className="island-intro">
            <h1>Đảo Trà</h1>
            <p>Khám phá thế giới TeaZ</p>
          </div>
          {sceneStatus !== "ready" && (
            <p className="island-stage-status" role="status">
              {sceneStatus === "loading" ? "Đang tải cảnh 3D…" : "Cảnh 3D không khả dụng. Chọn một địa điểm bên dưới để khám phá TeaZ."}
            </p>
          )}
          <div className="island-markers" hidden={sceneStatus !== "ready"}>
            {islandStops.map(({ id, name }) => {
              const Icon = icons[id];
              return (
                <button
                  className="island-pin"
                  key={id}
                  type="button"
                  ref={(element) => { markerElements.current[id] = element ?? undefined; }}
                  aria-pressed={selected === id}
                  onClick={() => visit(id)}
                ><Icon size={15} aria-hidden="true" /><span>{name}</span></button>
              );
            })}
          </div>
          {sceneStatus === "ready" && (
            <div className="island-help">
              <span className="island-help-desktop">WASD hoặc phím mũi tên để đi · Kéo để xoay</span>
              <span className="island-help-touch">Chạm đất để đi · Kéo để xoay</span>
            </div>
          )}
        </div>
        <section className="island-dock" id="dia-diem" aria-label="Địa điểm trên đảo">
          <nav className="island-destinations" aria-label="Chọn địa điểm">
            {islandStops.map(({ id, name }) => {
              const Icon = icons[id];
              return (
                <button key={id} type="button" className="island-destination" aria-pressed={selected === id} onClick={() => visit(id)}>
                  <Icon size={17} aria-hidden="true" /> {name}
                </button>
              );
            })}
          </nav>
          <div className="island-detail" aria-live="polite">
            <span className="island-detail-icon"><StopIcon size={23} aria-hidden="true" /></span>
            <div><h2>{stop.name}</h2><p>{walking ? `Đang đi tới ${stop.name}…` : stop.description}</p></div>
            {stop.href && <a href={stop.href} className="hub-button hub-button-primary"><MapPin size={17} aria-hidden="true" /> {stop.action}</a>}
          </div>
        </section>
      </main>
    </div>
  );
}
