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

  const shatterAvatar = () => {
    if (!ddAvatar) return;
    if (stage && stage.ddShards) {
      stage.ddShards.shatter(ddAvatar);
      return;
    }
    ddAvatar.style.display = 'none';
  };

  const reformAvatar = () => {
    if (!ddAvatar) return;
    if (stage && stage.ddShards) {
      stage.ddShards.reform(ddAvatar);
      return;
    }
    ddAvatar.style.display = '';
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let typed = '';
  let busy = false;

  const sectionOnScreen = () => {
    const rect = communitySection.getBoundingClientRect();
    return rect.top < innerHeight * 0.75 && rect.bottom > innerHeight * 0.25;
  };

  const ddIsGone = () => {
    document.cookie = 'koji_dd_out=1; max-age=31536000; path=/; SameSite=Lax';
    document.documentElement.classList.add('dd-gone');
  };

  const settle = () => {
    communityCameo.classList.remove('is-punching', 'is-flung');
    communityCameo.style.cssText = '';
    busy = false;
  };

  const contactDelay = 600;
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

  const positionPaw = () => {
    const cameo = communityCameo.getBoundingClientRect();
    const x = cameo.left + communityDancer.offsetLeft + communityDancer.offsetWidth * 0.5;
    const y = cameo.top + communityDancer.offsetTop + communityDancer.offsetHeight * 0.43;
    communityCameo.style.setProperty('--paw-x', `${x}px`);
    communityCameo.style.setProperty('--paw-y', `${y}px`);
    communityCameo.style.setProperty('--paw-width', `${Math.max(360, innerWidth - x + 48)}px`);
  };

  const swipe = async (onContact) => {
    communityPaw.loading = 'eager';
    await communityPaw.decode().catch(() => {});
    positionPaw();
    communityCameo.classList.add('is-punching');
    setTimeout(onContact, contactDelay);
  };

  const followPaw = () => {
    if (communityCameo.classList.contains('is-punching')) positionPaw();
  };
  window.addEventListener('resize', followPaw);
  window.addEventListener('scroll', followPaw, { passive: true });

  const punch = () => {
    if (busy) return;
    busy = true;
    const playSound = prepareSound();

    if (reduceMotion.matches) {
      playSound();
      shatterAvatar();
      ddIsGone();
      settle();
      return;
    }

    swipe(() => {
      const rect = communityDancer.getBoundingClientRect();
      const flying = communityDancer.cloneNode(true);
      flying.className = 'community-cameo__dancer is-flying';
      flying.removeAttribute('data-dd');
      flying.src = '/assets/community/ddfling.webp';
      flying.style.setProperty('--dd-left', `${rect.left}px`);
      flying.style.setProperty('--dd-top', `${rect.top}px`);
      flying.style.setProperty('--dd-w', `${rect.width}px`);
      flying.style.setProperty('--dd-h', `${rect.height}px`);
      document.body.append(flying);
      communityCameo.classList.add('is-flung');
      playSound();
      shatterAvatar();
      setTimeout(() => {
        flying.remove();
        ddIsGone();
        settle();
      }, 900);
    });
  };

  const bringDdBack = () => {
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
    communityDancer.src = '/assets/community/ddfling.webp';
    communityCameo.classList.add('is-returning');

    setTimeout(() => {
      communityCameo.classList.remove('is-returning');
      communityDancer.src = '/assets/community/dddance.webp';
      settle();
    }, 800);
  };

  new Image().src = '/assets/community/ddfling.webp';

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

  if (ddHidden()) {
    setTimeout(() => {
      if (!(stage && stage.ddShards) && ddAvatar) ddAvatar.style.display = 'none';
    }, 0);
  }
}
