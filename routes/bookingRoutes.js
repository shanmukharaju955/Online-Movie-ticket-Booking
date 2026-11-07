const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

// Generate unique booking reference: e.g. CV-82914-7291
function generateBookingReference() {
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CV-${timestamp}-${random}`;
}

// POST /api/bookings - Book seats with MySQL transaction to prevent race conditions & double-booking
router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.user.user_id;
  const { show_id, seat_numbers } = req.body;

  if (!show_id || !Array.isArray(seat_numbers) || seat_numbers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Show ID and at least one seat selection are required.'
    });
  }

  // Sanitize seat numbers (uppercase, trim)
  const cleanSeats = [...new Set(seat_numbers.map(s => String(s).trim().toUpperCase()))];
  if (cleanSeats.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid seat selection.' });
  }

  let connection;
  try {
    connection = await db.pool.getConnection();
    // START TRANSACTION
    await connection.beginTransaction();

    // 1. Fetch show and lock show details
    const [shows] = await connection.query(
      `SELECT s.*, m.title as movie_title, m.poster_url 
       FROM shows s 
       JOIN movies m ON s.movie_id = m.movie_id 
       WHERE s.show_id = ? FOR UPDATE`,
      [parseInt(show_id, 10)]
    );

    if (shows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Show not found or no longer active.' });
    }

    const show = shows[0];
    const basePrice = parseFloat(show.ticket_price);

    // 2. Validate seat availability with row locking FOR UPDATE
    const [existingSeats] = await connection.query(
      `SELECT seat_number FROM booking_seats 
       WHERE show_id = ? AND seat_number IN (?) FOR UPDATE`,
      [show.show_id, cleanSeats]
    );

    if (existingSeats.length > 0) {
      await connection.rollback();
      connection.release();
      const taken = existingSeats.map(s => s.seat_number).join(', ');
      return res.status(409).json({
        success: false,
        message: `Seat conflict: Seat(s) ${taken} are already booked. Please choose other seats.`
      });
    }

    // 3. Calculate seat types and total price
    // Premium Rows: Row A & B are VIP (+20%)
    let calculatedTotal = 0;
    const seatAllocations = cleanSeats.map(seat => {
      const rowLetter = seat.charAt(0);
      const isVIP = (rowLetter === 'A' || rowLetter === 'B');
      const seatType = isVIP ? 'VIP' : 'Standard';
      const seatPrice = isVIP ? Math.round((basePrice * 1.25) * 100) / 100 : basePrice;
      calculatedTotal += seatPrice;
      return { seat_number: seat, seat_type: seatType, seat_price: seatPrice };
    });

    // 4. Generate unique booking reference
    const bookingRef = generateBookingReference();

    // 5. Insert main booking record
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings (user_id, show_id, seats, total_amount, booking_status, booking_reference) 
       VALUES (?, ?, ?, ?, 'Confirmed', ?)`,
      [userId, show.show_id, cleanSeats.length, calculatedTotal, bookingRef]
    );

    const bookingId = bookingResult.insertId;

    // 6. Insert individual booked seats
    for (const alloc of seatAllocations) {
      await connection.query(
        `INSERT INTO booking_seats (booking_id, show_id, seat_number, seat_type, seat_price) 
         VALUES (?, ?, ?, ?, ?)`,
        [bookingId, show.show_id, alloc.seat_number, alloc.seat_type, alloc.seat_price]
      );
    }

    // COMMIT TRANSACTION
    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Booking successfully confirmed!',
      booking: {
        booking_id: bookingId,
        booking_reference: bookingRef,
        movie_title: show.movie_title,
        theatre_name: show.theatre_name,
        show_date: show.show_date,
        show_time: show.show_time,
        screen_type: show.screen_type,
        seats: cleanSeats,
        seat_count: cleanSeats.length,
        total_amount: calculatedTotal,
        customer_name: req.session.user.name,
        customer_email: req.session.user.email
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Booking Transaction Error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A seat you selected was just booked by another user. Please re-select your seats.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Database error while processing booking: ' + error.message
    });
  }
});

