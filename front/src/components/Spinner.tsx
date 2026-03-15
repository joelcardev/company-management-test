import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export const Spinner = ({ size = 20, color, className = '' }: SpinnerProps) => {
  return (
    <Loader2 
      size={size} 
      color={color} 
      className={`spinner ${className}`.trim()} 
    />
  );
};
