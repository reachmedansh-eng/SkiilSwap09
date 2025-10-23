import { Progress } from "./ui/progress";
import { Flame, Trophy } from "lucide-react";

interface XPBarProps {
  xp: number;
  level: number;
  streakCount: number;
}

export const XPBar = ({ xp, level, streakCount }: XPBarProps) => {
  const xpForNextLevel = level * 1000;
  const progress = (xp % 1000) / 10;

  return (
    <div className="glass p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center glow-primary">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-2xl font-bold">{level}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-lg border border-warning/20">
          <Flame className="w-5 h-5 text-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
            <p className="text-lg font-bold text-warning">{streakCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">XP Progress</span>
          <span className="font-semibold">{xp % 1000} / {xpForNextLevel}</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>
    </div>
  );
};
