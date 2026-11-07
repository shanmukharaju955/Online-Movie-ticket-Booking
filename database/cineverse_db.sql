-- CINEVERSE Movie Ticket Booking Platform
-- Complete Database Initialization Script with Hyderabad & Kurnool Theatres + Video Trailers

CREATE DATABASE IF NOT EXISTS `cineverse_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `cineverse_db`;

-- Drop tables in reverse order of foreign key dependency
DROP TABLE IF EXISTS `booking_seats`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `shows`;
DROP TABLE IF EXISTS `movies`;
DROP TABLE IF EXISTS `users`;

-- ========================================================
-- Table 1: users
-- ========================================================
CREATE TABLE `users` (
  `user_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'customer',
  `phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Table 2: movies
-- ========================================================
CREATE TABLE `movies` (
  `movie_id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(150) NOT NULL,
  `genre` VARCHAR(50) NOT NULL,
  `language` VARCHAR(100) NOT NULL,
  `duration` INT NOT NULL COMMENT 'Duration in minutes',
  `release_date` DATE NOT NULL,
  `description` TEXT,
  `poster_url` VARCHAR(500),
  `banner_url` VARCHAR(500),
  `trailer_url` VARCHAR(500) DEFAULT NULL,
  `rating` DECIMAL(3,1) DEFAULT 8.5,
  `status` VARCHAR(30) DEFAULT 'now_showing' COMMENT 'now_showing, coming_soon, trending',
  `director` VARCHAR(100) DEFAULT NULL,
  `cast` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Table 3: shows
-- ========================================================
CREATE TABLE `shows` (
  `show_id` INT PRIMARY KEY AUTO_INCREMENT,
  `movie_id` INT NOT NULL,
  `theatre_name` VARCHAR(100) NOT NULL,
  `city` VARCHAR(50) NOT NULL DEFAULT 'Hyderabad',
  `show_date` DATE NOT NULL,
  `show_time` TIME NOT NULL,
  `ticket_price` DECIMAL(10,2) NOT NULL,
  `screen_type` VARCHAR(50) DEFAULT 'IMAX 3D',
  `total_seats` INT DEFAULT 64,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_shows_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`movie_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Table 4: bookings
-- ========================================================
CREATE TABLE `bookings` (
  `booking_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `show_id` INT NOT NULL,
  `seats` INT NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `booking_status` VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
  `booking_reference` VARCHAR(50) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`show_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Table 5: booking_seats
-- ========================================================
CREATE TABLE `booking_seats` (
  `booking_seat_id` INT PRIMARY KEY AUTO_INCREMENT,
  `booking_id` INT NOT NULL,
  `show_id` INT NOT NULL,
  `seat_number` VARCHAR(10) NOT NULL,
  `seat_type` VARCHAR(20) DEFAULT 'Standard',
  `seat_price` DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_bseats_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bseats_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`show_id`) ON DELETE CASCADE,
  CONSTRAINT `unique_show_seat` UNIQUE (`show_id`, `seat_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for fast query lookup
CREATE INDEX `idx_shows_movie_date` ON `shows` (`movie_id`, `show_date`);
CREATE INDEX `idx_shows_theatre_city` ON `shows` (`theatre_name`, `city`);
CREATE INDEX `idx_bookings_user` ON `bookings` (`user_id`);
CREATE INDEX `idx_booking_seats_show` ON `booking_seats` (`show_id`);

-- ========================================================
-- SEED DATA
-- Default Passwords (hashed with bcrypt):
-- Admin: Admin@123
-- Customer: Customer@123
-- ========================================================

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `phone`) VALUES
(1, 'Shanmukha Raju', 'admin@cineverse.com', '$2a$10$VgduepPI1mPwu2pgzaiff.6MKt3Lk8mZu53VyHkX2lyLv5WE1/gCu', 'admin', '+91 98480 12345'),
(2, 'Alex Mercer', 'customer@example.com', '$2a$10$ePj6/lVOT9QzLxhc6HOMG.5XJa6uJjctcRJNIxExLjFpWMZjCBqCe', 'customer', '+91 99887 65432'),
(3, 'Sophia Chen', 'sophia@example.com', '$2a$10$ePj6/lVOT9QzLxhc6HOMG.5XJa6uJjctcRJNIxExLjFpWMZjCBqCe', 'customer', '+91 97001 23456');

