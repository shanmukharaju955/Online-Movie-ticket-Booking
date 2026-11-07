/**
 * CINEVERSE - Main Global Utility & Authentication Script (main.js)
 */

// Global User & Location State
window.currentUser = null;
window.currentCity = localStorage.getItem('cineverse_city') || 'All';

// Change Active City
function setCity(city) {
  window.currentCity = city;
  localStorage.setItem('cineverse_city', city);
  const cityDisplays = document.querySelectorAll('.selected-city-text');
  cityDisplays.forEach(el => el.textContent = city === 'All' ? 'All Cities' : city);
  
  // Trigger custom event so any active page re-filters
  window.dispatchEvent(new CustomEvent('cityChanged', { detail: { city } }));
}

// Global Cinema Trailer Video Modal Player
function openTrailerModal(trailerUrl, movieTitle, movieId) {
  if (!trailerUrl || trailerUrl === 'null' || trailerUrl === 'undefined') {
    showToast('Trailer not available for this title yet.', 'info');
    return;
  }

  // Format embed URL with autoplay
  let embedUrl = trailerUrl;
  if (embedUrl.includes('youtube.com/watch?v=')) {
    const videoId = embedUrl.split('watch?v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (embedUrl.includes('youtu.be/')) {
    const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }
  if (!embedUrl.includes('autoplay=1')) {
    embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&rel=0&modestbranding=1';
  }

  let modal = document.getElementById('cinema-trailer-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cinema-trailer-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="trailer-modal-dialog">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; background:#111827; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid fa-circle-play" style="color:var(--accent-red); font-size:1.4rem;"></i>
            <h3 id="trailer-modal-title" style="font-size:1.2rem; font-weight:700;">Movie Trailer</h3>
          </div>
          <button class="toast-close" id="trailer-close-btn" style="font-size:1.2rem; color:#fff;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="trailer-iframe-wrapper">
          <iframe id="trailer-iframe" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div class="trailer-modal-footer">
          <span style="font-size:0.85rem; color:var(--text-secondary);"><i class="fa-solid fa-film" style="color:var(--accent-violet); margin-right:6px;"></i> High Definition Theatrical Trailer</span>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-secondary btn-sm" id="trailer-dismiss-btn">Close</button>
            <a href="#" id="trailer-book-btn" class="btn btn-cinema btn-sm">
              <i class="fa-solid fa-ticket"></i> Book Tickets Now
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('trailer-modal-title').textContent = `${movieTitle} – Official Trailer`;
  document.getElementById('trailer-iframe').src = embedUrl;
  const bookBtn = document.getElementById('trailer-book-btn');
  if (bookBtn) {
    bookBtn.href = movieId ? `movie-details.html?id=${movieId}#shows` : 'movies.html';
  }

  modal.classList.add('active');

  const closeModal = () => {
    modal.classList.remove('active');
    const iframe = document.getElementById('trailer-iframe');
    if (iframe) iframe.src = ''; // Stop video playback immediately
  };

  document.getElementById('trailer-close-btn').onclick = closeModal;
  document.getElementById('trailer-dismiss-btn').onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

// Currency & Date Formatters
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '$' + num.toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  // Handles 'HH:MM:SS' or 'HH:MM'
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  }
  return timeStr;
}

// ========================================================
// Toast Notification System
// ========================================================
function showToast(message, type = 'info', duration = 4500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    warning: 'fa-circle-exclamation',
    info: 'fa-circle-info'
  };

  const iconClass = iconMap[type] || 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <div class="toast-content">${message}</div>
    <div class="toast-close"><i class="fa-solid fa-xmark"></i></div>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// ========================================================
// Custom Confirmation Dialog Modal
// ========================================================
function showConfirmModal({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', confirmClass = 'btn-cinema', onConfirm }) {
  let modalOverlay = document.getElementById('global-confirm-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'global-confirm-modal';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 id="modal-title" style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-red);"></i>
            <span>${title}</span>
          </h3>
          <button class="toast-close" id="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" id="modal-message">${message}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn ${confirmClass}" id="modal-action-btn">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  } else {
    document.getElementById('modal-title').querySelector('span').textContent = title;
    document.getElementById('modal-message').innerHTML = message;
    const actionBtn = document.getElementById('modal-action-btn');
    actionBtn.textContent = confirmText;
    actionBtn.className = `btn ${confirmClass}`;
  }

  modalOverlay.classList.add('active');

  const close = () => {
    modalOverlay.classList.remove('active');
  };

  const cancelBtn = document.getElementById('modal-cancel-btn');
  const closeBtn = document.getElementById('modal-close-btn');
  const actionBtn = document.getElementById('modal-action-btn');

  // Clone to avoid duplicate listeners
  const newActionBtn = actionBtn.cloneNode(true);
  actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

  newActionBtn.addEventListener('click', () => {
    close();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  });

  cancelBtn.onclick = close;
  closeBtn.onclick = close;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) close();
  };
}

// ========================================================
// Navbar & Authentication Check
// ========================================================
async function initNavbar() {
  const navContainer = document.querySelector('.nav-actions');
  const navLinksContainer = document.querySelector('.nav-links');
  const toggleBtn = document.querySelector('.nav-toggle');

  // Mobile menu toggle
  if (toggleBtn && navLinksContainer) {
    toggleBtn.addEventListener('click', () => {
      navLinksContainer.classList.toggle('active');
    });
  }

  // Highlight current active link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (href === 'index.html' && (currentPath === '/' || currentPath.endsWith('/'))))) {
      link.classList.add('active');
    }
  });

  try {
    const res = await fetch('/api/auth/profile');
    const data = await res.json();

    if (data.success && data.isAuthenticated && data.user) {
      window.currentUser = data.user;

      // Add Admin Link if user is admin
      if (data.user.role === 'admin' && navLinksContainer) {
        if (!document.querySelector('.admin-nav-link')) {
          const adminLi = document.createElement('li');
          adminLi.innerHTML = `<a href="admin.html" class="nav-link admin-nav-link"><i class="fa-solid fa-gauge-high"></i> Admin Panel</a>`;
          navLinksContainer.appendChild(adminLi);
        }
      }

      if (navContainer) {
        navContainer.innerHTML = `
          <div class="user-profile-badge">
            <div class="user-avatar">${data.user.name.charAt(0).toUpperCase()}</div>
            <span class="user-name">${data.user.name.split(' ')[0]}</span>
            ${data.user.role === 'admin' ? '<span class="badge badge-red" style="font-size:0.65rem;">ADMIN</span>' : ''}
          </div>
          <button id="logout-btn" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        `;

        document.getElementById('logout-btn').addEventListener('click', handleLogout);
      }
    } else {
      if (navContainer) {
        navContainer.innerHTML = `
          <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
          <a href="register.html" class="btn btn-primary btn-sm">Register</a>
        `;
      }
    }
  } catch (error) {
    console.error('Navbar Auth Check Error:', error);
  }
}

async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }
  } catch (error) {
    showToast('Failed to log out: ' + error.message, 'error');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  
  const citySelect = document.getElementById('navbar-city-select');
  if (citySelect) {
    citySelect.value = window.currentCity || 'All';
  }
});
