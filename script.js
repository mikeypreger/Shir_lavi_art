'use strict';

const DB_NAME = 'shir-lavi-art';
const STORE = 'works';
const COLOR_COUNT = 6; // matches the .card[data-color] rules in styles.css
const LANG_KEY = 'shir-lavi-art-lang';

const STRINGS = {
  en: {
    pageTitle: 'Shir Lavi | Interaction course works',
    metaDescription: 'Images and videos by Shir Lavi, made for her interaction course.',
    skip: 'Skip to the gallery',
    name: 'Shir Lavi',
    lede: 'Images and videos made for the interaction course',
    add: 'Add a work',
    works: 'Works',
    empty: 'Nothing here yet. Every work that gets added will appear here.',
    storageBlocked: "This browser isn't allowing saved files, so works can't be added or shown here. Private browsing windows often block this.",
    choose: 'Choose an image or video',
    dropHint: 'or drag and drop it here',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    optional: '(optional)',
    storageNote: 'Works are saved in this browser, on this device.',
    submit: 'Add to gallery',
    saving: 'Saving…',
    close: 'Close',
    image: 'Image',
    video: 'Video',
    remove: 'Remove',
    fallback_image: "This browser can't display this file format. Try JPG or PNG.",
    fallback_video: "This browser can't display this file format. Try MP4.",
    noFile: 'Please choose an image or video first.',
    quota: 'There is not enough browser storage for this file. Try a smaller file or remove some works.',
    saveFailed: 'Something went wrong saving this work. Please try again.',
    count: (n) => `${n} ${n === 1 ? 'work' : 'works'}`,
    viewFull: (title) => `View ${title} full size`,
    removeLabel: (title) => `Remove ${title}`,
    confirmRemove: (title) => `Remove "${title}" from the gallery? This can't be undone.`,
    removed: (title) => `Removed ${title}.`,
    removeFailed: (title) => `Couldn't remove ${title}. Please try again.`,
    added: (title) => `Added ${title} to the gallery.`,
    badType: (name) => `"${name}" isn't an image or video. Please choose a different file.`,
  },
  he: {
    pageTitle: 'שיר לביא | עבודות מקורס אינטראקציה',
    metaDescription: 'תמונות וסרטונים של שיר לביא, שנוצרו לקורס אינטראקציה.',
    skip: 'דילוג לגלריה',
    name: 'שיר לביא',
    lede: 'תמונות וסרטונים שנוצרו לקורס האינטראקציה',
    add: 'הוספת עבודה',
    works: 'עבודות',
    empty: 'עדיין אין כאן עבודות. כל עבודה שתתווסף תופיע כאן.',
    storageBlocked: 'הדפדפן הזה לא מאפשר לשמור קבצים, ולכן אי אפשר להוסיף או להציג כאן עבודות. חלונות גלישה פרטית חוסמים זאת לעיתים קרובות.',
    choose: 'בחירת תמונה או סרטון',
    dropHint: 'או גרירה ושחרור לכאן',
    titleLabel: 'כותרת',
    descriptionLabel: 'תיאור',
    optional: '(לא חובה)',
    storageNote: 'העבודות נשמרות בדפדפן הזה, במכשיר הזה.',
    submit: 'הוספה לגלריה',
    saving: 'שמירה…',
    close: 'סגירה',
    image: 'תמונה',
    video: 'סרטון',
    remove: 'הסרה',
    fallback_image: 'הדפדפן הזה לא מצליח להציג את סוג הקובץ הזה. כדאי לנסות JPG או PNG.',
    fallback_video: 'הדפדפן הזה לא מצליח להציג את סוג הקובץ הזה. כדאי לנסות MP4.',
    noFile: 'יש לבחור קודם תמונה או סרטון.',
    quota: 'אין מספיק מקום באחסון הדפדפן לקובץ הזה. אפשר לנסות קובץ קטן יותר או להסיר עבודות.',
    saveFailed: 'משהו השתבש בשמירת העבודה. כדאי לנסות שוב.',
    count: (n) => (n === 1 ? 'עבודה אחת' : `${n} עבודות`),
    viewFull: (title) => `הצגת ${title} בגודל מלא`,
    removeLabel: (title) => `הסרת ${title}`,
    confirmRemove: (title) => `להסיר את "${title}" מהגלריה? אי אפשר לבטל את הפעולה.`,
    removed: (title) => `העבודה ${title} הוסרה.`,
    removeFailed: (title) => `לא ניתן להסיר את ${title}. כדאי לנסות שוב.`,
    added: (title) => `העבודה ${title} נוספה לגלריה.`,
    badType: (name) => `"${name}" אינו תמונה או סרטון. יש לבחור קובץ אחר.`,
  },
};

