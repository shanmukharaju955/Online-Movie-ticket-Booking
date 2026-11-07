# 🎬 SHANMUKHA CINEVERSE – Premium Online Movie Ticket Booking Platform

> *"Every Seat. Every Story. Every Experience."*
> **Created & Developed by:** Shanmukha Raju

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#)

**SHANMUKHA CINEVERSE** is a modern, real-time, production-minded Online Movie Ticket Booking full-stack web application. It connects cinema enthusiasts to world-class theatres across **Hyderabad** and **Kurnool** with an interactive cinema seat layout, hover video trailers, concurrency-safe ticket reservations powered by MySQL transactions, digital ticket QR generation, customer booking history, and a separate administrative command center.

---

## 🌟 Key Features

### 1. Customer Experience
- **Cinematic Dark Theme**: Deep black (`#090B10`), dark navy (`#111827`), electric violet (`#8B5CF6`), cinema red (`#F43F5E`), and gold accents (`#FBBF24`).
- **Dynamic Catalog from MySQL**: Browse 12+ pre-seeded movies with high-resolution posters, ratings, trailers, genres, and languages.
- **Cursor Hover Video Trailer Preview**: Hovering over any movie card smoothly previews the official movie trailer right inside the card. Clicking the "Trailer" button opens a full-screen HD video modal.
- **Sleek Compact Card Design**: Modern compact cards (`minmax(215px, 1fr)`) that fit 4 to 6 movies per screen row with smooth hover animations.
- **Hyderabad & Kurnool Theatres**: Browse authentic partner theatres across Hyderabad (Prasads Multiplex, AMB Cinemas, AAA Cinemas, PVR INOX Forum Mall) and Kurnool (SVR Cinemas 4K Laser, Anand Complex, Venkatesh Picture Palace, INOX SVN Mall) with instant city switching.
- **Instant Search & Multi-Filter**: Filter dynamically by genre pills (Action, Sci-Fi, Drama, Animation), language dropdown, and sorting (highest rated, release date, title).
- **Showtimes & Theatres**: Select show dates, explore partner theatres, and view screen formats (IMAX Laser 3D, Dolby Atmos 4K, 4DX Motion).
- **Interactive Cinema Seat Selector**:
  - Realistic curved cinema screen with ambient violet glow.
  - Rows A through H with middle aisle navigation.
  - Multi-seat selection with automatic total price calculation.
  - Color-coded statuses: **Green** (Available), **Gold** (VIP Rows A & B with 25% premium), **Violet** (Selected), **Dark Grey** (Booked & Disabled).
  - **Zero Double-Booking Guarantee**: Server-side row locking (`FOR UPDATE`) and MySQL transactions prevent concurrent booking conflicts.
- **Digital Movie Tickets**:
  - Perforated ticket design with unique Booking Reference (e.g., `CV-82194-4912`).
  - Scannable dynamic QR code for kiosk admission.
  - 1-Click Print & PDF export with clean `@media print` layout.
- **Customer Self-Service ("My Bookings")**:
  - View upcoming and past booking history.
  - Instant ticket cancellation (releases seats back to the theatre inventory in real-time).
- **Authentication**:
  - Secure bcrypt password hashing (10 salt rounds).
  - Server-side sessions with `express-session`.
  - 1-Click Demo Credential fill on the login screen.

### 2. Administrator Command Center (`/admin.html`)
- **Dashboard Overview**:
  - Key metrics: Total Movies, Total Customers, Total Shows, Total Bookings, and Gross Revenue.
  - Recent Bookings feed with real-time customer data.
  - Box Office Leaderboard (top ticket sales and revenue per movie).
- **Movie Catalog Management**:
  - Add new movies with poster image upload or image URL.
  - Edit existing movie descriptions, durations, ratings, and release statuses.
  - Delete movies (with cascade confirmation).
- **Show Scheduling**:
  - Schedule new screenings by selecting movie, theatre name, screen type, date, time, and ticket price.
- **Booking Management**:
  - Search all bookings by reference ID, customer name, or movie.
  - Filter bookings by status (`Confirmed`, `Cancelled`).
  - Administrative cancellation with instant seat inventory release.
