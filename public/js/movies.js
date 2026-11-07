/**
 * CINEVERSE - Movies Catalog & Home Display (movies.js)
 */

let allMovies = [];
let currentFilter = {
  genre: 'All',
  language: 'All',
  search: '',
  sort: 'default'
};

// Debounce Helper
function debounce(func, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Hover Video Trailer Preview Timers
let hoverTrailerTimer = null;

window.startHoverTrailer = function(posterBox, trailerUrl) {
  if (!trailerUrl || trailerUrl === 'null' || trailerUrl === 'undefined') return;
  
  hoverTrailerTimer = setTimeout(() => {
    if (!posterBox.querySelector('.trailer-hover-preview')) {
      const card = posterBox.closest('.movie-card');
      if (card) card.classList.add('previewing');

      let embedUrl = trailerUrl;
      if (embedUrl.includes('youtube.com/watch?v=')) {
        const videoId = embedUrl.split('watch?v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('youtu.be/')) {
        const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      // Autoplay muted in background
      embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&mute=1&controls=0&loop=1&rel=0&modestbranding=1';

      const iframe = document.createElement('iframe');
      iframe.className = 'trailer-hover-preview';
      iframe.src = embedUrl;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      posterBox.appendChild(iframe);
    }
  }, 400);
};

window.stopHoverTrailer = function(posterBox) {
  if (hoverTrailerTimer) {
    clearTimeout(hoverTrailerTimer);
    hoverTrailerTimer = null;
  }
  const iframe = posterBox.querySelector('.trailer-hover-preview');
  if (iframe) {
    iframe.remove();
  }
  const card = posterBox.closest('.movie-card');
  if (card) card.classList.remove('previewing');
};

// Render Movie Card HTML Component (Compact, Sleek with Cursor Hover Video Preview)
function createMovieCard(movie) {
  const isComingSoon = movie.status === 'coming_soon';
  const badgeClass = isComingSoon ? 'badge-gold' : (movie.status === 'trending' ? 'badge-red' : 'badge-violet');
  const badgeText = isComingSoon ? 'COMING SOON' : (movie.status === 'trending' ? 'TRENDING' : 'NOW SHOWING');
  const safeTitle = (movie.title || '').replace(/'/g, "\\'");
  const trailerUrl = movie.trailer_url || '';

  return `
    <div class="movie-card" data-movie-id="${movie.movie_id}">
      <div class="movie-poster-box" onmouseenter="startHoverTrailer(this, '${trailerUrl}')" onmouseleave="stopHoverTrailer(this)">
        <img src="${movie.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80'}" 
             alt="${movie.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'">
        
        <div class="movie-rating-badge">
          <i class="fa-solid fa-star"></i> ${parseFloat(movie.rating).toFixed(1)}
        </div>
        
        <div class="movie-status-badge">
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>

        ${trailerUrl ? `
          <div class="hover-trailer-badge" onclick="event.preventDefault(); event.stopPropagation(); openTrailerModal('${trailerUrl}', '${safeTitle}', ${movie.movie_id})" title="Click to watch full trailer">
            <i class="fa-solid fa-play"></i> Trailer
          </div>
        ` : ''}

        <div class="movie-overlay-actions">
          ${trailerUrl ? `
            <button class="btn btn-cinema btn-sm" style="width:100%;" onclick="event.preventDefault(); openTrailerModal('${trailerUrl}', '${safeTitle}', ${movie.movie_id})">
              <i class="fa-solid fa-circle-play"></i> Watch Trailer
            </button>
          ` : ''}
          <div style="display:flex; gap:8px; width:100%;">
            <a href="movie-details.html?id=${movie.movie_id}" class="btn btn-secondary btn-sm" style="flex:1;">
              <i class="fa-solid fa-circle-info"></i> Info
            </a>
            ${!isComingSoon ? `
              <a href="movie-details.html?id=${movie.movie_id}#shows" class="btn btn-primary btn-sm" style="flex:1;">
                <i class="fa-solid fa-ticket"></i> Book
              </a>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="movie-info">
        <div class="movie-meta-tags">
          <span>${movie.genre}</span>
          <span>•</span>
          <span>${movie.duration}m</span>
        </div>
        <h3 class="movie-card-title" title="${movie.title}">${movie.title}</h3>
        <div class="movie-card-footer">
          <span class="movie-language"><i class="fa-solid fa-globe" style="font-size:0.75rem; margin-right:4px;"></i>${movie.language}</span>
          <a href="movie-details.html?id=${movie.movie_id}" class="btn btn-outline btn-sm" style="padding:3px 8px; font-size:0.75rem;">
            Explore
          </a>
        </div>
      </div>
    </div>
  `;
}

// Skeleton Cards
function renderSkeletons(container, count = 8) {
  let skeletonsHTML = '';
  for (let i = 0; i < count; i++) {
    skeletonsHTML += `
      <div class="movie-card">
        <div class="movie-poster-box skeleton" style="aspect-ratio:2/3;"></div>
        <div class="movie-info">
          <div class="skeleton" style="height:14px; width:40%; margin-bottom:10px;"></div>
          <div class="skeleton" style="height:20px; width:80%; margin-bottom:14px;"></div>
          <div class="skeleton" style="height:14px; width:30%;"></div>
        </div>
      </div>
    `;
  }
  container.innerHTML = skeletonsHTML;
}

// ========================================================
// Movies Catalog Page Logic (movies.html)
// ========================================================
async function initMoviesCatalog() {
  const gridContainer = document.getElementById('catalog-movies-grid');
  const searchInput = document.getElementById('movie-search-input');
  const genreContainer = document.getElementById('genre-pills-container');
  const languageSelect = document.getElementById('language-filter');
  const sortSelect = document.getElementById('sort-filter');
  const countDisplay = document.getElementById('movies-count-display');

  if (!gridContainer) return;

  renderSkeletons(gridContainer, 8);

  // Fetch Filter Metadata
  try {
    const metaRes = await fetch('/api/movies/filters/metadata');
    const metaData = await metaRes.json();
    if (metaData.success) {
      if (genreContainer) {
        metaData.genres.forEach(genre => {
          const pill = document.createElement('button');
          pill.className = 'genre-pill';
          pill.dataset.genre = genre;
          pill.textContent = genre;
          pill.onclick = () => {
            document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter.genre = genre;
            fetchAndRenderCatalog();
          };
          genreContainer.appendChild(pill);
        });
      }

      if (languageSelect) {
        metaData.languages.forEach(lang => {
          const opt = document.createElement('option');
          opt.value = lang;
          opt.textContent = lang;
          languageSelect.appendChild(opt);
        });
      }
    }
  } catch (err) {
    console.warn('Metadata fetch failed:', err);
  }

  // Parse URL query params if any (e.g. ?search=dune or ?genre=Sci-Fi)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('search')) {
    currentFilter.search = urlParams.get('search');
    if (searchInput) searchInput.value = currentFilter.search;
  }
  if (urlParams.get('genre')) {
    currentFilter.genre = urlParams.get('genre');
  }

  // Search Suggestions Dropdown setup
  let suggestionsBox = document.getElementById('search-suggestions-box');
  if (!suggestionsBox && searchInput && searchInput.parentElement) {
    suggestionsBox = document.createElement('div');
    suggestionsBox.id = 'search-suggestions-box';
    suggestionsBox.className = 'search-suggestions-dropdown';
    searchInput.parentElement.appendChild(suggestionsBox);
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
      const term = e.target.value.trim();
      currentFilter.search = term;
      fetchAndRenderCatalog();

      // Show live suggestions
      if (term.length >= 2 && suggestionsBox) {
        try {
          const res = await fetch(`/api/movies?search=${encodeURIComponent(term)}&limit=5`);
          const data = await res.json();
          if (data.success && data.movies.length > 0) {
            suggestionsBox.innerHTML = data.movies.map(m => `
              <div class="suggestion-item" onclick="window.location.href='movie-details.html?id=${m.movie_id}'">
                <img src="${m.poster_url}" alt="${m.title}" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=100&q=80'">
                <div class="suggestion-info">
                  <h4>${m.title}</h4>
                  <p>${m.genre} • ${m.language} • ⭐ ${parseFloat(m.rating).toFixed(1)}</p>
                </div>
              </div>
            `).join('');
            suggestionsBox.classList.add('active');
          } else {
            suggestionsBox.classList.remove('active');
          }
        } catch (err) {
          suggestionsBox.classList.remove('active');
        }
      } else if (suggestionsBox) {
        suggestionsBox.classList.remove('active');
      }
    }, 300));

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.remove('active');
      }
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      currentFilter.language = e.target.value;
      fetchAndRenderCatalog();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilter.sort = e.target.value;
      fetchAndRenderCatalog();
    });
  }

  // Initial Fetch
  fetchAndRenderCatalog();

  async function fetchAndRenderCatalog() {
    renderSkeletons(gridContainer, 8);
    const params = new URLSearchParams();
    if (currentFilter.search) params.append('search', currentFilter.search);
    if (currentFilter.genre && currentFilter.genre !== 'All') params.append('genre', currentFilter.genre);
    if (currentFilter.language && currentFilter.language !== 'All') params.append('language', currentFilter.language);
    if (currentFilter.sort) params.append('sort', currentFilter.sort);

    try {
      const res = await fetch(`/api/movies?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.movies.length > 0) {
        gridContainer.innerHTML = data.movies.map(createMovieCard).join('');
        if (countDisplay) countDisplay.textContent = `Showing ${data.movies.length} Movies`;
      } else {
        gridContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fa-solid fa-film" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
            <h3 style="margin-bottom: 8px;">No Movies Found</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">No movies matched your search or filter criteria. Try resetting the filters.</p>
            <button class="btn btn-secondary" onclick="resetFilters()">Reset All Filters</button>
          </div>
        `;
        if (countDisplay) countDisplay.textContent = '0 Movies Found';
      }
    } catch (err) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--accent-red);">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
          <p>Failed to connect to the database. Please ensure the backend server and MySQL are running.</p>
        </div>
      `;
    }
  }
}

window.resetFilters = function() {
  currentFilter = { genre: 'All', language: 'All', search: '', sort: 'default' };
  const searchInput = document.getElementById('movie-search-input');
  const languageSelect = document.getElementById('language-filter');
  const sortSelect = document.getElementById('sort-filter');
  if (searchInput) searchInput.value = '';
  if (languageSelect) languageSelect.value = 'All';
  if (sortSelect) sortSelect.value = 'default';
  document.querySelectorAll('.genre-pill').forEach(p => {
    if (p.dataset.genre === 'All') p.classList.add('active');
    else p.classList.remove('active');
  });
  const gridContainer = document.getElementById('catalog-movies-grid');
  if (gridContainer) {
    const event = new Event('input');
    if (searchInput) searchInput.dispatchEvent(event);
  }
};

// ========================================================
// Home Page Showcase Sections (index.html)
// ========================================================
async function initHomePage() {
  const featuredHero = document.getElementById('home-featured-hero');
  const trendingContainer = document.getElementById('home-trending-grid');
  const nowShowingContainer = document.getElementById('home-nowshowing-grid');
  const comingSoonContainer = document.getElementById('home-comingsoon-grid');

  if (!trendingContainer && !nowShowingContainer) return;

  if (trendingContainer) renderSkeletons(trendingContainer, 4);
  if (nowShowingContainer) renderSkeletons(nowShowingContainer, 4);
  if (comingSoonContainer) renderSkeletons(comingSoonContainer, 4);

  try {
    const res = await fetch('/api/movies');
    const data = await res.json();

    if (data.success && data.movies.length > 0) {
      allMovies = data.movies;

      // 1. Featured Hero Banner
      const featured = allMovies.find(m => m.status === 'trending') || allMovies[0];
      if (featured && featuredHero) {
        document.getElementById('hero-backdrop-img').style.backgroundImage = `url('${featured.banner_url || featured.poster_url}')`;
        document.getElementById('hero-title-text').textContent = featured.title;
        document.getElementById('hero-genre-text').textContent = featured.genre;
        document.getElementById('hero-duration-text').textContent = `${featured.duration} mins`;
        document.getElementById('hero-rating-text').textContent = parseFloat(featured.rating).toFixed(1);
        document.getElementById('hero-language-text').textContent = featured.language;
        document.getElementById('hero-synopsis-text').textContent = featured.description;
        document.getElementById('hero-poster-img').src = featured.poster_url;
        document.getElementById('hero-book-btn').href = `movie-details.html?id=${featured.movie_id}#shows`;
        document.getElementById('hero-details-btn').href = `movie-details.html?id=${featured.movie_id}`;
      }

      // 2. Trending Movies
      const trending = allMovies.filter(m => m.status === 'trending').slice(0, 4);
      if (trendingContainer) {
        trendingContainer.innerHTML = (trending.length > 0 ? trending : allMovies.slice(0, 4)).map(createMovieCard).join('');
      }

      // 3. Now Showing
      const nowShowing = allMovies.filter(m => m.status === 'now_showing').slice(0, 8);
      if (nowShowingContainer) {
        nowShowingContainer.innerHTML = nowShowing.map(createMovieCard).join('');
      }

      // 4. Coming Soon
      const comingSoon = allMovies.filter(m => m.status === 'coming_soon').slice(0, 4);
      if (comingSoonContainer) {
        comingSoonContainer.innerHTML = (comingSoon.length > 0 ? comingSoon : allMovies.slice(4, 8)).map(createMovieCard).join('');
      }
    }
  } catch (err) {
    console.error('Home Page Movies Load Error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMoviesCatalog();
  initHomePage();
});
