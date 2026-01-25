type AvatarPlaceholderProps = {
  size?: number;
  label?: string;
};

export function AvatarPlaceholder({ size = 56, label = 'User' }: AvatarPlaceholderProps) {
  return (
    <div
      aria-label={label}
      className="flex items-center justify-center rounded-full border border-black/20 bg-white text-xs font-semibold uppercase tracking-[0.2em] text-black/60"
      style={{ width: size, height: size }}
    >
      User
    </div>
  );
}
