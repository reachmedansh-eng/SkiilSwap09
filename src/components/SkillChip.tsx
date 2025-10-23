import { X } from "lucide-react";

interface SkillChipProps {
  skill: string;
  onRemove?: () => void;
  variant?: "offer" | "want";
}

export const SkillChip = ({ skill, onRemove, variant = "offer" }: SkillChipProps) => {
  const colorClass = variant === "offer" 
    ? "bg-teal-pulse/10 text-teal-pulse border-teal-pulse/20" 
    : "bg-golden-spark/20 text-deep-indigo border-golden-spark/40";

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${colorClass} transition-all hover:scale-105`}>
      <span className="text-sm font-medium">{skill}</span>
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
