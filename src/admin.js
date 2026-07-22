/**
 * admin.js – Admin Dashboard Logic
 * Manages CRUD operations for curations, guidebooks, testimonials, and site settings
 * Uses dataService for all data access (Firebase)
 */
import { dataService } from './services/dataService.js';

// ─── Auth Guard & Boot ──────────────────────────────────────────────────
async function boot() {
  if (!(await dataService.isAuthenticated())) {
    window.location.href = './admin-login.html';
    return;
  }
  await init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// ─── State ──────────────────────────────────────────────────────────────
let curations = [];
let guidebooks = [];
let testimonials = [];
let siteSettings = {};

const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// ─── Initialization ─────────────────────────────────────────────────────
async function init() {
  curations = await dataService.getCurations();
  guidebooks = await dataService.getGuidebooks();
  testimonials = await dataService.getTestimonials();
  siteSettings = await dataService.getSiteSettings();

  setupSidebar();
  setupLogout();
  updateDashboardStats();

  loadSettingsForm();
  renderCurationsList();
  renderGuidebooksList();
  renderTestimonialsList();

  initCurationEditor();
  initGuidebookEditor();
  initTestimonialEditor();
  initSettingsForm();
  initQuickActions();
}

// ─── Sidebar Navigation ────────────────────────────────────────────────
function setupSidebar() {
  const items = document.querySelectorAll('.sidebar-item');
  const sections = document.querySelectorAll('.admin-section');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-section');

      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      const panel = document.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

function switchToPanel(panelName) {
  const items = document.querySelectorAll('.sidebar-item');
  const sections = document.querySelectorAll('.admin-section');

  items.forEach(i => {
    i.classList.toggle('active', i.getAttribute('data-section') === panelName);
  });

  sections.forEach(s => {
    s.classList.toggle('active', s.getAttribute('data-panel') === panelName);
  });
}

function initQuickActions() {
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchToPanel(btn.getAttribute('data-goto'));
    });
  });
}

// ─── Logout ────────────────────────────────────────────────────────────
function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await dataService.logout();
    window.location.href = './admin-login.html';
  });
}

// ─── Dashboard Stats ────────────────────────────────────────────────────
function updateDashboardStats() {
  document.getElementById('stat-curations').textContent = curations.length;
  document.getElementById('stat-guidebooks').textContent = guidebooks.length;
  document.getElementById('stat-testimonials').textContent = testimonials.length;
}

// ─── Cloudinary Upload Helper ──────────────────────────────────────────
async function uploadToCloudinary(file, statusEl) {
  if (!file) return null;
  
  if (statusEl) statusEl.textContent = '업로드 중... (기다려주세요)';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('업로드 실패');
    
    const data = await response.json();
    if (statusEl) statusEl.textContent = '업로드 성공!';
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (statusEl) {
      statusEl.textContent = '업로드 실패. 콘솔을 확인하세요.';
      statusEl.style.color = '#e74c3c';
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ═══════════════════════════════════════════════════════════════════════

function loadSettingsForm() {
  const fields = [
    'heroTitle', 'heroAccent', 'heroDescription',
    'curationSectionTitle', 'curationSectionDesc',
    'guidebookSectionTitle', 'guidebookSectionDesc',
    'aboutQuote', 'aboutBio', 'statSpots', 'statSatisfaction'
  ];

  fields.forEach(key => {
    const el = document.getElementById(`set-${key}`);
    if (el) el.value = siteSettings[key] || '';
  });
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  const cancelBtn = document.getElementById('settings-cancel-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    const fields = [
      'heroTitle', 'heroAccent', 'heroDescription',
      'curationSectionTitle', 'curationSectionDesc',
      'guidebookSectionTitle', 'guidebookSectionDesc',
      'aboutQuote', 'aboutBio', 'statSpots', 'statSatisfaction'
    ];

    fields.forEach(key => {
      const el = document.getElementById(`set-${key}`);
      if (el) siteSettings[key] = el.value;
    });

    await dataService.saveSiteSettings(siteSettings);
    showToast('✅ 사이트 설정이 저장되었습니다.');
    
    submitBtn.disabled = false;
    submitBtn.textContent = '설정 저장';
  });

  cancelBtn.addEventListener('click', async () => {
    siteSettings = await dataService.getSiteSettings();
    loadSettingsForm();
    showToast('설정이 원래 값으로 되돌려졌습니다.');
  });
}

