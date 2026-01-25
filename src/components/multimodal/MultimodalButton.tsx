import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MultimodalButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function MultimodalButton({ 
  className, 
  variant = 'default',
  size = 'default'
}: MultimodalButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate('/multimodal')}
      className={cn(
        "gap-2 relative overflow-hidden group",
        "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
        "text-white shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
    >
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span className="relative z-10">Multimodal</span>
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </Button>
  );
}

