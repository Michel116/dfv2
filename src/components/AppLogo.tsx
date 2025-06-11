import { StarHalf } from 'lucide-react';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizeClass = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl';
  const iconSize = size === 'sm' ? 5 : size === 'md' ? 6 : 8;

  return (
    <div className="flex items-center gap-2">
      <StarHalf className={`h-${iconSize} w-${iconSize} text-primary animation-pulseSlow`} />
      <h1 className={`font-headline font-bold ${textSizeClass} text-primary`}>
        DataFill <span className="text-accent">v2</span>
      </h1>
    </div>
  );
}