- **Customer Management**:
  - View registered customers, booking frequencies, and lifetime spending.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Glassmorphism, CSS Variables, Flexbox & Grid), Vanilla JavaScript (ES6+ async/await, Fetch API)
- **Backend**: Node.js & Express.js
- **Database**: MySQL 8.0 / MariaDB
- **DB Driver**: `mysql2/promise` (connection pooling & parameterized queries)
- **Authentication**: `express-session` & `bcryptjs`
- **File Uploads**: `multer`
- **Icons**: Font Awesome 6.5.1

```
OnlineMovieTicketBookingSystem/
├── config/
│   └── db.js                  # MySQL2 connection pool & health diagnostics
├── database/
│   ├── cineverse_db.sql       # Complete SQL schema, indexes, and seed dataset
│   └── init-db.js             # Automated database creation and seeding script
├── middleware/
│   ├── authMiddleware.js      # Session-based customer route protection
│   └── adminMiddleware.js     # Role-based admin access control
├── public/
│   ├── css/
│   │   ├── style.css          # Core design system, glassmorphism, buttons, cards, tickets
│   │   ├── responsive.css     # Mobile & tablet layout breakpoints
│   │   └── admin.css          # Admin sidebar, metric cards, data tables
│   ├── js/
│   │   ├── main.js            # Navbar auth state, toasts, confirmation modals
│   │   ├── movies.js          # Live search, genre filtering, catalog display
│   │   ├── shows.js           # Movie details showtimes, date selector
│   │   ├── seats.js           # Interactive cinema seat grid & transaction booking
│   │   ├── bookings.js        # Digital ticket generation, QR code, my-bookings
│   │   ├── auth.js            # Login & registration validation, demo 1-click fill
│   │   └── admin.js           # Admin dashboard metrics, movie/show/booking CRUD
│   ├── images/                # Asset storage
│   ├── uploads/               # Admin movie poster uploads
│   ├── index.html             # Landing Home Page
│   ├── movies.html            # Dynamic Movies Catalog
│   ├── movie-details.html     # Movie Synopsis & Showtime Picker
│   ├── theatres.html          # Partner Cinema Locations
│   ├── seat-selection.html    # Interactive Cinema Seat Hall
│   ├── booking-confirmation.html # Digital Movie Ticket with QR Code
│   ├── my-bookings.html       # Customer Bookings & Cancellation
│   ├── login.html             # Customer / Admin Login
│   ├── register.html          # Customer Registration
│   ├── admin.html             # Admin Command Center
│   └── 404.html               # Cinematic 404 Intermission Page
├── routes/
│   ├── authRoutes.js          # /api/auth (register, login, logout, profile)
│   ├── movieRoutes.js         # /api/movies (CRUD, filters, metadata)
│   ├── showRoutes.js          # /api/shows (CRUD, show details, booked seats)
│   ├── bookingRoutes.js       # /api/bookings (transactions, user history, cancel)
│   └── adminRoutes.js         # /api/admin (stats, booking management, users)
├── server.js                  # Express application entry point
├── package.json               # Dependencies and scripts
├── .env.example               # Environment variable blueprint
├── .env                       # Local environment variables
└── README.md                  # Comprehensive Documentation
```

---

## 🗄️ Database Design (`cineverse_db`)

The database consists of 5 normalized relational tables with foreign keys and unique constraints:

### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Account login email |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `role` | VARCHAR(20) | DEFAULT 'customer' | Role: `'customer'` or `'admin'` |
| `phone` | VARCHAR(20) | NULL | Optional phone number |
| `created_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### 2. `movies`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `movie_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique movie identifier |
| `title` | VARCHAR(150) | NOT NULL | Movie title |
| `genre` | VARCHAR(50) | NOT NULL | Primary genre (Action, Sci-Fi, etc.) |
| `language` | VARCHAR(100) | NOT NULL | Spoken language |
| `duration` | INT | NOT NULL | Run time in minutes |
| `release_date` | DATE | NOT NULL | Theatrical release date |
| `description` | TEXT | NULL | Synopsis / overview |
| `poster_url` | VARCHAR(500) | NULL | Movie poster image link |
| `banner_url` | VARCHAR(500) | NULL | High-res background backdrop link |
| `rating` | DECIMAL(3,1) | DEFAULT 8.5 | IMDb / user rating (1.0 - 10.0) |
| `status` | VARCHAR(30) | DEFAULT 'now_showing' | `'now_showing'`, `'trending'`, `'coming_soon'` |
| `director` | VARCHAR(100) | NULL | Director name |
| `cast` | VARCHAR(255) | NULL | Lead actors |

