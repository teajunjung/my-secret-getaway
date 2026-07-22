import { loadAllData } from './data.js';

// Application State
const state = {
  activeTag: 'all',
  currentHeroIndex: 0,
  heroInterval: null,
  isUnlocked: false,
  cart: [],
  currentConsultingStep: 1,
  consultingData: {
    companion: [],
    mood: '',
    duration: '',
    budget: '',
    destination: '',
    name: '',
    phone: '',
    email: '',
    notes: ''
  },
  // Data loaded from dataService
  curations: [],
  guidebooks: [],
  testimonials: [],
  secretPins: [],
  siteSettings: {}
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', async () => {
  // Load data from dataService (localStorage → Firebase ready)
  const data = await loadAllData();
  state.curations = data.curations;
  state.guidebooks = data.guidebooks;
  state.testimonials = data.testimonials;
  state.secretPins = data.secretPins;
  state.siteSettings = data.siteSettings;

  applySiteSettings();
  initHeaderScroll();
  initScrollspy();
  initMobileDrawer();
  initHeroSlideshow();
  renderCurations('all');
  initTagFilter();
  checkSecretMapStatus();
  initSecretMapForm();
  renderGuidebooks();
  initCartModal();
  initConsultingStepForm();
  renderTestimonials();
  initGlobalKeyboardHandlers();
});

/* ==========================================
   0. Apply Site Settings (dynamic text from admin)
   ========================================== */
function applySiteSettings() {
  const s = state.siteSettings;
  if (!s) return;

  // Hero
  const heroTitleEl = document.querySelector('.hero-title');
  if (heroTitleEl && s.heroTitle) {
    heroTitleEl.innerHTML = `${s.heroTitle}<br><span class="serif-accent">${s.heroAccent || ''}</span>`;
  }

  const heroDescEl = document.querySelector('.hero-description');
  if (heroDescEl && s.heroDescription) {
    heroDescEl.textContent = s.heroDescription;
  }

  // Curation section
  const curationTitle = document.querySelector('#curation .section-title');
  if (curationTitle && s.curationSectionTitle) curationTitle.textContent = s.curationSectionTitle;

  const curationDesc = document.querySelector('#curation .section-desc');
  if (curationDesc && s.curationSectionDesc) curationDesc.textContent = s.curationSectionDesc;

  // Guidebook section
  const guidebookTitle = document.querySelector('#guidebook .section-title');
  if (guidebookTitle && s.guidebookSectionTitle) guidebookTitle.textContent = s.guidebookSectionTitle;

  const guidebookDesc = document.querySelector('#guidebook .section-desc');
  if (guidebookDesc && s.guidebookSectionDesc) guidebookDesc.textContent = s.guidebookSectionDesc;

  // About section
  const aboutTitle = document.querySelector('.about-title');
  if (aboutTitle && s.aboutQuote) aboutTitle.innerHTML = s.aboutQuote.replace(/\n/g, '<br>');

  const statSpots = document.querySelector('.about-stats .stat-item:nth-child(1) .stat-num');
  if (statSpots && s.statSpots) statSpots.textContent = s.statSpots;

  const statSat = document.querySelector('.about-stats .stat-item:nth-child(2) .stat-num');
  if (statSat && s.statSatisfaction) statSat.textContent = s.statSatisfaction;
}

/* ==========================================
   1. Header, Scrollspy & Mobile Navigation
   ========================================== */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initScrollspy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.gnb-nav .nav-link');

  window.addEventListener('scroll', () => {
    let currentSection = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });
}

function initMobileDrawer() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawer = document.getElementById('mobile-drawer');
  const drawerLinks = document.querySelectorAll('.drawer-link, .drawer-cta');

  if (mobileMenuBtn && drawer) {
    mobileMenuBtn.addEventListener('click', () => {
      drawer.classList.add('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    });

    const closeDrawer = () => {
      drawer.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    };

    drawerCloseBtn.addEventListener('click', closeDrawer);

    drawerLinks.forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }
}

/* ==========================================
   2. Hero Section Slideshow
   ========================================== */
function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.slide-indicators .indicator');

  if (!slides.length) return;

  function goToSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    indicators.forEach(i => i.classList.remove('active'));

    state.currentHeroIndex = index;
    slides[state.currentHeroIndex].classList.add('active');
    indicators[state.currentHeroIndex].classList.add('active');
  }

  indicators.forEach(ind => {
    ind.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      goToSlide(idx);
      resetHeroTimer();
    });
  });

  function startHeroTimer() {
    state.heroInterval = setInterval(() => {
      const nextIdx = (state.currentHeroIndex + 1) % slides.length;
      goToSlide(nextIdx);
    }, 5000);
  }

  function resetHeroTimer() {
    clearInterval(state.heroInterval);
    startHeroTimer();
  }

  startHeroTimer();
}

