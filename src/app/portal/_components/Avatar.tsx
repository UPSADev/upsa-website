export default function Avatar({
  name,
  initials,
  color,
  size = 'md',
}: {
  name: string;
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span className={`avatar avatar-${size} avatar-${color}`} role="img" aria-label={name}>
      {initials}
    </span>
  );
}
