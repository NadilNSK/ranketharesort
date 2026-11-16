(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const mobileQuery = window.matchMedia('(max-width: 700px)');

  function setMenu(open, restoreFocus = false) {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? 'Close' : 'Menu';
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) setMenu(false, true);
  });
  document.addEventListener('focusin', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  mobileQuery.addEventListener('change', () => setMenu(false));

  const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id], .hero')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const active = entries.find(entry => entry.isIntersecting);
      if (!active) return;
      for (const link of sectionLinks) {
        if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }

  const gallery = document.querySelector('#photo-gallery');
  const galleryImage = document.querySelector('#gallery-image');
  const galleryTitle = document.querySelector('#gallery-title');
  const galleryCaption = document.querySelector('#gallery-caption');
  const galleryCount = document.querySelector('#gallery-count');
  const thumbnails = document.querySelector('.gallery-thumbnails');
  const closeButton = document.querySelector('.gallery-close');
  const previousButton = document.querySelector('.gallery-prev');
  const nextButton = document.querySelector('.gallery-next');
  const originalButton = document.querySelector('#gallery-original');
  const versionNote = document.querySelector('#gallery-version');
  const labels = { rooms: 'Room interiors', outdoors: 'Outdoors', food: 'Food' };
  let currentPhotos = [];
  let currentIndex = 0;
  let opener = null;
  let galleryPointerStart = null;
  let showingOriginal = false;

  function updateImageVersion() {
    const photo = currentPhotos[currentIndex];
    galleryImage.src = showingOriginal ? photo.original : photo.src;
    galleryImage.alt = photo.alt + (showingOriginal ? '' : ' AI-enhanced; fine details may differ from the original.');
    galleryImage.width = showingOriginal ? photo.originalWidth : photo.width;
    galleryImage.height = showingOriginal ? photo.originalHeight : photo.height;
    originalButton.textContent = showingOriginal ? 'View enhanced' : 'View original';
    originalButton.setAttribute('aria-pressed', String(showingOriginal));
    versionNote.textContent = showingOriginal ? 'Original photo · supplied at low resolution' : 'AI-enhanced · fine details may differ';
  }

  function showPhoto(index) {
    currentIndex = (index + currentPhotos.length) % currentPhotos.length;
    const photo = currentPhotos[currentIndex];
    updateImageVersion();
    galleryCaption.textContent = photo.caption;
    galleryCount.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    thumbnails.querySelectorAll('button').forEach((button, index) => {
      button.setAttribute('aria-current', String(index === currentIndex));
    });
    const activeThumbnail = thumbnails.children[currentIndex];
    if (activeThumbnail) {
      const thumbnailLeft = activeThumbnail.offsetLeft - thumbnails.offsetLeft;
      const rightEdge = thumbnailLeft + activeThumbnail.offsetWidth;
      if (thumbnailLeft < thumbnails.scrollLeft) thumbnails.scrollLeft = thumbnailLeft - 4;
      else if (rightEdge > thumbnails.scrollLeft + thumbnails.clientWidth) thumbnails.scrollLeft = rightEdge - thumbnails.clientWidth + 4;
    }
    const nextPhoto = currentPhotos[(currentIndex + 1) % currentPhotos.length];
    const preload = new Image();
    preload.src = showingOriginal ? nextPhoto.original : nextPhoto.src;
  }

  function openGallery(category, index, trigger) {
    const photos = window.RESORT_PHOTOS?.[category];
    if (!photos?.length || typeof gallery.showModal !== 'function') return false;
    setMenu(false);
    opener = trigger;
    currentPhotos = photos;
    showingOriginal = false;
    galleryTitle.textContent = labels[category];
    thumbnails.replaceChildren();
    photos.forEach((photo, photoIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Show photo ${photoIndex + 1}: ${photo.caption}`);
      const image = document.createElement('img');
      image.src = photo.thumbnail;
      image.alt = '';
      image.loading = 'lazy';
      image.width = 128;
      image.height = Math.round(128 * photo.height / photo.width);
      button.append(image);
      button.addEventListener('click', () => showPhoto(photoIndex));
      thumbnails.append(button);
    });
    document.body.classList.add('gallery-open');
    gallery.showModal();
    showPhoto(index);
    closeButton.focus({ preventScroll: true });
    return true;
  }

  document.querySelectorAll('[data-gallery]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (openGallery(link.dataset.gallery, Number(link.dataset.index || 0), link)) event.preventDefault();
    });
  });
  closeButton.addEventListener('click', () => gallery.close());
  previousButton.addEventListener('click', () => showPhoto(currentIndex - 1));
  nextButton.addEventListener('click', () => showPhoto(currentIndex + 1));
  originalButton.addEventListener('click', () => {
    showingOriginal = !showingOriginal;
    updateImageVersion();
  });
  gallery.addEventListener('close', () => {
    document.body.classList.remove('gallery-open');
    galleryImage.removeAttribute('src');
    opener?.focus({ preventScroll: true });
  });
  gallery.addEventListener('click', event => {
    if (event.target !== gallery) return;
    const rect = gallery.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) gallery.close();
  });
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentIndex - 1); }
    if (event.key === 'Home') { event.preventDefault(); showPhoto(0); }
    if (event.key === 'End') { event.preventDefault(); showPhoto(currentPhotos.length - 1); }
    if (event.key === 'Tab') {
      const focusable = [...gallery.querySelectorAll('button')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  galleryImage.addEventListener('pointerdown', event => {
    galleryPointerStart = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
  });
  galleryImage.addEventListener('pointerup', event => {
    if (!galleryPointerStart) return;
    const distanceX = event.clientX - galleryPointerStart.x;
    const distanceY = event.clientY - galleryPointerStart.y;
    if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) showPhoto(currentIndex + (distanceX < 0 ? 1 : -1));
    galleryPointerStart = null;
  });
  galleryImage.addEventListener('pointercancel', () => { galleryPointerStart = null; });

  document.querySelector('#copyright-year').textContent = new Date().getFullYear();
})();
