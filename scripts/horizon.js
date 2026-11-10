const horizon = document.querySelector('[data-footer-horizon]');

if (horizon) {
  const icons = [...horizon.querySelectorAll('.site-footer__icon')];
  const kodo = horizon.querySelector('.site-footer__kodo');
  const sprite = kodo ? kodo.querySelector('.site-footer__sprite') : null;
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const poses = { idle: 0, crouch: 1, push: 2, float: 3, reach: 4, land: 5 };
  let frame = 0;
  let startedAt;
  let renderHop;
  let pathTimer = 0;

  const rand = (min, max) => min + Math.random() * (max - min);

  const layoutIcons = (visibleIcons) => {
    const box = horizon.getBoundingClientRect();
    const width = box.width || 1;
    const height = box.height || 1;
    const slotWidth = width / visibleIcons.length;
    visibleIcons.forEach((icon, index) => {
      const size = Math.round(rand(Math.min(slotWidth * 0.78, 74), Math.min(slotWidth * 1.2, 132)));
      const rotation = rand(-11, 11);
      const radians = (rotation * Math.PI) / 180;

      const reach = (size / 2) * (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)));
      const padX = Math.max(7, ((reach + 4) / width) * 100);
      const padY = Math.max(6, ((reach + 4) / height) * 100);
      const x = Math.min(100 - padX, Math.max(padX, ((index + 0.5) / visibleIcons.length) * 100 + rand(-2, 2)));
      const y = Math.min(100 - padY, Math.max(padY, 66 + rand(-3, 3)));
      icon.style.setProperty('--x', `${x.toFixed(1)}%`);
      icon.style.setProperty('--y', `${y.toFixed(1)}%`);
      icon.style.setProperty('--size', `${size}px`);
      icon.style.setProperty('--rot', `${rotation.toFixed(1)}deg`);
    });
  };

  const kodoPose = (x, y, rotation, facing) =>
    `translate3d(${x}px, ${y}px, 0) translate(-50%, -92.857%) rotate(${rotation}deg) scaleX(${facing})`;

  const updatePath = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    renderHop = null;
    startedAt = undefined;
    const visibleIcons = icons.filter((icon) => icon.getClientRects().length);
    if (!kodo || !sprite || !visibleIcons.length) return;
    kodo.classList.toggle('is-hopping', motion.matches);

    const bounds = horizon.getBoundingClientRect();
    const stops = visibleIcons
      .map((icon) => {
        const rect = icon.getBoundingClientRect();
        const angle = parseFloat(icon.style.getPropertyValue('--rot')) || 0;
        const radians = (angle * Math.PI) / 180;

        const height = icon.clientHeight || rect.height;
        const artTop = Number.parseFloat(icon.dataset.artTop) || 0;
        const depth = height * (0.5 - artTop);
        return {
          x: rect.left - bounds.left + rect.width / 2 + Math.sin(radians) * depth,
          y: rect.top - bounds.top + rect.height / 2 - Math.cos(radians) * depth,
          angle
        };
      })
      .sort((a, b) => a.x - b.x);

    if (!motion.matches) {
      kodo.style.transform = kodoPose(stops[0].x, stops[0].y, stops[0].angle || 0, 1);
      sprite.style.backgroundPosition = '0% 0%';
      return;
    }

    const route = [...stops, ...stops.slice(0, -1).reverse()];
    const frames = [];
    const spriteFrames = [{ time: 0, pose: poses.idle }];
    const addFrame = (time, x, y, angle = 0, facing = 1) => {
      frames.push({ time, x, y, angle, facing });
    };

    const faceOf = (from, to) => (to.x >= from.x ? -1 : 1);
    const angleAt = (stop) => stop.angle || 0;

    let time = 0;
    addFrame(0, route[0].x, route[0].y, angleAt(route[0]), faceOf(route[0], route[1] ?? route[0]));

    route.slice(1).forEach((to, index) => {
      const from = route[index];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      const facing = faceOf(from, to);
      const dir = -facing;
      const previous = index === 0 ? facing : faceOf(route[index - 1], from);

      const duration = Math.max(430, Math.min(1000, 300 + distance * 6.4));

      const headroom = Math.max(16, Math.min(from.y, to.y) - 8);
      const lift = Math.max(14, Math.min(bounds.width <= 560 ? 58 : 48, 14 + distance * 0.24, headroom));
      const takeoff = time + 130;
      const landing = takeoff + duration;

      spriteFrames.push(
        { time: time + 20, pose: poses.crouch },
        { time: takeoff, pose: poses.push },
        { time: takeoff + duration * 0.22, pose: poses.float },
        { time: takeoff + duration * 0.7, pose: poses.reach },
        { time: landing, pose: poses.land },
        { time: landing + 110, pose: poses.idle }
      );

      addFrame(time + 1, from.x, from.y, angleAt(from), previous);
      addFrame(time + 2, from.x, from.y, angleAt(from), facing);
      addFrame(takeoff, from.x, from.y, angleAt(from) - dir * 6, facing);
      for (let sample = 1; sample <= 17; sample += 1) {
        const progress = sample / 18;
        const glide = progress * progress * (3 - 2 * progress);
        const x = from.x + dx * glide;
        const y = from.y + dy * glide - lift * Math.sin(Math.PI * progress);

        const base = angleAt(from) + (angleAt(to) - angleAt(from)) * glide;
        const tilt = base + dir * 20 * Math.pow(Math.sin(Math.PI * progress), 0.6);
        addFrame(takeoff + duration * progress, x, y, tilt, facing);
      }
      addFrame(landing, to.x, to.y, angleAt(to), facing);
      time = landing + 220;
    });

    time += 260;
    const last = route[route.length - 1];
    addFrame(time, last.x, last.y, angleAt(last), faceOf(route[route.length - 2] ?? last, last));
    spriteFrames.push({ time, pose: poses.idle });

    let lastPose;
    let frameIndex = 0;
    let spriteIndex = 0;
    let lastAt = -1;
    renderHop = (elapsed) => {
      const at = elapsed % time;
      if (at < lastAt) {
        frameIndex = 0;
        spriteIndex = 0;
      }
      lastAt = at;
      while (frameIndex + 1 < frames.length && frames[frameIndex + 1].time <= at) frameIndex += 1;
      const from = frames[frameIndex];
      const to = frames[Math.min(frameIndex + 1, frames.length - 1)];
      const progress = (at - from.time) / (to.time - from.time);
      const mix = (start, end) => start + (end - start) * progress;
      kodo.style.transform = kodoPose(mix(from.x, to.x), mix(from.y, to.y),
        mix(from.angle, to.angle), from.facing);
      while (spriteIndex + 1 < spriteFrames.length && spriteFrames[spriteIndex + 1].time <= at) spriteIndex += 1;
      const pose = spriteFrames[spriteIndex].pose;
      if (pose !== lastPose) {
        sprite.style.backgroundPosition = `${pose * 20}% 0%`;
        lastPose = pose;
      }
    };
    renderHop(0);
    syncPlayback();
  };

  const tick = (now) => {
    startedAt ??= now;
    renderHop(now - startedAt);
    frame = requestAnimationFrame(tick);
  };

  let playbackFrame = 0;

  const syncPlayback = () => {
    playbackFrame = 0;
    const rect = horizon.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const bottom = top + (viewport?.height ?? innerHeight);
    const visible = rect.top < bottom && rect.bottom > top;
    if (renderHop && visible && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      startedAt = undefined;
    }
  };

  const relayout = () => {
    layoutIcons(icons.filter((icon) => icon.getClientRects().length));
    updatePath();
  };

  const resizeObserver = new ResizeObserver(relayout);
  resizeObserver.observe(horizon);

  const schedulePlayback = () => {
    if (!playbackFrame) playbackFrame = requestAnimationFrame(syncPlayback);
  };

  // Measure against the visible viewport, including when the browser toolbar moves.
  window.addEventListener('scroll', schedulePlayback, { passive: true });
  window.addEventListener('resize', schedulePlayback);
  window.visualViewport?.addEventListener('resize', schedulePlayback);
  window.visualViewport?.addEventListener('scroll', schedulePlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', updatePath);

  const schedulePath = () => {
    clearTimeout(pathTimer);
    pathTimer = setTimeout(updatePath, 90);
  };
  icons.forEach((icon) => {
    if (!icon.complete) icon.addEventListener('load', schedulePath, { once: true });
  });

  relayout();
  window.addEventListener('load', updatePath, { once: true });
}