const form = document.getElementById('upload-form');
const uploadDialog = document.getElementById('upload-dialog');
const addButton = document.getElementById('add-button');
const uploadClose = document.getElementById('upload-close');
const langToggle = document.getElementById('lang-toggle');
const fileInput = document.getElementById('file-input');
const fileError = document.getElementById('file-error');
const dropzone = document.getElementById('dropzone');
const dropzoneTitle = document.getElementById('dropzone-title');
const preview = document.getElementById('preview');
const titleInput = document.getElementById('title-input');
const descriptionInput = document.getElementById('description-input');
const submitButton = document.getElementById('submit-button');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('empty-state');
const emptyMessage = document.getElementById('empty-message');
const worksCount = document.getElementById('works-count');
const worksHeading = document.getElementById('works-heading');
const announcer = document.getElementById('announcer');
const viewer = document.getElementById('viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerCaption = document.getElementById('viewer-caption');

let currentLang = 'en';
let selectedFile = null;
let previewUrl = null;
let saving = false;

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

  updateDropzone();
  [...gallery.children].forEach(labelCard);
  updateCount();
}

/* Storage */

const dbReady = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function withStore(mode, action) {
  const db = await dbReady;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

const getAllWorks = () => withStore('readonly', (store) => store.getAll());
const addWork = (work) => withStore('readwrite', (store) => store.add(work));
const deleteWork = (id) => withStore('readwrite', (store) => store.delete(id));

/* Rendering */

function kindOf(type) {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  return null;
}

function announce(message) {
  announcer.textContent = message;
}

function titleFromFilename(name) {
  return name.replace(/\.[^.]+$/, '');
}

// Files like HEIC or some MOVs pass the type check but won't decode in every browser.
function createMedia(url, kind, { alt = '', label = '' } = {}) {
  const media = document.createElement(kind === 'image' ? 'img' : 'video');
  media.src = url;
  if (kind === 'image') {
    media.alt = alt;
  } else {
    media.controls = true;
    media.preload = 'metadata';
    media.playsInline = true;
    if (label) media.setAttribute('aria-label', label);
  }
  media.addEventListener('error', () => {
    const fallback = document.createElement('p');
    fallback.className = 'media-fallback';
    fallback.dataset.i18n = `fallback_${kind}`;
    fallback.textContent = t(fallback.dataset.i18n);
    media.replaceWith(fallback);
  });
  return media;
}

function createCard(work) {
  const url = URL.createObjectURL(work.blob);
  const kind = kindOf(work.type);

  const card = document.createElement('li');
  card.className = 'card';
  card.dataset.color = String(work.id % COLOR_COUNT);
  card.dataset.title = work.title;

  const description = work.description
    ? Object.assign(document.createElement('p'), { className: 'card-description', dir: 'auto', textContent: work.description })
    : null;

  let mediaWrap;
  if (kind === 'image') {
    mediaWrap = document.createElement('button');
    mediaWrap.type = 'button';
    mediaWrap.addEventListener('click', () => openViewer(url, work));
    mediaWrap.append(createMedia(url, kind, { alt: work.description || work.title }));
  } else {
    mediaWrap = document.createElement('div');
    mediaWrap.append(createMedia(url, kind, { label: work.title }));
  }
  mediaWrap.classList.add('card-media');

  const body = document.createElement('div');
  body.className = 'card-body';

  const badge = document.createElement('span');
  badge.className = 'card-type';
  badge.dataset.i18n = kind;

  const heading = document.createElement('h3');
  heading.className = 'card-title';
  heading.dir = 'auto';
  heading.tabIndex = -1;
  heading.textContent = work.title;

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-button';
  removeButton.dataset.i18n = 'remove';
  removeButton.addEventListener('click', () => removeWork(work, card, url));

  body.append(badge, heading);
  if (description) body.append(description);
  body.append(removeButton);
  card.append(mediaWrap, body);

  badge.textContent = t(kind);
  removeButton.textContent = t('remove');
  labelCard(card);
  return card;
}

// Accessible names that include the work's title, redone on every language switch.
function labelCard(card) {
  const { title } = card.dataset;
  card.querySelector('.remove-button').setAttribute('aria-label', t('removeLabel', title));
  const imageButton = card.querySelector('button.card-media');
  if (imageButton) imageButton.setAttribute('aria-label', t('viewFull', title));
}

function updateCount() {
  const count = gallery.children.length;
  worksCount.textContent = count ? t('count', count) : '';
  // A storage error stays on screen, because no works can load behind it.
  emptyState.hidden = count > 0 && emptyMessage.dataset.i18n === 'empty';
}

function updateDropzone() {
  dropzoneTitle.textContent = selectedFile ? selectedFile.name : t('choose');
}

function openViewer(url, work) {
  viewerImage.src = url;
  viewerImage.alt = work.description || work.title;
  viewerCaption.textContent = work.title;
  viewer.showModal();
}

/* Actions */

async function removeWork(work, card, url) {
  if (!confirm(t('confirmRemove', work.title))) return;
  try {
    await deleteWork(work.id);
  } catch (error) {
    console.error(error);
    announce(t('removeFailed', work.title));
    return;
  }
  card.remove();
  URL.revokeObjectURL(url);
  updateCount();
  worksHeading.focus();
  announce(t('removed', work.title));
}

function clearPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  preview.replaceChildren();
  preview.hidden = true;
}

