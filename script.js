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
    showItem: (n, total, kind) => `Show item ${n} of ${total}: ${kind}`,
    problem: 'File problem',
    untitled: 'Untitled',
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
    showItem: (n, total, kind) => `הצגת פריט ${n} מתוך ${total}: ${kind}`,
    problem: 'בעיה בקובץ',
    untitled: 'ללא כותרת',
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
let listLoaded = false;

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
  if (typeof file !== 'string') return null;
  const extension = file.split('.').pop().toLowerCase();
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
  return null;
}

function titleFromFilename(name) {
  return name.replace(/\.[^.]+$/, '');
}

function createFallback() {
  const fallback = document.createElement('p');
  fallback.className = 'media-fallback';
  fallback.dataset.i18n = 'fallback';
  fallback.textContent = t('fallback');
  return fallback;
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
    // Nothing to open full size any more, so the image's button goes too.
    const wrap = media.parentElement;
    const plainWrap = document.createElement('div');
    plainWrap.className = wrap.className;
    plainWrap.append(createFallback());
    wrap.replaceWith(plainWrap);
  });
  return media;
}

function urlOf(file) {
  return WORKS_FOLDER + encodeURIComponent(file);
}

// An entry lists one file under "file" or several under "files".
// Bad names are kept rather than dropped, so the card shows that something needs fixing.
function filesOf(work) {
  const listed = [].concat(work.files ?? work.file ?? []);
  if (!listed.length || !listed.every(kindOf)) {
    console.warn('An entry in works.js has a missing file name, or one without a supported ending like .jpg or .mp4:', work);
  }
  return listed;
}

function createMainMedia(file, title, alt) {
  const kind = kindOf(file);
  const url = kind && urlOf(file);
  let mediaWrap;
  if (!kind) {
    mediaWrap = document.createElement('div');
    mediaWrap.append(createFallback());
  } else if (kind === 'image') {
    mediaWrap = document.createElement('button');
    mediaWrap.type = 'button';
    mediaWrap.addEventListener('click', () => openViewer(url, title, alt));
    mediaWrap.append(createMedia(url, kind, { alt }));
  } else {
    mediaWrap = document.createElement('div');
    mediaWrap.append(createMedia(url, kind, { label: title }));
  }
  mediaWrap.classList.add('card-media');
  return mediaWrap;
}

function createThumb(file, onSelect) {
  const kind = kindOf(file);
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = `thumb thumb-${kind ?? 'problem'}`;
  thumb.dataset.kind = kind ?? 'problem';
  thumb.addEventListener('click', onSelect);
  if (!kind) return thumb;

  const media = document.createElement(kind === 'image' ? 'img' : 'video');
  if (kind === 'image') {
    media.alt = ''; // the button's label already says what this is
    media.loading = 'lazy';
    media.src = urlOf(file);
  } else {
    media.muted = true;
    media.preload = 'metadata';
    media.playsInline = true;
    media.src = `${urlOf(file)}#t=0.1`; // shows a frame from the video, not a blank box
  }
  thumb.append(media);
  return thumb;
}

function createCard(work, files, index) {
  const title = work.title || (typeof files[0] === 'string' ? titleFromFilename(files[0]) : '');
  const alt = work.description || title;

  const card = document.createElement('li');
  card.className = 'card';
  card.dataset.color = String(index % COLOR_COUNT);
  card.dataset.title = title;

  const body = document.createElement('div');
  body.className = 'card-body';

  const badge = document.createElement('span');
  badge.className = 'card-type';

  const showFile = (selected) => {
    const kind = kindOf(files[selected]) ?? 'problem';
    card.querySelector('.card-media').replaceWith(createMainMedia(files[selected], title, alt));
    badge.dataset.i18n = kind;
    badge.textContent = t(kind);
    card.querySelectorAll('.thumb').forEach((thumb, i) => {
      thumb.setAttribute('aria-current', String(i === selected));
    });
    labelCard(card);
  };

  const heading = document.createElement('h3');
  heading.className = 'card-title';
  heading.dir = 'auto';
  if (title) {
    heading.textContent = title;
  } else {
    heading.dataset.i18n = 'untitled';
    heading.textContent = t('untitled');
  }

  body.append(badge, heading);
  if (work.description) {
    const description = document.createElement('p');
    description.className = 'card-description';
    description.dir = 'auto';
    description.textContent = work.description.trim();
    body.append(description);
  }
  card.append(Object.assign(document.createElement('div'), { className: 'card-media' })); // filled by showFile

  if (files.length > 1) {
    const thumbs = document.createElement('div');
    thumbs.className = 'thumbs';
    files.forEach((file, i) => thumbs.append(createThumb(file, () => showFile(i))));
    card.append(thumbs);
  }
  card.append(body);

  showFile(0);
  return card;
}

// Accessible names built from the work's details, redone on every language switch.
function labelCard(card) {
  const imageButton = card.querySelector('button.card-media');
  if (imageButton) imageButton.setAttribute('aria-label', t('viewFull', card.dataset.title));
  const thumbs = card.querySelectorAll('.thumb');
  thumbs.forEach((thumb, i) => {
    thumb.setAttribute('aria-label', t('showItem', i + 1, thumbs.length, t(thumb.dataset.kind)));
  });
}

function updateCount() {
  const count = gallery.children.length;
  worksCount.textContent = count ? t('count', count) : '';
  // Stays hidden until the list arrives, so "nothing here yet" doesn't flash first.
  emptyState.hidden = !listLoaded || count > 0;
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

function showWorks() {
  listLoaded = true;
  // WORKS comes from works.js. A typo there stops that file from running, which leaves it undefined.
  if (typeof WORKS === 'undefined') {
    emptyMessage.dataset.i18n = 'listError';
    emptyMessage.textContent = t('listError');
  } else {
    WORKS
      .filter((work) => work && typeof work === 'object')
      .forEach((work, index) => gallery.append(createCard(work, filesOf(work), index)));
  }
  updateCount();
}

applyLanguage(loadLanguage());

// A new address on every visit means the browser can't serve an old saved copy of the list.
const listScript = document.createElement('script');
listScript.src = `works.js?v=${Date.now()}`;
listScript.addEventListener('load', showWorks);
listScript.addEventListener('error', showWorks);
document.head.append(listScript);
