import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'boot' | 'static' | 'wave' | 'welcome' | 'fade'>('boot');
  const [showText, setShowText] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [taglineText, setTaglineText] = useState('');

  useEffect(() => {
    // Boot sequence - slower for suspense
    const bootTimer = setTimeout(() => setStage('static'), 1500);
    const staticTimer = setTimeout(() => setStage('wave'), 3500);
    const waveTimer = setTimeout(() => {
      setStage('welcome');
      setShowText(true);
    }, 6000);
    const fadeTimer = setTimeout(() => setStage('fade'), 13000);
    const completeTimer = setTimeout(() => navigate('/auth'), 14500);

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(staticTimer);
      clearTimeout(waveTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [navigate]);

  // Typewriter effect for text
  useEffect(() => {
    if (!showText) return;

    const title = 'WELCOME TO';
    const subtitle = 'SkillSwap';
    const tagline = 'Where knowledge meets community';
    
    let titleIndex = 0;
    let subtitleIndex = 0;
    let taglineIndex = 0;

    // Type title first
    const titleInterval = setInterval(() => {
      if (titleIndex < title.length) {
        setTitleText(title.slice(0, titleIndex + 1));
        titleIndex++;
      } else {
        clearInterval(titleInterval);
        
        // Then type subtitle
        const subtitleInterval = setInterval(() => {
          if (subtitleIndex < subtitle.length) {
            setSubtitleText(subtitle.slice(0, subtitleIndex + 1));
            subtitleIndex++;
          } else {
            clearInterval(subtitleInterval);
            
            // Finally type tagline
            const taglineInterval = setInterval(() => {
              if (taglineIndex < tagline.length) {
                setTaglineText(tagline.slice(0, taglineIndex + 1));
                taglineIndex++;
              } else {
                clearInterval(taglineInterval);
              }
            }, 50);
          }
        }, 80);
      }
    }, 100);

    return () => {
      clearInterval(titleInterval);
    };
  }, [showText]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black flex items-center justify-center overflow-hidden relative">
      {/* Ambient edge lighting - warm desk lamp effect */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
      
      {/* Desk surface glow */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/30 via-purple-900/10 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent" />
      
      {/* Centered workspace container */}
      <div className="relative py-12">
      
      {/* Monitor - centered */}
      <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto mb-12"
          style={{
            filter: stage === 'fade' ? 'brightness(0)' : 'brightness(1)',
            transition: 'filter 1.5s ease-out'
          }}
        >
        {/* TV Frame */}
        <div className="relative w-[900px] h-[600px] bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-900 rounded-[2.5rem] p-12"
             style={{
               boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 50px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -5px 20px rgba(0,0,0,0.5)',
               transformStyle: 'preserve-3d'
             }}
        >
          {/* Wood grain texture overlay */}
          <div className="absolute inset-0 rounded-[2.5rem] opacity-40 mix-blend-multiply"
               style={{
                 backgroundImage: `
                   repeating-linear-gradient(
                     90deg,
                     #2d2d2d 0px,
                     #1a1a1a 1px,
                     #2d2d2d 2px,
                     #3a3a3a 3px
                   ),
                   repeating-linear-gradient(
                     0deg,
                     rgba(0,0,0,0.1) 0px,
                     rgba(0,0,0,0) 2px
                   )
                 `,
                 backgroundSize: '4px 100%, 100% 8px'
               }}
          />
          
          {/* Realistic corner screws */}
          <div className="absolute top-6 left-6 w-4 h-4 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-inner border border-zinc-900">
            <div className="absolute inset-1 border-t border-l border-zinc-500 rounded-full" />
          </div>
          <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-inner border border-zinc-900">
            <div className="absolute inset-1 border-t border-l border-zinc-500 rounded-full" />
          </div>
          <div className="absolute bottom-6 left-6 w-4 h-4 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-inner border border-zinc-900">
            <div className="absolute inset-1 border-t border-l border-zinc-500 rounded-full" />
          </div>
          <div className="absolute bottom-6 right-6 w-4 h-4 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-inner border border-zinc-900">
            <div className="absolute inset-1 border-t border-l border-zinc-500 rounded-full" />
          </div>
          
          {/* Brand badge with metallic effect - moved higher */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-md shadow-lg border border-zinc-600 z-50">
            <div className="text-zinc-300 font-bold text-xs tracking-[0.3em] drop-shadow-lg">RETROVISION™</div>
          </div>

          {/* Speaker grilles with more detail */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-40 bg-zinc-950 rounded-xl shadow-inner border-2 border-zinc-800"
               style={{
                 backgroundImage: `repeating-linear-gradient(
                   0deg,
                   #0a0a0a,
                   #0a0a0a 2px,
                   #1a1a1a 2px,
                   #1a1a1a 3px
                 )`,
                 boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
               }}
          >
            <div className="absolute inset-2 rounded-lg bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent" />
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-40 bg-zinc-950 rounded-xl shadow-inner border-2 border-zinc-800"
               style={{
                 backgroundImage: `repeating-linear-gradient(
                   0deg,
                   #0a0a0a,
                   #0a0a0a 2px,
                   #1a1a1a 2px,
                   #1a1a1a 3px
                 )`,
                 boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
               }}
          >
            <div className="absolute inset-2 rounded-lg bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent" />
          </div>

          {/* Screen bezel - deeper inset */}
          <div className="relative w-full h-full bg-gradient-to-b from-zinc-950 to-black rounded-2xl p-6 shadow-[inset_0_10px_30px_rgba(0,0,0,0.9)]"
               style={{
                 boxShadow: 'inset 0 8px 20px rgba(0,0,0,0.9), inset 0 -2px 10px rgba(255,255,255,0.05)'
               }}
          >
            {/* Glass reflection - more prominent */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/3 h-1/2 rounded-2xl bg-gradient-to-bl from-white/10 to-transparent pointer-events-none blur-sm" />
            
            {/* CRT Screen */}
            <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
              {/* CRT curvature effect */}
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
                }}
              />

              {/* Stage: Boot - Power on flash with warm-up effect */}
              <AnimatePresence>
                {stage === 'boot' && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ 
                        opacity: [0, 0.3, 0.8, 1, 0.7, 0],
                        scale: [0.3, 0.5, 0.8, 1, 1, 1]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-0 bg-gradient-radial from-cyan-300/80 via-blue-200/50 to-white/30 rounded-xl"
                    />
                    {/* CRT cathode ray warm-up effect */}
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: [0, 1] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 bg-white rounded-xl"
                      style={{ transformOrigin: 'center' }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Stage: Static noise - more dramatic */}
              <AnimatePresence>
                {stage === 'static' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <div 
                      className="w-full h-full bg-gray-800"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        animation: 'static 0.08s infinite'
                      }}
                    />
                    {/* Static color interference */}
                    <motion.div
                      animate={{ 
                        opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
                        backgroundPosition: ['0% 0%', '100% 100%']
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute inset-0 mix-blend-overlay"
                      style={{
                        backgroundImage: 'linear-gradient(90deg, rgba(255,0,0,0.2), rgba(0,255,0,0.2), rgba(0,0,255,0.2))',
                        backgroundSize: '200% 200%'
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stage: Wave reveal */}
              <AnimatePresence>
                {(stage === 'wave' || stage === 'welcome' || stage === 'fade') && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-blue-900 to-indigo-900">
                    {/* Animated wave gradient - slower */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        duration: 2.5,
                        ease: [0.65, 0, 0.35, 1]
                      }}
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 75%, transparent 100%)',
                        filter: 'blur(30px)'
                      }}
                    />
                    
                    {/* Chroma wave particles */}
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          x: -100,
                          y: Math.random() * 400,
                          opacity: 0
                        }}
                        animate={{ 
                          x: 900,
                          y: Math.random() * 500,
                          opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                          duration: 2.5,
                          delay: i * 0.08,
                          ease: "easeOut"
                        }}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: `hsl(${180 + i * 10}, 70%, 60%)`,
                          boxShadow: `0 0 10px hsl(${180 + i * 10}, 70%, 60%)`
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Welcome text with typewriter effect */}
              <AnimatePresence>
                {showText && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="text-center space-y-6">
                      {/* Title - typewriter */}
                      <h1 
                        className="font-retro text-6xl font-bold tracking-wider min-h-[4rem]"
                        style={{
                          color: '#fff',
                          textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(100,200,255,0.3)',
                        }}
                      >
                        {titleText}
                        {titleText.length > 0 && titleText.length < 10 && (
                          <span className="animate-pulse">|</span>
                        )}
                      </h1>
                      
                      {/* Subtitle - typewriter */}
                      <div className="min-h-[5rem]">
                        <h2 
                          className="font-retro text-7xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                          style={{
                            textShadow: '0 0 30px rgba(100,200,255,0.6)',
                          }}
                        >
                          {subtitleText}
                          {subtitleText.length > 0 && subtitleText.length < 9 && titleText.length >= 10 && (
                            <span className="text-cyan-400 animate-pulse">|</span>
                          )}
                        </h2>
                      </div>

                      {/* Tagline - typewriter */}
                      <p className="text-gray-300 text-xl font-comfortaa tracking-wide min-h-[2rem]">
                        {taglineText}
                        {taglineText.length > 0 && taglineText.length < 30 && subtitleText.length >= 9 && (
                          <span className="animate-pulse">|</span>
                        )}
                      </p>

                      {/* Initializing text - only show after all text is typed */}
                      {taglineText.length >= 30 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-cyan-400 text-sm font-retro"
                        >
                          ⚡ INITIALIZING ⚡
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* CRT Scan lines overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.3) 2px,
                    rgba(0,0,0,0.3) 4px
                  )`
                }}
              />

              {/* CRT Flicker */}
              <motion.div
                animate={{ opacity: [0.95, 1, 0.95] }}
                transition={{ duration: 0.1, repeat: Infinity }}
                className="absolute inset-0 bg-white mix-blend-overlay pointer-events-none"
                style={{ opacity: 0.02 }}
              />

              {/* Screen glow */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 100px rgba(100,200,255,0.1)',
                }}
              />
            </div>
          </div>

          {/* Control knobs - more detailed */}
          <div className="absolute bottom-8 right-12 flex gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border-4 border-zinc-800 flex items-center justify-center">
                <div className="w-3 h-8 bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-full shadow-inner" style={{ transform: 'rotate(-25deg)' }} />
              </div>
              <div className="text-xs text-zinc-500 text-center mt-1 font-bold tracking-wider">VOL</div>
            </div>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border-4 border-zinc-800 flex items-center justify-center">
                <div className="w-3 h-8 bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-full shadow-inner" style={{ transform: 'rotate(45deg)' }} />
              </div>
              <div className="text-xs text-zinc-500 text-center mt-1 font-bold tracking-wider">CH</div>
            </div>
          </div>

          {/* Power indicator LED - more realistic */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-12"
          >
            <div className="relative w-4 h-4 rounded-full bg-red-500 shadow-lg"
                 style={{
                   boxShadow: '0 0 15px #ef4444, 0 0 30px #ef4444, inset 0 1px 2px rgba(255,255,255,0.3)'
                 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-300 to-transparent opacity-60" />
            </div>
            <div className="text-xs text-zinc-500 text-center mt-1 font-bold">PWR</div>
          </motion.div>
        </div>

        {/* TV stand - more realistic with 3D depth */}
        <div className="mx-auto w-48 h-10 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-b-2xl shadow-xl border-t-2 border-zinc-600 -mt-3"
             style={{
               transformStyle: 'preserve-3d'
             }}
        />
      </motion.div>

      {/* Keyboard - centered below monitor with proper key layout */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        className="mx-auto relative flex items-start gap-4 justify-center"
      >
        {/* Keyboard cable - connecting to monitor */}
        <div className="absolute -top-16 left-[350px] w-1 h-16 bg-zinc-700/40 rounded-full" />
        
        <div className="relative w-[700px] bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-2xl px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)]">
          {/* Function keys row */}
          <div className="flex gap-1 mb-2 justify-center">
            {['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((key, i) => (
              <div
                key={i}
                className="w-9 h-7 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-[7px] font-bold">{key}</span>
              </div>
            ))}
          </div>
          
          {/* Number row */}
          <div className="flex gap-1 mb-1.5 pl-1">
            {['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
            <div className="w-16 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[9px] font-bold">←</span>
            </div>
          </div>
          
          {/* QWERTY row */}
          <div className="flex gap-1 mb-1.5">
            <div className="w-14 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Tab</span>
            </div>
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
            {['[', ']', '\\'].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
          </div>
          
          {/* ASDF row */}
          <div className="flex gap-1 mb-1.5 pl-2">
            <div className="w-16 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Caps</span>
            </div>
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
            {[';', '\''].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
            <div className="w-20 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Enter</span>
            </div>
          </div>
          
          {/* ZXCV row */}
          <div className="flex gap-1 mb-1.5 pl-4">
            <div className="w-20 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Shift</span>
            </div>
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
            {[',', '.', '/'].map((key, i) => (
              <div
                key={i}
                className="w-10 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center"
              >
                <span className="text-zinc-400 text-xs font-bold">{key}</span>
              </div>
            ))}
          </div>
          
          {/* Bottom row with spacebar */}
          <div className="flex gap-1 pl-2">
            <div className="w-12 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Ctrl</span>
            </div>
            <div className="w-12 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Alt</span>
            </div>
            {/* Spacebar */}
            <div className="flex-1 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md" />
            <div className="w-12 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Alt</span>
            </div>
            <div className="w-12 h-9 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded border border-zinc-950 shadow-md flex items-center justify-center">
              <span className="text-zinc-400 text-[8px] font-bold">Ctrl</span>
            </div>
          </div>
          
          {/* Brand label on keyboard */}
          <div className="absolute bottom-2 right-4 text-zinc-500 text-[10px] font-bold tracking-widest opacity-60">
            RETROVISION KB-84
          </div>
        </div>

      {/* Mouse - positioned to the right of keyboard at same level */}
      <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
        className="relative"
      >
        {/* Mouse cable - connecting to keyboard */}
        <div className="absolute -top-0 -left-12 w-12 h-1 bg-zinc-700/40 rounded-full" />
        
        {/* Mouse body */}
        <div className="relative w-14 h-20 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)]">
          {/* Mouse buttons divider */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-zinc-950" />
          
          {/* Left button */}
          <div className="absolute top-2 left-2 w-5 h-8 rounded-t-[1.2rem] bg-gradient-to-b from-zinc-600 to-zinc-700 opacity-80" />
          
          {/* Right button */}
          <div className="absolute top-2 right-2 w-5 h-8 rounded-t-[1.2rem] bg-gradient-to-b from-zinc-600 to-zinc-700 opacity-80" />
          
          {/* Scroll wheel */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-2 h-4 bg-zinc-950 rounded-sm border border-zinc-700">
            <div className="absolute inset-0.5 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-sm" />
          </div>
          
          {/* Mouse highlight */}
          <div className="absolute top-2 left-3 w-4 h-6 rounded-full bg-white/10 blur-sm" />
        </div>
      </motion.div>
      </div>
      
      </motion.div>
      
      </div>
      {/* End centered workspace container */}
      
      {/* CSS for static animation */}
      <style>{`
        @keyframes static {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 2px); }
          20% { transform: translate(2px, -2px); }
          30% { transform: translate(-2px, -2px); }
          40% { transform: translate(2px, 2px); }
          50% { transform: translate(-2px, 2px); }
          60% { transform: translate(2px, -2px); }
          70% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
          90% { transform: translate(-2px, 2px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}