function selectFile(file) {
  fileError.textContent = '';
  const kind = kindOf(file.type);
  if (!kind) {
    fileError.textContent = t('badType', file.name);
    return;
  }
  selectedFile = file;
  updateDropzone();
  clearPreview();
  previewUrl = URL.createObjectURL(file);
  preview.append(createMedia(previewUrl, kind, { label: file.name }));
  preview.hidden = false;
}

function resetForm() {
  form.reset();
  selectedFile = null;
  fileError.textContent = '';
  updateDropzone();
  clearPreview();
}

function setSaving(isSaving) {
  saving = isSaving;
  submitButton.disabled = isSaving;
  uploadClose.disabled = isSaving;
  submitButton.textContent = t(isSaving ? 'saving' : 'submit');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedFile) {
    fileError.textContent = t('noFile');
    fileInput.focus();
    return;
  }

  const work = {
    title: titleInput.value.trim() || titleFromFilename(selectedFile.name),
    description: descriptionInput.value.trim(),
    type: selectedFile.type,
    blob: selectedFile,
    createdAt: Date.now(),
  };

  // Asks the browser not to clear saved works when the disk runs low.
  navigator.storage?.persist?.().catch(() => {});

  setSaving(true);
  try {
    work.id = await addWork(work);
  } catch (error) {
    console.error(error);
    fileError.textContent = t(error && error.name === 'QuotaExceededError' ? 'quota' : 'saveFailed');
    return;
  } finally {
    setSaving(false);
  }

  const card = createCard(work);
  gallery.prepend(card);
  updateCount();
  uploadDialog.close();
  card.querySelector('.card-title').focus({ preventScroll: true });
  card.scrollIntoView({ block: 'center' });
  announce(t('added', work.title));
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) selectFile(fileInput.files[0]);
  fileInput.value = ''; // lets the same file be chosen again after a reset
});

addButton.addEventListener('click', () => uploadDialog.showModal());
uploadClose.addEventListener('click', () => uploadDialog.close());
uploadDialog.addEventListener('close', resetForm);
// Escape would hide a save that is still running, and with it any error it reports.
uploadDialog.addEventListener('cancel', (event) => {
  if (saving) event.preventDefault();
});

langToggle.addEventListener('click', () => {
  applyLanguage(langToggle.lang);
  saveLanguage();
});

// Handled on the whole page: dropping a file anywhere opens the upload form with it.
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragging');
  const file = event.dataTransfer.files[0];
  if (!file || viewer.open || saving) return;
  if (!uploadDialog.open) uploadDialog.showModal();
  selectFile(file);
});
dropzone.addEventListener('dragover', () => dropzone.classList.add('is-dragging'));
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));

document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});

/* Startup */

applyLanguage(loadLanguage());

getAllWorks()
  .then((works) => {
    works.reverse().forEach((work) => gallery.append(createCard(work)));
    updateCount();
  })
  .catch((error) => {
    console.error(error);
    addButton.disabled = true;
    emptyMessage.dataset.i18n = 'storageBlocked';
    emptyMessage.textContent = t('storageBlocked');
    updateCount();
  });
