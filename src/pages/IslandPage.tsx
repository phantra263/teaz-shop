import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bird, Compass, Eye, Flag, Flower2, House, LocateFixed, Map, MapPin, Rabbit, Radio, ShoppingBag, Trees, Waves, Wind, Wrench, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { islandStops, type IslandStopId } from "../data/island";
import { islandAnimalInteraction, type IslandWildlifePrompt } from "../data/islandInteractions";
import { islandPlaceName, islandPlacePath, islandPlaces } from "../data/islandPlaces";
import type { IslandObstacle } from "../lib/islandNavigation";
import type { mountIslandScene } from "../lib/islandScene";
import "./shop.css";
import "./island.css";

const icons = { pier: Flag, market: ShoppingBag, lab: Wrench, studio: Radio, house: House, grove: Trees, pond: Waves };
const animalIcons = { rabbit: Rabbit, duck: Waves, bird: Bird, butterfly: Flower2 };
const obstacleMessage: Record<IslandObstacle, string> = {
  tree: "Thân cây chắn đường",
  rock: "Đá chắn đường",
  building: "Vướng công trình",
  water: "Đã tới mép nước",
};
const motionPreference = "teaz-island-motion";

function readMotionPreference() {
  try {
    const saved = localStorage.getItem(motionPreference);
    if (saved === "on" || saved === "off") return saved === "on";
  } catch {
    // Browsers can block storage without blocking the 3D scene.
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function IslandPage() {
  const location = useLocation();
  const initialStop = useRef<IslandStopId>(islandPlaces.find(({ id }) => id === location.state?.islandStop)?.id ?? "pier");
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mapCanvas = useRef<HTMLCanvasElement>(null);
  const mapPlayer = useRef<HTMLSpanElement>(null);
  const markerElements = useRef<Partial<Record<IslandStopId, HTMLButtonElement>>>({});
  const scene = useRef<ReturnType<typeof mountIslandScene>>(undefined);
  const [sceneStatus, setSceneStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [selected, setSelected] = useState<IslandStopId>(initialStop.current);
  const [walking, setWalking] = useState(false);
  const [closeView, setCloseView] = useState(true);
  const [motion, setMotion] = useState(readMotionPreference);
  const [wildlife, setWildlife] = useState<IslandWildlifePrompt>({ nearby: [], active: null });
  const [obstacle, setObstacle] = useState<IslandObstacle | null>(null);
  const [nearbyStop, setNearbyStop] = useState<IslandStopId | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const motionRef = useRef(motion);
  const stop = islandStops.find(({ id }) => id === selected) ?? islandStops[0];
  const StopIcon = icons[stop.id];
  const activePlace = walking ? undefined : islandPlaces.find(({ id }) => id === nearbyStop);
  const dockPlace = islandPlaces.find(({ id }) => id === selected);
  const PlaceIcon = activePlace && icons[activePlace.id];

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
      scene.current = mountIslandScene(host, surface, mapCanvas.current, mapPlayer.current, markerElements.current, {
        onArrive: (id) => {
          setSelected(id);
          setWalking(false);
        },
        onCancelWalk: () => setWalking(false),
        onWildlifeChange: setWildlife,
        onObstacle: setObstacle,
        onNearbyStop: (id) => {
          setNearbyStop(id);
          setPreviewOpen(false);
        },
        initialMotion: motionRef.current,
        initialStop: initialStop.current,
      });
      scene.current?.setCloseView(true);
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
    setPreviewOpen(false);
    if (scene.current) {
      setWalking(true);
      scene.current.walkTo(id);
    }
  }

  function toggleCloseView() {
    scene.current?.setCloseView(!closeView);
    setCloseView(!closeView);
    if (document.activeElement instanceof HTMLElement && document.activeElement.matches(":focus:not(:focus-visible)")) {
      document.activeElement.blur();
    }
  }

  function toggleMotion() {
    const enabled = !motion;
    motionRef.current = enabled;
    setMotion(enabled);
    scene.current?.setMotion(enabled);
    try {
      localStorage.setItem(motionPreference, enabled ? "on" : "off");
    } catch {
      // The current scene still uses the chosen setting.
    }
  }

  return (
    <div className="hub island-shell">
      <header className="island-header">
        <Link className="island-brand" to="/">
          <ArrowLeft size={17} aria-hidden="true" />
          <img src="/avatar.png" width="32" height="32" alt="" />
          <span>TeaZ Review</span>
        </Link>
        <a href="#dia-diem" className="island-ui-button"><MapPin size={17} aria-hidden="true" /> Địa điểm</a>
      </header>
      <main>
        <div className="island-stage" ref={viewport} data-scene-status={sceneStatus}>
          <canvas ref={canvas} className="island-canvas" aria-hidden="true" />
          <div className="island-intro">
            <h1>Đảo Trà</h1>
            <p><Compass size={15} aria-hidden="true" /> {closeView ? "Khám phá đảo" : "Toàn cảnh đảo"}</p>
          </div>
          <aside className="island-minimap" hidden={sceneStatus !== "ready"} aria-label="Bản đồ vị trí trên đảo">
            <div className="island-minimap-art" aria-hidden="true">
              <canvas ref={mapCanvas} width="288" height="208" />
              <span className="island-minimap-north">B</span>
              <span className="island-minimap-player" ref={mapPlayer} />
            </div>
            <span className="island-minimap-label">Bản đồ đảo</span>
          </aside>
          {sceneStatus !== "ready" && (
            <p className="island-stage-status" role="status">
              {sceneStatus === "loading" ? "Đang tải cảnh 3D…" : "Cảnh 3D không khả dụng. Chọn một địa điểm bên dưới để khám phá TeaZ."}
            </p>
          )}
          <div className="island-markers" hidden={sceneStatus !== "ready" || closeView}>
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
            <>
              {obstacle && <p className="island-obstacle" role="status">{obstacleMessage[obstacle]}</p>}
              {activePlace && PlaceIcon && (
                <aside className="island-place-card" aria-label={`Nội dung ${islandPlaceName(activePlace)}`} onKeyDown={(event) => {
                  if (event.key === "Escape") setPreviewOpen(false);
                }}>
                  <div className="island-place-card-heading">
                    <span className="island-place-card-icon"><PlaceIcon size={19} aria-hidden="true" /></span>
                    <div><h2>{islandPlaceName(activePlace)}</h2><p>{activePlace.heading}</p></div>
                  </div>
                  <div className="island-place-card-preview" id="island-place-preview" hidden={!previewOpen}>
                    <p>{activePlace.intro}</p>
                    <ul>{activePlace.preview.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div className="island-place-card-actions">
                    <button className="island-ui-button" type="button" aria-expanded={previewOpen} aria-controls="island-place-preview" onClick={() => setPreviewOpen(!previewOpen)}>
                      {previewOpen ? <X size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      {previewOpen ? "Đóng xem trước" : "Xem trước"}
                    </button>
                    <Link className="island-ui-button island-place-primary" to={islandPlacePath(activePlace)}>Xem chi tiết <ArrowRight size={16} aria-hidden="true" /></Link>
                  </div>
                </aside>
              )}
              <div className="island-area" aria-hidden="true"><StopIcon size={17} /> <span>{stop.name}</span></div>
              {(wildlife.nearby.length > 0 || wildlife.active) && (
                <div className="island-wildlife" role="group" aria-label="Tương tác với động vật">
                  {wildlife.active && <p className="island-wildlife-response" role="status">{islandAnimalInteraction[wildlife.active].response}</p>}
                  {wildlife.nearby.map((action, index) => {
                    const Icon = animalIcons[action];
                    return (
                      <button
                        key={action}
                        type="button"
                        className="island-ui-button island-wildlife-button"
                        aria-disabled={!!wildlife.active}
                        aria-keyshortcuts={index === 0 && !wildlife.active ? "E" : undefined}
                        onClick={() => scene.current?.interact(action)}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {islandAnimalInteraction[action].label}
                        {index === 0 && !wildlife.active && <kbd aria-hidden="true">E</kbd>}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="island-scene-actions">
                <button type="button" className="island-ui-button island-motion-toggle" aria-label="Hiệu ứng chuyển động" aria-pressed={motion} onClick={toggleMotion}>
                  <Wind size={17} aria-hidden="true" /> <span aria-hidden="true">Hiệu ứng {motion ? "bật" : "tắt"}</span>
                </button>
                <button type="button" className="island-ui-button" onClick={toggleCloseView}>
                  {closeView ? <Map size={18} aria-hidden="true" /> : <LocateFixed size={18} aria-hidden="true" />}
                  {closeView ? "Toàn cảnh" : "Theo chân"}
                </button>
              </div>
              <div className="island-help">
                <span className="island-help-desktop">Bấm đất hoặc <kbd>↑ ↓ ← →</kbd> để đi <span>·</span> Kéo để xoay</span>
                <span className="island-help-touch">Chạm đất để đi · Kéo để xoay</span>
              </div>
            </>
          )}
        </div>
        <section className="island-dock" id="dia-diem" aria-label="Địa điểm trên đảo">
          <h2 className="island-dock-title"><Compass size={18} aria-hidden="true" /> Điểm đến</h2>
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
            {dockPlace && <Link to={islandPlacePath(dockPlace)} className="hub-button hub-button-primary"><MapPin size={17} aria-hidden="true" /> {stop.action}</Link>}
          </div>
        </section>
      </main>
    </div>
  );
}
