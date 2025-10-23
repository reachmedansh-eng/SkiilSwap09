export function PixelSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative animate-spin`}>
        <div className="absolute inset-0 pixel-corners border-4 border-primary/30" />
        <div className="absolute inset-0 pixel-corners border-4 border-transparent border-t-primary border-r-primary" />
        <div className="absolute inset-2 pixel-corners bg-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">
          💾
        </div>
      </div>
    </div>
  );
}