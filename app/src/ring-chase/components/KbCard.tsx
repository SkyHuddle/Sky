import { cn } from '@/lib/utils';

interface KbCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'gold' | 'amber' | 'none';
  padded?: boolean;
}

export function KbCard({ children, className, accent = 'none', padded = true }: KbCardProps) {
  return (
    <div
      className={cn(
        'kb-card rounded-[var(--kb-r-lg)]',
        padded && 'p-4',
        accent === 'gold' && 'kb-card-accent-gold',
        accent === 'amber' && 'kb-card-accent-amber',
        className
      )}
    >
      {children}
    </div>
  );
}
