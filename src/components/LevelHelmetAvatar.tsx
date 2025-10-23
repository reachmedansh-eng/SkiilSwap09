import React from "react";

export function LevelHelmetAvatar({
  avatarUrl,
  username,
  level: _level = 1, // kept for API compatibility, not used
  size = 64,
}: {
  avatarUrl?: string | null;
  username?: string | null;
  level?: number;
  size?: number; // px
}) {
  return (
    <div
      className="relative pixel-corners border-4 border-primary/50 overflow-hidden"
      style={{ width: size, height: size }}
      title={username || undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username || "avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl">
          👤
        </div>
      )}
    </div>
  );
}