// ═══════════════════════════════════════════════════════════════════════
// CURATIONS CRUD
// ═══════════════════════════════════════════════════════════════════════

function renderCurationsList() {
  const list = document.getElementById('curations-list');
  if (!list) return;

  if (curations.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); padding: 20px 0; text-align: center;">등록된 큐레이션이 없습니다.</p>';
    return;
  }

  list.innerHTML = curations.map(item => `
    <div class="admin-item-row">
      <img src="${item.image}" alt="" class="admin-item-thumb">
      <div class="admin-item-info">
        <div class="admin-item-title">${item.title}</div>
        <div class="admin-item-meta">${item.location} · ${item.badge} · ${item.allTags.map(t => '#' + t).join(' ')}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-outline btn-sm edit-curation-btn" data-id="${item.id}">수정</button>
        <button class="btn btn-danger-outline btn-sm delete-curation-btn" data-id="${item.id}">삭제</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.edit-curation-btn').forEach(btn => {
    btn.addEventListener('click', () => openCurationEditor(btn.dataset.id));
  });

  list.querySelectorAll('.delete-curation-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteCuration(btn.dataset.id));
  });
}

function openCurationEditor(id) {
  const panel = document.getElementById('curation-edit-panel');
  const title = document.getElementById('curation-edit-title');
  panel.hidden = false;
  
  const statusEl = document.getElementById('ce-image-status');
  statusEl.textContent = '';
  statusEl.style.color = 'var(--sage-green)';

  if (id) {
    title.textContent = '큐레이션 수정';
    const item = curations.find(c => c.id === id);
    if (!item) return;

    document.getElementById('ce-id').value = item.id;
    document.getElementById('ce-title').value = item.title;
    document.getElementById('ce-location').value = item.location;
    document.getElementById('ce-badge').value = item.badge;
    document.getElementById('ce-image-url').value = item.image;
    document.getElementById('ce-image-public-id').value = item.imagePublicId || '';
    document.getElementById('ce-ratingLabel').value = item.ratingLabel;
    document.getElementById('ce-ratingValue').value = item.ratingValue;
    document.getElementById('ce-tags').value = item.allTags.join(', ');
    document.getElementById('ce-quote').value = item.quote;
    document.getElementById('ce-description').value = item.description;
    document.getElementById('ce-lat').value = item.lat || '';
    document.getElementById('ce-lng').value = item.lng || '';
    
    if (item.image) {
      statusEl.textContent = '현재 이미지 있음 (새로 선택하면 교체됩니다)';
    }
  } else {
    title.textContent = '새 큐레이션 추가';
    document.getElementById('curation-edit-form').reset();
    document.getElementById('ce-id').value = '';
    document.getElementById('ce-image-url').value = '';
    document.getElementById('ce-image-public-id').value = '';
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initCurationEditor() {
  const form = document.getElementById('curation-edit-form');
  const cancelBtn = document.getElementById('curation-cancel-btn');
  const addBtn = document.getElementById('add-curation-btn');

  addBtn.addEventListener('click', () => openCurationEditor(null));

  cancelBtn.addEventListener('click', () => {
    document.getElementById('curation-edit-panel').hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    const id = document.getElementById('ce-id').value;
    const tagsRaw = document.getElementById('ce-tags').value;
    const allTags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    
    // Handle Image Upload
    const fileInput = document.getElementById('ce-image-file');
    const statusEl = document.getElementById('ce-image-status');
    let imageUrl = document.getElementById('ce-image-url').value;
    let imagePublicId = document.getElementById('ce-image-public-id').value;
    
    if (fileInput.files.length > 0) {
      const uploadResult = await uploadToCloudinary(fileInput.files[0], statusEl);
      if (uploadResult) {
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      }
    }

    if (!imageUrl) {
      alert('이미지를 업로드해 주세요!');
      submitBtn.disabled = false;
      submitBtn.textContent = '저장';
      return;
    }

    const itemData = {
      id: id || `c${Date.now()}`,
      title: document.getElementById('ce-title').value,
      location: document.getElementById('ce-location').value,
      tag: allTags[0] || '',
      allTags,
      badge: document.getElementById('ce-badge').value,
      image: imageUrl,
      imagePublicId: imagePublicId,
      ratingLabel: document.getElementById('ce-ratingLabel').value,
      ratingValue: document.getElementById('ce-ratingValue').value,
      quote: document.getElementById('ce-quote').value,
      description: document.getElementById('ce-description').value,
      lat: document.getElementById('ce-lat').value,
      lng: document.getElementById('ce-lng').value,
    };

    if (id) {
      const idx = curations.findIndex(c => c.id === id);
      if (idx !== -1) curations[idx] = itemData;
    } else {
      curations.push(itemData);
    }

    await dataService.saveCuration(itemData);
    
    document.getElementById('curation-edit-panel').hidden = true;
    renderCurationsList();
    updateDashboardStats();
    showToast(`✅ 큐레이션 "${itemData.title}"이(가) 저장되었습니다.`);
    
    submitBtn.disabled = false;
    submitBtn.textContent = '저장';
  });
}

async function deleteCuration(id) {
  const item = curations.find(c => c.id === id);
  if (!confirm(`"${item?.title}" 큐레이션을 삭제하시겠습니까?`)) return;

  curations = curations.filter(c => c.id !== id);
  await dataService.deleteCuration(id);
  renderCurationsList();
  updateDashboardStats();
  showToast('큐레이션이 삭제되었습니다.');
}

// ═══════════════════════════════════════════════════════════════════════
// GUIDEBOOKS CRUD
// ═══════════════════════════════════════════════════════════════════════

function renderGuidebooksList() {
  const list = document.getElementById('guidebooks-list');
  if (!list) return;

  if (guidebooks.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); padding: 20px 0; text-align: center;">등록된 가이드북이 없습니다.</p>';
    return;
  }

  list.innerHTML = guidebooks.map(item => `
    <div class="admin-item-row">
      <img src="${item.image}" alt="" class="admin-item-thumb">
      <div class="admin-item-info">
        <div class="admin-item-title">${item.title}</div>
        <div class="admin-item-meta">${item.pages} · ${item.priceFormatted}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-outline btn-sm edit-guidebook-btn" data-id="${item.id}">수정</button>
        <button class="btn btn-danger-outline btn-sm delete-guidebook-btn" data-id="${item.id}">삭제</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.edit-guidebook-btn').forEach(btn => {
    btn.addEventListener('click', () => openGuidebookEditor(btn.dataset.id));
  });

  list.querySelectorAll('.delete-guidebook-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteGuidebook(btn.dataset.id));
  });
}

