type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

/**
 * 優しいパステルブルーのローディング表示。
 */
export default function LoadingSpinner({
  label = '読み込み中...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-3 text-sm text-brand-muted ${className}`}>
      <span className="relative inline-flex h-6 w-6 items-center justify-center">
        <span className="absolute h-6 w-6 animate-spin rounded-full border-2 border-brand-accent-soft border-t-brand-accent" />
        <span className="h-2.5 w-2.5 rounded-full bg-blue-50" />
      </span>
      <span className="leading-relaxed">{label}</span>
    </div>
  );
}
