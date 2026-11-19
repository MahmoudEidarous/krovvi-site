import { filmUrl, hasFilm, hasStill, SCREEN, sizeOf, stillSet, stillUrl } from "@/lib/app-shots";

/**
 * An iPhone drawn around the app's real screen (402 x 874 points, 428 x 900 with its band): the body, its buttons, one
 * soft reflection. The island is the screen's own (the pictures are the phone's whole screen). What is on the screen is
 * always the app itself, a picture or a film of it (lib/app-shots.ts). Its size is the height it is given (--ph, look.css).
 */
export function Device({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`dev ${className}`.trim()}>
      <div className="dev-body" />
      <i className="dev-btn l b-act" />
      <i className="dev-btn l b-vu" />
      <i className="dev-btn l b-vd" />
      <i className="dev-btn r b-pw" />
      <i className="dev-btn r b-cc" />
      <div className="dev-scr">{children}</div>
      <div className="dev-glint" />
    </div>
  );
}

/** How wide a phone's screen is drawn at most, for the browser to pick the right file. */
const SIZES = "(max-width: 860px) 86vw, 420px";

/** One of the app's screens, still. */
export function Shot({ name, alt, className = "", eager = false, sizes = SIZES }: { name: string; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  if (!hasStill(name)) return null;
  // a picture cut from a screen (a game, an app's page) has its own size; a whole screen has the phone's
  const size = sizeOf(name) ?? SCREEN;
  return (
    <img
      className={className}
      src={stillUrl(name)}
      srcSet={stillSet(name)}
      sizes={sizes}
      alt={alt}
      width={size.w}
      height={size.h}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      data-shot={name}
    />
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
  const end = film && hasStill(`${name}-end`) ? `${name}-end` : name;
  return (
    <div className={`sc ${className}`.trim()} id={id} data-scene={name} data-show={show}>
      {film && hasStill(name) && <Shot className="sc-a" name={name} alt="" eager={eager} />}
      {film && <video className="sc-v" muted playsInline preload="none" data-src={filmUrl(name)} data-film={name} aria-hidden="true" tabIndex={-1} />}
      <Shot className="sc-e" name={end} alt={alt} eager={eager} />
      {children}
    </div>
  );
}
