const playground = document.querySelector('[data-playground]');

if (playground) {
  const layer = playground.querySelector('.playground__layer');
  const avatars = [...layer.querySelectorAll('.playground__avatar')];
  const motionAllowed = matchMedia('(prefers-reduced-motion: no-preference)');

  if (avatars.length && motionAllowed.matches) {
    playground.classList.add('is-live');

    const bodies = avatars.map((el) => ({ el, r: 0, x: 0, y: 0, vx: 0, vy: 0 }));
    const bodyOf = new Map(bodies.map((body) => [body.el, body]));
    const view = { w: 0, h: 0 };
    const pointer = { x: 0, y: 0, active: true, seen: false };
    const drag = { body: null, pointer: null, offsetX: 0, offsetY: 0, lastX: 0, lastY: 0, lastTime: 0, vx: 0, vy: 0 };
    let frame = 0;
    let previous = 0;
    let running = false;

    const measure = () => {
      const rect = playground.getBoundingClientRect();
      view.w = rect.width;
      view.h = rect.height;
      bodies.forEach((body) => {
        body.r = body.el.offsetWidth / 2 || 20;
        body.x = Math.min(view.w - body.r, Math.max(body.r, body.x));
        body.y = Math.min(view.h - body.r, Math.max(body.r, body.y));
      });
      if (!pointer.seen) {
        pointer.x = view.w / 2;
        pointer.y = view.h / 2;
      }
    };

    const seed = () => {
      measure();
      pointer.x = view.w / 2;
      pointer.y = view.h / 2;
      pointer.active = true;
      const columns = Math.max(1, Math.round(view.w / 72));
      const rows = Math.max(1, Math.ceil(bodies.length / columns));
      bodies.forEach((body, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const spreadX = (column + 0.5) * (view.w / columns) + (Math.random() - 0.5) * 14;
        const spreadY = (row + 0.5) * (view.h / rows) + (Math.random() - 0.5) * 12;
        body.x = Math.min(view.w - body.r, Math.max(body.r, spreadX));
        body.y = Math.min(view.h - body.r, Math.max(body.r, spreadY));
        body.vx = (Math.random() - 0.5) * 120;
        body.vy = (Math.random() - 0.5) * 120;
      });
    };

    const render = () => {
      bodies.forEach((body) => {
        body.el.style.transform = `translate3d(${(body.x - body.r).toFixed(1)}px, ${(body.y - body.r).toFixed(1)}px, 0)`;
      });
    };

    const step = (dt) => {
      const floor = view.h;
      const right = view.w;
      const damping = Math.exp(-3.2 * dt);

      bodies.forEach((body) => {
        if (body === drag.body) return;

        const dx = pointer.x - body.x;
        const dy = pointer.y - body.y;
        const distance = Math.hypot(dx, dy) || 1;
        const pull = Math.min(1200, distance * 9);
        body.vx += (dx / distance) * pull * dt;
        body.vy += (dy / distance) * pull * dt;

        body.vx *= damping;
        body.vy *= damping;

        const speed = Math.hypot(body.vx, body.vy);
        if (speed > 820) {
          body.vx = (body.vx / speed) * 820;
          body.vy = (body.vy / speed) * 820;
        }

        body.x += body.vx * dt;
        body.y += body.vy * dt;

        if (body.x - body.r < 0) {
          body.x = body.r;
          body.vx = Math.abs(body.vx) * 0.6;
        } else if (body.x + body.r > right) {
          body.x = right - body.r;
          body.vx = -Math.abs(body.vx) * 0.6;
        }

        if (body.y - body.r < 0) {
          body.y = body.r;
          body.vy = Math.abs(body.vy) * 0.6;
        } else if (body.y + body.r > floor) {
          body.y = floor - body.r;
          body.vy = -Math.abs(body.vy) * 0.6;
        }
      });

      for (let i = 0; i < bodies.length; i += 1) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j += 1) {
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = a.r + b.r;
          const dist2 = dx * dx + dy * dy;
          if (dist2 >= min * min || dist2 < 0.0001) continue;

          const dist = Math.sqrt(dist2);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = min - dist;
          const aDragged = a === drag.body;
          const bDragged = b === drag.body;
          const aShare = aDragged ? 0 : bDragged ? 1 : 0.5;
          const bShare = bDragged ? 0 : aDragged ? 1 : 0.5;

          a.x -= nx * overlap * aShare;
          a.y -= ny * overlap * aShare;
          b.x += nx * overlap * bShare;
          b.y += ny * overlap * bShare;

          const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (approach > 0) continue;
          const impulse = -(1 + 0.35) * approach * 0.5;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }
      }

      bodies.forEach((body) => {
        body.x = Math.min(right - body.r, Math.max(body.r, body.x));
        body.y = Math.min(floor - body.r, body.y);
      });
    };

    const tick = (now) => {
      if (!running) return;
      const dt = Math.min(0.032, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      step(dt);
      render();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      previous = performance.now();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const localPoint = (event) => {
      const rect = playground.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const release = (event) => {
      const body = bodyOf.get(event.currentTarget);
      if (!body || drag.body !== body) return;
      body.vx = Math.max(-1800, Math.min(1800, drag.vx));
      body.vy = Math.max(-1800, Math.min(1800, drag.vy));
      body.el.classList.remove('is-dragging');
      drag.body = null;
      drag.pointer = null;
      start();
    };

    bodies.forEach((body) => {
      const el = body.el;

      el.addEventListener('pointerdown', (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        const point = localPoint(event);
        drag.body = body;
        drag.pointer = event.pointerId;
        drag.offsetX = body.x - point.x;
        drag.offsetY = body.y - point.y;
        drag.lastX = point.x;
        drag.lastY = point.y;
        drag.lastTime = performance.now();
        drag.vx = 0;
        drag.vy = 0;
        body.vx = 0;
        body.vy = 0;
        el.classList.add('is-dragging');
        try {
          el.setPointerCapture(event.pointerId);
        } catch {

        }
        start();
      });

      el.addEventListener('pointermove', (event) => {
        if (drag.body !== body || drag.pointer !== event.pointerId) return;
        event.preventDefault();
        const point = localPoint(event);
        body.x = Math.min(view.w - body.r, Math.max(body.r, point.x + drag.offsetX));
        body.y = Math.min(view.h - body.r, Math.max(body.r, point.y + drag.offsetY));
        const now = performance.now();
        const elapsed = Math.max(0.008, (now - drag.lastTime) / 1000);
        drag.vx = (point.x - drag.lastX) / elapsed;
        drag.vy = (point.y - drag.lastY) / elapsed;
        drag.lastX = point.x;
        drag.lastY = point.y;
        drag.lastTime = now;
        render();
      });

      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
    });

    window.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType === 'touch') return;
        const point = localPoint(event);
        pointer.x = point.x;
        pointer.y = point.y;
        pointer.active = true;
        pointer.seen = true;
      },
      { passive: true }
    );

    seed();
    render();
    start();

    playground.ddShards = {
      shatter(el) {
        const body = bodyOf.get(el);
        if (!body) return 0;

        const size = Math.max(24, Math.round(body.r * 2));
        const cols = 5;
        const cell = size / cols;
        const src = `url("${el.currentSrc || el.src}")`;

        for (let row = 0; row < cols; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const piece = document.createElement('span');
            piece.className = 'dd-shard';
            piece.style.cssText = [
              `width:${cell}px`,
              `height:${cell}px`,
              `background-image:${src}`,
              `background-size:${size}px ${size}px`,
              `background-position:${-col * cell}px ${-row * cell}px`
            ].join(';');
            layer.append(piece);

            const shard = {
              el: piece,
              r: cell / 2,
              x: body.x + (col - (cols - 1) / 2) * cell,
              y: body.y + (row - (cols - 1) / 2) * cell,
              vx: (Math.random() - 0.5) * 460,
              vy: (Math.random() - 0.5) * 460
            };
            bodies.push(shard);
            bodyOf.set(piece, shard);
          }
        }

        el.ddHome = { x: body.x, y: body.y };
        bodies.splice(bodies.indexOf(body), 1);
        bodyOf.delete(el);
        if (drag.body === body) {
          drag.body = null;
          drag.pointer = null;
        }
        el.style.display = 'none';
        render();
        start();
        return cols * cols;
      },

      reform(el) {
        if (!el) return 0;
        let removed = 0;
        for (let index = bodies.length - 1; index >= 0; index -= 1) {
          const candidate = bodies[index];
          if (candidate.el.classList.contains('dd-shard')) {
            bodyOf.delete(candidate.el);
            candidate.el.remove();
            bodies.splice(index, 1);
            removed += 1;
          }
        }
        if (bodyOf.has(el)) return removed;

        el.style.display = '';
        const home = el.ddHome || { x: view.w / 2, y: view.h / 2 };
        const body = {
          el,
          r: el.offsetWidth / 2 || 20,
          x: Math.min(view.w, Math.max(0, home.x)),
          y: Math.min(view.h, Math.max(0, home.y)),
          vx: 0,
          vy: 0
        };
        bodies.push(body);
        bodyOf.set(el, body);
        render();
        start();
        return removed;
      }
    };

    if (document.documentElement.classList.contains('dd-gone')) {
      const catAvatar = playground.querySelector('[data-dd-avatar]');
      if (catAvatar) playground.ddShards.shatter(catAvatar);
    }

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const width = view.w;
        measure();
        if (view.w !== width) {
          bodies.forEach((body) => {
            body.x = Math.min(view.w - body.r, Math.max(body.r, body.x));
            body.y = Math.min(view.h - body.r, Math.max(body.r, body.y));
          });
          render();
        }
      }, 150);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      }).observe(playground);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
  }
}
