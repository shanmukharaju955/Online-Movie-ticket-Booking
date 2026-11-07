const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Setup multer storage for movie poster uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'poster-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|avif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed!'));
  }
});

// GET /api/movies/filters/metadata - genres, languages, theatres
router.get('/filters/metadata', async (req, res) => {
  try {
    const [genres] = await db.query('SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL ORDER BY genre ASC');
    const [languages] = await db.query('SELECT DISTINCT language FROM movies WHERE language IS NOT NULL ORDER BY language ASC');
    return res.json({
      success: true,
      genres: genres.map(g => g.genre),
      languages: languages.map(l => l.language)
    });
  } catch (error) {
    console.error('Metadata Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch filter metadata' });
  }
});

// GET /api/movies - List movies with search, filters, and sorting
router.get('/', async (req, res) => {
  try {
    const { search, genre, language, status, sort, limit } = req.query;

    let query = 'SELECT * FROM movies WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND (title LIKE ? OR description LIKE ? OR genre LIKE ? OR director LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (genre && genre !== 'All' && genre.trim() !== '') {
      query += ' AND genre = ?';
      params.push(genre.trim());
    }

    if (language && language !== 'All' && language.trim() !== '') {
      query += ' AND language = ?';
      params.push(language.trim());
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status.trim());
    }

    // Sorting
    switch (sort) {
      case 'rating_desc':
        query += ' ORDER BY rating DESC, release_date DESC';
        break;
      case 'release_desc':
        query += ' ORDER BY release_date DESC';
        break;
      case 'release_asc':
        query += ' ORDER BY release_date ASC';
        break;
      case 'title_asc':
        query += ' ORDER BY title ASC';
        break;
      case 'title_desc':
        query += ' ORDER BY title DESC';
        break;
      default:
        query += ' ORDER BY (CASE WHEN status = "trending" THEN 1 WHEN status = "now_showing" THEN 2 ELSE 3 END), rating DESC, release_date DESC';
    }

    if (limit && !isNaN(parseInt(limit, 10))) {
      query += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const [movies] = await db.query(query, params);

    return res.json({
      success: true,
      count: movies.length,
      movies
    });
  } catch (error) {
    console.error('Get Movies Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch movies from database' });
  }
});

// GET /api/movies/:id - Get movie details with available shows & theatres
router.get('/:id', async (req, res) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const [movies] = await db.query('SELECT * FROM movies WHERE movie_id = ?', [movieId]);
    if (movies.length === 0) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const movie = movies[0];

    // Fetch active shows for this movie (today and upcoming)
    const [shows] = await db.query(
      `SELECT s.show_id, s.movie_id, s.theatre_name, s.city, s.show_date, s.show_time, 
              s.ticket_price, s.screen_type, s.total_seats,
              (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = s.show_id) as booked_seats_count
       FROM shows s
       WHERE s.movie_id = ? AND s.show_date >= CURRENT_DATE()
       ORDER BY s.city ASC, s.show_date ASC, s.show_time ASC`,
      [movieId]
    );

    // Group shows by theatre and date
    const theatresMap = {};
    shows.forEach(show => {
      if (!theatresMap[show.theatre_name]) {
        theatresMap[show.theatre_name] = {
          theatre_name: show.theatre_name,
          city: show.city || 'Hyderabad',
          dates: {}
        };
      }
      const dateStr = typeof show.show_date === 'string' ? show.show_date : show.show_date.toISOString().split('T')[0];
      if (!theatresMap[show.theatre_name].dates[dateStr]) {
        theatresMap[show.theatre_name].dates[dateStr] = [];
      }
      theatresMap[show.theatre_name].dates[dateStr].push(show);
    });

    return res.json({
      success: true,
      movie,
      shows,
      theatresGrouped: Object.values(theatresMap)
    });
  } catch (error) {
    console.error('Get Movie Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch movie details' });
  }
});

// Helper to normalize YouTube URLs to embed URLs for safe iframe/hover playback
function normalizeTrailerUrl(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();
  if (url.includes('/embed/')) return url;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

// POST /api/movies - Create new movie (Admin Only)
router.post('/', requireAdmin, upload.single('poster_file'), async (req, res) => {
  try {
    const {
      title,
      genre,
      language,
      duration,
      release_date,
      description,
      poster_url,
      banner_url,
      trailer_url,
      rating,
      status,
      director,
      cast
    } = req.body;

    if (!title || !genre || !language || !duration || !release_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, genre, language, duration, and release date are required fields.'
      });
    }

    let finalPosterUrl = poster_url || '';
    if (req.file) {
      finalPosterUrl = '/uploads/' + req.file.filename;
    }

    if (!finalPosterUrl) {
      finalPosterUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
    }

    const cleanTrailerUrl = normalizeTrailerUrl(trailer_url);

    const [result] = await db.query(
      `INSERT INTO movies 
        (title, genre, language, duration, release_date, description, poster_url, banner_url, trailer_url, rating, status, director, cast)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        genre.trim(),
        language.trim(),
        parseInt(duration, 10),
        release_date,
        description || '',
        finalPosterUrl,
        banner_url || finalPosterUrl,
        cleanTrailerUrl || '',
        parseFloat(rating) || 8.0,
        status || 'now_showing',
        director || '',
        cast || ''
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Movie successfully added!',
      movie_id: result.insertId
    });
  } catch (error) {
    console.error('Create Movie Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create movie: ' + error.message });
  }
});

// PUT /api/movies/:id - Update movie (Admin Only)
router.put('/:id', requireAdmin, upload.single('poster_file'), async (req, res) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    const {
      title,
      genre,
      language,
      duration,
      release_date,
      description,
      poster_url,
      banner_url,
      trailer_url,
      rating,
      status,
      director,
      cast
    } = req.body;

    if (!title || !genre || !language || !duration || !release_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, genre, language, duration, and release date are required.'
      });
    }

    let updatePoster = poster_url;
    if (req.file) {
      updatePoster = '/uploads/' + req.file.filename;
    }

    const cleanTrailerUrl = trailer_url !== undefined ? normalizeTrailerUrl(trailer_url) : null;

    await db.query(
      `UPDATE movies SET 
        title = ?,
        genre = ?,
        language = ?,
        duration = ?,
        release_date = ?,
        description = ?,
        poster_url = COALESCE(?, poster_url),
        banner_url = COALESCE(?, banner_url),
        trailer_url = COALESCE(?, trailer_url),
        rating = ?,
        status = ?,
        director = ?,
        cast = ?
       WHERE movie_id = ?`,
      [
        title.trim(),
        genre.trim(),
        language.trim(),
        parseInt(duration, 10),
        release_date,
        description || '',
        updatePoster || null,
        banner_url || null,
        cleanTrailerUrl,
        parseFloat(rating) || 8.0,
        status || 'now_showing',
        director || '',
        cast || '',
        movieId
      ]
    );

    return res.json({
      success: true,
      message: 'Movie updated successfully!'
    });
  } catch (error) {
    console.error('Update Movie Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update movie' });
  }
});

// DELETE /api/movies/:id - Delete movie (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM movies WHERE movie_id = ?', [movieId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    return res.json({
      success: true,
      message: 'Movie deleted successfully!'
    });
  } catch (error) {
    console.error('Delete Movie Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete movie' });
  }
});

module.exports = router;
