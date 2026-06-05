import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SisterCtaButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'gold' | 'amber' | 'glass';
  className?: string;
  showArrow?: boolean;
  type?: 'button' | 'submit';
}

export function SisterCtaButton({
  children,
  onClick,
  disabled,
  variant = 'gold',
  className,
  showArrow = true,
  type = 'button',
}: SisterCtaButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group w-full inline-flex items-center justify-center gap-3 font-semibold text-sm rounded-full pl-6 pr-2 py-2 transition-all duration-300',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        variant === 'gold' && 'kb-cta-gold',
        variant === 'amber' && 'kb-cta-amber',
        variant === 'glass' && 'kb-cta-glass',
        className
      )}
    >
      <span className="flex-1 text-center sm:text-left">{children}</span>
      {showArrow && (
        <span className="kb-cta-icon">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      )}
    </button>
  );
}
