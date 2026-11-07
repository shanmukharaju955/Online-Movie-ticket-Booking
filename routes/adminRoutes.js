const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All routes here require administrator privileges
router.use(requireAdmin);

// GET /api/admin/dashboard - Overview statistics
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Total counts
    const [[moviesCount]] = await db.query('SELECT COUNT(*) as total FROM movies');
    const [[usersCount]] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = "customer"');
    const [[showsCount]] = await db.query('SELECT COUNT(*) as total FROM shows');
    const [[bookingsCount]] = await db.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status = "Confirmed"');
    const [[revenueTotal]] = await db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE booking_status = "Confirmed"');

    // 2. Recent Bookings (latest 8)
    const [recentBookings] = await db.query(
      `SELECT b.booking_id, b.booking_reference, b.seats, b.total_amount, b.booking_status, b.created_at,
              u.name as customer_name, u.email as customer_email,
              m.title as movie_title,
              s.theatre_name, s.show_date, s.show_time
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN shows s ON b.show_id = s.show_id
       JOIN movies m ON s.movie_id = m.movie_id
       ORDER BY b.created_at DESC
       LIMIT 8`
    );

    // 3. Popular Movies (top 5 by bookings)
    const [popularMovies] = await db.query(
      `SELECT m.movie_id, m.title, m.poster_url, m.genre, m.rating,
              COUNT(b.booking_id) as total_bookings,
              COALESCE(SUM(b.seats), 0) as tickets_sold,
              COALESCE(SUM(b.total_amount), 0) as revenue
       FROM movies m
       LEFT JOIN shows s ON m.movie_id = s.movie_id
       LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status = "Confirmed"
       GROUP BY m.movie_id
       ORDER BY tickets_sold DESC, revenue DESC
       LIMIT 5`
    );

    // 4. Booking Status Distribution
    const [statusDistribution] = await db.query(
      `SELECT booking_status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM bookings
       GROUP BY booking_status`
    );

    return res.json({
      success: true,
      stats: {
        totalMovies: moviesCount.total,
        totalCustomers: usersCount.total,
        totalShows: showsCount.total,
        totalBookings: bookingsCount.total,
        totalRevenue: parseFloat(revenueTotal.total)
      },
      recentBookings,
      popularMovies,
      statusDistribution
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard statistics' });
  }
});

// GET /api/admin/bookings - List all bookings with search and filter
router.get('/bookings', async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT b.booking_id, b.booking_reference, b.seats, b.total_amount, b.booking_status, b.created_at,
             u.user_id, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             s.show_id, s.theatre_name, s.show_date, s.show_time, s.screen_type,
             m.title as movie_title, m.poster_url
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN shows s ON b.show_id = s.show_id
      JOIN movies m ON s.movie_id = m.movie_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND (b.booking_reference LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR m.title LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    if (status && status !== 'all') {
      query += ' AND b.booking_status = ?';
      params.push(status.trim());
    }

    query += ' ORDER BY b.created_at DESC';

    const [bookings] = await db.query(query, params);

    // Get seats for these bookings
    const bookingIds = bookings.map(b => b.booking_id);
    let seatsMap = {};

    if (bookingIds.length > 0) {
      const [allSeats] = await db.query(
        `SELECT booking_id, seat_number, seat_type, seat_price FROM booking_seats WHERE booking_id IN (?)`,
        [bookingIds]
      );
      allSeats.forEach(s => {
        if (!seatsMap[s.booking_id]) seatsMap[s.booking_id] = [];
        seatsMap[s.booking_id].push(s);
      });
    }

    const formatted = bookings.map(b => ({
      ...b,
      seat_numbers: (seatsMap[b.booking_id] || []).map(s => s.seat_number)
    }));

    return res.json({
      success: true,
      count: formatted.length,
      bookings: formatted
    });
  } catch (error) {
    console.error('Admin Bookings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /api/admin/customers - List registered customers and their history
router.get('/customers', async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT u.user_id, u.name, u.email, u.phone, u.role, u.created_at,
             COUNT(b.booking_id) as total_bookings,
             COALESCE(SUM(CASE WHEN b.booking_status = 'Confirmed' THEN b.total_amount ELSE 0 END), 0) as total_spent,
             MAX(b.created_at) as last_booking_date
      FROM users u
      LEFT JOIN bookings b ON u.user_id = b.user_id
      WHERE u.role = 'customer'
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' GROUP BY u.user_id ORDER BY u.created_at DESC';

    const [customers] = await db.query(query, params);

    return res.json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    console.error('Admin Customers Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

module.exports = router;
