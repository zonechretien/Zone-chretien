'use client';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
}

export function PublicationImage({ src, alt, className }: Props) {
  const fallback = '/images/default-publication.svg';

  if (!src) {
    return <img src={fallback} alt={alt} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== window.location.origin + fallback) {
          img.src = fallback;
        }
      }}
    />
  );
}
