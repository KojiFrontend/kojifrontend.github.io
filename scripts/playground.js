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
    const pointer = { x: 0, y: 0, inside: false };
    const drag = { body: null, pointer: null, offsetX: 0, offsetY: 0, lastX: 0, lastY: 0, lastTime: 0, vx: 0, vy: 0 };
    let frame = 0;
    let previous = 0;
    let running = false;
    let visible = !('IntersectionObserver' in window);
    let scrollTimer = 0;
    let restFrames = 0;

    const clampAxis = (value, size, radius) => {
      const inset = Math.min(size / 2, radius + 2);
      return Math.max(inset, Math.min(size - inset, value));
    };

    const contain = (body, bounce = true) => {
      const x = clampAxis(body.x, view.w, body.r);
      const y = clampAxis(body.y, view.h, body.r);
      if (bounce && (body.x - x) * body.vx > 0) body.vx *= -0.45;
      if (bounce && (body.y - y) * body.vy > 0) body.vy *= -0.45;
      body.x = x;
      body.y = y;
    };

    const measure = () => {
      view.w = layer.clientWidth;
      view.h = layer.clientHeight;
      bodies.forEach((body) => {
        body.r = body.el.getBoundingClientRect().width / 2 || body.r;
        contain(body);
      });
    };

    const seed = () => {
      measure();
      const radius = Math.max(...bodies.map((body) => body.r));
      const spread = radius * Math.sqrt(bodies.length) * 1.15;
      const aspect = Math.max(0.8, Math.min(1.4, Math.sqrt(view.w / (view.h || 1))));
      const horizontal = Math.max(0, Math.min(spread * aspect, view.w / 2 - radius - 2));
      const vertical = Math.max(0, Math.min(spread / aspect, view.h / 2 - radius - 2));
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      bodies.forEach((body, index) => {
        // Spiral outward so the first render already looks like a magnetized cluster.
        const angle = index * goldenAngle;
        const distance = Math.sqrt((index + 0.5) / bodies.length);
        body.x = view.w / 2 + Math.cos(angle) * distance * horizontal;
        body.y = view.h / 2 + Math.sin(angle) * distance * vertical;
        contain(body);
      });
    };

    const render = () => {
      bodies.forEach((body) => {
        const x = Math.round((body.x - body.r) * 10) / 10;
        const y = Math.round((body.y - body.r) * 10) / 10;
        if (body.renderedX === x && body.renderedY === y) return;
        body.renderedX = x;
        body.renderedY = y;
        body.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    const step = (dt) => {
      const targetX = pointer.inside ? clampAxis(pointer.x, view.w, 0) : view.w / 2;
      const targetY = pointer.inside ? clampAxis(pointer.y, view.h, 0) : view.h / 2;
      const shardRestRadius = Math.min(view.w, view.h) * 0.12;
      const damping = Math.exp(-3.2 * dt);

      bodies.forEach((body) => {
        if (body === drag.body) return;

        const dx = targetX - body.x;
        const dy = targetY - body.y;
        const distance = Math.hypot(dx, dy) || 1;
        // Pull fragments across the box, leaving room to settle near the magnet.
        const pull = body.shard
          ? Math.min(1000, Math.max(0, distance - shardRestRadius) * 8)
          : Math.min(1200, distance * 9);
        body.vx = (body.vx + (dx / distance) * pull * dt) * damping;
        body.vy = (body.vy + (dy / distance) * pull * dt) * damping;

        const speed = Math.hypot(body.vx, body.vy);
        if (speed > 820) {
          body.vx *= 820 / speed;
          body.vy *= 820 / speed;
        }

        body.x += body.vx * dt;
        body.y += body.vy * dt;
        contain(body);
      });

      for (let pass = 0; pass < 3; pass += 1) {
        for (let i = 0; i < bodies.length; i += 1) {
          const a = bodies[i];
          for (let j = i + 1; j < bodies.length; j += 1) {
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const radius = (a.shard ? a.r * Math.SQRT2 : a.r) + (b.shard ? b.r * Math.SQRT2 : b.r);
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared >= radius * radius) continue;
            const distance = Math.sqrt(distanceSquared);
            const overlap = Math.max(0, radius - distance - 0.25);

            const nx = distance ? dx / distance : 1;
            const ny = distance ? dy / distance : 0;
            // Smaller pieces move more on impact. The dragged avatar stays under the pointer.
            const aWeight = a === drag.body ? 0 : 1 / (a.r * a.r);
            const bWeight = b === drag.body ? 0 : 1 / (b.r * b.r);
            const aShare = aWeight / (aWeight + bWeight);
            const bShare = 1 - aShare;
            a.x -= nx * overlap * aShare;
            a.y -= ny * overlap * aShare;
            b.x += nx * overlap * bShare;
            b.y += ny * overlap * bShare;
            contain(a, false);
            contain(b, false);

            if (pass !== 0) continue;
            const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (approach >= 0) continue;
            const restitution = Math.abs(approach) > 35 ? 0.35 : 0;
            const impulse = -(1 + restitution) * approach;
            a.vx -= impulse * nx * aShare;
            a.vy -= impulse * ny * aShare;
            b.vx += impulse * nx * bShare;
            b.vy += impulse * ny * bShare;
          }
        }
      }
    };

    const tick = (now) => {
      if (!running) return;
      const dt = Math.min(0.032, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      const steps = bodies.length > avatars.length ? Math.ceil(dt * 144) : 1;
      for (let index = 0; index < steps; index += 1) step(dt / steps);
      render();
      const peak = bodies.reduce((max, body) => Math.max(max, Math.hypot(body.vx, body.vy)), 0);
      if (peak < 6 && !drag.body) {
        restFrames += 1;
        if (restFrames > 40) {
          restFrames = 0;
          stop();
          return;
        }
      } else {
        restFrames = 0;
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !visible || document.hidden || (scrollTimer && !drag.body)) return;
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
      const rect = layer.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const endDrag = (throwAvatar = false) => {
      const { body, pointer: pointerId } = drag;
      if (!body) return;
      const speed = Math.hypot(drag.vx, drag.vy);
      const fresh = performance.now() - drag.lastTime < 100;
      const scale = throwAvatar && fresh && speed ? Math.min(1, 820 / speed) : 0;
      body.vx = drag.vx * scale;
      body.vy = drag.vy * scale;
      body.el.classList.remove('is-dragging');
      drag.body = null;
      drag.pointer = null;
      if (body.el.hasPointerCapture(pointerId)) body.el.releasePointerCapture(pointerId);
    };

    const release = (event) => {
      if (drag.body?.el !== event.currentTarget || drag.pointer !== event.pointerId) return;
      endDrag(event.type === 'pointerup');
    };

    bodies.forEach((body) => {
      const el = body.el;

      el.addEventListener('pointerdown', (event) => {
        if (drag.body || event.button !== 0) return;
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
        body.x = point.x + drag.offsetX;
        body.y = point.y + drag.offsetY;
        contain(body);
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
      el.addEventListener('lostpointercapture', release);
    });

    playground.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const point = localPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.x >= 0 && point.x <= view.w && point.y >= 0 && point.y <= view.h;
      start();
    }, { passive: true });
    const resetPointer = () => { pointer.inside = false; };
    playground.addEventListener('pointerenter', start);
    playground.addEventListener('pointerleave', resetPointer);
    window.addEventListener('scroll', () => {
      resetPointer();
      if (!visible || drag.body) return;
      stop();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        scrollTimer = 0;
        start();
      }, 140);
    }, { passive: true });
    window.addEventListener('blur', () => {
      resetPointer();
      endDrag();
    });

    seed();
    render();
    start();

    playground.ddShards = {
      shatter(el) {
        const body = bodyOf.get(el);
        if (!body || !bodies.includes(body)) return 0;
        if (drag.body === body) endDrag();

        const size = body.r * 2;
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

            const offsetX = (col - (cols - 1) / 2) * cell;
            const offsetY = (row - (cols - 1) / 2) * cell;
            const shard = {
              el: piece,
              shard: true,
              r: cell / 2,
              x: body.x + offsetX,
              y: body.y + offsetY,
              vx: body.vx * 0.35 + offsetX * 7 + (Math.random() - 0.5) * 60,
              vy: body.vy * 0.35 + offsetY * 7 + (Math.random() - 0.5) * 60
            };
            contain(shard);
            bodies.push(shard);
          }
        }

        bodies.splice(bodies.indexOf(body), 1);
        el.style.display = 'none';
        render();
        start();
        return cols * cols;
      },

      reform(el) {
        const body = bodyOf.get(el);
        if (!body || bodies.includes(body)) return 0;
        let removed = 0;
        for (let index = bodies.length - 1; index >= 0; index -= 1) {
          const candidate = bodies[index];
          if (candidate.shard) {
            candidate.el.remove();
            bodies.splice(index, 1);
            removed += 1;
          }
        }
        el.style.display = '';
        body.r = el.getBoundingClientRect().width / 2;
        body.vx = 0;
        body.vy = 0;
        body.renderedX = body.renderedY = undefined;
        contain(body);
        const clearance = (x, y) => Math.min(...bodies.map((other) =>
          Math.hypot(other.x - x, other.y - y) - other.r - body.r
        ));
        if (clearance(body.x, body.y) < 0) {
          let best = { x: body.x, y: body.y, gap: clearance(body.x, body.y) };
          const stride = Math.max(12, body.r);
          for (let y = body.r + 2; y <= view.h - body.r - 2; y += stride) {
            for (let x = body.r + 2; x <= view.w - body.r - 2; x += stride) {
              const gap = clearance(x, y);
              if (gap > best.gap) best = { x, y, gap };
            }
          }
          body.x = best.x;
          body.y = best.y;
        }
        bodies.push(body);
        render();
        start();
        return removed;
      }
    };

    if (document.documentElement.classList.contains('dd-gone')) {
      const catAvatar = playground.querySelector('[data-dd-avatar]');
      if (catAvatar) playground.ddShards.shatter(catAvatar);
    }

    const resize = () => {
      resetPointer();
      measure();
      render();
      start();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(layer);
    else window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
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
