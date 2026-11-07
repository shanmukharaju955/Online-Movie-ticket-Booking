/**
 * CINEVERSE - Shows & Theatre Selection (shows.js)
 * Enhanced with Hyderabad and Kurnool Theatres + Trailer Modals
 */

let currentMovieData = null;
let selectedDate = null;
let currentCityFilter = localStorage.getItem('cineverse_city') || 'All';

// ========================================================
// Movie Details & Showtimes Logic (movie-details.html)
// ========================================================
async function initMovieDetails() {
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get('id');

  if (!movieId) {
    const container = document.getElementById('movie-details-content');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 16px;"></i>
          <h2>Movie Not Specified</h2>
          <p style="color: var(--text-secondary); margin: 12px 0 24px;">Please select a movie from the catalog.</p>
          <a href="movies.html" class="btn btn-primary">Browse Movies</a>
        </div>
      `;
    }
    return;
  }

  try {
    const res = await fetch(`/api/movies/${movieId}`);
    const data = await res.json();

    if (!data.success || !data.movie) {
      document.getElementById('movie-details-content').innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
          <h2>Movie Not Found</h2>
          <p style="color: var(--text-secondary); margin: 12px 0 24px;">The requested movie does not exist in our database.</p>
          <a href="movies.html" class="btn btn-primary">Return to Movies</a>
        </div>
      `;
      return;
    }

    currentMovieData = data;
    renderMovieDetails(data.movie);
    renderShowDatesAndTheatres(data.shows, data.theatresGrouped);

  } catch (err) {
    console.error('Error loading movie details:', err);
    showToast('Failed to load movie details: ' + err.message, 'error');
  }
}

function renderMovieDetails(movie) {
  document.title = `${movie.title} – SHANMUKHA CINEVERSE`;

  const backdrop = document.getElementById('details-backdrop');
  if (backdrop) {
    backdrop.style.backgroundImage = `url('${movie.banner_url || movie.poster_url}')`;
  }

  const poster = document.getElementById('details-poster');
  if (poster) {
    poster.src = movie.poster_url;
    poster.alt = movie.title;
  }

  document.getElementById('details-title').textContent = movie.title;
  document.getElementById('details-rating').textContent = parseFloat(movie.rating).toFixed(1);
  document.getElementById('details-genre').textContent = movie.genre;
  document.getElementById('details-duration').textContent = `${movie.duration} min`;
  document.getElementById('details-language').textContent = movie.language;
  document.getElementById('details-release').textContent = formatDate(movie.release_date);
  document.getElementById('details-synopsis').textContent = movie.description;

  if (movie.director) {
    const dirElem = document.getElementById('details-director');
    if (dirElem) dirElem.textContent = movie.director;
  }
  if (movie.cast) {
    const castElem = document.getElementById('details-cast');
    if (castElem) castElem.textContent = movie.cast;
  }

  // Trailer button wrapper
  const trailerBtnWrapper = document.getElementById('details-trailer-btn-wrapper');
  if (trailerBtnWrapper && movie.trailer_url) {
    trailerBtnWrapper.innerHTML = `
      <button class="btn btn-outline btn-lg" onclick="openTrailerModal('${movie.trailer_url}', '${movie.title.replace(/'/g, "\\'")}', ${movie.movie_id})">
        <i class="fa-solid fa-circle-play" style="color:var(--accent-red);"></i> Watch Official Trailer
      </button>
    `;
  }
}

