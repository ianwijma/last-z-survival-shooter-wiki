interface ScreenshotProps {
  id: string;
  alt: string;
  caption?: string;
  size?: "thumb" | "md" | "lg";
}

const SIZE_MAP = {
  thumb: "thumb.webp",
  md: "md.webp",
  lg: "lg.webp",
} as const;

export function Screenshot({
  id,
  alt,
  caption,
  size = "md",
}: ScreenshotProps) {
  const variant = SIZE_MAP[size];
  const src = `/media/${id}/${variant}`;

  return (
    <figure className="screenshot">
      <picture>
        <source srcSet={src} type="image/webp" />
        <img
          src={`/media/${id}/original.png`}
          alt={alt}
          loading="lazy"
          width={size === "thumb" ? 320 : size === "md" ? 800 : 1600}
        />
      </picture>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
