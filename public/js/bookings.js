/**
 * CINEVERSE - Booking Confirmation & Customer Booking Management (bookings.js)
 */

let myBookingsList = [];
let currentFilterTab = 'all';

// ========================================================
// Booking Confirmation & Digital Ticket Page
// ========================================================
async function initBookingConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const bookingRef = params.get('id');

  const container = document.getElementById('ticket-display-container');
  if (!container) return;

  if (!bookingRef) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 16px;"></i>
        <h2>Booking Not Specified</h2>
        <p style="color: var(--text-secondary); margin: 12px 0 24px;">No booking reference was provided.</p>
        <a href="my-bookings.html" class="btn btn-primary">Go to My Bookings</a>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`/api/bookings/${bookingRef}`);
    const data = await res.json();

    if (!data.success || !data.booking) {
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
          <h2>Booking Not Found</h2>
          <p style="color: var(--text-secondary); margin: 12px 0 24px;">${data.message || 'We could not locate this booking.'}</p>
          <a href="index.html" class="btn btn-secondary">Return Home</a>
        </div>
      `;
      return;
    }

    const b = data.booking;
    renderDigitalTicket(b);

  } catch (err) {
    console.error('Error fetching booking details:', err);
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <h2>Error Loading Ticket</h2>
        <p style="color: var(--text-secondary); margin: 12px 0 24px;">${err.message}</p>
        <a href="my-bookings.html" class="btn btn-primary">View My Bookings</a>
      </div>
    `;
  }
}

function renderDigitalTicket(b) {
  const container = document.getElementById('ticket-display-container');
  if (!container) return;

  const seatsDisplay = b.seat_numbers ? b.seat_numbers.join(', ') : (b.seats + ' Seats');
  const qrData = encodeURIComponent(`SHANMUKHA CINEVERSE|REF:${b.booking_reference}|SHOW:${b.show_id}|SEATS:${seatsDisplay}|USER:${b.customer_name}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&bgcolor=ffffff&color=111827&margin=2`;

  container.innerHTML = `
    <div class="ticket-wrapper">
      <div class="ticket-card" id="printable-ticket">
        <div class="ticket-perforation"></div>
        
        <!-- Main Ticket Body -->
        <div class="ticket-main">
          <div class="ticket-header">
            <div class="ticket-brand">
              <i class="fa-solid fa-film" style="color:var(--accent-violet);"></i> <span>SHANMUKHA</span> CINEVERSE
            </div>
            <div class="ticket-ref-id">${b.booking_reference}</div>
          </div>

          <h2 class="ticket-movie-title">${b.movie_title}</h2>

          <div class="ticket-info-grid">
            <div>
              <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Theatre & Screen</div>
              <div style="font-weight:600; color:#FFFFFF; margin-top:2px;">${b.theatre_name}</div>
              <div style="font-size:0.8rem; color:var(--accent-violet);">${b.screen_type || 'IMAX 3D'}</div>
            </div>

            <div>
              <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Date & Time</div>
              <div style="font-weight:600; color:#FFFFFF; margin-top:2px;">${formatDate(b.show_date)}</div>
              <div style="font-size:0.8rem; color:var(--accent-gold); font-weight:600;">${formatTime(b.show_time)}</div>
            </div>

            <div>
              <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Seats Selected</div>
              <div style="font-weight:700; color:var(--accent-violet); font-size:1.1rem; margin-top:2px;">${seatsDisplay}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">${b.seats} Tickets</div>
            </div>

            <div>
              <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Ticket Holder</div>
              <div style="font-weight:600; color:#FFFFFF; margin-top:2px;">${b.customer_name}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">${b.customer_email || ''}</div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:18px;">
            <div>
              <span style="font-size:0.8rem; color:var(--text-muted);">Total Paid:</span>
              <span style="font-size:1.4rem; font-weight:800; color:var(--accent-gold); margin-left:8px;">${formatCurrency(b.total_amount)}</span>
            </div>
            <div>
              <span class="badge ${b.booking_status === 'Confirmed' ? 'badge-green' : 'badge-red'}">
                <i class="fa-solid fa-check-circle"></i> ${b.booking_status}
              </span>
            </div>
          </div>
        </div>

        <!-- Ticket Stub with QR Code -->
        <div class="ticket-stub">
          <div class="ticket-qr-box">
            <img src="${qrUrl}" alt="Digital Ticket QR Code" loading="lazy" 
                 onerror="this.parentElement.innerHTML='<div style=\'width:130px;height:130px;background:#111827;color:#8B5CF6;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;font-size:0.75rem;padding:8px;text-align:center;\'><i class=\'fa-solid fa-qrcode\' style=\'font-size:2.5rem;margin-bottom:6px;\'></i><span>${b.booking_reference}</span></div>';">
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.4;">
            Scan at cinema kiosk or gate for instant paperless admission.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; justify-content:center; gap:16px; margin-top:32px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="window.print()">
          <i class="fa-solid fa-print"></i> Print Ticket
        </button>
        <a href="my-bookings.html" class="btn btn-secondary">
          <i class="fa-solid fa-clock-rotate-left"></i> View All My Bookings
        </a>
        <a href="movies.html" class="btn btn-outline">
          <i class="fa-solid fa-film"></i> Book More Movies
        </a>
      </div>
    </div>
  `;
}

// ========================================================
// My Bookings Page Logic (my-bookings.html)
// ========================================================
async function initMyBookings() {
  const container = document.getElementById('my-bookings-list');
  if (!container) return;

  try {
    const res = await fetch('/api/bookings/my-bookings');
    
    if (res.status === 401) {
      container.innerHTML = `
        <div style="background:var(--bg-card); padding:50px 20px; border-radius:var(--radius-lg); text-align:center; border:1px solid var(--border-light);">
          <i class="fa-solid fa-lock" style="font-size:2.5rem; color:var(--accent-violet); margin-bottom:16px;"></i>
          <h3>Please Log In to View Your Bookings</h3>
          <p style="color:var(--text-secondary); margin:8px 0 20px;">You need to be logged in to access your digital tickets and booking history.</p>
          <a href="login.html?redirect=my-bookings.html" class="btn btn-primary">Log In Now</a>
        </div>
      `;
      return;
    }

    const data = await res.json();
    if (!data.success) {
      container.innerHTML = `<p style="color:var(--accent-red);">${data.message || 'Error fetching bookings'}</p>`;
      return;
    }

    myBookingsList = data.bookings || [];
    renderBookingsList();

    // Attach Tab Filter Listeners
    document.querySelectorAll('.booking-filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.booking-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilterTab = tab.dataset.filter;
        renderBookingsList();
      });
    });

  } catch (err) {
    console.error('Error in my bookings:', err);
    container.innerHTML = `<p style="color:var(--accent-red);">Failed to connect to database: ${err.message}</p>`;
  }
}

