interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export const ProgressBar = ({ current, total, showLabel = true }: ProgressBarProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-soft-horizon">Progress</span>
          <span className="font-semibold text-teal-pulse">{current} of {total}</span>
        </div>
      )}
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-teal-pulse to-golden-spark h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