// GET /api/bookings/my-bookings - Get authenticated customer's booking history
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;

    const [bookings] = await db.query(
      `SELECT b.booking_id, b.booking_reference, b.seats, b.total_amount, b.booking_status, b.created_at,
              s.show_id, s.theatre_name, s.show_date, s.show_time, s.screen_type, s.ticket_price,
              m.movie_id, m.title as movie_title, m.poster_url, m.duration, m.language, m.genre
       FROM bookings b
       JOIN shows s ON b.show_id = s.show_id
       JOIN movies m ON s.movie_id = m.movie_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    // Fetch seats for each booking
    const bookingIds = bookings.map(b => b.booking_id);
    let seatsMap = {};

    if (bookingIds.length > 0) {
      const [allSeats] = await db.query(
        `SELECT booking_id, seat_number, seat_type, seat_price 
         FROM booking_seats 
         WHERE booking_id IN (?) 
         ORDER BY seat_number ASC`,
        [bookingIds]
      );

      allSeats.forEach(s => {
        if (!seatsMap[s.booking_id]) {
          seatsMap[s.booking_id] = [];
        }
        seatsMap[s.booking_id].push(s);
      });
    }

    const formattedBookings = bookings.map(b => ({
      ...b,
      seat_details: seatsMap[b.booking_id] || [],
      seat_numbers: (seatsMap[b.booking_id] || []).map(s => s.seat_number)
    }));

    return res.json({
      success: true,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('My Bookings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking history' });
  }
});

// GET /api/bookings/:id - Single booking confirmation details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.session.user.user_id;
    const isAdmin = req.session.user.role === 'admin';

    // Allow lookup by numeric ID or booking reference
    let query = `
      SELECT b.booking_id, b.user_id, b.booking_reference, b.seats, b.total_amount, b.booking_status, b.created_at,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             s.show_id, s.theatre_name, s.show_date, s.show_time, s.screen_type, s.ticket_price,
             m.movie_id, m.title as movie_title, m.poster_url, m.duration, m.language, m.genre
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN shows s ON b.show_id = s.show_id
      JOIN movies m ON s.movie_id = m.movie_id
      WHERE (b.booking_id = ? OR b.booking_reference = ?)
    `;
    const params = [bookingId, bookingId];

    // Restrict customers to only their own bookings
    if (!isAdmin) {
      query += ' AND b.user_id = ?';
      params.push(userId);
    }

    const [bookings] = await db.query(query, params);

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or access denied.' });
    }

    const booking = bookings[0];

    // Fetch seats
    const [seats] = await db.query(
      `SELECT seat_number, seat_type, seat_price FROM booking_seats WHERE booking_id = ?`,
      [booking.booking_id]
    );

    booking.seats_list = seats;
    booking.seat_numbers = seats.map(s => s.seat_number);

    return res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load booking details' });
  }
});

// PUT /api/bookings/:id/cancel - Cancel booking
router.put('/:id/cancel', requireAuth, async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.session.user.user_id;
  const isAdmin = req.session.user.role === 'admin';

  let connection;
  try {
    connection = await db.pool.getConnection();
    await connection.beginTransaction();

    let checkQuery = `
      SELECT b.*, s.show_date, s.show_time 
      FROM bookings b 
      JOIN shows s ON b.show_id = s.show_id 
      WHERE b.booking_id = ? FOR UPDATE
    `;
    const checkParams = [bookingId];

    if (!isAdmin) {
      checkQuery += ' AND b.user_id = ?';
      checkParams.push(userId);
    }

    const [bookings] = await connection.query(checkQuery, checkParams);

    if (bookings.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Booking not found or cannot be cancelled.' });
    }

    const booking = bookings[0];

    if (booking.booking_status === 'Cancelled') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'This booking has already been cancelled.' });
    }

    // Check cancellation eligibility (show must not be in past)
    const showDateTime = new Date(`${booking.show_date}T${booking.show_time}`);
    if (showDateTime < new Date() && !isAdmin) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Past shows cannot be cancelled.'
      });
    }

    // 1. Delete seat reservations so seats become available immediately for others
    await connection.query('DELETE FROM booking_seats WHERE booking_id = ?', [booking.booking_id]);

    // 2. Mark booking status as Cancelled
    await connection.query(
      'UPDATE bookings SET booking_status = "Cancelled" WHERE booking_id = ?',
      [booking.booking_id]
    );

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: 'Booking successfully cancelled. The seats have been released.'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Cancel Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

module.exports = router;
