import { cn } from "@/lib/utils";

interface FloatingElementsProps {
  className?: string;
}

export function FloatingElements({ className }: FloatingElementsProps) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden -z-10", className)}>
      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200/20 rounded-full animate-float" />
      <div className="absolute top-40 right-20 w-16 h-16 bg-blue-200/20 rounded-full animate-float-delayed" />
      <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-cyan-200/20 rounded-full animate-float [animation-delay:1s]" />
      <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-pink-200/20 rounded-full animate-float-delayed [animation-delay:2s]" />
      
      {/* Gradient orbs with animated backgrounds */}
      <div className="absolute top-1/3 left-1/2 w-32 h-32 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-xl animate-gradient-shift" 
           style={{ backgroundSize: '200% 200%' }} />
      <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-xl animate-gradient-shift [animation-delay:1.5s]" 
           style={{ backgroundSize: '200% 200%' }} />
      
      {/* Subtle shimmer lines */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-shimmer" />
      <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-transparent via-blue-400/20 to-transparent animate-shimmer [animation-delay:1s]" />
    </div>
  );
}

interface ParticleFieldProps {
  className?: string;
  particleCount?: number;
}

export function ParticleField({ className, particleCount = 20 }: ParticleFieldProps) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden -z-10", className)}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}
