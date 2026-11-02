'use strict';

const WORKS_FOLDER = 'works/';
const COLOR_COUNT = 6; // matches the .card[data-color] rules in styles.css
const LANG_KEY = 'shir-lavi-art-lang';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];

const STRINGS = {
  en: {
    pageTitle: 'Shir Lavi | Interaction course works',
    metaDescription: 'Images and videos by Shir Lavi, made for her interaction course.',
    skip: 'Skip to the gallery',
    name: 'Shir Lavi',
    lede: 'Images and videos made for the interaction course',
    works: 'Works',
    empty: 'Nothing here yet. Works will appear here soon.',
    listError: "The list of works couldn't be loaded.",
    close: 'Close',
    image: 'Image',
    video: 'Video',
    fallback: "This work couldn't be displayed.",
    count: (n) => `${n} ${n === 1 ? 'work' : 'works'}`,
    viewFull: (title) => `View ${title} full size`,
  },
  he: {
    pageTitle: 'שיר לביא | עבודות מקורס אינטראקציה',
    metaDescription: 'תמונות וסרטונים של שיר לביא, שנוצרו לקורס אינטראקציה.',
    skip: 'דילוג לגלריה',
    name: 'שיר לביא',
    lede: 'תמונות וסרטונים שנוצרו לקורס האינטראקציה',
    works: 'עבודות',
    empty: 'עדיין אין כאן עבודות. הן יופיעו כאן בקרוב.',
    listError: 'לא ניתן היה לטעון את רשימת העבודות.',
    close: 'סגירה',
    image: 'תמונה',
    video: 'סרטון',
    fallback: 'לא ניתן היה להציג את העבודה הזו.',
    count: (n) => (n === 1 ? 'עבודה אחת' : `${n} עבודות`),
    viewFull: (title) => `הצגת ${title} בגודל מלא`,
  },
};

const langToggle = document.getElementById('lang-toggle');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('empty-state');
const emptyMessage = document.getElementById('empty-message');
const worksCount = document.getElementById('works-count');
const viewer = document.getElementById('viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerCaption = document.getElementById('viewer-caption');

let currentLang = 'en';

/* Language */

function t(key, ...args) {
  const value = STRINGS[currentLang][key];
  return typeof value === 'function' ? value(...args) : value;
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved in STRINGS) return saved;
  } catch {
    // Storage can be blocked; fall through to the browser's language.
  }
  return navigator.language.startsWith('he') ? 'he' : 'en';
}

function saveLanguage() {
  try {
    localStorage.setItem(LANG_KEY, currentLang);
  } catch {
    // The switch still works for this visit.
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('pageTitle');
  document.getElementById('meta-description').content = t('metaDescription');

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  // Each language's name is written in that language, so this button is findable by those who need it.
  const other = lang === 'he' ? 'en' : 'he';
  langToggle.lang = other;
  langToggle.textContent = other === 'he' ? 'עברית' : 'English';

  [...gallery.children].forEach(labelCard);
  updateCount();
}

/* Rendering */

function kindOf(file) {
  const extension = file.split('.').pop().toLowerCase();
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
  return null;
}

function titleFromFilename(name) {
  return name.replace(/\.[^.]+$/, '');
}

// A mistyped file name, or a format like HEIC that some browsers can't decode, ends up here.
function createMedia(url, kind, { alt = '', label = '' } = {}) {
  const media = document.createElement(kind === 'image' ? 'img' : 'video');
  media.src = url;
  if (kind === 'image') {
    media.alt = alt;
    media.loading = 'lazy';
  } else {
    media.controls = true;
    media.preload = 'metadata';
    media.playsInline = true;
    if (label) media.setAttribute('aria-label', label);
  }
  media.addEventListener('error', () => {
    console.warn(`Couldn't display ${url}. Check the file name in works.js.`);
    const fallback = document.createElement('p');
    fallback.className = 'media-fallback';
    fallback.dataset.i18n = 'fallback';
    fallback.textContent = t('fallback');
    // Nothing to open full size any more, so the image's button goes too.
    const wrap = media.parentElement;
    const plainWrap = document.createElement('div');
    plainWrap.className = wrap.className;
    plainWrap.append(fallback);
    wrap.replaceWith(plainWrap);
  });
  return media;
}

function createCard(work, index) {
  const url = WORKS_FOLDER + encodeURIComponent(work.file);
  const kind = kindOf(work.file);
  const title = work.title || titleFromFilename(work.file);
  const alt = work.description || title;

  const card = document.createElement('li');
  card.className = 'card';
  card.dataset.color = String(index % COLOR_COUNT);
  card.dataset.title = title;

  let mediaWrap;
  if (kind === 'image') {
    mediaWrap = document.createElement('button');
    mediaWrap.type = 'button';
    mediaWrap.addEventListener('click', () => openViewer(url, title, alt));
    mediaWrap.append(createMedia(url, kind, { alt }));
  } else {
    mediaWrap = document.createElement('div');
    mediaWrap.append(createMedia(url, kind, { label: title }));
  }
  mediaWrap.classList.add('card-media');

  const body = document.createElement('div');
  body.className = 'card-body';

  const badge = document.createElement('span');
  badge.className = 'card-type';
  badge.dataset.i18n = kind;
  badge.textContent = t(kind);

  const heading = document.createElement('h3');
  heading.className = 'card-title';
  heading.dir = 'auto';
  heading.textContent = title;

  body.append(badge, heading);
  if (work.description) {
    const description = document.createElement('p');
    description.className = 'card-description';
    description.dir = 'auto';
    description.textContent = work.description.trim();
    body.append(description);
  }
  card.append(mediaWrap, body);

  labelCard(card);
  return card;
}

// Accessible name that includes the work's title, redone on every language switch.
function labelCard(card) {
  const imageButton = card.querySelector('button.card-media');
  if (imageButton) imageButton.setAttribute('aria-label', t('viewFull', card.dataset.title));
}

function updateCount() {
  const count = gallery.children.length;
  worksCount.textContent = count ? t('count', count) : '';
  emptyState.hidden = count > 0;
}

function openViewer(url, title, alt) {
  viewerImage.src = url;
  viewerImage.alt = alt;
  viewerCaption.textContent = title;
  viewer.showModal();
}

/* Actions */

langToggle.addEventListener('click', () => {
  applyLanguage(langToggle.lang);
  saveLanguage();
});

document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});

/* Startup */

applyLanguage(loadLanguage());

// WORKS comes from works.js. A typo there stops that file from loading, which leaves it undefined.
if (typeof WORKS === 'undefined') {
  emptyMessage.dataset.i18n = 'listError';
  emptyMessage.textContent = t('listError');
} else {
  const works = WORKS.filter((work) => {
    const usable = work && typeof work.file === 'string' && kindOf(work.file);
    if (!usable) console.warn('Skipped an entry in works.js with a missing or unsupported file:', work);
    return usable;
  });
  works.forEach((work, index) => gallery.append(createCard(work, index)));
  updateCount();
}
