import { ReactNode } from "react";
import { motion } from "framer-motion";

interface RetroArcadeMachineProps {
  children: ReactNode;
}

export function RetroArcadeMachine({ children }: RetroArcadeMachineProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
  {/* Arcade Machine Container - Minimal, smaller */}
  <div className="relative mx-auto" style={{ width: "500px" }}>
        
        {/* Top Marquee - Mint Green "SKILLSWAP" sign */}
  <div className="relative mx-auto mb-0" style={{ width: "480px" }}>
          <div 
            className="relative bg-gradient-to-b from-soft-blue to-indigo rounded-t-lg overflow-hidden border-4 border-black"
            style={{
              height: "56px",
              boxShadow: "0 3px 0 #000"
            }}
          >
            {/* Minimal marquee, no texture overlays */}

            {/* SKILLSWAP text in retro pixel font */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-white font-black tracking-wider"
                style={{
                  fontFamily: "Retropix, 'Press Start 2P', monospace",
                  fontSize: "22px",
                  textShadow: "3px 3px 0 rgba(0,0,0,0.7)",
                  letterSpacing: "3px"
                }}
              >
                SKILLSWAP
              </div>
            </div>

            {/* Subtle inner border */}
            <div className="absolute inset-2 border-2 border-soft-blue/50 rounded pointer-events-none" />
          </div>
        </div>

        {/* Main Cabinet Body - Minimal mint with subtle 3D */}
        <div 
          className="relative bg-gradient-to-b from-soft-blue to-indigo border-6 border-black"
          style={{
            borderRadius: "8px",
            boxShadow: "0 6px 0 #000, 0 18px 28px rgba(0,0,0,0.25)"
          }}
        >
          {/* Subtle side depth strips */}
          <div 
            className="absolute inset-y-2 left-0 w-2 rounded-l"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0))"
            }}
          />
          <div 
            className="absolute inset-y-2 right-0 w-2 rounded-r"
            style={{
              background: "linear-gradient(to left, rgba(0,0,0,0.35), rgba(0,0,0,0))"
            }}
          />

          {/* Top highlight and bottom shadow for bezel depth */}
          <div 
            className="absolute top-0 left-0 right-0 h-2 rounded-t"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0))"
            }}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 rounded-b"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))"
            }}
          />

          {/* Screen Bezel Section */}
          <div className="px-6 pt-6 pb-4">
            {/* Screen Frame - Black bezel */}
            <div 
              className="relative bg-black rounded-lg p-4 border-6 border-black"
              style={{
                boxShadow: `inset 0 0 24px rgba(0,0,0,0.9), 0 6px 10px rgba(0,0,0,0.4)`
              }}
            >
              {/* Outer rim highlight */}
              <div 
                className="pointer-events-none absolute -inset-1 rounded-lg"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0))",
                  maskImage: "radial-gradient(closest-side, black 70%, transparent 72%)",
                  WebkitMaskImage: "radial-gradient(closest-side, black 70%, transparent 72%)",
                  opacity: 0.6
                }}
              />
              {/* Inner bezel - lighter (single instance) */}
              <div 
                className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded p-3 border-4 border-gray-700"
                style={{
                  boxShadow: "inset 0 4px 10px rgba(0,0,0,0.8)"
                }}
              >
                {/* Screen area with CRT effect */}
                <div 
                  className="relative bg-gradient-to-br from-blue-300 via-blue-200 to-blue-100 rounded overflow-hidden"
                  style={{
                    minHeight: "320px",
                    boxShadow: "inset 0 0 28px rgba(59,130,246,0.35)"
                  }}
                 >
                  {/* CRT scanlines */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-5 z-10"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 2px,
                          rgba(0,0,0,0.8) 2px,
                          rgba(0,0,0,0.8) 4px
                        )
                      `
                    }}
                  />

                  {/* Screen glow effect */}
                  <motion.div
                    animate={{ 
                      opacity: [0.2, 0.35, 0.2]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: "radial-gradient(circle at center, transparent 0%, rgba(59,130,246,0.18) 100%)"
                    }}
                  />

                  {/* Glass reflection */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: `
                        linear-gradient(
                          135deg,
                          rgba(255,255,255,0.2) 0%,
                          transparent 20%,
                          transparent 80%,
                          rgba(255,255,255,0.1) 100%
                        )
                      `
                    }}
                  />

                  {/* Content */}
                  <motion.div
                    className="relative z-20 p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.95, duration: 0.35, ease: "easeOut" }}
                  >
                    {children}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          {/* No control panel section for minimal look */}
        </div>

        {/* Cabinet Base/Stand - extended for more realistic look */}
        <div 
          className="relative mx-auto bg-gradient-to-b from-indigo to-indigo border-6 border-black mt-0 overflow-hidden"
          style={{
            width: "480px",
            height: "120px",
            borderRadius: "0 0 12px 12px",
            boxShadow: "0 8px 0 #000, 0 18px 32px rgba(0,0,0,0.35)"
          }}
        >
          {/* Subtle base bevels */}
          <div 
            className="absolute inset-x-0 top-0 h-3"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0))" }}
          />
          <div 
            className="absolute inset-x-0 bottom-0 h-3"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0))" }}
          />
          
          {/* Side depth strips for 3D effect */}
          <div 
            className="absolute inset-y-3 left-0 w-3 rounded-bl"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0))"
            }}
          />
          <div 
            className="absolute inset-y-3 right-0 w-3 rounded-br"
            style={{
              background: "linear-gradient(to left, rgba(0,0,0,0.4), rgba(0,0,0,0))"
            }}
          />
        </div>

        {/* Floor shadow for grounding */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-[60%] h-8 bg-black rounded-full opacity-30 blur-xl"
        />

        {/* Floor shadow */}
        <div 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-black rounded-full opacity-40 blur-xl"
        />
      </div>
    </motion.div>
  );
}
