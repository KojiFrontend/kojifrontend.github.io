const communityCameo = document.querySelector('.community-cameo');
const communityDancer = document.querySelector('[data-dd]');
const communityPaw = document.querySelector('.community-cameo__paw');
const communitySection = document.querySelector('#community');

if (communityCameo && communityDancer && communityPaw && communitySection) {
  const secret = 'ihatedd';
  const loveSecret = 'ilovedd';
  const ddHidden = () => document.documentElement.classList.contains('dd-gone');
  const ddAvatar = document.querySelector('.playground__avatar[data-dd-avatar]');
  const stage = document.querySelector('[data-playground]');
  const trigger = communityCameo.querySelector('.community-cameo__trigger');
  const swipeLayer = communityPaw.parentElement;
  const touchInput = matchMedia('(pointer: coarse)');
  const danceSrc = communityDancer.getAttribute('src');
  const flingArt = new Image();
  flingArt.src = '/assets/community/ddfling.webp';
  let restoreButton;
  let fromLeft = false;

  const shatterAvatar = () => {
    if (!ddAvatar) return;
    if (stage && stage.ddShards) {
      stage.ddShards.shatter(ddAvatar);
      return;
    }
    if (restoreButton) return;
    restoreButton = document.createElement('button');
    restoreButton.type = 'button';
    restoreButton.className = 'dd-shard-restore';
    restoreButton.setAttribute('aria-label', 'Bring DD back');
    const picture = new Image();
    picture.src = ddAvatar.src;
    picture.alt = '';
    restoreButton.append(picture);
    ddAvatar.after(restoreButton);
    ddAvatar.style.display = 'none';
  };

  const reformAvatar = () => {
    if (!ddAvatar) return;
    if (stage && stage.ddShards) {
      stage.ddShards.reform(ddAvatar);
      return;
    }
    restoreButton?.remove();
    restoreButton = null;
    ddAvatar.style.display = '';
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let typed = '';
  let busy = false;
  let finishPunch;

  const sectionOnScreen = () => {
    const rect = communitySection.getBoundingClientRect();
    return rect.top < innerHeight * 0.75 && rect.bottom > innerHeight * 0.25;
  };

  const ddIsGone = () => {
    document.cookie = 'koji_dd_out=1; max-age=31536000; path=/; SameSite=Lax';
    document.documentElement.classList.add('dd-gone');
  };

  const settle = () => {
    if (communityCameo.classList.contains('is-aiming')) communityDancer.src = danceSrc;
    communityCameo.classList.remove('is-punching', 'is-flung', 'is-aiming');
    communityCameo.style.cssText = '';
    busy = false;
  };

  let soundContext;
  let soundBuffer;

  const prepareSound = () => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return () => {};
    try {
      soundContext ??= new Audio();
      const resumed = soundContext.resume().catch(() => {});
      soundBuffer ??= fetch('/assets/community/cat-punch.mp3')
        .then((response) => {
          if (!response.ok) throw new Error('Cat paw audio unavailable');
          return response.arrayBuffer();
        })
        .then((bytes) => soundContext.decodeAudioData(bytes))
        .catch(() => null);
      return async () => {
        const [, buffer] = await Promise.all([resumed, soundBuffer]);
        if (!buffer || soundContext.state !== 'running') return;
        const source = soundContext.createBufferSource();
        source.buffer = buffer;
        source.connect(soundContext.destination);
        source.start();
      };
    } catch {
      return () => {};
    }
  };

  const positionPaw = (target) => {
    const rect = target.getBoundingClientRect();
    const layer = swipeLayer.getBoundingClientRect();
    // Measure both in client coordinates, then position inside the fixed swipe layer.
    const x = rect.left + rect.width / 2 - layer.left;
    const y = rect.top + rect.height / 2 - layer.top;
    const distance = fromLeft ? x : layer.width - x;
    communityCameo.style.setProperty('--paw-x', `${x}px`);
    communityCameo.style.setProperty('--paw-y', `${y}px`);
    communityCameo.style.setProperty('--paw-width', `${Math.max(360, distance + 48)}px`);
    communityCameo.style.setProperty('--paw-facing', fromLeft ? '-1' : '1');
    communityCameo.style.setProperty('--paw-anchor', fromLeft ? '-95%' : '-5%');
  };

  const swipe = async (target, onContact) => {
    await communityPaw.decode().catch(() => {});
    let trackingFrame;
    const track = () => {
      positionPaw(target);
      trackingFrame = requestAnimationFrame(track);
    };
    track();
    communityCameo.classList.add('is-punching');
    const lunge = communityPaw.getAnimations().find((animation) => animation.animationName === 'paw-lunge');
    await lunge?.finished.catch(() => {});
    cancelAnimationFrame(trackingFrame);
    positionPaw(target);
    onContact();
  };

  const punch = (swipeFromLeft = false, target = communityDancer) => {
    if (busy || ddHidden()) return;
    busy = true;
    fromLeft = swipeFromLeft;
    const playSound = prepareSound();

    if (reduceMotion.matches) {
      playSound();
      shatterAvatar();
      ddIsGone();
      settle();
      return;
    }

    if (target === communityDancer && flingArt.naturalWidth) {
      // Hold a centered pose during the swipe so the moving dance frame can't dodge it.
      const rect = target.getBoundingClientRect();
      communityCameo.style.setProperty('--dd-w', `${rect.width}px`);
      communityCameo.style.setProperty('--dd-h', `${rect.height}px`);
      communityCameo.classList.add('is-aiming');
      communityDancer.src = flingArt.src;
    }

    swipe(target, () => {
      const rect = target.getBoundingClientRect();
      const flying = communityDancer.cloneNode(true);
      flying.className = 'community-cameo__dancer is-flying';
      flying.removeAttribute('data-dd');
      flying.src = flingArt.src;
      flying.style.setProperty('--dd-left', `${rect.left}px`);
      flying.style.setProperty('--dd-top', `${rect.top}px`);
      flying.style.setProperty('--dd-w', `${rect.width}px`);
      flying.style.setProperty('--dd-h', `${rect.height}px`);
      flying.style.setProperty('--dd-fling-direction', fromLeft ? '1' : '-1');
      document.body.append(flying);
      communityCameo.classList.add('is-flung');
      playSound();
      shatterAvatar();
      ddIsGone();
      const cleanup = () => {
        flying.remove();
        finishPunch = null;
        settle();
      };
      const timer = setTimeout(cleanup, 900);
      finishPunch = () => {
        clearTimeout(timer);
        cleanup();
      };
    });
  };

  const bringDdBack = () => {
    if (!ddHidden()) return;
    finishPunch?.();
    if (busy) return;
    busy = true;
    reformAvatar();

    document.cookie = 'koji_dd_out=; max-age=0; path=/';
    document.documentElement.classList.remove('dd-gone');

    if (reduceMotion.matches) {
      settle();
      return;
    }

    const rect = communityDancer.getBoundingClientRect();
    communityCameo.style.setProperty('--dd-w', `${rect.width}px`);
    communityCameo.style.setProperty('--dd-h', `${rect.height}px`);
    communityDancer.src = flingArt.src;
    communityCameo.classList.add('is-returning');

    setTimeout(() => {
      communityCameo.classList.remove('is-returning');
      communityDancer.src = danceSrc;
      settle();
    }, 800);
  };

  trigger?.addEventListener('click', (event) => punch(event.pointerType === 'touch' || touchInput.matches));

  // The avatar also supports dragging, so only a short touch counts as a tap.
  let avatarTouch;
  ddAvatar?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    avatarTouch = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
  });
  ddAvatar?.addEventListener('pointermove', (event) => {
    if (avatarTouch?.id === event.pointerId && Math.hypot(event.clientX - avatarTouch.x, event.clientY - avatarTouch.y) > 10) {
      avatarTouch = null;
    }
  });
  ddAvatar?.addEventListener('pointercancel', () => { avatarTouch = null; });
  ddAvatar?.addEventListener('pointerup', (event) => {
    if (avatarTouch?.id !== event.pointerId) return;
    const tap = event.timeStamp - avatarTouch.time < 500
      && Math.hypot(event.clientX - avatarTouch.x, event.clientY - avatarTouch.y) <= 10;
    avatarTouch = null;
    if (tap) punch(true, ddAvatar);
  });
  stage?.addEventListener('click', (event) => {
    if (!ddHidden()) return;
    const directHit = event.target.closest('.dd-shard, .dd-shard-restore');
    const touchTap = event.pointerType === 'touch' || touchInput.matches;
    const nearShard = touchTap && [...stage.querySelectorAll('.dd-shard')].some((shard) => {
      const rect = shard.getBoundingClientRect();
      return Math.hypot(event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2) <= 30;
    });
    if (directHit || nearShard) bringDdBack();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key.length !== 1 || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!sectionOnScreen()) {
      typed = '';
      return;
    }
    typed = (typed + event.key.toLowerCase()).slice(-secret.length);
    if (typed === secret && !ddHidden()) {
      typed = '';
      punch();
    } else if (typed === loveSecret && ddHidden()) {
      typed = '';
      bringDdBack();
    }
  });

  if (ddHidden() && !stage?.ddShards) shatterAvatar();
}
