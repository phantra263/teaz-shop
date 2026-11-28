import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowUpRight, House, Map, Radio, ShoppingBag, Wrench } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { islandPlaceName, islandPlaces, type IslandPlace } from "../data/islandPlaces";
import "./shop.css";
import "./island.css";

const placeIcons = { lab: Wrench, studio: Radio, market: ShoppingBag, house: House };

function PlaceLink({ link }: { link: IslandPlace["links"][number] }) {
  const content = <>{link.label}<ArrowUpRight size={16} aria-hidden="true" /></>;
  if (link.href.startsWith("/")) return <Link className="island-ui-button" to={link.href}>{content}</Link>;
  return <a className="island-ui-button" href={link.href} target="_blank" rel={link.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}>{content}</a>;
}

export default function IslandPlacePage() {
  const { slug } = useParams();
  const place = islandPlaces.find((item) => item.slug === slug);
  const name = place ? islandPlaceName(place) : "Không tìm thấy địa điểm";
  const heading = useRef<HTMLHeadingElement>(null);
  const Icon = place ? placeIcons[place.id] : Map;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${name} | Đảo Trà`;
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    return () => { document.title = previousTitle; };
  }, [name]);

  return (
    <div className="hub island-shell island-place-page">
      <header className="island-header">
        <Link to="/dao-tra" state={place ? { islandStop: place.id } : undefined} className="island-ui-button">
          <ArrowLeft size={17} aria-hidden="true" /> Về Đảo Trà
        </Link>
        <Link className="island-brand" to="/"><img src="/avatar.png" width="32" height="32" alt="" /><span>TeaZ</span></Link>
      </header>
      <main className="island-place-main">
        <section className="island-place-hero" aria-labelledby="island-place-title">
          <span className="island-place-hero-icon"><Icon size={30} aria-hidden="true" /></span>
          {place && <p className="island-place-name">{name}</p>}
          <h1 ref={heading} tabIndex={-1} id="island-place-title">{place?.heading ?? name}</h1>
          {place && <p className="island-place-intro">{place.intro}</p>}
          {!!place?.links.length && <div className="island-place-links">{place.links.map((link) => <PlaceLink link={link} key={link.href} />)}</div>}
        </section>
        {place && (
          <section className="island-place-entries" aria-label={`Nội dung ${name}`}>
            {place.entries.map((entry) => (
              <article key={entry.title} className={place.id === "lab" ? "island-place-entry island-tool-exhibit" : "island-place-entry"}>
                {entry.cover && <img className="island-market-cover" src={entry.cover} alt="" width={place.id === "lab" ? 1280 : 405} height={place.id === "lab" ? 800 : 720} loading="lazy" />}
                <h2>{entry.title}</h2>
                <p>{entry.description}</p>
                {entry.link && <PlaceLink link={entry.link} />}
                {entry.notesUrl && <a className="island-market-notes" href={entry.notesUrl}>Đọc ghi chú review</a>}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
