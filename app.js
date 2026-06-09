/* ===== Content Loader for Chancemaker Landing Page ===== */

const SOCIAL_ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.82a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.23z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none"/></svg>`
};

let siteContent = null;

async function loadContent() {
  try {
    const res = await fetch('/api/content');
    if (!res.ok) throw new Error('API not available');
    siteContent = await res.json();
  } catch {
    // Fallback: load content.json directly
    try {
      const res = await fetch('/content.json');
      siteContent = await res.json();
    } catch {
      console.warn('Could not load content.json');
      return;
    }
  }
  renderContent();
}

function renderContent() {
  if (!siteContent) return;
  const c = siteContent;

  // Update all data-content elements
  document.querySelectorAll('[data-content]').forEach(el => {
    const path = el.getAttribute('data-content');
    const value = getNestedValue(c, path);
    if (value !== undefined) {
      el.textContent = value;
    }
  });

  // WhatsApp links
  const waUrl = `https://wa.me/${c.site.whatsappPhone}?text=${encodeURIComponent(c.site.whatsappMessage)}`;
  document.querySelectorAll('.whatsapp-link').forEach(el => {
    el.href = waUrl;
    el.target = '_blank';
  });

  // Social icons
  renderSocialIcons('navSocial', c.social);
  renderSocialIcons('footerSocial', c.social);

  // Nav links
  renderNavLinks(c.nav.links);

  // Hero
  setupHeroMedia(c.hero);
  renderHeroStats(c.hero.stats);

  // Dynamic sections
  renderPainCards(c.painPoints.cards);
  renderBenefitCards(c.benefits.cards);
  renderProcessSteps(c.process.steps);

  // Mockup image
  const mockupImg = document.getElementById('mockupImage');
  if (mockupImg && c.mockup) {
    mockupImg.src = c.mockup.image;
    if (c.mockup.alt) mockupImg.alt = c.mockup.alt;
  }

  // About photo
  const aboutPhoto = document.getElementById('aboutPhoto');
  if (aboutPhoto && c.about.photo) {
    aboutPhoto.src = c.about.photo;
  }

  // Font sizes
  if (c.fonts) {
    document.documentElement.style.setProperty('--heading-size', c.fonts.headingSize + 'px');
    if (c.fonts.cardTitleSize) {
      document.querySelectorAll('.benefit-card h3').forEach(el => el.style.fontSize = c.fonts.cardTitleSize + 'px');
    }
    if (c.fonts.cardDescSize) {
      document.querySelectorAll('.benefit-card p').forEach(el => el.style.fontSize = c.fonts.cardDescSize + 'px');
    }
  }

  // Page title
  document.title = c.site.title;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o && o[k], obj);
}

function renderSocialIcons(containerId, social) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const platforms = ['tiktok', 'facebook', 'instagram', 'youtube'];
  platforms.forEach(platform => {
    if (social[platform]) {
      const a = document.createElement('a');
      a.href = social[platform];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', platform);
      a.innerHTML = SOCIAL_ICONS[platform] || '';
      container.appendChild(a);
    }
  });
}

function renderNavLinks(links) {
  const nav = document.getElementById('navLinks');
  if (!nav) return;
  nav.innerHTML = '';
  links.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    li.appendChild(a);
    nav.appendChild(li);
  });
}

function getYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function setupHeroMedia(hero) {
  const video = document.getElementById('heroVideo');
  const poster = document.getElementById('heroPoster');
  const media = document.querySelector('.hero-media');

  // Remove existing iframe/yt-player div if any
  const existingIframe = media.querySelector('iframe');
  if (existingIframe) existingIframe.remove();
  const existingDiv = document.getElementById('ytPlayer');
  if (existingDiv) existingDiv.remove();

  if (hero.videoUrl) {
    const ytId = getYouTubeId(hero.videoUrl);
    if (ytId) {
      // Set YouTube thumbnail as background fallback (always visible)
      media.style.backgroundImage = `url(https://img.youtube.com/vi/${ytId}/maxresdefault.jpg)`;
      media.style.backgroundSize = 'cover';
      media.style.backgroundPosition = 'center';
      video.classList.remove('active');
      poster.classList.add('hidden');

      // Create player div for YT API
      const playerDiv = document.createElement('div');
      playerDiv.id = 'ytPlayer';
      playerDiv.style.cssText = 'opacity:0; transition:opacity 1s;';
      media.appendChild(playerDiv);

      // Load YT IFrame API
      if (!window.YT || !window.YT.Player) {
        window.onYouTubeIframeAPIReady = function() { createYTPlayer(ytId); };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      } else {
        createYTPlayer(ytId);
      }
    } else {
      // Direct video file (mp4)
      video.querySelector('source').src = hero.videoUrl;
      video.load();
      video.classList.add('active');
      poster.classList.add('hidden');
    }
  } else {
    video.classList.remove('active');
    poster.classList.remove('hidden');
    if (hero.videoPoster) {
      poster.src = hero.videoPoster;
      video.poster = hero.videoPoster;
    }
  }
}

function createYTPlayer(ytId) {
  new YT.Player('ytPlayer', {
    videoId: ytId,
    playerVars: {
      autoplay: 1,
      mute: 1,
      loop: 1,
      playlist: ytId,
      controls: 0,
      showinfo: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3
    },
    events: {
      onReady: function(e) {
        e.target.mute();
        e.target.playVideo();
      },
      onStateChange: function(e) {
        if (e.data === YT.PlayerState.PLAYING) {
          // Video is actually playing — fade in the iframe over the thumbnail
          const iframe = document.getElementById('ytPlayer');
          if (iframe) iframe.style.opacity = '1';
        }
        if (e.data === YT.PlayerState.ENDED) {
          e.target.playVideo();
        }
      }
    }
  });
}

function renderHeroStats(stats) {
  const container = document.getElementById('heroStats');
  if (!container) return;
  container.innerHTML = '';
  stats.forEach(stat => {
    const div = document.createElement('div');
    div.className = 'hero-stat';
    div.innerHTML = `<div class="num">${stat.number}</div><div class="label">${stat.label}</div>`;
    container.appendChild(div);
  });
}

function renderPainCards(cards) {
  const grid = document.getElementById('painGrid');
  if (!grid) return;
  grid.innerHTML = '';
  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'pain-card';
    div.innerHTML = `
      <h3>${card.title}</h3>
      <p>${card.description}</p>
    `;
    grid.appendChild(div);
  });
}

function renderBenefitCards(cards) {
  const container = document.getElementById('benefitsCards');
  if (!container) return;
  container.innerHTML = '';
  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'benefit-card';
    div.innerHTML = `
      <div class="benefit-icon">
        ${card.icon ? `<img src="${card.icon}" alt="">` : ''}
      </div>
      <h3>${card.title}</h3>
      <p>${card.description}</p>
    `;
    container.appendChild(div);
  });
}

function renderProcessSteps(steps) {
  const container = document.getElementById('processSteps');
  if (!container) return;
  container.innerHTML = '';
  steps.forEach((step, i) => {
    if (i > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'step-arrow';
      arrow.textContent = '←';
      container.appendChild(arrow);
    }
    const div = document.createElement('div');
    div.className = 'process-step';
    div.innerHTML = `
      <div class="step-number">${step.number}</div>
      <div class="step-icon">
        ${step.icon ? `<img src="${step.icon}" alt="">` : ''}
      </div>
      <p>${step.title}</p>
    `;
    container.appendChild(div);
  });
}

// Init
document.addEventListener('DOMContentLoaded', loadContent);
