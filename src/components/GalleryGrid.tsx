interface GalleryGridProps {
  photos: string[];
  city: string;
  title: string;
}

export default function GalleryGrid({ photos, city }: GalleryGridProps) {
  if (photos.length === 0) return null;

  return (
    <div className="gallery-grid">
      {photos.map((src, i) => (
        <div key={i} className="gallery-item">
          <img src={src} alt={`${city} meetup photo ${i + 1}`} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
