// ============================================
// ANTI-DEVTOOLS PROTECTION
// ============================================

// 1. Block right-click context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// 2. Block keyboard shortcuts for DevTools
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12') { e.preventDefault(); return false; }
  // Ctrl+Shift+I (Inspect)
  if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
  // Ctrl+Shift+J (Console)
  if (e.ctrlKey && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
  // Ctrl+Shift+C (Element picker)
  if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); return false; }
  // Ctrl+U (View source)
  if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
  // Ctrl+S (Save page)
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); return false; }
});

// 3. Debugger trap — freezes execution when DevTools is open
(function _dt() {
  const el = new Image();
  Object.defineProperty(el, 'id', {
    get: function () {
      // DevTools is open — throw infinite debugger
      _trap();
    }
  });
  setInterval(() => { console.log('%c', el); }, 2000);
})();

function _trap() {
  setTimeout(_trap, 100);
  debugger;
}

// 4. Detect DevTools via window size difference (Disabled due to browser zoom false-positives)
// let _devWarn = false;
// setInterval(() => {
//   const widthThreshold = window.outerWidth - window.innerWidth > 160;
//   const heightThreshold = window.outerHeight - window.innerHeight > 160;
//   if (widthThreshold || heightThreshold) {
//     if (!_devWarn) {
//       _devWarn = true;
//       // sessionStorage.removeItem('cv_unlocked');
//       // document.getElementById('cv-content').classList.add('hidden');
//       // ...
//     }
//   } else {
//     _devWarn = false;
//   }
// }, 1000);

// 5. Disable console methods to prevent snooping
(function () {
  const noop = () => {};
  ['log', 'debug', 'info', 'warn', 'error', 'table', 'dir'].forEach(m => {
    // Keep a backup but override for users
    window.console[m] = noop;
  });
})();

// 6. Prevent drag & select (makes it harder to copy content)
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());

// ============================================
// PASSWORD CHECK — SHA-256 HASHED
// ============================================

// Hash of "1904" — password is NEVER stored as plaintext
let _HASH = '90bbc9533a02213ffdf4d1482eb9b97a5feec554e33641d40f24777cbe5a8341'; // Fallback

// Load .env dynamically
async function loadEnv() {
  try {
    const response = await fetch('.env');
    if (!response.ok) return;
    const text = await response.text();
    const match = text.match(/PASSWORD_HASH=(.*)/);
    if (match) {
      _HASH = match[1].trim();
    }
  } catch (err) {
    console.warn('Failed to load .env file, using fallback.');
  }
}
loadEnv();

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
  const input = document.getElementById('password-input');
  const error = document.getElementById('password-error');
  const gate = document.getElementById('password-gate');
  const cv = document.getElementById('cv-content');

  const inputHash = await sha256(input.value);

  if (inputHash === _HASH) {
    sessionStorage.setItem('cv_unlocked', 'true');
    gate.style.transition = 'opacity 0.5s, transform 0.5s';
    gate.style.opacity = '0';
    gate.style.transform = 'scale(1.05)';
    setTimeout(() => {
      gate.classList.add('hidden');
      cv.classList.remove('hidden');
      cv.classList.add('cv-unlock');
      initCV();
      
      // Remove the animation class after it completes so it doesn't break position: fixed
      setTimeout(() => {
        cv.classList.remove('cv-unlock');
      }, 850);
    }, 500);
  } else {
    error.textContent = '密碼錯誤，請重試';
    gate.querySelector('.gate-container').classList.add('gate-shake');
    input.style.borderColor = '#f87171';
    setTimeout(() => {
      gate.querySelector('.gate-container').classList.remove('gate-shake');
      input.style.borderColor = '';
    }, 500);
  }
}

// Enter key support
document.getElementById('password-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkPassword();
});

// ============================================
// LANGUAGE SWITCHER
// ============================================
let currentLang = 'zh';
function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

// Mobile menu toggle
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// ============================================
// CV INTERACTIONS
// ============================================
function initCV() {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  const backTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    backTop.classList.toggle('show', window.scrollY > 400);
  });

  // Fade-in on scroll
  const fadeEls = document.querySelectorAll('.skill-card, .timeline-item, .edu-card, .contact-card, .about-card');
  fadeEls.forEach(el => el.classList.add('fade-in'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });
  fadeEls.forEach(el => observer.observe(el));

  // Smooth nav links
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      document.querySelector('.nav-links').classList.remove('open');
    });
  });
}

// Auto-unlock if session storage has the unlock flag
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('cv_unlocked') === 'true') {
    const gate = document.getElementById('password-gate');
    const cv = document.getElementById('cv-content');
    if (gate && cv) {
      gate.style.display = 'none';
      cv.classList.remove('hidden');
      cv.classList.add('cv-unlock');
      
      // Remove the animation class after it completes so it doesn't break position: fixed
      setTimeout(() => {
        cv.classList.remove('cv-unlock');
      }, 850);
      
      initCV();
    }
  }
});