/* ==========================================
   3. Editor's Pick Curation & Tag Filter
   ========================================== */
function renderCurations(tag = 'all') {
  const grid = document.getElementById('curation-grid');
  if (!grid) return;

  const filtered = tag === 'all' 
    ? state.curations 
    : state.curations.filter(item => item.allTags.includes(tag));

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">선택하신 감성 태그에 해당하는 큐레이션이 준비 중입니다.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="curation-card" data-id="${item.id}" tabindex="0" role="button" aria-label="${item.title} 상세 보기">
      <div class="card-image-box">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <span class="badge-tag ${item.badge === 'NEW' ? 'badge-new' : 'badge-exclusive'} card-badge-pos">${item.badge}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-location">${item.location}</span>
          <span class="card-rating">
            ★ ${item.ratingLabel} ${item.ratingValue}
          </span>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-review-quote">"${item.quote}"</p>
        <div class="card-tags">
          ${item.allTags.map(t => `<span class="card-tag">#${t}</span>`).join('')}
        </div>
        <div class="card-footer-action">
          <button class="card-detail-btn" data-id="${item.id}">
            상세 보기 <span>&rarr;</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  // Entire Card & Detail Button Click Listeners
  grid.querySelectorAll('.curation-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.getAttribute('data-id');
      openPlaceModal(id);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.getAttribute('data-id');
        openPlaceModal(id);
      }
    });
  });
}

function initTagFilter() {
  const tagBtns = document.querySelectorAll('.tag-btn');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tagBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const tag = e.target.getAttribute('data-tag');
      state.activeTag = tag;
      renderCurations(tag);
    });
  });
}

function openPlaceModal(id) {
  const item = state.curations.find(c => c.id === id);
  if (!item) return;

  const modal = document.getElementById('place-modal');
  const modalBody = document.getElementById('modal-place-body');

  modalBody.innerHTML = `
    <div style="margin-bottom: 20px;">
      <span class="badge-tag badge-exclusive" style="margin-bottom: 8px;">${item.badge}</span>
      <h2 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 6px;">${item.title}</h2>
      <p style="font-size: 0.85rem; color: var(--sage-green-dark); font-weight: 700;">${item.location} · ★ ${item.ratingLabel} ${item.ratingValue}</p>
    </div>
    <div style="width: 100%; height: 260px; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
      <img src="${item.image}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover;">
    </div>
    <blockquote style="font-family: var(--font-serif); font-style: italic; font-size: 1.1rem; border-left: 3px solid var(--terracotta); padding-left: 14px; margin-bottom: 20px; color: var(--text-main);">
      "${item.quote}"
    </blockquote>
    <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 24px;">
      ${item.description}
    </p>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <a href="#consulting" class="btn btn-terracotta btn-sm modal-consult-link">이 장소 포함 맞춤 일정 의뢰</a>
    </div>
  `;

  openModal(modal);

  const closeBtn = document.getElementById('place-modal-close');
  closeBtn.onclick = () => closeModal(modal);
  modal.onclick = (e) => {
    if (e.target === modal) closeModal(modal);
  };

  const consultLink = modalBody.querySelector('.modal-consult-link');
  if (consultLink) {
    consultLink.onclick = () => closeModal(modal);
  }
}

/* ==========================================
   4. Secret Map (Membership Locking / Unlocking)
   ========================================== */
function checkSecretMapStatus() {
  const isUnlockedLocal = localStorage.getItem('secret_map_unlocked');
  if (isUnlockedLocal === 'true') {
    state.isUnlocked = true;
    applyUnlockedState();
  }
}

function initSecretMapForm() {
  const form = document.getElementById('secret-unlock-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('subscriber-email');
    if (emailInput.value) {
      localStorage.setItem('secret_map_unlocked', 'true');
      localStorage.setItem('secret_map_email', emailInput.value);
      state.isUnlocked = true;

      applyUnlockedState();
      showToast('🎉 비밀 지도가 해제되었습니다! 핀 좌표를 확인해 보세요.');
    }
  });
}

function applyUnlockedState() {
  const secretMapCard = document.querySelector('.secret-map-card');
  const form = document.getElementById('secret-unlock-form');
  const unlockedView = document.getElementById('unlocked-view');
  const statusText = document.getElementById('secret-map-status-text');
  const lockBadge = document.getElementById('lock-badge');
  const pinsContainer = document.getElementById('unlocked-pins-container');

  if (secretMapCard) secretMapCard.classList.add('unlocked');
  if (form) form.classList.add('hidden');
  if (unlockedView) unlockedView.classList.remove('hidden');

  if (statusText) {
    statusText.innerHTML = `구독자 자격이 인증되었습니다. 크리에이터가 검증한 아래의 시크릿 핀 좌표를 확인하세요.`;
  }

  if (lockBadge) {
    lockBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
  }

  if (pinsContainer) {
    pinsContainer.innerHTML = state.secretPins.map(pin => `
      <div class="secret-pin-card">
        <h4>📍 ${pin.name}</h4>
        <span class="secret-pin-coord">GPS: ${pin.coords}</span>
        <p class="secret-pin-desc">${pin.note}</p>
      </div>
    `).join('');
  }
}