function renderShowDatesAndTheatres(shows, theatresGrouped) {
  const datesContainer = document.getElementById('show-date-tabs');
  const showsContainer = document.getElementById('theatres-shows-container');

  if (!shows || shows.length === 0) {
    if (showsContainer) {
      showsContainer.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 50px 20px; text-align: center;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 16px;"></i>
          <h3>No Active Shows Scheduled</h3>
          <p style="color: var(--text-secondary); margin-top: 8px;">Showtimes for this movie will be added soon. Please check back later or explore other movies.</p>
          <a href="movies.html" class="btn btn-secondary btn-sm" style="margin-top: 20px;">Browse Other Movies</a>
        </div>
      `;
    }
    if (datesContainer) datesContainer.innerHTML = '';
    return;
  }

  // Extract distinct dates from shows
  const uniqueDates = [...new Set(shows.map(s => {
    return typeof s.show_date === 'string' ? s.show_date : s.show_date.toISOString().split('T')[0];
  }))].sort();

  if (!selectedDate && uniqueDates.length > 0) {
    selectedDate = uniqueDates[0];
  }

  // Render Date Tabs
  if (datesContainer) {
    datesContainer.innerHTML = uniqueDates.map((dateStr, idx) => {
      const d = new Date(dateStr + 'T00:00:00');
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      const dayName = isToday ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isActive = dateStr === selectedDate ? 'active' : '';

      return `
        <button class="genre-pill date-tab ${isActive}" data-date="${dateStr}" onclick="selectShowDate('${dateStr}')">
          <strong>${dayName}</strong> • ${monthDay}
        </button>
      `;
    }).join('');
  }

  // Filter shows by selected date & city
  renderTheatresForSelectedDate(shows, selectedDate);
}

window.selectShowDate = function(dateStr) {
  selectedDate = dateStr;
  document.querySelectorAll('.date-tab').forEach(tab => {
    if (tab.dataset.date === dateStr) tab.classList.add('active');
    else tab.classList.remove('active');
  });

  if (currentMovieData) {
    renderTheatresForSelectedDate(currentMovieData.shows, selectedDate);
  }
};

window.filterCityShows = function(city) {
  currentCityFilter = city;
  localStorage.setItem('cineverse_city', city);
  document.querySelectorAll('.city-filter-pill').forEach(pill => {
    if (pill.dataset.city === city) pill.classList.add('active');
    else pill.classList.remove('active');
  });
  if (currentMovieData) {
    renderTheatresForSelectedDate(currentMovieData.shows, selectedDate);
  }
};

function renderTheatresForSelectedDate(shows, dateStr) {
  const container = document.getElementById('theatres-shows-container');
  if (!container) return;

  const filteredByDate = shows.filter(s => {
    const sDate = typeof s.show_date === 'string' ? s.show_date : s.show_date.toISOString().split('T')[0];
    return sDate === dateStr;
  });

  // Filter by City
  const filteredShows = currentCityFilter === 'All' 
    ? filteredByDate 
    : filteredByDate.filter(s => (s.city || '').toLowerCase() === currentCityFilter.toLowerCase());

  // City Selector HTML Banner
  const cityFilterHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; background:var(--bg-card); padding:12px 18px; border-radius:var(--radius-md); border:1px solid var(--border-light);">
      <div style="display:flex; align-items:center; gap:8px;">
        <i class="fa-solid fa-location-dot" style="color:var(--accent-red);"></i>
        <span style="font-weight:600; font-size:0.9rem;">Filter by Location:</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="genre-pill city-filter-pill ${currentCityFilter === 'All' ? 'active' : ''}" data-city="All" onclick="filterCityShows('All')">
          All Locations
        </button>
        <button class="genre-pill city-filter-pill ${currentCityFilter === 'Hyderabad' ? 'active' : ''}" data-city="Hyderabad" onclick="filterCityShows('Hyderabad')">
          📍 Hyderabad
        </button>
        <button class="genre-pill city-filter-pill ${currentCityFilter === 'Kurnool' ? 'active' : ''}" data-city="Kurnool" onclick="filterCityShows('Kurnool')">
          📍 Kurnool
        </button>
      </div>
    </div>
  `;

  if (filteredShows.length === 0) {
    container.innerHTML = cityFilterHTML + `
      <div style="background: var(--bg-card); padding: 40px; text-align: center; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <i class="fa-solid fa-film" style="font-size:2rem; color:var(--text-muted); margin-bottom:12px;"></i>
        <p style="color: var(--text-secondary);">No showtimes scheduled in <strong>${currentCityFilter}</strong> for this date. Try selecting "All Locations".</p>
      </div>
    `;
    return;
  }

  // Group by theatre
  const grouped = {};
  filteredShows.forEach(show => {
    if (!grouped[show.theatre_name]) {
      grouped[show.theatre_name] = {
        city: show.city || 'Hyderabad',
        shows: []
      };
    }
    grouped[show.theatre_name].shows.push(show);
  });

  const theatresListHTML = Object.keys(grouped).map(theatreName => {
    const theatreObj = grouped[theatreName];
    const theatreShows = theatreObj.shows;
    const screenType = theatreShows[0].screen_type || 'IMAX 3D';
    const city = theatreObj.city;
    const isHyd = city.toLowerCase() === 'hyderabad';

    return `
      <div class="theatre-card">
        <div class="theatre-header">
          <div>
            <div class="theatre-name">
              <i class="fa-solid fa-film"></i>
              <span>${theatreName}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
              <span class="badge ${isHyd ? 'badge-violet' : 'badge-gold'}" style="font-size:0.7rem;">📍 ${city}</span>
              <span style="margin-left:8px; color:var(--text-muted);">${screenType} • Dolby Atmos Sound</span>
            </div>
          </div>
          <div class="theatre-specs">
            <span class="badge badge-green">M-Ticket Available</span>
          </div>
        </div>
        <div class="showtimes-grid">
          ${theatreShows.map(show => {
            const formattedTime = formatTime(show.show_time);
            return `
              <a href="seat-selection.html?show_id=${show.show_id}" class="showtime-btn" title="Click to select seats">
                <span class="showtime-time">${formattedTime}</span>
                <span class="showtime-price">${formatCurrency(show.ticket_price)}</span>
                <span style="font-size: 0.65rem; color: var(--text-muted);">${show.screen_type}</span>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cityFilterHTML + theatresListHTML;
}

// ========================================================
// Theatres Explorer Page Logic (theatres.html)
// ========================================================
async function initTheatresPage() {
  const container = document.getElementById('theatres-list-container');
  if (!container) return;

  try {
    const res = await fetch('/api/shows/theatres/list');
    const data = await res.json();

    if (data.success && data.theatres.length > 0) {
      window.allTheatresData = data.theatres;
      renderTheatresCatalog(currentCityFilter);
    } else {
      container.innerHTML = `
        <div style="background: var(--bg-card); padding: 40px; text-align: center; border-radius: var(--radius-lg);">
          <p style="color: var(--text-secondary);">No theatres listed currently.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching theatres:', err);
  }
}

window.renderTheatresCatalog = function(city) {
  const container = document.getElementById('theatres-list-container');
  if (!container || !window.allTheatresData) return;

  currentCityFilter = city;
  localStorage.setItem('cineverse_city', city);

  // Update pills active state
  document.querySelectorAll('.theatre-city-pill').forEach(pill => {
    if (pill.dataset.city === city) pill.classList.add('active');
    else pill.classList.remove('active');
  });

  const filtered = city === 'All' 
    ? window.allTheatresData 
    : window.allTheatresData.filter(t => (t.city || '').toLowerCase() === city.toLowerCase());

  container.innerHTML = filtered.map(th => {
    const isHyd = (th.city || '').toLowerCase() === 'hyderabad';
    const cityTag = th.city || (th.theatre_name.includes('Hyderabad') ? 'Hyderabad' : 'Kurnool');

    return `
      <div class="theatre-card" style="margin-bottom: 24px;">
        <div class="theatre-header">
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span class="badge ${isHyd ? 'badge-violet' : 'badge-gold'}">📍 ${cityTag}</span>
              <span class="badge badge-green">4K Projection</span>
            </div>
            <h3 class="theatre-name" style="font-size: 1.3rem;">
              <i class="fa-solid fa-building-columns"></i> ${th.theatre_name}
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 6px;">
              <i class="fa-solid fa-location-dot" style="color: var(--accent-red); margin-right: 6px;"></i>
              ${isHyd ? 'Hyderabad Premier Multiplex • Dolby Atmos 7.1 • Laser 4K • Recliner Seating' : 'Kurnool Prime Cinema Centre • Qube 4K Projection • RGB Laser Atmos'}
            </p>
          </div>
          <div>
            <span class="badge badge-violet">${th.active_shows_count || 'Active'} Shows</span>
          </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap;">
          <a href="movies.html" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-ticket"></i> View Movies at this Theatre
          </a>
        </div>
      </div>
    `;
  }).join('');
};

document.addEventListener('DOMContentLoaded', () => {
  initMovieDetails();
  initTheatresPage();
});
