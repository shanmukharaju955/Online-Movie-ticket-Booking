/**
 * CINEVERSE - Interactive Cinema Seat Selection (seats.js)
 */

let currentShow = null;
let bookedSeatsList = new Set();
let selectedSeats = new Set();
let baseTicketPrice = 0;

// Setup rows & columns
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 8;
const VIP_ROWS = ['A', 'B'];

async function initSeatSelection() {
  const params = new URLSearchParams(window.location.search);
  const showId = params.get('show_id');

  if (!showId) {
    showToast('No show selected. Redirecting to movies...', 'error');
    setTimeout(() => window.location.href = 'movies.html', 1500);
    return;
  }

  try {
    // 1. Fetch Show details & booked seats from backend
    const res = await fetch(`/api/shows/${showId}`);
    const data = await res.json();

    if (!data.success || !data.show) {
      showToast('Show not found or unavailable.', 'error');
      setTimeout(() => window.location.href = 'movies.html', 1500);
      return;
    }

    currentShow = data.show;
    baseTicketPrice = parseFloat(currentShow.ticket_price) || 15.00;
    bookedSeatsList = new Set(data.bookedSeats || []);

    // 2. Render Show Header & Info
    renderShowHeader(currentShow);

    // 3. Render Interactive Cinema Hall
    renderCinemaHall();

    // 4. Update Summary Bar
    updateBookingSummary();

    // 5. Attach Confirm Button
    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', handleConfirmBooking);
    }

  } catch (err) {
    console.error('Error initializing seat selection:', err);
    showToast('Failed to load seat layout: ' + err.message, 'error');
  }
}

function renderShowHeader(show) {
  document.title = `Select Seats – ${show.movie_title} | SHANMUKHA CINEVERSE`;

  const titleElem = document.getElementById('seat-movie-title');
  if (titleElem) titleElem.textContent = show.movie_title;

  const metaElem = document.getElementById('seat-show-meta');
  if (metaElem) {
    metaElem.innerHTML = `
      <span><i class="fa-solid fa-building-columns"></i> ${show.theatre_name}</span>
      <span>•</span>
      <span><i class="fa-solid fa-calendar-day"></i> ${formatDate(show.show_date)}</span>
      <span>•</span>
      <span><i class="fa-solid fa-clock"></i> ${formatTime(show.show_time)}</span>
      <span>•</span>
      <span class="badge badge-violet">${show.screen_type || 'IMAX'}</span>
    `;
  }
}

function renderCinemaHall() {
  const container = document.getElementById('cinema-hall-grid');
  if (!container) return;

  container.innerHTML = '';
  const layoutWrapper = document.createElement('div');
  layoutWrapper.className = 'seats-layout';

  SEAT_ROWS.forEach(rowLetter => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';

    // Left Row Label
    const leftLabel = document.createElement('div');
    leftLabel.className = 'row-label';
    leftLabel.textContent = rowLetter;
    rowDiv.appendChild(leftLabel);

    const isVIP = VIP_ROWS.includes(rowLetter);

    // Render Seats 1 through 8
    for (let num = 1; num <= SEATS_PER_ROW; num++) {
      // Add aisle gap in the middle (between seat 4 and 5)
      if (num === 5) {
        const aisleGap = document.createElement('div');
        aisleGap.style.width = '24px';
        rowDiv.appendChild(aisleGap);
      }

      const seatNumber = `${rowLetter}${num}`;
      const seatBtn = document.createElement('div');
      seatBtn.className = 'seat';
      seatBtn.dataset.seatNumber = seatNumber;
      seatBtn.dataset.vip = isVIP ? 'true' : 'false';
      seatBtn.textContent = num;

      if (bookedSeatsList.has(seatNumber)) {
        seatBtn.classList.add('booked');
        seatBtn.title = `Seat ${seatNumber} - Already Booked`;
      } else {
        if (isVIP) {
          seatBtn.classList.add('vip-seat');
          seatBtn.title = `VIP Seat ${seatNumber} (${formatCurrency(baseTicketPrice * 1.25)})`;
        } else {
          seatBtn.classList.add('available');
          seatBtn.title = `Standard Seat ${seatNumber} (${formatCurrency(baseTicketPrice)})`;
        }

        // Toggle selection
        seatBtn.addEventListener('click', () => toggleSeatSelection(seatNumber, seatBtn));
      }

      rowDiv.appendChild(seatBtn);
    }

    // Right Row Label
    const rightLabel = document.createElement('div');
    rightLabel.className = 'row-label';
    rightLabel.textContent = rowLetter;
    rowDiv.appendChild(rightLabel);

    layoutWrapper.appendChild(rowDiv);
  });

  container.appendChild(layoutWrapper);
}

function toggleSeatSelection(seatNumber, seatElem) {
  if (bookedSeatsList.has(seatNumber)) return;

  if (selectedSeats.has(seatNumber)) {
    selectedSeats.delete(seatNumber);
    seatElem.classList.remove('selected');
  } else {
    // Max 10 seats per booking
    if (selectedSeats.size >= 10) {
      showToast('Maximum 10 seats allowed per booking transaction.', 'warning');
      return;
    }
    selectedSeats.add(seatNumber);
    seatElem.classList.add('selected');
  }

  updateBookingSummary();
}

