const communityCameo = document.querySelector('.community-cameo');
const communityDancer = document.querySelector('[data-dd]');
const communityFist = document.querySelector('.community-cameo__fist');
const communitySection = document.querySelector('#community');

if (communityCameo && communityDancer && communityFist && communitySection) {
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

  const punch = () => {
    if (busy) return;
    busy = true;

    if (reduceMotion.matches) {
      shatterAvatar();
      ddIsGone();
      settle();
      return;
    }

    const rect = communityDancer.getBoundingClientRect();

    communityCameo.style.setProperty('--fist-x', `${rect.left + rect.width * 0.25}px`);
    communityCameo.style.setProperty('--fist-y', `${rect.top + rect.height * 0.42}px`);
    communityCameo.style.setProperty('--dd-left', `${rect.left}px`);
    communityCameo.style.setProperty('--dd-top', `${rect.top}px`);
    communityCameo.style.setProperty('--dd-w', `${rect.width}px`);
    communityCameo.style.setProperty('--dd-h', `${rect.height}px`);

    void communityFist.offsetWidth;
    communityCameo.classList.add('is-punching');

    setTimeout(() => {
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
      shatterAvatar();
      setTimeout(() => flying.remove(), 1000);
    }, 650);

    setTimeout(ddIsGone, 1650);

    setTimeout(settle, 1900);
  };

  const bringDdBack = () => {
    if (busy) return;
    busy = true;

    reformAvatar();

    document.cookie = 'koji_dd_out=; max-age=0; path=/';
    communityCameo.classList.remove('is-punching', 'is-flung');

    const rect = communityDancer.getBoundingClientRect();
    if (!rect.width) {
      busy = false;
      return;
    }

    communityCameo.style.setProperty('--dd-left', `${rect.left}px`);
    communityCameo.style.setProperty('--dd-top', `${rect.top}px`);
    communityCameo.style.setProperty('--dd-w', `${rect.width}px`);
    communityCameo.style.setProperty('--dd-h', `${rect.height}px`);

    communityDancer.src = '/assets/community/ddfling.webp';
    document.documentElement.classList.remove('dd-gone');

    if (reduceMotion.matches) {
      communityDancer.src = '/assets/community/dddance.webp';
      busy = false;
      return;
    }

    void communityDancer.offsetWidth;
    communityCameo.classList.add('is-returning');

    setTimeout(() => {
      communityCameo.classList.remove('is-returning');
      communityDancer.src = '/assets/community/dddance.webp';
      communityCameo.style.cssText = '';
      busy = false;
    }, 800);
  };

  new Image().src = '/assets/community/ddfling.webp';

  document.addEventListener('keydown', (event) => {
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!sectionOnScreen()) return;
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
