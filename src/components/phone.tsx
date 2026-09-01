import Image from "next/image";

/**
 * The device: mockup frame with the screen art seated in the measured cutout.
 * Frame is desaturated to graphite so the set stays strictly mono.
 *
 * next/image so a phone downloads a phone-sized WebP instead of the 1320px PNG;
 * `sizes` tells it how wide the device renders at each breakpoint.
 */
export function Phone({ shot, alt, sizes, priority = false }: {
  shot: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[1022/2082]">
      <Image
        src="/shots/mockup.png"
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="[filter:grayscale(1)_brightness(1.02)]"
      />
      <div className="absolute left-[5.088%] top-[2.2094%] h-[95.5812%] w-[89.8239%] overflow-hidden rounded-[13.7255%/6.3317%]">
        <Image
          src={shot}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}
