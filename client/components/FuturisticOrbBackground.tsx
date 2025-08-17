import React, { useRef, useEffect, useState } from 'react';

interface FuturisticOrbBackgroundProps {
  enabled?: boolean;
  className?: string;
  isPaused?: boolean;
}

export function FuturisticOrbBackground({ 
  enabled = true, 
  className = "", 
  isPaused = false 
}: FuturisticOrbBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w: number, h: number;
    let centerX: number, centerY: number;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      centerX = w / 2;
      centerY = h * 0.55;
    }

    window.addEventListener('resize', resize);
    resize();

    // === Starfield (static stars) ===
    const stars = Array.from({length: 200}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      alpha: Math.random() * 0.6 + 0.2,
      radius: Math.random() * 1.5 + 0.5
    }));

    // === Spiral Orb Setup ===
    const spiralCount = 7;
    const pointsPerSpiral = 100;
    const orbRadius = 110;

    const spiralParticles = [];
    for(let j = 0; j < spiralCount; j++) {
      const baseAngle = Math.random() * Math.PI * 2;
      const speed = 0.001 + Math.random() * 0.0015;
      const ellipticalFactor = 0.55 + Math.random() * 0.45;
      const zWobble = 0.4 + Math.random() * 0.6;
      const phase = Math.random() * Math.PI * 2;

      for(let i = 0; i < pointsPerSpiral; i++) {
        const angle = (i / pointsPerSpiral) * Math.PI * 2;
        spiralParticles.push({
          j, i, angle,
          baseAngle,
          speed,
          ellipticalFactor,
          zWobble,
          phase
        });
      }
    }

    // === Red dots orbiting around the orb ===
    const redOrbitCount = 12;
    const redOrbits = [];
    for(let i = 0; i < redOrbitCount; i++) {
      redOrbits.push({
        angle: Math.random() * Math.PI * 2,
        radius: orbRadius * (0.6 + Math.random() * 0.5),
        speed: 0.002 + Math.random() * 0.0025,
        yFactor: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        size: 6 + Math.random() * 3
      });
    }

    // === Room shapes (futuristic "Star Trek ship" style) ===
    function drawRoom() {
      // Floor (triangular gradient)
      let floorGrad = ctx.createLinearGradient(0, centerY + 120, 0, h);
      floorGrad.addColorStop(0, '#0e2035');
      floorGrad.addColorStop(1, '#001010');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(centerX - 350, h);
      ctx.lineTo(centerX + 350, h);
      ctx.lineTo(centerX + 150, centerY + 120);
      ctx.lineTo(centerX - 150, centerY + 120);
      ctx.closePath();
      ctx.fill();

      // Left wall
      ctx.beginPath();
      const leftWallGrad = ctx.createLinearGradient(centerX - 350, centerY + 120, centerX - 150, centerY - 150);
      leftWallGrad.addColorStop(0, '#0a1a2a');
      leftWallGrad.addColorStop(1, '#001115');
      ctx.fillStyle = leftWallGrad;
      ctx.moveTo(centerX - 350, h);
      ctx.lineTo(centerX - 150, centerY + 120);
      ctx.lineTo(centerX - 150, centerY - 150);
      ctx.lineTo(centerX - 350, centerY);
      ctx.closePath();
      ctx.fill();

      // Right wall (mirrored)
      ctx.beginPath();
      const rightWallGrad = ctx.createLinearGradient(centerX + 350, centerY + 120, centerX + 150, centerY - 150);
      rightWallGrad.addColorStop(0, '#0a1a2a');
      rightWallGrad.addColorStop(1, '#001115');
      ctx.fillStyle = rightWallGrad;
      ctx.moveTo(centerX + 350, h);
      ctx.lineTo(centerX + 150, centerY + 120);
      ctx.lineTo(centerX + 150, centerY - 150);
      ctx.lineTo(centerX + 350, centerY);
      ctx.closePath();
      ctx.fill();

      // Ceiling arcs (semi-elliptical shapes for a ship-like dome)
      ctx.strokeStyle = '#143a6a';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 150, 370, 120, 0, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 150, 320, 110, 0, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();

      // Futuristic panels - blue-silver
      for(let i = -3; i <= 3; i++) {
        ctx.fillStyle = `rgba(100, 170, 220, 0.15)`;
        ctx.fillRect(centerX + i * 100 - 30, centerY - 100 + i * 15, 60, 150);
      }
    }

    // === Pillar / Water Feature (Palm Springs style) ===
    function drawPillar() {
      // Pillar base (transparent silver glass effect)
      const pillarX = centerX + 120;
      const pillarY = centerY + 50;
      const pillarWidth = 40;
      const pillarHeight = 280;

      // Glow base
      ctx.save();
      const grad = ctx.createLinearGradient(pillarX, pillarY, pillarX + pillarWidth, pillarY + pillarHeight);
      grad.addColorStop(0, 'rgba(160, 220, 230, 0.6)');
      grad.addColorStop(1, 'rgba(20, 50, 70, 0.1)');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(100, 200, 230, 0.9)';
      ctx.shadowBlur = 20;
      ctx.fillRect(pillarX, pillarY, pillarWidth, pillarHeight);
      ctx.restore();

      // Pillar structure lines (vertical)
      ctx.strokeStyle = 'rgba(180, 230, 250, 0.4)';
      ctx.lineWidth = 3;
      for(let i = 0; i <= pillarHeight; i += 20) {
        ctx.beginPath();
        ctx.moveTo(pillarX, pillarY + i);
        ctx.lineTo(pillarX + pillarWidth, pillarY + i + 6);
        ctx.stroke();
      }
      // Horizontal rings
      for(let i = 0; i < pillarWidth; i += 10) {
        ctx.beginPath();
        ctx.moveTo(pillarX + i, pillarY);
        ctx.lineTo(pillarX + i - 6, pillarY + pillarHeight);
        ctx.stroke();
      }

      // Water top glow
      ctx.save();
      ctx.fillStyle = 'rgba(180, 230, 250, 0.25)';
      ctx.shadowColor = 'rgba(180, 230, 250, 0.7)';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.ellipse(pillarX + pillarWidth/2, pillarY, pillarWidth * 1.3, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Water ripple effect lines on top
      ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
      ctx.lineWidth = 1;
      for(let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(pillarX + pillarWidth/2, pillarY, pillarWidth * (1 + 0.2 * i), 4 + i, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // === Draw glowing orb spiral as connected thin yellow lines with glow ===
    function drawOrbSpiral(time: number) {
      ctx.save();
      ctx.translate(centerX, centerY);
      for(let j = 0; j < spiralCount; j++) {
        ctx.beginPath();

        for(let i = 0; i < pointsPerSpiral; i++) {
          const p = spiralParticles[j * pointsPerSpiral + i];
          const nextP = spiralParticles[j * pointsPerSpiral + ((i + 1) % pointsPerSpiral)];

          const angle1 = p.angle + time * p.speed;
          const angle2 = nextP.angle + time * nextP.speed;

          const z1 = Math.sin(angle1 * p.zWobble + p.phase) * 0.5 + 0.5;
          const z2 = Math.sin(angle2 * nextP.zWobble + nextP.phase) * 0.5 + 0.5;

          const x1 = Math.cos(angle1 + p.baseAngle) * orbRadius * (1 - z1);
          const y1 = Math.sin(angle1 + p.baseAngle) * orbRadius * p.ellipticalFactor * (1 - z1);

          const x2 = Math.cos(angle2 + nextP.baseAngle) * orbRadius * (1 - z2);
          const y2 = Math.sin(angle2 + nextP.baseAngle) * orbRadius * nextP.ellipticalFactor * (1 - z2);

          if(i === 0) ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = 'rgba(255, 255, 180, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(255, 255, 160, 0.9)';
        ctx.shadowBlur = 14;
        ctx.stroke();
      }
      ctx.restore();
    }

    // === Draw Red glowing orbiting balls with silver cores ===
    function drawRedOrbits(time: number) {
      ctx.save();
      ctx.translate(centerX, centerY);
      redOrbits.forEach(r => {
        const angle = r.angle + time * r.speed;
        const x = Math.cos(angle) * r.radius;
        const y = Math.sin(angle) * r.radius * r.yFactor;
        const alpha = 0.5 + 0.5 * Math.sin(time * 0.01 + r.phase);

        // Red glow
        ctx.beginPath();
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r.size * 3);
        glow.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
        glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.arc(x, y, r.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Silver core
        ctx.beginPath();
        ctx.fillStyle = `rgba(192,192,192,${alpha})`;
        ctx.arc(x, y, r.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // === Draw BB text and rotating wrench inside orb ===
    function drawCenterObjects(time: number) {
      ctx.save();
      ctx.fillStyle = 'silver';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BB', centerX, centerY);

      ctx.translate(centerX, centerY);
      ctx.rotate(time * 0.02);
      ctx.font = '100px serif';
      ctx.fillStyle = 'gray';
      ctx.fillText('🔧', 0, 0);

      ctx.restore();
    }

    // === Animation Loop ===
    let t = 0;
    function animate() {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      t++;

      ctx.clearRect(0, 0, w, h);

      // Set background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a1b2a');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw stars
      stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      drawRoom();
      drawOrbSpiral(t);
      drawRedOrbits(t);
      drawPillar();
      drawCenterObjects(t);

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Start animation after a brief delay to simulate loading
    setTimeout(() => {
      setIsLoaded(true);
      animate();
    }, 1500);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, isPaused]);

  if (!enabled) return null;

  return (
    <div className={`fixed inset-0 z-0 ${className}`}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white/70 text-sm">Loading futuristic environment...</p>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas 
        ref={canvasRef}
        className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          display: 'block',
          filter: isPaused ? 'grayscale(50%) blur(1px)' : 'none',
          transition: 'filter 0.3s ease'
        }}
      />

      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
      
      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          Environment Paused
        </div>
      )}
    </div>
  );
}