-- 12 Realistic Blockbuster Movies with high-res posters and playable YouTube trailer embeds
INSERT INTO `movies` (`movie_id`, `title`, `genre`, `language`, `duration`, `release_date`, `description`, `poster_url`, `banner_url`, `trailer_url`, `rating`, `status`, `director`, `cast`) VALUES
(1, 'Dune: Part Two', 'Sci-Fi', 'English', 166, '2024-03-01', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/Way9Dexny3w', 8.9, 'trending', 'Denis Villeneuve', 'Timothee Chalamet, Zendaya, Rebecca Ferguson, Austin Butler'),
(2, 'Kalki 2898 AD', 'Sci-Fi', 'Telugu', 181, '2024-06-27', 'A modern avatar of the Hindu god Vishnu descends to earth to protect the world from evil forces in a dystopian post-apocalyptic future set in the sacred city of Kasi.', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/kQDd1AhGIHk', 8.5, 'trending', 'Nag Ashwin', 'Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone'),
(3, 'Oppenheimer', 'Drama', 'English', 180, '2023-07-21', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, grappling with the profound moral ramifications of unleashing the nuclear era.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/uYPbbksJxIg', 8.8, 'now_showing', 'Christopher Nolan', 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.'),
(4, 'Interstellar: IMAX Special', 'Sci-Fi', 'English', 169, '2024-09-27', 'A team of explorers travel through a newly discovered wormhole near Saturn in an effort to ensure humanity survival as crop blights and dust storms threaten life on Earth.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/zSWdZVtXT7E', 9.2, 'trending', 'Christopher Nolan', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain'),
(5, 'The Dark Knight: 4K Re-Master', 'Action', 'English', 152, '2024-06-15', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/EXeTwQWrcwY', 9.0, 'now_showing', 'Christopher Nolan', 'Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine'),
(6, 'Gladiator II', 'Action', 'English', 148, '2024-11-22', 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by tyrannical emperors who rule Rome with an iron fist.', 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/4rgYUipGJNo', 8.4, 'now_showing', 'Ridley Scott', 'Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen'),
(7, 'Cyberpunk: Neon Genesis', 'Sci-Fi', 'Japanese', 125, '2025-01-15', 'In the sprawling hyper-dense megalopolis of Neo-Kyoto, an augmented cyber-detective uncovers an underground syndicate weaponizing human consciousness through neural interfaces.', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/BnnbP7pCIvQ', 8.7, 'now_showing', 'Kenji Kamiyama', 'Mamoru Miyano, Maaya Sakamoto, Kenjiro Tsuda'),
(8, 'Avatar: The Way of Water', 'Adventure', 'English', 192, '2023-12-16', 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/d9MyW72ELq0', 8.3, 'now_showing', 'James Cameron', 'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang'),
(9, 'Spirited Away: Collector Edition', 'Animation', 'Japanese', 125, '2024-08-10', 'During her family move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/ByXuk9QqQkk', 9.1, 'trending', 'Hayao Miyazaki', 'Rumi Hiiragi, Miyu Irino, Mari Natsuki'),
(10, 'Jawan: Final Cut', 'Action', 'Hindi', 169, '2024-04-12', 'A high-octane action thriller outlining the emotional journey of a man who is set to rectify the wrongs in the society, with an army of courageous women supporting his mission.', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/MWOlnZSnXpc', 8.1, 'now_showing', 'Atlee', 'Shah Rukh Khan, Nayanthara, Vijay Sethupathi, Deepika Padukone'),
(11, 'Blade Runner 2099', 'Sci-Fi', 'English', 150, '2026-12-20', 'Fifty years after the events of 2049, a new generation of Blade Runners confronts the moral boundary between human evolution and synthetic life on a dying planet.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/gCcx85zbxz4', 9.0, 'coming_soon', 'Jonathan van Tulleken', 'Michelle Yeoh, Hunter Schafer, Dimitri Abold'),
(12, 'Mission: Impossible – The Final Reckoning', 'Action', 'English', 160, '2026-05-23', 'Ethan Hunt and his IMF team embark on their most dangerous mission yet: to track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1600&q=80', 'https://www.youtube.com/embed/2m1drlOZSDw', 8.9, 'coming_soon', 'Christopher McQuarrie', 'Tom Cruise, Hayley Atwell, Ving Rhames, Simon Pegg');

-- Shows in HYDERABAD and KURNOOL Theatres
INSERT INTO `shows` (`show_id`, `movie_id`, `theatre_name`, `city`, `show_date`, `show_time`, `ticket_price`, `screen_type`, `total_seats`) VALUES
-- =================== HYDERABAD SHOWS ===================
-- Prasads Multiplex & Large Screen, Hyderabad
(1, 1, 'Prasads Multiplex & Large Screen - Hyderabad', 'Hyderabad', CURRENT_DATE(), '10:30:00', 22.00, 'PCX Giant Screen 4K Atmos', 64),
(2, 1, 'Prasads Multiplex & Large Screen - Hyderabad', 'Hyderabad', CURRENT_DATE(), '14:30:00', 25.00, 'PCX Giant Screen 4K Atmos', 64),
(3, 1, 'Prasads Multiplex & Large Screen - Hyderabad', 'Hyderabad', CURRENT_DATE(), '18:45:00', 28.00, 'PCX Giant Screen 4K Atmos', 64),
(4, 2, 'Prasads Multiplex & Large Screen - Hyderabad', 'Hyderabad', CURRENT_DATE(), '21:45:00', 24.00, 'PCX Giant Screen 4K Atmos', 64),

-- AMB Cinemas Superplex (Gachibowli, Hyderabad)
(5, 1, 'AMB Cinemas (Superplex) - Gachibowli, Hyderabad', 'Hyderabad', CURRENT_DATE(), '11:15:00', 26.00, 'Laser Dolby Atmos VIP', 64),
(6, 1, 'AMB Cinemas (Superplex) - Gachibowli, Hyderabad', 'Hyderabad', CURRENT_DATE(), '15:45:00', 28.50, 'Laser Dolby Atmos VIP', 64),
(7, 2, 'AMB Cinemas (Superplex) - Gachibowli, Hyderabad', 'Hyderabad', CURRENT_DATE(), '19:30:00', 25.00, 'Laser Dolby Atmos VIP', 64),
(8, 4, 'AMB Cinemas (Superplex) - Gachibowli, Hyderabad', 'Hyderabad', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '17:00:00', 26.00, 'Laser Dolby Atmos VIP', 64),

-- AAA Cinemas (Asian Allu Arjun, Ameerpet, Hyderabad)
(9, 2, 'AAA Cinemas (Asian Allu Arjun) - Ameerpet, Hyderabad', 'Hyderabad', CURRENT_DATE(), '14:00:00', 20.00, 'Barco 4K Laser Sound', 64),
(10, 2, 'AAA Cinemas (Asian Allu Arjun) - Ameerpet, Hyderabad', 'Hyderabad', CURRENT_DATE(), '18:15:00', 22.00, 'Barco 4K Laser Sound', 64),
(11, 10, 'AAA Cinemas (Asian Allu Arjun) - Ameerpet, Hyderabad', 'Hyderabad', CURRENT_DATE(), '21:30:00', 19.50, 'Barco 4K Laser Sound', 64),

-- PVR INOX Forum Mall (Kukatpally, Hyderabad)
(12, 3, 'PVR INOX Forum Mall - Kukatpally, Hyderabad', 'Hyderabad', CURRENT_DATE(), '13:00:00', 21.00, 'IMAX with Laser 3D', 64),
(13, 3, 'PVR INOX Forum Mall - Kukatpally, Hyderabad', 'Hyderabad', CURRENT_DATE(), '20:15:00', 23.00, 'IMAX with Laser 3D', 64),
(14, 5, 'PVR INOX Forum Mall - Kukatpally, Hyderabad', 'Hyderabad', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '16:30:00', 22.00, '4DX Motion Dynamic', 64),

-- =================== KURNOOL SHOWS ===================
-- SVR Cinemas (4K Laser Dolby Atmos, Kurnool)
(15, 2, 'SVR Cinemas 4K Laser Atmos - Kurnool', 'Kurnool', CURRENT_DATE(), '11:00:00', 16.00, '4K Laser RGB Dolby Atmos', 64),
(16, 2, 'SVR Cinemas 4K Laser Atmos - Kurnool', 'Kurnool', CURRENT_DATE(), '14:45:00', 18.00, '4K Laser RGB Dolby Atmos', 64),
(17, 2, 'SVR Cinemas 4K Laser Atmos - Kurnool', 'Kurnool', CURRENT_DATE(), '18:30:00', 19.50, '4K Laser RGB Dolby Atmos', 64),
(18, 1, 'SVR Cinemas 4K Laser Atmos - Kurnool', 'Kurnool', CURRENT_DATE(), '21:45:00', 18.00, '4K Laser RGB Dolby Atmos', 64),
(19, 1, 'SVR Cinemas 4K Laser Atmos - Kurnool', 'Kurnool', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '15:00:00', 17.50, '4K Laser RGB Dolby Atmos', 64),

-- Anand Complex Multiplex (Kurnool)
(20, 1, 'Anand Complex Multiplex - Kurnool', 'Kurnool', CURRENT_DATE(), '11:30:00', 15.00, 'Dolby 7.1 Digital Sound', 64),
(21, 1, 'Anand Complex Multiplex - Kurnool', 'Kurnool', CURRENT_DATE(), '15:15:00', 16.50, 'Dolby 7.1 Digital Sound', 64),
(22, 10, 'Anand Complex Multiplex - Kurnool', 'Kurnool', CURRENT_DATE(), '19:00:00', 15.00, 'Dolby 7.1 Digital Sound', 64),
(23, 8, 'Anand Complex Multiplex - Kurnool', 'Kurnool', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '18:00:00', 16.00, 'Dolby 7.1 Digital Sound', 64),

-- Venkatesh Picture Palace (Kurnool)
(24, 2, 'Venkatesh Picture Palace - Kurnool', 'Kurnool', CURRENT_DATE(), '13:30:00', 14.50, 'Qube 4K Projection', 64),
(25, 4, 'Venkatesh Picture Palace - Kurnool', 'Kurnool', CURRENT_DATE(), '17:45:00', 15.00, 'Qube 4K Projection', 64),
(26, 5, 'Venkatesh Picture Palace - Kurnool', 'Kurnool', CURRENT_DATE(), '21:15:00', 15.00, 'Qube 4K Projection', 64),

-- INOX SVN Mall (Kurnool)
(27, 3, 'Inox SVN Mall - Kurnool', 'Kurnool', CURRENT_DATE(), '14:15:00', 17.00, 'Inox Insignia Laser', 64),
(28, 6, 'Inox SVN Mall - Kurnool', 'Kurnool', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '19:30:00', 16.50, 'Inox Insignia Laser', 64);

-- Sample Bookings
INSERT INTO `bookings` (`booking_id`, `user_id`, `show_id`, `seats`, `total_amount`, `booking_status`, `booking_reference`, `created_at`) VALUES
(1, 2, 1, 2, 44.00, 'Confirmed', 'CV-2026-98124', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 3, 1, 3, 66.00, 'Confirmed', 'CV-2026-54192', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 2, 15, 2, 32.00, 'Confirmed', 'CV-2026-31847', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Corresponding Booked Seats
INSERT INTO `booking_seats` (`booking_seat_id`, `booking_id`, `show_id`, `seat_number`, `seat_type`, `seat_price`) VALUES
(1, 1, 1, 'E5', 'Standard', 22.00),
(2, 1, 1, 'E6', 'Standard', 22.00),
(3, 2, 1, 'F7', 'VIP', 22.00),
(4, 2, 1, 'F8', 'VIP', 22.00),
(5, 2, 1, 'F9', 'VIP', 22.00),
(6, 3, 15, 'D3', 'Standard', 16.00),
(7, 3, 15, 'D4', 'Standard', 16.00);
