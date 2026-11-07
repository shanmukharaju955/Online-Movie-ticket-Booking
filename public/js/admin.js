/**
 * CINEVERSE - Admin Dashboard Management Script (admin.js)
 */

let allAdminMovies = [];
let allAdminShows = [];
let allAdminBookings = [];
let allAdminCustomers = [];
let editingMovieId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verifyAdminAccess();
  initAdminTabs();
  loadDashboardData();
  loadMoviesTable();
  loadShowsTable();
  loadBookingsTable();
  loadCustomersTable();
  initAdminModals();
});

// Verify Admin Role
async function verifyAdminAccess() {
  try {
    const res = await fetch('/api/auth/profile');
    const data = await res.json();
    if (!data.success || !data.user || data.user.role !== 'admin') {
      showToast('Administrator privileges required.', 'error');
      setTimeout(() => {
        window.location.href = 'login.html?error=admin_required';
      }, 1000);
    } else {
      document.getElementById('admin-username-display').textContent = data.user.name;
    }
  } catch (err) {
    window.location.href = 'login.html';
  }
}

// Sidebar Tab Switching
function initAdminTabs() {
  const tabButtons = document.querySelectorAll('.admin-nav-item button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// ========================================================
// 1. Dashboard Overview
// ========================================================
async function loadDashboardData() {
  try {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();

    if (data.success) {
      document.getElementById('stat-total-movies').textContent = data.stats.totalMovies;
      document.getElementById('stat-total-customers').textContent = data.stats.totalCustomers;
      document.getElementById('stat-total-shows').textContent = data.stats.totalShows;
      document.getElementById('stat-total-bookings').textContent = data.stats.totalBookings;
      document.getElementById('stat-total-revenue').textContent = formatCurrency(data.stats.totalRevenue);

      // Render Recent Bookings Table
      const recentContainer = document.getElementById('admin-recent-bookings-body');
      if (recentContainer && data.recentBookings) {
        recentContainer.innerHTML = data.recentBookings.map(b => `
          <tr>
            <td><strong>${b.booking_reference}</strong></td>
            <td>${b.customer_name}</td>
            <td>${b.movie_title}</td>
            <td>${b.theatre_name}</td>
            <td>${formatDate(b.show_date)} ${formatTime(b.show_time)}</td>
            <td><strong>${formatCurrency(b.total_amount)}</strong></td>
            <td><span class="badge ${b.booking_status === 'Confirmed' ? 'badge-green' : 'badge-red'}">${b.booking_status}</span></td>
          </tr>
        `).join('');
      }

      // Render Popular Movies
      const popularContainer = document.getElementById('admin-popular-movies-body');
      if (popularContainer && data.popularMovies) {
        popularContainer.innerHTML = data.popularMovies.map(m => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="${m.poster_url}" style="width:36px; height:50px; border-radius:4px; object-fit:cover;">
                <strong>${m.title}</strong>
              </div>
            </td>
            <td>${m.genre}</td>
            <td><i class="fa-solid fa-star" style="color:var(--accent-gold);"></i> ${parseFloat(m.rating).toFixed(1)}</td>
            <td><strong>${m.tickets_sold}</strong> tickets</td>
            <td><strong style="color:var(--accent-gold);">${formatCurrency(m.revenue)}</strong></td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading admin dashboard stats:', err);
  }
}

// ========================================================
// 2. Movie Management
// ========================================================
async function loadMoviesTable() {
  const container = document.getElementById('admin-movies-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/movies');
    const data = await res.json();
    if (data.success) {
      allAdminMovies = data.movies;
      renderAdminMoviesTable(allAdminMovies);
      populateMovieSelectOptions(allAdminMovies);
    }
  } catch (err) {
    console.error('Error fetching admin movies:', err);
  }
}

function renderAdminMoviesTable(movies) {
  const container = document.getElementById('admin-movies-table-body');
  if (!container) return;

  if (movies.length === 0) {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">No movies found.</td></tr>`;
    return;
  }

  container.innerHTML = movies.map(m => `
    <tr>
      <td>${m.movie_id}</td>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${m.poster_url}" style="width:36px; height:50px; border-radius:4px; object-fit:cover;">
          <div>
            <strong>${m.title}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${m.director || 'Director unspecified'}</div>
          </div>
        </div>
      </td>
      <td>${m.genre}</td>
      <td>${m.language}</td>
      <td>${m.duration} mins</td>
      <td><span class="badge ${m.status === 'trending' ? 'badge-red' : (m.status === 'coming_soon' ? 'badge-gold' : 'badge-violet')}">${m.status}</span></td>
      <td>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="editMovie(${m.movie_id})" title="Edit Movie">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="deleteMovie(${m.movie_id}, '${m.title}')" style="color:var(--accent-red);" title="Delete Movie">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Populate movie dropdown in Add Show modal
function populateMovieSelectOptions(movies) {
  const select = document.getElementById('show-movie-select');
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Movie --</option>' + 
    movies.map(m => `<option value="${m.movie_id}">${m.title} (${m.language})</option>`).join('');
}

// ========================================================
// 3. Show Management
// ========================================================
async function loadShowsTable() {
  const container = document.getElementById('admin-shows-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/shows');
    const data = await res.json();
    if (data.success) {
      allAdminShows = data.shows;
      renderAdminShowsTable(allAdminShows);
    }
  } catch (err) {
    console.error('Error fetching admin shows:', err);
  }
}

function renderAdminShowsTable(shows) {
  const container = document.getElementById('admin-shows-table-body');
  if (!container) return;

  if (shows.length === 0) {
    container.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;">No shows scheduled.</td></tr>`;
    return;
  }

  container.innerHTML = shows.map(s => `
    <tr>
      <td>${s.show_id}</td>
      <td><strong>${s.movie_title}</strong></td>
      <td>${s.theatre_name}</td>
      <td><span class="badge badge-violet">${s.screen_type}</span></td>
      <td>${formatDate(s.show_date)}</td>
      <td><strong>${formatTime(s.show_time)}</strong></td>
      <td><strong style="color:var(--accent-gold);">${formatCurrency(s.ticket_price)}</strong></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="deleteShow(${s.show_id})" style="color:var(--accent-red);" title="Delete Show">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ========================================================
// 4. Booking Management
// ========================================================
async function loadBookingsTable(search = '', status = 'all') {
  const container = document.getElementById('admin-bookings-table-body');
  if (!container) return;

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    const res = await fetch(`/api/admin/bookings?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      allAdminBookings = data.bookings;
      renderAdminBookingsTable(allAdminBookings);
    }
  } catch (err) {
    console.error('Error loading bookings:', err);
  }
}

function renderAdminBookingsTable(bookings) {
  const container = document.getElementById('admin-bookings-table-body');
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;">No bookings found.</td></tr>`;
    return;
  }

  container.innerHTML = bookings.map(b => `
    <tr>
      <td><strong>${b.booking_reference}</strong></td>
      <td>${b.customer_name} <br><small style="color:var(--text-muted);">${b.customer_email}</small></td>
      <td>${b.movie_title}</td>
      <td>${b.theatre_name}</td>
      <td>${formatDate(b.show_date)} ${formatTime(b.show_time)}</td>
      <td><span style="color:var(--accent-violet); font-weight:700;">${b.seat_numbers.join(', ')}</span></td>
      <td><strong style="color:var(--accent-gold);">${formatCurrency(b.total_amount)}</strong></td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="badge ${b.booking_status === 'Confirmed' ? 'badge-green' : 'badge-red'}">${b.booking_status}</span>
          ${b.booking_status === 'Confirmed' ? `
            <button class="btn btn-secondary btn-sm" onclick="adminCancelBooking(${b.booking_id})" style="color:var(--accent-red); padding:4px 8px; font-size:0.75rem;" title="Cancel Booking & Free Seats">
              <i class="fa-solid fa-ban"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// ========================================================
// 5. Customer Management
// ========================================================
async function loadCustomersTable(search = '') {
  const container = document.getElementById('admin-customers-table-body');
  if (!container) return;

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      allAdminCustomers = data.customers;
      renderAdminCustomersTable(allAdminCustomers);
    }
  } catch (err) {
    console.error('Error loading customers:', err);
  }
}

function renderAdminCustomersTable(customers) {
  const container = document.getElementById('admin-customers-table-body');
  if (!container) return;

  if (customers.length === 0) {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">No customers found.</td></tr>`;
    return;
  }

  container.innerHTML = customers.map(c => `
    <tr>
      <td>${c.user_id}</td>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone || 'N/A'}</td>
      <td><strong>${c.total_bookings}</strong> bookings</td>
      <td><strong style="color:var(--accent-gold);">${formatCurrency(c.total_spent)}</strong></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="filterBookingsByCustomer('${c.email}')" title="View Customer Bookings">
          <i class="fa-solid fa-ticket"></i> View Bookings
        </button>
      </td>
    </tr>
  `).join('');
}

window.filterBookingsByCustomer = function(customerEmail) {
  // Switch to bookings tab
  const bookingTabBtn = document.querySelector('button[data-tab="tab-bookings"]');
  if (bookingTabBtn) bookingTabBtn.click();

  const searchInput = document.getElementById('admin-booking-search');
  if (searchInput) {
    searchInput.value = customerEmail;
    loadBookingsTable(customerEmail);
  }
};

// ========================================================
// Modals & Action Handlers
// ========================================================
function initAdminModals() {
  // Movie Search Filter
  const movieSearch = document.getElementById('admin-movie-search');
  if (movieSearch) {
    movieSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allAdminMovies.filter(m => m.title.toLowerCase().includes(term) || m.genre.toLowerCase().includes(term));
      renderAdminMoviesTable(filtered);
    });
  }

  // Booking Search & Filter
  const bookingSearch = document.getElementById('admin-booking-search');
  const bookingStatusFilter = document.getElementById('admin-booking-status-filter');
  if (bookingSearch) {
    bookingSearch.addEventListener('input', () => {
      loadBookingsTable(bookingSearch.value, bookingStatusFilter?.value || 'all');
    });
  }
  if (bookingStatusFilter) {
    bookingStatusFilter.addEventListener('change', () => {
      loadBookingsTable(bookingSearch?.value || '', bookingStatusFilter.value);
    });
  }

  // Customer Search
  const customerSearch = document.getElementById('admin-customer-search');
  if (customerSearch) {
    customerSearch.addEventListener('input', () => {
      loadCustomersTable(customerSearch.value);
    });
  }

  // Add Movie Button
  const addMovieBtn = document.getElementById('admin-add-movie-btn');
  if (addMovieBtn) {
    addMovieBtn.addEventListener('click', () => {
      editingMovieId = null;
      document.getElementById('movie-modal-title').textContent = 'Add New Movie';
      document.getElementById('movie-form').reset();
      openModal('admin-movie-modal');
    });
  }

  // Movie Form Submit (Add or Edit)
  const movieForm = document.getElementById('movie-form');
  if (movieForm) {
    movieForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(movieForm);

      const url = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
      const method = editingMovieId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Movie saved successfully!', 'success');
          closeModal('admin-movie-modal');
          loadMoviesTable();
          loadDashboardData();
        } else {
          showToast(data.message || 'Error saving movie.', 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  // Schedule Show Button
  const addShowBtn = document.getElementById('admin-add-show-btn');
  if (addShowBtn) {
    addShowBtn.addEventListener('click', () => {
      document.getElementById('show-form').reset();
      // default date today
      document.getElementById('show-date-input').value = new Date().toISOString().split('T')[0];
      openModal('admin-show-modal');
    });
  }

  // Show Form Submit
  const showForm = document.getElementById('show-form');
  if (showForm) {
    showForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        movie_id: document.getElementById('show-movie-select').value,
        theatre_name: document.getElementById('show-theatre-input').value,
        city: document.getElementById('show-city-select')?.value || 'Hyderabad',
        show_date: document.getElementById('show-date-input').value,
        show_time: document.getElementById('show-time-input').value,
        ticket_price: document.getElementById('show-price-input').value,
        screen_type: document.getElementById('show-screentype-input').value
      };

      try {
        const res = await fetch('/api/shows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast('Show scheduled successfully!', 'success');
          closeModal('admin-show-modal');
          loadShowsTable();
          loadDashboardData();
        } else {
          showToast(data.message || 'Failed to add show', 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
};

// Edit Movie
window.editMovie = function(movieId) {
  const m = allAdminMovies.find(x => x.movie_id === movieId);
  if (!m) return;

  editingMovieId = movieId;
  document.getElementById('movie-modal-title').textContent = `Edit Movie: ${m.title}`;
  document.getElementById('m-title').value = m.title;
  document.getElementById('m-genre').value = m.genre;
  document.getElementById('m-language').value = m.language;
  document.getElementById('m-duration').value = m.duration;
  document.getElementById('m-release-date').value = m.release_date ? m.release_date.split('T')[0] : '';
  document.getElementById('m-rating').value = m.rating;
  document.getElementById('m-status').value = m.status;
  document.getElementById('m-director').value = m.director || '';
  document.getElementById('m-cast').value = m.cast || '';
  document.getElementById('m-description').value = m.description || '';
  document.getElementById('m-poster-url').value = m.poster_url || '';
  document.getElementById('m-banner-url').value = m.banner_url || '';
  const trailerInput = document.getElementById('m-trailer-url');
  if (trailerInput) trailerInput.value = m.trailer_url || '';

  openModal('admin-movie-modal');
};

// Delete Movie
window.deleteMovie = function(movieId, title) {
  showConfirmModal({
    title: 'Delete Movie',
    message: `Are you sure you want to permanently delete <strong>${title}</strong>? All associated shows and bookings will also be removed.`,
    confirmText: 'Delete Movie',
    confirmClass: 'btn-cinema',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/movies/${movieId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast('Movie deleted successfully.', 'success');
          loadMoviesTable();
          loadDashboardData();
        } else {
          showToast(data.message || 'Failed to delete movie', 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }
  });
};

// Delete Show
window.deleteShow = function(showId) {
  showConfirmModal({
    title: 'Delete Show',
    message: 'Are you sure you want to delete this show? Any confirmed bookings for this show will also be removed.',
    confirmText: 'Delete Show',
    confirmClass: 'btn-cinema',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/shows/${showId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast('Show deleted successfully.', 'success');
          loadShowsTable();
          loadDashboardData();
        } else {
          showToast(data.message || 'Failed to delete show', 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }
  });
};

// Admin Cancel Booking
window.adminCancelBooking = function(bookingId) {
  showConfirmModal({
    title: 'Admin Cancel Booking',
    message: 'Cancel this customer booking and free reserved seats immediately?',
    confirmText: 'Cancel Booking',
    confirmClass: 'btn-cinema',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) {
          showToast('Booking cancelled and seats released.', 'success');
          loadBookingsTable();
          loadDashboardData();
        } else {
          showToast(data.message || 'Failed to cancel', 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }
  });
};