function updateBookingSummary() {
  const countElem = document.getElementById('selected-seats-count');
  const listElem = document.getElementById('selected-seats-list');
  const priceElem = document.getElementById('total-booking-price');
  const confirmBtn = document.getElementById('confirm-booking-btn');

  const count = selectedSeats.size;
  const seatsArray = Array.from(selectedSeats).sort();

  if (countElem) countElem.textContent = count;
  if (listElem) listElem.textContent = count > 0 ? seatsArray.join(', ') : 'None';

  // Calculate total price
  let total = 0;
  seatsArray.forEach(seat => {
    const isVIP = VIP_ROWS.includes(seat.charAt(0));
    const price = isVIP ? Math.round((baseTicketPrice * 1.25) * 100) / 100 : baseTicketPrice;
    total += price;
  });

  if (priceElem) priceElem.textContent = formatCurrency(total);

  if (confirmBtn) {
    confirmBtn.disabled = count === 0;
    if (count === 0) {
      confirmBtn.style.opacity = '0.5';
      confirmBtn.style.pointerEvents = 'none';
    } else {
      confirmBtn.style.opacity = '1';
      confirmBtn.style.pointerEvents = 'auto';
    }
  }
}

async function handleConfirmBooking() {
  if (selectedSeats.size === 0) {
    showToast('Please select at least one seat before confirming.', 'warning');
    return;
  }

  // 1. Verify user authentication
  if (!window.currentUser) {
    showToast('Please log in or register to complete your ticket booking.', 'info');
    setTimeout(() => {
      const redirectUrl = `seat-selection.html?show_id=${currentShow.show_id}`;
      window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
    }, 1200);
    return;
  }

  const seatsArray = Array.from(selectedSeats).sort();
  const seatsCount = seatsArray.length;

  let total = 0;
  seatsArray.forEach(seat => {
    const isVIP = VIP_ROWS.includes(seat.charAt(0));
    total += isVIP ? Math.round((baseTicketPrice * 1.25) * 100) / 100 : baseTicketPrice;
  });

  // 2. Custom confirmation modal before executing database transaction
  showConfirmModal({
    title: 'Confirm Ticket Reservation',
    message: `
      <div style="font-size:0.95rem;">
        <p><strong>Movie:</strong> ${currentShow.movie_title}</p>
        <p><strong>Theatre:</strong> ${currentShow.theatre_name}</p>
        <p><strong>Date & Time:</strong> ${formatDate(currentShow.show_date)} at ${formatTime(currentShow.show_time)}</p>
        <p><strong>Seats:</strong> <span style="color:var(--accent-violet); font-weight:700;">${seatsArray.join(', ')}</span> (${seatsCount} tickets)</p>
        <p style="margin-top:12px; font-size:1.1rem; color:var(--accent-gold);"><strong>Total Amount:</strong> ${formatCurrency(total)}</p>
        <div style="margin-top:14px; padding:10px 12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; font-size:0.8rem; color:#A7F3D0;">
          <i class="fa-solid fa-credit-card"></i> <strong>Payment Mode:</strong> Demo Simulation Checkout (Instant ticket issue, no credit card required)
        </div>
      </div>
    `,
    confirmText: 'Confirm & Book',
    confirmClass: 'btn-primary',
    onConfirm: async () => {
      const confirmBtn = document.getElementById('confirm-booking-btn');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
      }

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            show_id: currentShow.show_id,
            seat_numbers: seatsArray
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showToast('🎉 Booking Confirmed! Generating your digital ticket...', 'success');
          setTimeout(() => {
            window.location.href = `booking-confirmation.html?id=${data.booking.booking_reference}`;
          }, 1000);
        } else if (res.status === 409) {
          // Double booking / seat conflict
          showToast(data.message || 'Seat conflict: Some seats were just booked. Refreshing availability...', 'error', 6000);
          // Refresh seat status
          refreshBookedSeats();
        } else {
          showToast(data.message || 'Failed to complete booking. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Booking submission error:', err);
        showToast('Network error while booking: ' + err.message, 'error');
      } finally {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirm Booking';
        }
      }
    }
  });
}

// Re-sync booked seats if conflict occurs
async function refreshBookedSeats() {
  if (!currentShow) return;
  try {
    const res = await fetch(`/api/shows/${currentShow.show_id}/seats`);
    const data = await res.json();
    if (data.success) {
      bookedSeatsList = new Set(data.bookedSeats || []);
      // Remove any conflicting selected seat
      for (const s of selectedSeats) {
        if (bookedSeatsList.has(s)) {
          selectedSeats.delete(s);
        }
      }
      renderCinemaHall();
      updateBookingSummary();
    }
  } catch (err) {
    console.error('Failed to refresh seats:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSeatSelection();
});
