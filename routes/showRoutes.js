const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/adminMiddleware');

// GET /api/shows/theatres/list - Distinct theatres and active shows count
router.get('/theatres/list', async (req, res) => {
  try {
    const { city } = req.query;
    let query = `
      SELECT theatre_name, city,
              COUNT(DISTINCT show_id) as active_shows_count,
              COUNT(DISTINCT movie_id) as movies_count
       FROM shows
       WHERE show_date >= CURRENT_DATE()
    `;
    const params = [];
    if (city && city !== 'All') {
      query += ' AND city = ?';
      params.push(city);
    }
    query += ' GROUP BY theatre_name, city ORDER BY city ASC, theatre_name ASC';

    const [theatres] = await db.query(query, params);

    // If no active shows, get all distinct theatre names in system
    if (theatres.length === 0) {
      const [allTheatres] = await db.query('SELECT DISTINCT theatre_name, city FROM shows ORDER BY city ASC, theatre_name ASC');
      return res.json({
        success: true,
        theatres: allTheatres.map(t => ({
          theatre_name: t.theatre_name,
          city: t.city || 'Hyderabad',
          active_shows_count: 0,
          movies_count: 0
        }))
      });
    }

    return res.json({
      success: true,
      theatres
    });
  } catch (error) {
    console.error('Theatres List Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch theatres' });
  }
});

// GET /api/shows - List shows with optional filters
router.get('/', async (req, res) => {
  try {
    const { movie_id, theatre_name, show_date, city } = req.query;

    let query = `
      SELECT s.show_id, s.movie_id, s.theatre_name, s.city, s.show_date, s.show_time, 
             s.ticket_price, s.screen_type, s.total_seats,
             m.title as movie_title, m.genre, m.language, m.duration, m.poster_url, m.trailer_url, m.rating,
             (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = s.show_id) as booked_seats
      FROM shows s
      JOIN movies m ON s.movie_id = m.movie_id
      WHERE 1=1
    `;
    const params = [];

    if (movie_id) {
      query += ' AND s.movie_id = ?';
      params.push(parseInt(movie_id, 10));
    }

    if (theatre_name && theatre_name.trim() !== '') {
      query += ' AND s.theatre_name = ?';
      params.push(theatre_name.trim());
    }

    if (city && city !== 'All' && city.trim() !== '') {
      query += ' AND s.city = ?';
      params.push(city.trim());
    }

    if (show_date && show_date.trim() !== '') {
      query += ' AND s.show_date = ?';
      params.push(show_date.trim());
    } else {
      query += ' AND s.show_date >= CURRENT_DATE()';
    }

    query += ' ORDER BY s.show_date ASC, s.show_time ASC';

    const [shows] = await db.query(query, params);

    return res.json({
      success: true,
      count: shows.length,
      shows
    });
  } catch (error) {
    console.error('Get Shows Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch shows' });
  }
});

// GET /api/shows/:id - Get single show details
router.get('/:id', async (req, res) => {
  try {
    const showId = parseInt(req.params.id, 10);
    if (isNaN(showId)) {
      return res.status(400).json({ success: false, message: 'Invalid show ID' });
    }

    const [shows] = await db.query(
      `SELECT s.*, m.title as movie_title, m.genre, m.language, m.duration, m.poster_url, m.rating, m.description
       FROM shows s
       JOIN movies m ON s.movie_id = m.movie_id
       WHERE s.show_id = ?`,
      [showId]
    );

    if (shows.length === 0) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    // Get list of booked seats
    const [bookedSeats] = await db.query(
      `SELECT seat_number, seat_type FROM booking_seats WHERE show_id = ?`,
      [showId]
    );

    return res.json({
      success: true,
      show: shows[0],
      bookedSeats: bookedSeats.map(b => b.seat_number)
    });
  } catch (error) {
    console.error('Get Show Detail Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load show details' });
  }
});

// GET /api/shows/:id/seats - Get occupied/booked seats specifically
router.get('/:id/seats', async (req, res) => {
  try {
    const showId = parseInt(req.params.id, 10);
    if (isNaN(showId)) {
      return res.status(400).json({ success: false, message: 'Invalid show ID' });
    }

    const [seats] = await db.query(
      'SELECT seat_number, seat_type FROM booking_seats WHERE show_id = ?',
      [showId]
    );

    return res.json({
      success: true,
      show_id: showId,
      bookedSeats: seats.map(s => s.seat_number)
    });
  } catch (error) {
    console.error('Get Booked Seats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve booked seats' });
  }
});

// POST /api/shows - Add new show (Admin Only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { movie_id, theatre_name, city, show_date, show_time, ticket_price, screen_type, total_seats } = req.body;

    if (!movie_id || !theatre_name || !show_date || !show_time || !ticket_price) {
      return res.status(400).json({
        success: false,
        message: 'Movie, theatre, date, time, and ticket price are required.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO shows (movie_id, theatre_name, city, show_date, show_time, ticket_price, screen_type, total_seats)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(movie_id, 10),
        theatre_name.trim(),
        city || (theatre_name.toLowerCase().includes('kurnool') ? 'Kurnool' : 'Hyderabad'),
        show_date,
        show_time,
        parseFloat(ticket_price),
        screen_type || 'IMAX 3D',
        parseInt(total_seats, 10) || 64
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Show scheduled successfully!',
      show_id: result.insertId
    });
  } catch (error) {
    console.error('Create Show Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add show: ' + error.message });
  }
});

// PUT /api/shows/:id - Update show (Admin Only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const showId = parseInt(req.params.id, 10);
    const { movie_id, theatre_name, show_date, show_time, ticket_price, screen_type, total_seats } = req.body;

    if (!movie_id || !theatre_name || !show_date || !show_time || !ticket_price) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    await db.query(
      `UPDATE shows SET 
        movie_id = ?,
        theatre_name = ?,
        show_date = ?,
        show_time = ?,
        ticket_price = ?,
        screen_type = ?,
        total_seats = ?
       WHERE show_id = ?`,
      [
        parseInt(movie_id, 10),
        theatre_name.trim(),
        show_date,
        show_time,
        parseFloat(ticket_price),
        screen_type || 'IMAX 3D',
        parseInt(total_seats, 10) || 64,
        showId
      ]
    );

    return res.json({
      success: true,
      message: 'Show updated successfully!'
    });
  } catch (error) {
    console.error('Update Show Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update show' });
  }
});

// DELETE /api/shows/:id - Delete show (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const showId = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM shows WHERE show_id = ?', [showId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    return res.json({
      success: true,
      message: 'Show deleted successfully!'
    });
  } catch (error) {
    console.error('Delete Show Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete show' });
  }
});

module.exports = router;
