import { useEffect, useRef } from "react";

export const RetroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      type: 'square' | 'circle' | 'star';
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const isDark = document.documentElement.classList.contains('dark');
    const alpha = isDark ? 0.4 : 0.65;
    const colors = [
      `rgba(50, 157, 159, ${alpha})`,   // teal-pulse
      `rgba(241, 216, 105, ${alpha})`,  // golden-spark
      `rgba(215, 249, 241, ${alpha})`,  // mint-breeze
      `rgba(33, 91, 140, ${alpha})`,    // deep-indigo
    ];

    const types: ('square' | 'circle' | 'star')[] = ['square', 'circle', 'star'];

    // Create floating pixels with variety
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 6 + 3,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw animated grid pattern (stronger in light mode)
  const time = Date.now() * 0.001;
  const baseAlpha = isDark ? 0.05 : 0.12;
  const oscillation = isDark ? 0.03 : 0.05;
  ctx.strokeStyle = `rgba(139, 170, 173, ${baseAlpha + Math.sin(time) * oscillation})`;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw and update particles with different shapes
      particles.forEach((particle) => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;

        if (particle.type === 'square') {
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        } else if (particle.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'star') {
          // Draw a simple 4-pointed star (pixel style)
          const half = particle.size / 2;
          ctx.fillRect(-1, -half, 2, particle.size);
          ctx.fillRect(-half, -1, particle.size, 2);
        }

        ctx.restore();

        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        if (particle.x < -particle.size) particle.x = canvas.width + particle.size;
        if (particle.x > canvas.width + particle.size) particle.x = -particle.size;
        if (particle.y < -particle.size) particle.y = canvas.height + particle.size;
        if (particle.y > canvas.height + particle.size) particle.y = -particle.size;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="retro-background" />;
};
