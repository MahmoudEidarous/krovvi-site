/**
 * The device: mockup frame with the screen art seated in the measured cutout.
 * Frame is desaturated to graphite so the set stays strictly mono.
 */
export function Phone({ shot, alt, priority = false }: {
  shot: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[1022/2082]">
      <img
        src="/shots/mockup.png"
        alt=""
        width={1022}
        height={2082}
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full [filter:grayscale(1)_brightness(1.02)]"
      />
      <div className="absolute left-[5.088%] top-[2.2094%] h-[95.5812%] w-[89.8239%] overflow-hidden rounded-[13.7255%/6.3317%]">
        <img
          src={shot}
          alt={alt}
          width={1320}
          height={2868}
          loading={priority ? "eager" : "lazy"}
          className="block h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}