/* ==========================================
   5. Digital Guidebook Shop & Cart Modal
   ========================================== */
function renderGuidebooks() {
  const grid = document.getElementById('guidebook-grid');
  if (!grid) return;

  grid.innerHTML = state.guidebooks.map(item => `
    <article class="guidebook-card">
      <div class="guidebook-thumb">
        <span class="pdf-badge">PDF</span>
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="guidebook-body">
        <span class="guidebook-pages">${item.pages} · 즉시 다운로드</span>
        <h3 class="guidebook-title">${item.title}</h3>
        <p class="guidebook-desc">${item.description}</p>
        <div class="guidebook-footer">
          <span class="guidebook-price">${item.priceFormatted}</span>
          <button class="btn btn-primary btn-sm add-cart-btn" data-id="${item.id}">
            장바구니 담기
          </button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      addToCart(id);
    });
  });
}

function addToCart(id) {
  const item = state.guidebooks.find(g => g.id === id);
  if (!item) return;

  if (state.cart.some(c => c.id === id)) {
    showToast('이미 장바구니에 담긴 가이드북입니다.');
    return;
  }

  state.cart.push(item);
  updateCartBadge();
  showToast(`🛒 '${item.title}' 장바구니에 담겼습니다.`);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count-badge');
  const modalCount = document.getElementById('cart-modal-count');
  if (badge) badge.textContent = state.cart.length;
  if (modalCount) modalCount.textContent = state.cart.length;
}

function initCartModal() {
  const cartBtn = document.getElementById('cart-toggle-btn');
  const modal = document.getElementById('cart-modal');
  const closeBtn = document.getElementById('cart-modal-close');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (cartBtn && modal) {
    cartBtn.addEventListener('click', () => {
      renderCartModalItems();
      openModal(modal);
    });

    closeBtn.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
          showToast('장바구니가 비어 있습니다.');
          return;
        }

        showToast('⚡ 가이드북 결제가 완료되었습니다! PDF 다운로드가 시작됩니다.');
        state.cart = [];
        updateCartBadge();
        closeModal(modal);
      });
    }
  }
}

function renderCartModalItems() {
  const container = document.getElementById('cart-modal-items');
  const totalPriceEl = document.getElementById('cart-total-price');

  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px 0;">장바구니에 담긴 가이드북이 없습니다.</p>`;
    if (totalPriceEl) totalPriceEl.textContent = '0원';
    return;
  }

  const total = state.cart.reduce((sum, item) => sum + item.price, 0);

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <span class="cart-item-price">${item.priceFormatted}</span>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" aria-label="삭제">&times;</button>
    </div>
  `).join('');

  if (totalPriceEl) totalPriceEl.textContent = `${total.toLocaleString()}원`;

  container.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      state.cart = state.cart.filter(c => c.id !== id);
      updateCartBadge();
      renderCartModalItems();
    });
  });
}

/* ==========================================
   6. 1:1 Consulting Step-by-Step Form
   ========================================== */
function initConsultingStepForm() {
  const form = document.getElementById('consulting-step-form');
  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');
  const submitBtn = document.getElementById('submit-step-btn');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const currentStepNum = document.getElementById('current-step-num');

  if (!form) return;

  nextBtn.addEventListener('click', () => {
    if (validateStep(state.currentConsultingStep)) {
      if (state.currentConsultingStep < 4) {
        state.currentConsultingStep++;
        updateStepView();
      }
    }
  });

  prevBtn.addEventListener('click', () => {
    if (state.currentConsultingStep > 1) {
      state.currentConsultingStep--;
      updateStepView();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateStep(4)) {
      const name = document.getElementById('client-name').value;
      const phone = document.getElementById('client-phone').value;
      const email = document.getElementById('client-email').value;
      const notes = document.getElementById('client-notes').value;

      state.consultingData.name = name;
      state.consultingData.phone = phone;
      state.consultingData.email = email;
      state.consultingData.notes = notes;
      
      const submitBtn = document.getElementById('submit-step-btn');
      const originalText = submitBtn ? submitBtn.textContent : '제출하기';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '제출 중...';
      }

      try {
        await dataService.saveConsultingInquiry(state.consultingData);
      } catch (err) {
        console.warn('[Consulting] Save fallback handled:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        openSuccessModal();
      }
    }
  });

  function updateStepView() {
    const steps = document.querySelectorAll('.form-step');
    steps.forEach(s => s.classList.remove('active'));

    const activeStepEl = document.querySelector(`.form-step[data-step="${state.currentConsultingStep}"]`);
    if (activeStepEl) activeStepEl.classList.add('active');

    if (currentStepNum) currentStepNum.textContent = state.currentConsultingStep;
    if (progressBarFill) progressBarFill.style.width = `${state.currentConsultingStep * 25}%`;

    prevBtn.style.display = state.currentConsultingStep > 1 ? 'inline-flex' : 'none';
    nextBtn.style.display = state.currentConsultingStep < 4 ? 'inline-flex' : 'none';
    submitBtn.style.display = state.currentConsultingStep === 4 ? 'inline-flex' : 'none';
  }

  function validateStep(step) {
    if (step === 1) {
      const checkedCompanions = document.querySelectorAll('input[name="companion"]:checked');
      if (checkedCompanions.length === 0) {
        showToast('동행 및 여행 목적을 1개 이상 선택해 주세요.');
        return false;
      }
      state.consultingData.companion = Array.from(checkedCompanions).map(cb => cb.value);
    } else if (step === 2) {
      const checkedMood = document.querySelector('input[name="mood"]:checked');
      if (!checkedMood) {
        showToast('선호하는 여행 분위기를 선택해 주세요.');
        return false;
      }
      state.consultingData.mood = checkedMood.value;
    } else if (step === 3) {
      const duration = document.getElementById('travel-duration').value;
      if (!duration.trim()) {
        showToast('예상 여행 기간을 입력해 주세요.');
        return false;
      }
      state.consultingData.duration = duration;
      state.consultingData.budget = document.getElementById('travel-budget').value;
      state.consultingData.destination = document.getElementById('travel-destination').value || '추천 요청';
    }
    return true;
  }
}

function openSuccessModal() {
  const modal = document.getElementById('success-modal');
  const summaryBox = document.getElementById('consulting-summary-box');
  const closeBtn = document.getElementById('success-modal-close');

  if (summaryBox) {
    summaryBox.innerHTML = `
      <div style="background-color: var(--bg-cream); border-radius: 12px; padding: 20px; text-align: left; font-size: 0.88rem; margin: 20px 0; color: var(--text-main);">
        <p style="margin-bottom: 6px;"><strong>의뢰자:</strong> ${state.consultingData.name} (${state.consultingData.phone})</p>
        <p style="margin-bottom: 6px;"><strong>여행 목적:</strong> ${state.consultingData.companion.join(', ')}</p>
        <p style="margin-bottom: 6px;"><strong>희망 분위기:</strong> ${state.consultingData.mood}</p>
        <p style="margin-bottom: 6px;"><strong>기간 & 예산:</strong> ${state.consultingData.duration} / ${state.consultingData.budget}</p>
        <p style="margin-bottom: 0;"><strong>희망 지역:</strong> ${state.consultingData.destination}</p>
      </div>
    `;
  }

  if (modal) openModal(modal);

  if (closeBtn) {
    closeBtn.onclick = () => {
      closeModal(modal);
      resetConsultingForm();
    };
  }
}

function resetConsultingForm() {
  state.currentConsultingStep = 1;
  const form = document.getElementById('consulting-step-form');
  if (form) form.reset();

  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');
  const submitBtn = document.getElementById('submit-step-btn');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const currentStepNum = document.getElementById('current-step-num');

  const steps = document.querySelectorAll('.form-step');
  steps.forEach(s => s.classList.remove('active'));
  document.querySelector('.form-step[data-step="1"]').classList.add('active');

  if (currentStepNum) currentStepNum.textContent = '1';
  if (progressBarFill) progressBarFill.style.width = '25%';

  if (prevBtn) prevBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'inline-flex';
  if (submitBtn) submitBtn.style.display = 'none';
}

/* ==========================================
   7. Testimonials
   ========================================== */
function renderTestimonials() {
  const container = document.getElementById('testimonials-slider');
  if (!container) return;

  container.innerHTML = state.testimonials.map(item => `
    <div class="testimonial-card">
      <div>
        <div class="quote-mark">"</div>
        <p class="testimonial-text">${item.quote}</p>
      </div>
      <div class="reviewer-meta">
        <img src="${item.avatar}" alt="${item.name}" class="reviewer-avatar">
        <div class="reviewer-info">
          <strong>${item.name}</strong>
          <span>${item.role}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ==========================================
   8. Modal Helpers & Keyboard Accessibility
   ========================================== */
function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function initGlobalKeyboardHandlers() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-overlay.open');
      openModals.forEach(m => closeModal(m));

      const drawer = document.getElementById('mobile-drawer');
      if (drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
    }
  });
}

/* ==========================================
   9. Toast Helper Notification
   ========================================== */
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