### 3. `shows`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `show_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique show identifier |
| `movie_id` | INT | FK -> `movies(movie_id)` | Referenced movie |
| `theatre_name`| VARCHAR(100) | NOT NULL | Theatre name |
| `show_date` | DATE | NOT NULL | Screening date |
| `show_time` | TIME | NOT NULL | Screening time |
| `ticket_price`| DECIMAL(10,2)| NOT NULL | Standard seat price ($) |
| `screen_type`| VARCHAR(50) | DEFAULT 'IMAX 3D' | IMAX Laser 3D, Dolby Atmos, 4DX |
| `total_seats`| INT | DEFAULT 64 | Hall capacity |

### 4. `bookings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `booking_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique booking ID |
| `user_id` | INT | FK -> `users(user_id)` | Customer who booked |
| `show_id` | INT | FK -> `shows(show_id)` | Show scheduled |
| `seats` | INT | NOT NULL | Total number of tickets booked |
| `total_amount`| DECIMAL(10,2)| NOT NULL | Total cost ($) |
| `booking_status`| VARCHAR(30)| DEFAULT 'Confirmed' | `'Confirmed'` or `'Cancelled'` |
| `booking_reference`| VARCHAR(50)| UNIQUE, NOT NULL | Alphanumeric e-ticket code (e.g. `CV-24427-1950`) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Booking timestamp |

### 5. `booking_seats` (Prevents Duplicate Seat Bookings)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `booking_seat_id`| INT | PRIMARY KEY, AUTO_INCREMENT | Unique seat reservation ID |
| `booking_id` | INT | FK -> `bookings(booking_id)` ON DELETE CASCADE | Associated booking |
| `show_id` | INT | FK -> `shows(show_id)` ON DELETE CASCADE | Associated show |
| `seat_number` | VARCHAR(10) | NOT NULL | E.g., 'A1', 'E5', 'H8' |
| `seat_type` | VARCHAR(20) | DEFAULT 'Standard' | `'Standard'` or `'VIP'` |
| `seat_price` | DECIMAL(10,2)| NOT NULL | Individual seat charge |

> **Unique Integrity Constraint:** `UNIQUE KEY unique_show_seat (show_id, seat_number)` guarantees that two customers can never occupy the same seat for the same show.

---

## 🚀 Installation & Quick Start

### Prerequisites
1. **Node.js** (v18.0.0 or higher recommended)
2. **MySQL Server** (MySQL 8.0, XAMPP, or MariaDB running locally)

---

### Step 1: Clone or Navigate to the Workspace
```bash
cd "c:\Users\shanm\OneDrive\Desktop\OnlineMovieTicketBookingSystem"
```

### Step 2: Configure Environment Variables
Verify or edit the `.env` file in the root folder with your local MySQL credentials:

```ini
PORT=3000
NODE_ENV=development
SESSION_SECRET=cineverse_super_secret_session_key_2026_xyz

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cineverse_db
DB_PORT=3306
```
*(If your MySQL root user has a password, enter it in `DB_PASSWORD`)*

---

### Step 3: Install Dependencies
```bash
npm install
```

---

### Step 4: Initialize and Seed the Database
Run the automated database setup command:
```bash
npm run init-db
```
This automatically:
- Creates the `cineverse_db` database if it does not already exist.
- Creates all 5 tables with relationships, indexes, and cascade rules.
- Pre-seeds 12 movies, 28 active shows across multiple theatres, and sample demo accounts.

---

### Step 5: Start the Application Server
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

Open your browser and visit:
👉 **`http://localhost:3000`**

---

## 🔑 Default Accounts & Credentials

