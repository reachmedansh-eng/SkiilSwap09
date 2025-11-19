import { X } from "lucide-react";

interface SkillChipProps {
  skill: string;
  onRemove?: () => void;
  variant?: "offer" | "want";
}

export const SkillChip = ({ skill, onRemove, variant = "offer" }: SkillChipProps) => {
  const colorClass = variant === "offer" 
    ? "bg-teal/10 text-teal border-teal/20" 
    : "bg-mustard/30 text-indigo border-mustard/50";

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
