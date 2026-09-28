export default function Avatar({
  name,
  initials,
  color,
  size = 'md',
  imageUrl,
}: {
  name: string;
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className={`avatar avatar-${size} avatar-photo`} />
    );
  }

  return (
    <span className={`avatar avatar-${size} avatar-${color}`} role="img" aria-label={name}>
      {initials}
    </span>
  );
}