The database comes pre-seeded with tested accounts. You can also click the **"1-Click Demo Credentials"** button directly on the `/login.html` page:

| Account Type | Email | Password | Role / Access |
|---|---|---|---|
| **System Administrator (Shanmukha Raju)** | `admin@cineverse.com` | `Admin@123` | Full Admin Dashboard (`/admin.html`), Movie & Show CRUD, Booking & Customer Management |
| **Demo Customer 1** | `customer@example.com` | `Customer@123` | Customer features, seat booking, ticket confirmation, `/my-bookings.html` |
| **Demo Customer 2** | `sophia@example.com` | `Customer@123` | Additional verified customer |

---

## 🧪 Testing Guide

### 1. Customer Registration & Login
1. Navigate to `http://localhost:3000/register.html`.
2. Register with a new name, email, and password (min 6 characters).
3. You will be automatically logged in and redirected to the movies catalog.
4. Test logout and log back in at `http://localhost:3000/login.html` (or click **Customer Demo**).

### 2. Live Movie Search & Filtering
1. Visit `http://localhost:3000/movies.html`.
2. Type in the search box: e.g. `"Dune"` or `"Nolan"`. Results update live with zero lag.
3. Click the **Sci-Fi** or **Action** genre pills.
4. Change the sort selector to **Highest Rated** or **Newest Releases**.

### 3. Showtime & Seat Selection
1. Click **View Details** or **Book Tickets** on any movie (e.g. *Dune: Part Two*).
2. Choose a date tab (**TODAY**, **TOMORROW**, etc.).
3. Choose a theatre (e.g., *CINEVERSE Grand IMAX - Downtown*) and click a showtime button (e.g., `18:45`).
4. You will be brought to `seat-selection.html?show_id=...`.
5. Click to select seats:
   - Notice standard seats are green.
   - Rows A & B are VIP seats (gold) with a 25% premium.
   - Already booked seats (e.g. E5, E6) are greyed out and cannot be clicked.
6. The summary bar recalculates ticket count, seat names, and total cost dynamically.

### 4. Double Booking Prevention Test
1. Select available seats (e.g., `H1`, `H2`).
2. Click **Proceed to Confirm Booking**.
3. Confirm in the dialog. The booking succeeds and redirects to your digital ticket.
4. In another tab or browser window, open the same showtime.
5. Seats `H1` and `H2` are now marked as **Booked**.
6. Even if two tabs attempt to confirm the exact same seat simultaneously, the MySQL database transaction and `UNIQUE(show_id, seat_number)` constraint will prevent race conditions and return HTTP 409 Conflict.

### 5. Digital Ticket & QR Code Verification
1. On `booking-confirmation.html?id=CV-...`, view the cinema ticket.
2. Observe the unique Booking Reference, movie metadata, and scannable QR code.
3. Click **Print Ticket** to view the clean printable layout.

### 6. Booking Cancellation & Inventory Release
1. Navigate to `http://localhost:3000/my-bookings.html`.
2. Click **Cancel Booking** on an upcoming reservation.
3. Confirm the action. The status changes to **Cancelled**, and those seats are immediately released back into the available pool.

### 7. Admin Dashboard (`/admin.html`)
1. Log in as `admin@cineverse.com` / `Admin@123`.
2. View real-time analytics, revenue numbers, and box office leaders.
3. Add a new movie or edit an existing one.
4. Schedule a new screening in the **Show Schedules** tab.
5. Search bookings by reference number or cancel fraudulent reservations.

---

## 🔒 Security Implementations

- **Password Hashing**: Strong bcrypt hashing with 10 salt rounds.
- **SQL Injection Prevention**: 100% parameterized queries (`pool.query(sql, [params])`).
- **Authorization Enforcement**: Dedicated `authMiddleware` and `adminMiddleware` verify user role before executing protected API endpoints.
- **Race Condition Prevention**: MySQL `BEGIN TRANSACTION`, `SELECT ... FOR UPDATE`, and unique index constraints prevent simultaneous double bookings.
- **Session Security**: HttpOnly cookies prevent client-side XSS session sniffing.

---

## 📄 License
This project is licensed under the ISC License. Built with passion for cinema by the CINEVERSE engineering team.