function openGuidebookEditor(id) {
  const panel = document.getElementById('guidebook-edit-panel');
  const title = document.getElementById('guidebook-edit-title');
  panel.hidden = false;
  
  const statusEl = document.getElementById('ge-image-status');
  statusEl.textContent = '';
  statusEl.style.color = 'var(--sage-green)';

  if (id) {
    title.textContent = '가이드북 수정';
    const item = guidebooks.find(g => g.id === id);
    if (!item) return;

    document.getElementById('ge-id').value = item.id;
    document.getElementById('ge-title').value = item.title;
    document.getElementById('ge-subtitle').value = item.subtitle || '';
    document.getElementById('ge-pages').value = item.pages;
    document.getElementById('ge-price').value = item.price;
    document.getElementById('ge-image-url').value = item.image;
    document.getElementById('ge-image-public-id').value = item.imagePublicId || '';
    document.getElementById('ge-description').value = item.description;
    
    if (item.image) {
      statusEl.textContent = '현재 이미지 있음 (새로 선택하면 교체됩니다)';
    }
  } else {
    title.textContent = '새 가이드북 추가';
    document.getElementById('guidebook-edit-form').reset();
    document.getElementById('ge-id').value = '';
    document.getElementById('ge-image-url').value = '';
    document.getElementById('ge-image-public-id').value = '';
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initGuidebookEditor() {
  const form = document.getElementById('guidebook-edit-form');
  const cancelBtn = document.getElementById('guidebook-cancel-btn');
  const addBtn = document.getElementById('add-guidebook-btn');

  addBtn.addEventListener('click', () => openGuidebookEditor(null));

  cancelBtn.addEventListener('click', () => {
    document.getElementById('guidebook-edit-panel').hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    const id = document.getElementById('ge-id').value;
    const price = parseInt(document.getElementById('ge-price').value, 10);
    
    // Handle Image Upload
    const fileInput = document.getElementById('ge-image-file');
    const statusEl = document.getElementById('ge-image-status');
    let imageUrl = document.getElementById('ge-image-url').value;
    let imagePublicId = document.getElementById('ge-image-public-id').value;
    
    if (fileInput.files.length > 0) {
      const uploadResult = await uploadToCloudinary(fileInput.files[0], statusEl);
      if (uploadResult) {
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      }
    }
    
    if (!imageUrl) {
      alert('이미지를 업로드해 주세요!');
      submitBtn.disabled = false;
      submitBtn.textContent = '저장';
      return;
    }

    const itemData = {
      id: id || `g${Date.now()}`,
      title: document.getElementById('ge-title').value,
      subtitle: document.getElementById('ge-subtitle').value,
      pages: document.getElementById('ge-pages').value,
      price,
      priceFormatted: `${price.toLocaleString()}원`,
      image: imageUrl,
      imagePublicId: imagePublicId,
      description: document.getElementById('ge-description').value,
    };

    if (id) {
      const idx = guidebooks.findIndex(g => g.id === id);
      if (idx !== -1) guidebooks[idx] = itemData;
    } else {
      guidebooks.push(itemData);
    }

    await dataService.saveGuidebook(itemData);
    
    document.getElementById('guidebook-edit-panel').hidden = true;
    renderGuidebooksList();
    updateDashboardStats();
    showToast(`✅ 가이드북 "${itemData.title}"이(가) 저장되었습니다.`);
    
    submitBtn.disabled = false;
    submitBtn.textContent = '저장';
  });
}

async function deleteGuidebook(id) {
  const item = guidebooks.find(g => g.id === id);
  if (!confirm(`"${item?.title}" 가이드북을 삭제하시겠습니까?`)) return;

  guidebooks = guidebooks.filter(g => g.id !== id);
  await dataService.deleteGuidebook(id);
  renderGuidebooksList();
  updateDashboardStats();
  showToast('가이드북이 삭제되었습니다.');
}

// ═══════════════════════════════════════════════════════════════════════
// TESTIMONIALS CRUD
// ═══════════════════════════════════════════════════════════════════════

function renderTestimonialsList() {
  const list = document.getElementById('testimonials-list');
  if (!list) return;

  if (testimonials.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); padding: 20px 0; text-align: center;">등록된 후기가 없습니다.</p>';
    return;
  }

  list.innerHTML = testimonials.map(item => `
    <div class="admin-item-row">
      <img src="${item.avatar}" alt="" class="admin-item-thumb" style="border-radius: 50%;">
      <div class="admin-item-info">
        <div class="admin-item-title">${item.name}</div>
        <div class="admin-item-meta">${item.role} · "${item.quote.substring(0, 50)}..."</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-outline btn-sm edit-testimonial-btn" data-id="${item.id}">수정</button>
        <button class="btn btn-danger-outline btn-sm delete-testimonial-btn" data-id="${item.id}">삭제</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.edit-testimonial-btn').forEach(btn => {
    btn.addEventListener('click', () => openTestimonialEditor(btn.dataset.id));
  });

  list.querySelectorAll('.delete-testimonial-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTestimonial(btn.dataset.id));
  });
}

function openTestimonialEditor(id) {
  const panel = document.getElementById('testimonial-edit-panel');
  const title = document.getElementById('testimonial-edit-title');
  panel.hidden = false;
  
  const statusEl = document.getElementById('te-avatar-status');
  statusEl.textContent = '';
  statusEl.style.color = 'var(--sage-green)';

  if (id) {
    title.textContent = '후기 수정';
    const item = testimonials.find(t => t.id === id);
    if (!item) return;

    document.getElementById('te-id').value = item.id;
    document.getElementById('te-name').value = item.name;
    document.getElementById('te-role').value = item.role;
    document.getElementById('te-quote').value = item.quote;
    document.getElementById('te-avatar-url').value = item.avatar;
    document.getElementById('te-avatar-public-id').value = item.avatarPublicId || '';
    
    if (item.avatar) {
      statusEl.textContent = '현재 이미지 있음 (새로 선택하면 교체됩니다)';
    }
  } else {
    title.textContent = '새 후기 추가';
    document.getElementById('testimonial-edit-form').reset();
    document.getElementById('te-id').value = '';
    document.getElementById('te-avatar-url').value = '';
    document.getElementById('te-avatar-public-id').value = '';
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initTestimonialEditor() {
  const form = document.getElementById('testimonial-edit-form');
  const cancelBtn = document.getElementById('testimonial-cancel-btn');
  const addBtn = document.getElementById('add-testimonial-btn');

  addBtn.addEventListener('click', () => openTestimonialEditor(null));

  cancelBtn.addEventListener('click', () => {
    document.getElementById('testimonial-edit-panel').hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    const id = document.getElementById('te-id').value;
    
    // Handle Image Upload
    const fileInput = document.getElementById('te-avatar-file');
    const statusEl = document.getElementById('te-avatar-status');
    let avatarUrl = document.getElementById('te-avatar-url').value;
    let avatarPublicId = document.getElementById('te-avatar-public-id').value;
    
    if (fileInput.files.length > 0) {
      const uploadResult = await uploadToCloudinary(fileInput.files[0], statusEl);
      if (uploadResult) {
        avatarUrl = uploadResult.url;
        avatarPublicId = uploadResult.publicId;
      }
    }
    
    // default placeholder avatar if none uploaded
    if (!avatarUrl) {
       avatarUrl = './public/images/creator_portrait.png';
    }

    const itemData = {
      id: id || `t${Date.now()}`,
      name: document.getElementById('te-name').value,
      role: document.getElementById('te-role').value,
      quote: document.getElementById('te-quote').value,
      avatar: avatarUrl,
      avatarPublicId: avatarPublicId,
    };

    if (id) {
      const idx = testimonials.findIndex(t => t.id === id);
      if (idx !== -1) testimonials[idx] = itemData;
    } else {
      testimonials.push(itemData);
    }

    await dataService.saveTestimonial(itemData);
    
    document.getElementById('testimonial-edit-panel').hidden = true;
    renderTestimonialsList();
    updateDashboardStats();
    showToast(`✅ "${itemData.name}" 후기가 저장되었습니다.`);
    
    submitBtn.disabled = false;
    submitBtn.textContent = '저장';
  });
}

async function deleteTestimonial(id) {
  const item = testimonials.find(t => t.id === id);
  if (!confirm(`"${item?.name}" 후기를 삭제하시겠습니까?`)) return;

  testimonials = testimonials.filter(t => t.id !== id);
  await dataService.deleteTestimonial(id);
  renderTestimonialsList();
  updateDashboardStats();
  showToast('후기가 삭제되었습니다.');
}

// ─── Toast ──────────────────────────────────────────────────────────────
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
