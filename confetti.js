// Gaelic Hero — a tiny canvas confetti burst, no external libraries.

(function () {
  const COLORS = ["#F2C94C", "#2E8B57", "#6FCF97", "#EDF0F4", "#C06B31"];

  function burst({ duration = 2200, particleCount = 140 } = {}) {
    const canvas = document.createElement("canvas");
    canvas.className = "gf-confetti-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vy: 2 + Math.random() * 3,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4,
      });
    }

    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(frame);
  }

  window.GaaConfetti = { burst };
})();
