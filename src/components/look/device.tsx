import { filmUrl, hasFilm, hasStill, stillUrl } from "@/lib/app-shots";

/**
 * An iPhone drawn at 416 x 870 around the app's real screen (390 x 844 points): the body, its buttons, the island, one
 * soft reflection. What is on the screen is always the app itself, a picture or a film of it (lib/app-shots.ts).
 */
export function Device({ children }: { children: React.ReactNode }) {
  return (
    <div className="dev">
      <div className="dev-body" />
      <i className="dev-btn l b-act" />
      <i className="dev-btn l b-vu" />
      <i className="dev-btn l b-vd" />
      <i className="dev-btn r b-pw" />
      <i className="dev-btn r b-cc" />
      <div className="dev-scr">
        {children}
        <div className="dev-isl" />
      </div>
      <div className="dev-glint" />
    </div>
  );
}

/**
 * One of the app's screens as a short story: its first moment, the film of what happens, and its last moment, one over
 * the other. The page's script plays the film when the screen is seen; until then, or when a film cannot play (a
 * phone in Low Power Mode does not play films), the last moment shows, so the answer is always there.
 */
export function Scene({
  name,
  alt,
  className = "",
  id,
  show = "e",
  eager = false,
  children,
}: {
  name: string;
  alt: string;
  className?: string;
  id?: string;
  show?: "a" | "v" | "e";
  eager?: boolean;
  children?: React.ReactNode;
}) {
  const film = hasFilm(name);
  const end = film ? `${name}-end` : name;
  const loading = eager ? "eager" : "lazy";
  return (
    <div className={`sc ${className}`.trim()} id={id} data-scene={name} data-show={show}>
      {film && hasStill(name) && <img className="sc-a" src={stillUrl(name)} alt="" width={390} height={844} loading={loading} decoding="async" data-shot={name} />}
      {film && <video className="sc-v" muted playsInline preload="none" data-src={filmUrl(name)} data-film={name} aria-hidden="true" tabIndex={-1} />}
      {hasStill(end) && <img className="sc-e" src={stillUrl(end)} alt={alt} width={390} height={844} loading={loading} decoding="async" data-shot={end} />}
      {children}
    </div>
  );
}
