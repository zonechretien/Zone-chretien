'use client';

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc: string;
}

export function ImageWithFallback({ src, alt, className, fallbackSrc }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => { e.currentTarget.src = fallbackSrc; }}
    />
  );
}
