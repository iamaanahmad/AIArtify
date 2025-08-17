import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size]
      )} />
    </div>
  );
}

interface PulsingDotsProps {
  className?: string;
  dotClassName?: string;
}

export function PulsingDots({ className, dotClassName }: PulsingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className={cn("h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]", dotClassName)}></div>
      <div className={cn("h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]", dotClassName)}></div>
      <div className={cn("h-2 w-2 bg-pink-500 rounded-full animate-bounce", dotClassName)}></div>
    </div>
  );
}

interface GradientSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function GradientSpinner({ size = "md", className }: GradientSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "animate-spin rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 p-1",
        sizeClasses[size]
      )}>
        <div className="h-full w-full rounded-full bg-background"></div>
      </div>
    </div>
  );
}

interface ProcessingIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProcessingIndicator({ steps, currentStep, className }: ProcessingIndicatorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="text-sm font-medium animate-pulse">
        {steps[currentStep]}
      </div>
    </div>
  );
}