function renderBookingsList() {
  const container = document.getElementById('my-bookings-list');
  if (!container) return;

  const now = new Date();

  const filtered = myBookingsList.filter(b => {
    if (currentFilterTab === 'all') return true;
    const showDateTime = new Date(`${b.show_date}T${b.show_time}`);
    const isUpcoming = showDateTime >= now && b.booking_status === 'Confirmed';
    if (currentFilterTab === 'upcoming') return isUpcoming;
    if (currentFilterTab === 'past') return !isUpcoming;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background:var(--bg-card); padding:60px 20px; border-radius:var(--radius-lg); text-align:center; border:1px solid var(--border-light);">
        <i class="fa-solid fa-ticket" style="font-size:3rem; color:var(--text-muted); margin-bottom:16px;"></i>
        <h3>No Bookings Found</h3>
        <p style="color:var(--text-secondary); margin:8px 0 20px;">You don't have any bookings in this section yet.</p>
        <a href="movies.html" class="btn btn-primary">Explore Movies Now</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const showDateTime = new Date(`${b.show_date}T${b.show_time}`);
    const isUpcoming = showDateTime >= now && b.booking_status === 'Confirmed';
    const isCancelled = b.booking_status === 'Cancelled';
    const seatsStr = b.seat_numbers ? b.seat_numbers.join(', ') : `${b.seats} Seats`;

    return `
      <div class="theatre-card" style="margin-bottom:20px; border-left:4px solid ${isCancelled ? 'var(--accent-red)' : 'var(--accent-violet)'};">
        <div style="display:grid; grid-template-columns:120px 1fr auto; gap:24px; align-items:center;">
          <div style="aspect-ratio:2/3; border-radius:var(--radius-md); overflow:hidden; background:#111;">
            <img src="${b.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'}" 
                 alt="${b.movie_title}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
              <span class="badge ${isCancelled ? 'badge-red' : 'badge-green'}">${b.booking_status}</span>
              <span style="font-family:monospace; font-size:0.85rem; color:var(--text-muted);">${b.booking_reference}</span>
            </div>
            <h3 style="font-size:1.3rem; margin-bottom:8px;">${b.movie_title}</h3>
            <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:4px;">
              <i class="fa-solid fa-building-columns" style="color:var(--accent-red); margin-right:6px;"></i>
              ${b.theatre_name} (${b.screen_type || 'IMAX'})
            </p>
            <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:8px;">
              <i class="fa-solid fa-calendar-day" style="color:var(--accent-violet); margin-right:6px;"></i>
              ${formatDate(b.show_date)} at <strong>${formatTime(b.show_time)}</strong>
            </p>
            <div style="font-size:0.9rem; color:#FFFFFF;">
              Seats: <span style="color:var(--accent-violet); font-weight:700;">${seatsStr}</span> 
              (${b.seats} ${b.seats > 1 ? 'tickets' : 'ticket'}) • Total: <strong style="color:var(--accent-gold);">${formatCurrency(b.total_amount)}</strong>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
            <a href="booking-confirmation.html?id=${b.booking_reference}" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-qrcode"></i> Digital Ticket
            </a>
            ${isUpcoming ? `
              <button class="btn btn-secondary btn-sm" onclick="cancelCustomerBooking(${b.booking_id}, '${b.movie_title}')" style="color:var(--accent-red);">
                <i class="fa-solid fa-ban"></i> Cancel Booking
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.cancelCustomerBooking = function(bookingId, movieTitle) {
  showConfirmModal({
    title: 'Cancel Booking',
    message: `Are you sure you want to cancel your booking for <strong>${movieTitle}</strong>? The reserved seats will be immediately released back for other customers.`,
    confirmText: 'Yes, Cancel Booking',
    confirmClass: 'btn-cinema',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PUT' });
        const data = await res.json();

        if (data.success) {
          showToast('Booking successfully cancelled and seats released.', 'success');
          // Refresh list
          initMyBookings();
        } else {
          showToast(data.message || 'Could not cancel booking.', 'error');
        }
      } catch (err) {
        showToast('Error cancelling booking: ' + err.message, 'error');
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initBookingConfirmation();
  initMyBookings();
});
