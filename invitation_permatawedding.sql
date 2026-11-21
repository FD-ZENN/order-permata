-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 14 Nov 2026 pada 22.37
-- Versi server: 10.11.10-MariaDB-log
-- Versi PHP: 8.3.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `invitation_permatawedding`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `admins`
--

CREATE TABLE `admins` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `name`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
('c62245d6-cc21-11f1-95f3-d8bbc11ae103', 'fauzan', '$2y$10$zaEQ169gtSuX0s1fntSSG.QX/PW4FFJRcyF8tpMefS9o4gq4yGn26', 'fauzan', 1, '2026-10-22 12:43:24', '2026-10-20 01:01:25', '2026-10-22 05:43:24'),
('de285d52-af30-11f1-b529-d8bbc11ae103', 'permata', '$2y$12$Tx97AkSzdSx.MsYqRpjjJeQqQh36EglNBtt4qkeSBqL1.ZJnlU9kW', 'Permata Wedding', 1, '2026-10-31 11:14:01', '2026-09-13 05:06:24', '2026-10-31 04:14:01');

-- --------------------------------------------------------

--
-- Struktur dari tabel `comments`
--

CREATE TABLE `comments` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `guest_name` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `attendance` enum('hadir','tidak_hadir','ragu_ragu') NOT NULL DEFAULT 'hadir',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `comments`
--

INSERT INTO `comments` (`id`, `order_id`, `guest_name`, `content`, `attendance`, `created_at`, `updated_at`) VALUES
('04fbd708-b878-423f-a154-908d572cef11', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Muhammad Qosim Ghifari Aji', 'Barakallahulakuma Wabaroka A\'laikuma wajama\'a bainakumaa fii khayr. Aamiin. Selamat dan semoga sakinah mawardah warahmah untuk pernikahannya. Aamiin3.', 'ragu_ragu', '2026-11-02 21:41:41', '2026-11-02 21:41:41'),
('088ae3f8-ef45-4f02-9ee6-813ab4bf1c0e', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Nanik', 'Happy wedding riz❤️‍🔥,semoga mnjadi kluarga yg sakinah mawaddah warahmah.. dan smoga lekas dberi mmongan..🤲🏻 Aamiin', 'tidak_hadir', '2026-11-10 20:01:01', '2026-11-10 20:01:01'),
('090be125-cb58-421d-bcfb-a75657bf7da7', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Septi & Farid', 'lancarr sampai hari H kinurr, bestiekuu, samawa nggihh cantikk 🩷🩷🩷', 'ragu_ragu', '2026-11-07 14:47:28', '2026-11-07 14:47:28'),
('0b8158f5-eaec-458c-814d-8cbce5005081', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Rofi Cantik', 'selamat menempuh hidup baru sengkuu❤️🥺🥺selamat menjalankan ibadah paling lama❤️Samawa yaa,langeng sampaii maut memisahkann❤️🥺bahagiaa selalu sengkuuu🥺🥰😍', 'hadir', '2026-11-01 18:11:01', '2026-11-01 18:11:01'),
('170cfefa-1a4b-4e9c-ae2d-f30a7df5f3be', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Septi', 'happy wedding Vita🥰Selamat menempuh hidup baru, Semoga menjadi keluarga sakinah, mawaddah, warahmah dan semoga perjalanan baru kalian penuh kebahagiaan💐', 'ragu_ragu', '2026-11-02 11:34:00', '2026-11-02 11:34:00'),
('1c34f864-6366-43e7-80ac-d71d812f244c', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Mbak pipit', 'Happy wedding, adikku! Welcome to your new chapter. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Semoga cinta kalian selalu tumbuh, bukan hanya di hari bahagia, tetapi juga dalam setiap proses kehidupan 💗💐', 'tidak_hadir', '2026-11-02 06:58:05', '2026-11-02 06:58:05'),
('22e82d11-a36f-4a5d-a862-17c7700493d6', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Eldo & Della', 'happy wedding love, samawa till jannah ya sayangku❤️❤️❤️', 'ragu_ragu', '2026-11-02 11:31:36', '2026-11-02 11:31:36'),
('33cb7a77-3539-4e09-bdf5-6503bb563c2f', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Anggrek anggara', 'Bunda rizki cantik banget💛', 'hadir', '2026-11-06 05:57:17', '2026-11-06 05:57:17'),
('36d4944d-87d2-4ab4-b894-6eb2bfbba179', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'Permata Wedding', 'Selamat menempuh hidup baru kak Febri & kak Silvia. Semoga bahagia selalu dan menjadi keluarga sakinah, mawaddah, warahmah.', 'tidak_hadir', '2026-10-25 01:20:34', '2026-10-25 01:29:56'),
('3cc27c32-faad-4081-802b-6725aa620200', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Jihan', 'Selamat yaa cantikkk🥺🥰selamat menempuh hidup baru, bahagia selalu cantikk💐', 'ragu_ragu', '2026-11-02 10:34:38', '2026-11-02 10:34:38'),
('57c4cb81-dcd7-45d6-a68d-f4fc1e7502d1', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'zahra', 'happy wedding yaa cantikk🥰selamat menempuh hidup baru samawa till jannah yaa!💐💗', 'ragu_ragu', '2026-11-02 11:23:20', '2026-11-02 11:23:20'),
('5af5d94d-651e-4142-83fe-f30f26e347a7', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Yeni', 'Selamat menempuh hidup baru ki,langgeng dunia akhirat ki', 'hadir', '2026-11-06 12:52:45', '2026-11-06 12:52:45'),
('66cc5535-258f-440b-a59c-9facb7c90290', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Tari', 'selamat menempuh hidup baru, langgeng selawase. Amin', 'tidak_hadir', '2026-11-06 07:49:47', '2026-11-06 07:49:47'),
('70d4eea6-4f7e-4205-b810-983aef3ff74f', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Amel', 'Semoga lancar sampai hari H ya mba Rizky dan menjadi keluarga yang samawa Aamiin ❤️', 'ragu_ragu', '2026-11-06 19:49:30', '2026-11-06 19:49:30'),
('72c83811-6031-4493-95d8-f0466ceadbd3', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'isna', 'selamat menempuh hidup baru mas rudy dan istri, jadi keluarga samawa selalu🤗', 'tidak_hadir', '2026-11-05 04:53:21', '2026-11-05 04:53:21'),
('7addecc0-6a5a-4fa6-9831-796fa3c42c64', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Melda dan suami', 'Maaf ya ta aku gak bisa hadir sma suami karna aku gak bisa cuti hee ,selamat ya ta &suami semoga bahagia di dunia dan akhirat,dan segera dapat momongan ya loveee 🥰♥️ta', 'ragu_ragu', '2026-11-02 12:46:27', '2026-11-02 12:46:27'),
('7fd48ed2-b345-47b9-9e60-de870b3b8f97', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'yuu', 'tesst coba', 'hadir', '2026-10-06 04:15:16', '2026-10-06 04:15:16'),
('85872eb3-8f0b-427c-b161-37193c4d0231', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'fatimah dan suami', 'Happy wedding suci, selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah mawadah warohmah💐✨', 'hadir', '2026-11-02 13:24:35', '2026-11-02 13:24:35'),
('89b71c45-22c6-406b-90ba-6032d0bc3383', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Zaima putri Ismayuda', 'Selamat menempuh hidup baru suci dan suami,sakinah mawadah warahmah 😚☺️', 'tidak_hadir', '2026-11-10 10:39:50', '2026-11-10 10:39:50'),
('9238fed3-d7d8-4439-9e32-1a1744ef3ec5', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Stevi a', 'Selamat menempuh hidup baru ucii🥺, semoga sakinah mawadah warohmah yaa, bahagia selalu 🥰❤️', 'ragu_ragu', '2026-11-02 06:26:41', '2026-11-02 06:26:41'),
('a030d794-1dd8-4e49-afc0-9736094b6be6', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Rud', 'Samawa ki', 'tidak_hadir', '2026-11-06 08:17:51', '2026-11-06 08:17:51'),
('a0e20f7e-1e47-4b68-a9d3-7ac426b058a3', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Permata Wedding', 'Selamat menempuh hidup baru kak Rudy & kak Chindy. Semoga bahagia selalu dan menjadi keluarga sakinah, mawaddah, warahmah.', 'tidak_hadir', '2026-10-25 01:18:52', '2026-10-25 01:29:32'),
('c250171d-a25f-405a-869b-b9630eaab196', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Cindy Okta', 'Selamat menempuh hidup baruu rudy dan istri, semoga menjadi keluarga yang sakinah mawadah warahmah🤗🤗', 'ragu_ragu', '2026-11-06 10:11:01', '2026-11-06 10:11:01'),
('c4f07c55-0043-4aa1-a319-8b8eee66bf42', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'yasmin', 'samawa', 'ragu_ragu', '2026-10-25 13:00:00', '2026-10-25 13:00:00'),
('c7391c22-53d1-436e-b2ac-69fc76fa5a84', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Susilo agus', '11-11 flash sale gacooor ,samawa riz !', 'tidak_hadir', '2026-11-06 07:21:48', '2026-11-06 07:21:48'),
('d4655932-29ba-4ae4-9092-8bdd40088825', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Siti Rohimah', 'Selamat cayang ku semoga menjadi keluarga yang sakinah mawadah warohmah,lancar sampai hari h 🥰🥰😘', 'hadir', '2026-11-01 14:11:37', '2026-11-01 14:11:37'),
('ef16a504-28a5-4607-827e-ea0339e87476', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'prasasti Zahra aulia', 'sayangkuuu🥹sakinah mawadah warohmah sayangku🥹 selamat menempuh perjalanan baru🥹🥹🤍🤍🤍', 'hadir', '2026-11-01 13:43:58', '2026-11-01 13:43:58'),
('f30b6f8a-5070-40fa-8083-87c64ad0884f', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Ayuk dan suami', 'Happy wedding sayangg selamat menempuh hidup baruu semoga sakinah mawadah warohmah🥰', 'ragu_ragu', '2026-11-02 11:34:40', '2026-11-02 11:34:40');

-- --------------------------------------------------------

--
-- Struktur dari tabel `couples`
--

CREATE TABLE `couples` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `slug_url` varchar(100) NOT NULL,
  `cover_photo_url` varchar(255) DEFAULT NULL,
  `groom_name` varchar(150) NOT NULL,
  `groom_nickname` varchar(50) DEFAULT NULL,
  `groom_father` varchar(150) DEFAULT NULL,
  `groom_mother` varchar(150) DEFAULT NULL,
  `groom_address` text DEFAULT NULL,
  `groom_photo_url` varchar(255) DEFAULT NULL,
  `bride_name` varchar(150) NOT NULL,
  `bride_nickname` varchar(50) DEFAULT NULL,
  `bride_father` varchar(150) DEFAULT NULL,
  `bride_mother` varchar(150) DEFAULT NULL,
  `bride_address` text DEFAULT NULL,
  `bride_photo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `couples`
--

INSERT INTO `couples` (`id`, `order_id`, `slug_url`, `cover_photo_url`, `groom_name`, `groom_nickname`, `groom_father`, `groom_mother`, `groom_address`, `groom_photo_url`, `bride_name`, `bride_nickname`, `bride_father`, `bride_mother`, `bride_address`, `bride_photo_url`, `created_at`, `updated_at`) VALUES
('04f1f0c9-f257-4bf9-b0a0-00002cc97f9b', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'ruddy-suci', NULL, 'Ruddy Ady Nugroho', 'Ruddy', 'Bapak Sukidi', 'Ibu Sugiyanti', 'Popongan RT 20/RW 04 Patihan Sidoharjo Sragen', '/2027/ruddy-suci/couple/mempelai-pria.jpg', 'Suci Ovita Sari', 'Suci', 'Bapak Sugiyanto', 'Ibu Siti Rohimah', 'Genengan RT 08/RW 12, Mojosongo Jebres Surakarta', '/2027/ruddy-suci/couple/mempelai-wanita.jpg', '2026-10-29 04:19:23', '2026-10-29 16:06:25'),
('16fa4bc4-d741-11f1-a270-d8bbc11ae103', '16fa4130-d741-11f1-a270-d8bbc11ae103', 'ari-desti', NULL, 'Ari Rahmat Ramadhan', 'Ari', 'Anto Kuncoro', 'Murni Tri Lestari', 'Gebang rt 04/16, Banjarsari, Banjarsari, Surakarta', '', 'Desti Rahmawati', 'Desti', 'Paeran', 'Sri Suratiningsih', 'Poko rt 08/02,Keden,Kalijambe,Sragen', '', '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('3b9ce8f1-cf68-11f1-95f3-d8bbc11ae103', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'febri-silvia', NULL, 'Febri Galih Satria', 'Febri', 'Bpk Suparmin', 'Ibu Ngatmi', 'Sidowayah RT 02, Jenggrik, Kedawung, Sragen', NULL, 'Silvia Melly Eka Panggraeni', 'Silvia', 'Bpk Suwarto Kadavi', 'Ibu Kusdaryanti', 'Mentir RT 09, Bener, Ngrampal, Sragen', NULL, '2026-10-24 05:03:20', '2026-10-25 10:55:03'),
('49b5a4ac-3bd8-4e29-88af-9fe2b97dcdfd', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'ahmad-siti', NULL, 'dimas', 'Anjay', 'Mahfud', 'Ibu Siti Aminah', 'Jl. Melati No. 15, Wonosobo, Jawa Tengah', '/2027/ahmad-siti/couple/mempelai-pria.jpg', 'Siti Nur Aisyah', 'Siti', 'Bapak Abdul Rahman', 'Ibu Nurhayati', 'Jl. Mawar No. 27, Wonosobo, Jawa Tengah', '/2027/ahmad-siti/couple/mempelai-wanita.jpg', '2026-10-05 14:53:11', '2026-10-27 07:59:24'),
('4cb0e1ca-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'ahmad-rizky', NULL, 'Ahmad Nurdiyanto', 'Ahmad', 'Bapak Tugiyo', 'Ibu Murni', 'Kedawung RT 09, Kedawung, Mondokan, Sragen', '/2027/ahmad-rizky/couple/mempelai-pria.jpg', 'Rizky Nur Syarifah, S.Pd', 'Rizky', 'Bapak Suranto', 'Ibu Suwanti', 'Kaligunting RT 06, Kedawung, Mondokan, Sragen', '/2027/ahmad-rizky/couple/mempelai-wanita.jpg', '2026-10-31 02:39:31', '2026-11-02 15:01:18'),
('88982723-b85b-410d-aaf7-be0e508783fd', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'rudy-chindy', NULL, 'Rudy Prasetyo', 'Rudy', 'Bapak Sunaryo', 'Sri Umiyatun', 'Losari RT 018 RW 003, Kedungharjo, Mantingan, Ngawi', NULL, 'Chindy Widya Rahma', 'Chindy', 'Daim Hari Susanto', 'Wiwik Agustina', 'Genengan RT 10 RW 03, Genengan, Kawedanan, Magetan', NULL, '2026-10-22 08:15:28', '2026-10-22 08:19:24'),
('a757be01-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'agung-fitri', NULL, 'Agung Prastiyo', 'Agung', 'Giyono', 'Ngadinem', 'Kalidoro RT 29, Kedawung, Mondokan,Sragen', '', 'Nur Safitri', 'Fitri', 'Riyanto', 'Supanti', 'Mojorejo RT 12 Karanganom Sukodono Sragen', '', '2026-11-05 11:47:18', '2026-11-05 11:47:18');

-- --------------------------------------------------------

--
-- Struktur dari tabel `digital_wallets`
--

CREATE TABLE `digital_wallets` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `wallet_type` enum('bank','gopay','ovo','dana','shopeepay','other') NOT NULL DEFAULT 'bank',
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `account_holder` varchar(150) NOT NULL,
  `qr_code_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `digital_wallets`
--

INSERT INTO `digital_wallets` (`id`, `order_id`, `wallet_type`, `bank_name`, `account_number`, `account_holder`, `qr_code_url`, `is_active`, `created_at`, `updated_at`) VALUES
('16fa60da-d741-11f1-a270-d8bbc11ae103', '16fa4130-d741-11f1-a270-d8bbc11ae103', 'bank', 'BRI', '686001023692535', 'Ari Rahmat Ramadhan', NULL, 1, '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('16fa6261-d741-11f1-a270-d8bbc11ae103', '16fa4130-d741-11f1-a270-d8bbc11ae103', 'bank', 'BRI', '209801007925535', 'Desti Rahmawati', NULL, 1, '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('39f47078-7510-4c38-9807-cc6fd8589b09', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'other', 'BCA', '0770817561', 'Ruddy Ady Nugroho', NULL, 1, '2026-10-29 04:30:08', '2026-10-29 04:30:59'),
('4cb1384f-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'bank', 'BNI', '1765287021', 'Ahmad Nurdiyanto', NULL, 1, '2026-10-31 02:39:31', '2026-11-02 14:55:56'),
('4cb140e5-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'bank', 'BRI', '687501029947533', 'Rizky Nur Syarifah', NULL, 1, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('597ebbe6-b5ab-4fb3-ab4f-06cb9dd8ea41', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'bank', 'BCA', '1234567890', 'Ahmad Fauzan Pratama', NULL, 1, '2026-10-05 14:53:11', '2026-10-06 04:25:41'),
('636df657-6f68-4659-a096-97f42e42f5b0', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'bank', 'BRI', '635701005036530', 'Rudy Prasetyo', NULL, 1, '2026-10-22 08:23:26', '2026-10-22 08:23:26'),
('65311a11-03c6-4d65-b2f3-261f44b50ad7', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'shopeepay', 'SeaBank', '901660189173', 'Suci Ovita Sari', NULL, 1, '2026-10-29 04:30:46', '2026-10-29 04:30:46'),
('74d4c02d-ed59-472f-a18e-92fc9bd8e49a', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'bank', 'BNI', '1333357105', 'Rudy Prasetyo', NULL, 1, '2026-10-22 08:23:09', '2026-10-22 08:23:09'),
('76877020-5b36-48c2-b976-3a7bed38185f', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'bank', 'BCA', '0770978386', 'Silvia Melly Eka Panggraeni', NULL, 1, '2026-10-24 05:08:00', '2026-10-25 11:48:13'),
('8aa88564-8433-475b-9ccb-bac805256ebd', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'bank', 'BRI', '321301025060538', 'Sunaryo', NULL, 1, '2026-10-22 08:23:47', '2026-10-22 08:23:47'),
('a757cc38-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'bank', 'BRI', '687501046673539', 'Nur Safitri', NULL, 1, '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('a757cd86-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'bank', 'BCA', '0770757185', 'Agung Prastiyo', NULL, 1, '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('d396c68a-af22-4b32-bfbd-e285af2da3fb', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'bank', 'Mandiri', '9876543210', 'Siti Nur Aisyah', NULL, 1, '2026-10-05 14:53:11', '2026-10-06 03:51:32'),
('e70db7de-1945-429e-9e3a-0b63461621ce', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'dana', 'DANA', '08817662747', 'Suci Ovita Sari', NULL, 1, '2026-10-29 04:30:22', '2026-10-30 06:53:52');

-- --------------------------------------------------------

--
-- Struktur dari tabel `entertainment`
--

CREATE TABLE `entertainment` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` varchar(80) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `entertainment`
--

INSERT INTO `entertainment` (`id`, `order_id`, `name`, `type`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
('16fa5d58-d741-11f1-a270-d8bbc11ae103', '16fa4130-d741-11f1-a270-d8bbc11ae103', 'Arga music', 'Orgen tunggal', 'Resepsi', 1, '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('4be11307-76c3-47b0-8114-16c187a6605c', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'SB Music Production', 'Campursari', NULL, 1, '2026-10-31 02:56:06', '2026-11-02 14:55:38'),
('5988f299-4db5-4669-9a59-8023e66cbf11', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'Rizki Musik', NULL, NULL, 0, '2026-10-24 05:08:20', '2026-10-24 05:08:29'),
('7daddd6a-f604-4020-b866-14765818f8e4', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Campursari', NULL, NULL, 0, '2026-10-29 05:43:20', '2026-10-29 05:43:20'),
('a5c30200-97e3-4d6d-820d-8b57879963a5', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Live Acoustic', NULL, 'Penampilan musik akustik selama acara resepsi.', 1, '2026-10-05 14:53:11', '2026-10-05 14:53:11'),
('a757c9cd-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Sekar Jinggo', 'Campursari', '', 1, '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('c4cd0600-aea5-412d-ba58-c49b0de1db3a', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'Organ Tunggal', NULL, NULL, 0, '2026-10-24 05:08:13', '2026-10-24 05:08:13'),
('eb3cfc20-da88-4e8d-b63a-4a061de11a88', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Organ Tunggal', NULL, 'Malam Midodareni', 1, '2026-10-22 08:27:03', '2026-10-22 09:51:54'),
('f6ad7dd6-061d-4999-b02f-89b8cc3c74aa', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'KMB', 'Campursari', 'Siang', 2, '2026-10-22 08:27:02', '2026-10-22 14:22:48');

-- --------------------------------------------------------

--
-- Struktur dari tabel `events`
--

CREATE TABLE `events` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `event_name` varchar(100) NOT NULL,
  `event_datetime` datetime NOT NULL,
  `event_end` datetime DEFAULT NULL,
  `venue_name` varchar(200) DEFAULT NULL,
  `venue_address` text DEFAULT NULL,
  `google_maps_url` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `events`
--

INSERT INTO `events` (`id`, `order_id`, `event_name`, `event_datetime`, `event_end`, `venue_name`, `venue_address`, `google_maps_url`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
('060fbd8f-3d65-4343-82b6-41e2f0d6c1f5', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Akad Nikah', '2026-12-24 07:00:00', '2026-12-24 10:00:00', 'Kediaman Mempelai Wanita', NULL, NULL, NULL, 1, '2026-10-22 08:20:46', '2026-10-22 08:20:46'),
('0f840394-aaee-460d-ac2b-01044b519a60', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'Resepsi', '2026-11-14 10:00:00', NULL, 'Kediaman Mempelai Wanita', 'Mentir RT 09, Bener, Ngrampal, Sragen', 'https://www.google.com/maps/place/7%C2%B024\'59.9%22S+111%C2%B004\'08.2%22E/@-7.4165467,111.0676033,17z/data=!4m4!3m3!8m2!3d-7.4166389!4d111.0689444?hl=id&entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D', NULL, 1, '2026-10-24 05:07:22', '2026-10-25 11:47:56'),
('16fa54d3-d741-11f1-a270-d8bbc11ae103', '16fa4130-d741-11f1-a270-d8bbc11ae103', 'Akad Nikah Dan Resepsi', '2026-11-22 10:00:00', NULL, 'Kediaman Mempelai Wanita', 'Poko rt 08/02,Keden,Kalijambe,Sragen', 'https://maps.app.goo.gl/sLsdDMJzBUiBFYHY7', NULL, 1, '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('3b7a27a4-915f-4b13-a68e-241234508e8e', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Resepsi', '2026-11-10 10:00:00', NULL, 'Rumah Mempelai Wanita', 'Genengan RT 08/RW 12, Mojosongo Jebres Surakarta', 'https://maps.app.goo.gl/NJ3VKLsp2CLPi53L8?g_st=ac', NULL, 2, '2026-10-29 04:22:03', '2026-10-29 04:22:03'),
('3d240dd2-6cb5-4d37-9231-4531c6ad499c', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Akad Nikah', '2027-02-14 07:00:00', '2027-02-14 10:00:00', 'Masjid Al-Hidayah Wonosobo', 'Jl. Dieng No. 10, Wonosobo, Jawa Tengah', 'https://maps.google.com/?q=Masjid+Al-Hidayah+Wonosobo', NULL, 1, '2026-10-05 14:53:11', '2026-10-27 08:15:16'),
('4cb10516-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Akad Nikah', '2026-11-11 08:00:00', '2026-11-11 09:00:00', 'Rumah Mempelai Wanita', NULL, 'https://goo.gl/maps/1wDBQDzWCgznGHjg8?g_st=ac', NULL, 1, '2026-10-31 02:39:31', '2026-11-02 08:43:59'),
('4cb10fe6-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Resepsi', '2026-11-11 10:00:00', NULL, 'Rumah Mempelai Wanita', NULL, 'https://goo.gl/maps/1wDBQDzWCgznGHjg8?g_st=ac', NULL, 2, '2026-10-31 02:39:31', '2026-11-02 08:44:07'),
('572ba6e4-4467-483e-bc29-b380fdc10027', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Resepsi', '2026-12-26 10:00:00', NULL, 'Kediaman Mempelai Pria', NULL, 'https://www.google.com/maps/place/7%C2%B023\'22.1%22S+111%C2%B009\'03.9%22E/@-7.3894701,111.1484947,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-7.3894701!4d111.1510696?hl=id&entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D', NULL, 2, '2026-10-22 08:22:06', '2026-10-22 08:22:17'),
('a757c3ab-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Akad Nikah', '2026-11-29 07:00:00', NULL, 'Kediaman perempuan , Mojorejo RT 12 Karanganom Sukodono Sragen', '', '', NULL, 1, '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('a757c53d-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Resepsi', '2026-11-29 09:00:00', NULL, 'Kediaman perempuan, Mojorejo RT 12 Karanganom Sukodono Sragen', '', '', NULL, 2, '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('ca16e7d0-577a-4f52-9cdb-c8ff46e9d5a0', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Akad Nikah', '2026-11-10 07:00:00', NULL, 'Rumah Mempelai Wanita', 'Genengan RT 08/RW 12, Mojosongo Jebres Surakarta', 'https://maps.app.goo.gl/NJ3VKLsp2CLPi53L8?g_st=ac', NULL, 1, '2026-10-29 04:21:23', '2026-10-29 13:36:37'),
('ef335e81-2b3e-40f3-8a47-54192fcbf546', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'Akad Nikah', '2026-11-14 08:00:00', '2026-11-14 09:00:00', 'Kediaman Mempelai Wanita', 'Mentir RT 09, Bener, Ngrampal, Sragen', 'https://www.google.com/maps/place/7%C2%B024\'59.9%22S+111%C2%B004\'08.2%22E/@-7.4165467,111.0676033,17.75z/data=!4m4!3m3!8m2!3d-7.4166274!4d111.0689316?hl=id&entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D', NULL, 0, '2026-10-24 05:06:44', '2026-10-24 05:07:29'),
('ef530a8b-3397-45ca-a1dd-609d783f5ef0', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Resepsi', '2027-02-28 10:00:00', '2027-02-28 14:00:00', 'Gedung Graha Wonosobo', 'Jl. A. Yani No. 25, Wonosobo, Jawa Tengah', 'https://maps.google.com/?q=Gedung+Graha+Wonosobo', NULL, 2, '2026-10-05 14:53:11', '2026-10-19 08:22:16');

-- --------------------------------------------------------

--
-- Struktur dari tabel `galleries`
--

CREATE TABLE `galleries` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `photo_url` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `galleries`
--

INSERT INTO `galleries` (`id`, `order_id`, `photo_url`, `caption`, `is_cover`, `sort_order`, `uploaded_at`, `updated_at`) VALUES
('06bdf19c-9728-49ac-a611-02b317fd70d5', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-5.jpg', NULL, 0, 4, '2026-10-29 05:29:11', '2026-10-29 05:29:11'),
('10096067-44c7-4ad0-98b8-e4ae68bc479b', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-6.jpg', NULL, 0, 5, '2026-10-29 05:29:11', '2026-10-29 05:29:11'),
('225cec68-1be8-4bd4-914c-0dc8ef6170b1', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-10.jpg', NULL, 0, 9, '2026-10-29 05:29:12', '2026-10-29 05:29:12'),
('481583fa-130f-4176-b5d7-a47d64a9d9d7', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-5.jpg', NULL, 0, 5, '2026-10-05 14:55:14', '2026-10-06 03:16:27'),
('4a5c6baf-8486-48ba-94b7-4ba9b95a7170', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-2.jpg', NULL, 0, 1, '2026-10-29 05:29:11', '2026-10-29 05:29:11'),
('4bf25d7b-3060-48ff-b31b-ba161fef39c7', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-1.jpg', NULL, 0, 11, '2026-10-29 09:07:45', '2026-10-29 09:07:45'),
('4cb18485-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-1.jpg', NULL, 0, 1, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb18caf-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-2.jpg', NULL, 0, 2, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb194b0-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-3.jpg', NULL, 0, 3, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb19b15-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-4.jpg', NULL, 0, 4, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb1a153-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-5.jpg', NULL, 0, 5, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb1e702-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-6.jpg', NULL, 0, 6, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb1eda4-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-7.jpg', NULL, 0, 7, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb1f42f-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-8.jpg', NULL, 0, 8, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb1faab-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-9.jpg', NULL, 0, 9, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('4cb20117-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', '/2027/ahmad-rizky/gallery/galeri-10.jpg', NULL, 0, 10, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('50aba09b-3432-419f-b632-6addc55776f3', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-9.jpg', NULL, 0, 9, '2026-10-19 10:16:28', '2026-10-19 10:16:28'),
('638031db-f2c6-4fdb-b000-4e41b7776f13', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-3.jpg', NULL, 0, 3, '2026-10-05 14:55:13', '2026-10-05 14:55:13'),
('6c806adb-be3d-4aeb-85d6-5d6e79bbac46', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-1.jpg', NULL, 0, 0, '2026-10-29 05:29:11', '2026-10-29 05:29:11'),
('7f915e1f-e568-49ce-82ed-82315a6f27dc', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-6.jpg', NULL, 0, 6, '2026-10-19 09:44:26', '2026-10-19 10:48:57'),
('91ec1648-5562-416d-b191-2677e90a8b81', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-7.jpg', NULL, 0, 6, '2026-10-29 05:29:12', '2026-10-29 05:29:12'),
('a0650b72-f419-4740-9920-4c7c95cc2135', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-9.jpg', NULL, 0, 8, '2026-10-29 05:29:12', '2026-10-29 05:29:12'),
('aa256803-f5c6-49c9-9c53-555510d140ef', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-3.jpg', NULL, 0, 2, '2026-10-29 05:29:11', '2026-10-29 05:29:11'),
('ab6a1800-94a7-47ca-9d86-e120d7235d69', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-10.jpg', NULL, 0, 10, '2026-10-19 10:16:28', '2026-10-19 10:16:28'),
('b3f0e84a-810a-4473-a79a-5ef4d2a7edaf', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-8.jpg', NULL, 0, 7, '2026-10-29 05:29:12', '2026-10-29 05:29:12'),
('baa5519b-aa05-4045-90a2-982122ef4d9d', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-1.jpg', NULL, 0, 1, '2026-10-05 14:55:13', '2026-10-17 05:36:33'),
('c0530757-bfee-4a0b-a10c-2a9d4acd13e0', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-7.jpg', NULL, 0, 7, '2026-10-19 10:16:27', '2026-10-19 10:16:27'),
('c9c27a1d-66bb-460c-b79a-28d02e9c5d61', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-8.jpg', NULL, 0, 8, '2026-10-19 10:16:27', '2026-10-19 10:16:27'),
('dedef16e-b997-482a-8326-a7b90c64f783', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-2.jpg', NULL, 0, 2, '2026-10-05 14:55:13', '2026-10-05 14:55:13'),
('e9bc984b-1696-4581-82df-543ae26729b2', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', '/2027/ruddy-suci/gallery/galeri-4.jpg', NULL, 0, 3, '2026-10-29 05:29:11', '2026-10-29 05:29:11'),
('fd20cc92-8472-4fc3-b8c8-4273249b2223', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', '/2027/ahmad-siti/gallery/galeri-4.jpg', NULL, 0, 4, '2026-10-05 14:55:14', '2026-10-05 14:55:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `livestreaming`
--

CREATE TABLE `livestreaming` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `youtube_url` varchar(500) NOT NULL,
  `stream_start` datetime DEFAULT NULL,
  `stream_end` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `livestreaming`
--

INSERT INTO `livestreaming` (`id`, `order_id`, `title`, `youtube_url`, `stream_start`, `stream_end`, `is_active`, `created_at`, `updated_at`) VALUES
('f4c430b8-fbe2-456c-9022-f699e9e4040c', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Live Streaming Pernikahan', 'https://www.youtube.com/@contohchannel', '2027-02-14 08:00:00', NULL, 1, '2026-10-05 14:53:11', '2026-10-05 14:53:11'),
('fcd05a4f-1f6e-4c8d-b8a5-d981f0d17a14', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Pernikahan Ruddy  & Suci', 'https://youtube.com/@himaproduction7537?si=Dpuyv7vpaFHM-Nwb', '2026-11-10 07:00:00', NULL, 1, '2026-10-29 04:32:00', '2026-10-29 04:32:00');

-- --------------------------------------------------------

--
-- Struktur dari tabel `love_stories`
--

CREATE TABLE `love_stories` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `title` varchar(150) NOT NULL,
  `content` text DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `story_date` date DEFAULT NULL,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `love_stories`
--

INSERT INTO `love_stories` (`id`, `order_id`, `title`, `content`, `photo_url`, `story_date`, `sort_order`, `created_at`, `updated_at`) VALUES
('22021a6a-90ec-47ed-8dec-a460d87bce5f', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Lamaran', 'Atas kehendak Allah swt serta restu dan doa dari orang tua dengan penuh keyakinan kami memutuskan April 2025 untuk melangkah lebih jauh dengan mengikat janji dengan komitmen yang lebih dalam', NULL, '2025-04-22', 3, '2026-10-22 08:25:59', '2026-10-22 08:45:49'),
('47b32a9e-8bd5-4f29-a317-169dfbed51da', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Pernikahan', 'Berjalannya waktu kita memutuskan untuk menuju ke jenjang pernikahan di tanggl 10 November 2026.\nTernyata cerita singkat kita mempunyai tujuan di pelabuhan yang sama usaha mu membuat ku percaya bahwa tanpa tanggl jadian itu bisa sampai di titik ini.', NULL, '2026-11-10', 3, '2026-10-29 04:29:43', '2026-10-29 05:49:54'),
('61dfcc82-c9ac-436e-9dc5-89025015d31b', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Awal Bertemu', 'Kami pertama kali bertemu dalam sebuah acara keluarga. Pertemuan sederhana itu menjadi awal dari kisah panjang yang membawa kami hingga hari ini.', NULL, '2023-06-10', 1, '2026-10-05 14:53:11', '2026-10-05 14:53:11'),
('6f0b517c-d239-46e3-97c3-830268dc63a9', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Lamaran', 'Setelah Kita Mengenal dan Meyakinkan diri masing-masing, Akhirnya kita membranikan diri untuk Malanjutkan ke jenjang yang lebih Serius di Tanggal ini.', NULL, '2026-05-03', 2, '2026-10-29 04:26:07', '2026-10-29 12:17:18'),
('757dd4b3-823a-4cb7-864a-1f4acbf77ff0', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Awal Perjalanan', 'Seiring berjalanannya waktu, kami belajar tentang menerima kekurangan, bertahan ditengah perbedaan sehingga mampu memahami satu sama lain. Memang bukan hubungan yang mudah, kami percaya cinta bukan hanya tentang rasa tetapi keputusan untuk tetap tinggal dan mencari jalan keluar bersama', NULL, '2023-11-24', 2, '2026-10-22 08:25:34', '2026-10-22 08:46:13'),
('79299592-9b3b-4c49-8f8b-5c1d0bf8e777', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Menikah', 'Dengan ridha Allah swt, 24 Desember 2026 kami memutuskan untuk mengikhrarkan janji pernikahan dimana hal tersebut menjadi awal perjalanan hidup dengan membuka bab baru yang kelak akan kami tulis dan warnai bersama. Dalam satu janji suci kami akan berjalan berdampingan melewati setiap langkah kehidupan dalan suka maupun duka.', NULL, '2026-12-24', 4, '2026-10-22 08:26:20', '2026-10-22 08:45:30'),
('87363c3b-dd24-11f1-92e5-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Pertemuan pertama', 'Tidak ada yang terjadi secara kebetulan didunia ini, semua sudah diatur Allah SWT kami tidak pernah menyangka bahwa pertemuan sederhana di tahun 2021menjadi awal dari perjalanan panjang yang membawa kami sampai dititik ini.seiring berjalannya waktu kedekatan itu tumbuh dengan sendirinya,Dari obrolan kecil yang sederhana perlahan hadir rasa nyaman yang membuat kami ingin mengenal lebih jauh hingga pada akhirnya pada tahun 2026 kami memutuskan untuk melangkah kedalam sebuah hubungan', NULL, '2021-12-07', 1, '2026-11-10 16:33:58', '2026-11-10 16:33:58'),
('873642d9-dd24-11f1-92e5-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Lamaran', 'Perjalanan kami bukan tanpa ujian dan cerita .Namun setiap proses yang kami lewati justru membawa kami semakin yakin satu sama lain sampai pada akhirnya pada Maret 2026 kami dipertemukan dalam sebuah ikatan yang penuh doa dan restu keluarga.', NULL, '2026-03-23', 2, '2026-11-10 16:33:58', '2026-11-10 16:33:58'),
('8736445c-dd24-11f1-92e5-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Pernikahan', 'Kami percaya bukan karena bertemu lalu berjodoh, tetapi karena berjodohlah maka Allah mempertemukan kami dengan cara terbaiknya dan penuh rasa syukur kami memutuskan untuk mengikrarkan janji suci pernikahan 29 November 2026', NULL, '2026-11-29', 3, '2026-11-10 16:33:58', '2026-11-10 16:33:58'),
('b9763ae3-6544-40bc-b1e0-5b3324169d69', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Pertama Bertemu di Kampus', 'Awal pertemuan kami yang tak di sengaja, di suatu perguruan tinggi yang sama di surakarta. Tidak ada perkenalan atau pun percakapan diantara kami', NULL, '2018-11-24', 1, '2026-10-22 08:24:34', '2026-10-22 08:43:27'),
('e7d7919e-fe0a-4786-b2bd-422493e673a2', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Mulai Serius', 'Setelah saling mengenal lebih dekat, kami memutuskan untuk menjalani hubungan dengan lebih serius dan saling mendukung dalam berbagai hal.', NULL, '2024-01-20', 2, '2026-10-05 14:53:11', '2026-10-05 14:53:11'),
('ee155860-9c82-4288-b3dc-f6e4c1a9854b', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Lamaran', 'Dengan restu kedua keluarga, kami memantapkan hati untuk melangkah ke jenjang pernikahan.', NULL, '2026-08-17', 3, '2026-10-05 14:53:11', '2026-10-05 14:53:11'),
('f2e47f24-f1e3-4989-ad82-0202775a9e84', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Awal Pertemuan', 'Awal kisah kami bertemu di saat Sesi Foto bersama. \nDari hal tersebut kita  Saling mengenal dan Memahami, Dalam waktu singkat dan Hanya Bertemu Tiga kali.', NULL, '2025-11-12', 1, '2026-10-29 04:23:29', '2026-10-29 05:50:10');

-- --------------------------------------------------------

--
-- Struktur dari tabel `music`
--

CREATE TABLE `music` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `title` varchar(150) NOT NULL,
  `artist` varchar(100) DEFAULT NULL,
  `audio_url` varchar(500) NOT NULL,
  `autoplay` tinyint(1) NOT NULL DEFAULT 0,
  `loop` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `music`
--

INSERT INTO `music` (`id`, `order_id`, `title`, `artist`, `audio_url`, `autoplay`, `loop`, `sort_order`, `created_at`, `updated_at`) VALUES
('16fa581c-d741-11f1-a270-d8bbc11ae103', '16fa4130-d741-11f1-a270-d8bbc11ae103', 'Kabagyan Sadewok ( )', 'Sadewok Official', 'https://content.permatawedding.com/uploads/music/kabagyan-sadewok.mp3', 0, 1, 1, '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('3b9cede6-cf68-11f1-95f3-d8bbc11ae103', '3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'Kabagyan Sadewok ( )', 'Sadewok Official', 'https://content.permatawedding.com/uploads/music/kabagyan-sadewok.mp3', 0, 1, 1, '2026-10-24 05:03:20', '2026-10-24 05:03:20'),
('4cb12917-d4d4-11f1-9488-d8bbc11ae103', '4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'Kabagyan', 'Permata Wedding', 'https://invitation.permatawedding.com/templates/assets/kabagyan.mp3', 0, 1, 1, '2026-10-31 02:39:31', '2026-10-31 02:39:31'),
('5bf50ae3-541d-42db-bb7e-1d9fe8d0618a', '550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'Safira Inema Sarining Kartika ( ) Mulat Kadyo Bethari, Linungguh Ing Padmasari (Trimmed)', 'Safira Inema [Official]', 'https://content.permatawedding.com/uploads/music/safira-inema-sarining-kartika-mulat-kadyo-bethari-linungguh-ing-padmasari-trimmed.mp3', 0, 1, 0, '2026-10-29 04:22:21', '2026-10-29 09:22:58'),
('721c5bf2-f8dd-4b8f-bb9e-51e02a024d7b', 'e5c3f394-803d-44f0-81fa-09eaf8c55286', 'Smaragita', 'Adif Marhaendra & Linda Adista', 'https://content.permatawedding.com/uploads/music/smaragita.mp3', 0, 1, 0, '2026-10-22 08:22:34', '2026-10-22 08:38:16'),
('a757c77c-d90e-11f1-9c1b-d8bbc11ae103', 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'Kabagyan Sadewok ( )', 'Sadewok Official', 'https://content.permatawedding.com/uploads/music/kabagyan-sadewok.mp3', 0, 1, 1, '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('cd176cf3-bf68-41b1-a0e0-cfe2a89de093', 'dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'Janji Suci', 'Yovie & Nuno', 'https://invitation.permatawedding.com/templates/assets/kabagyan.mp3', 1, 1, 1, '2026-10-05 14:53:11', '2026-10-20 04:10:41');

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_code` varchar(20) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `package_type` enum('basic','premium','exclusive') NOT NULL DEFAULT 'basic',
  `theme_id` char(36) DEFAULT NULL,
  `payment_status` enum('unpaid','paid','partial','cancelled') NOT NULL DEFAULT 'paid',
  `total_price` decimal(12,2) NOT NULL DEFAULT 100000.00,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `order_code`, `customer_name`, `customer_phone`, `package_type`, `theme_id`, `payment_status`, `total_price`, `order_date`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
('16fa4130-d741-11f1-a270-d8bbc11ae103', 'ORD-202611-0001', 'Ari Rahmat Ramadhan & Desti Rahmawati', '085950485179', 'premium', '2a224abe-0ac2-48c1-b069-ad993123b024', 'unpaid', 100000.00, '2026-11-03 04:43:18', 0, 'Gebang rt 04/16, Banjarsari, Banjarsari, Surakarta', '2026-11-03 04:43:18', '2026-11-03 04:43:18'),
('3b9ce250-cf68-11f1-95f3-d8bbc11ae103', 'ORD-202610-0005', 'Indra Bendot', '6289637718300', 'basic', '1b06f7e5-b6dc-4d17-8a6d-417a48e9a6a4', 'unpaid', 85000.00, '2026-10-24 05:03:20', 1, NULL, '2026-10-24 05:03:20', '2026-10-24 05:16:06'),
('4cb0b7d8-d4d4-11f1-9488-d8bbc11ae103', 'ORD-202610-0007', 'Adirian', '6282138957550', 'basic', '2a224abe-0ac2-48c1-b069-ad993123b024', 'unpaid', 85000.00, '2026-10-31 02:39:30', 1, NULL, '2026-10-31 02:39:30', '2026-10-31 02:40:15'),
('550e4a2f-5898-4181-96bd-bf9e58b1ce77', 'ORD-202610-0006', 'Suci Ovita Sari QA', '088902817456', 'basic', '2a224abe-0ac2-48c1-b069-ad993123b024', 'unpaid', 100000.00, '2026-10-29 05:17:30', 1, 'Ordar Via Qurrata Ayu Makeup', '2026-10-29 04:17:30', '2026-10-29 04:17:30'),
('a757b2c1-d90e-11f1-9c1b-d8bbc11ae103', 'ORD-202611-0002', 'Agung Prastiyo & Nur Safitri', '085741121196', 'premium', '2a224abe-0ac2-48c1-b069-ad993123b024', 'unpaid', 100000.00, '2026-11-05 11:47:18', 0, 'Kalidoro RT 29, Kedawung, Mondokan,Sragen', '2026-11-05 11:47:18', '2026-11-05 11:47:18'),
('dc67b4ea-3b85-471e-bdc6-afdb4ca4da87', 'ORD-202610-0004', 'Templates', '081234567890', 'basic', NULL, 'paid', 0.00, '2026-10-05 14:53:11', 1, 'Mohon dibuatkan undangan pernikahan dengan tema elegan.', '2026-10-05 14:53:11', '2026-10-24 04:38:05'),
('e5c3f394-803d-44f0-81fa-09eaf8c55286', 'ORD-202610-0003', 'Indra Bendot', '6289637718300', 'premium', '2a224abe-0ac2-48c1-b069-ad993123b024', 'unpaid', 85000.00, '2026-10-22 08:06:16', 1, NULL, '2026-10-22 08:06:16', '2026-10-24 03:49:56');

-- --------------------------------------------------------

--
-- Struktur dari tabel `testimonials`
--

CREATE TABLE `testimonials` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `rating` tinyint(4) NOT NULL DEFAULT 5,
  `photo_url` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `testimonials`
--

INSERT INTO `testimonials` (`id`, `order_id`, `customer_name`, `content`, `rating`, `photo_url`, `is_published`, `sort_order`, `created_at`, `updated_at`) VALUES
('1f3fcd53-ae5c-420e-a2cf-f547a2f9fbff', NULL, 'Sinta & irvan', 'Alhamdulillah senang banget,semua hasilnya sesuai req dan juga fast bgt respon nya  ..puassssss pwolll sama hasil karyanya\nTerimakasih banyak permata wedding🤗🤗', 5, NULL, 1, 0, '2026-09-16 08:53:18', '2026-09-18 02:23:59'),
('4156c15d-0f03-4141-a9c3-04e678d0f444', NULL, 'Deti & Aldo', 'Sangat puass dengan hasilnya dari permatawedding, trimakasihh permata wedding sudah membantu membuatkan undangan digital dengan baik. Semoga semakin sukses', 4, NULL, 1, 0, '2026-09-16 08:52:54', '2026-09-16 08:53:39'),
('7d37fac3-7afa-4884-807c-71c029eaffcd', NULL, 'Syarif & Yauta', 'Undangan digital yang dibuat sangat cantik dan mudah dibagikan. Semua tamu kami terkesan dengan desainnya. Prosesnya juga cepat dan responsif. Sangat recommended!', 5, NULL, 1, 0, '2026-09-16 08:52:19', '2026-09-16 08:53:45');

-- --------------------------------------------------------

--
-- Struktur dari tabel `themes`
--

CREATE TABLE `themes` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `name` varchar(100) NOT NULL,
  `preview_img` varchar(100) NOT NULL,
  `preview_url` varchar(255) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `themes`
--

INSERT INTO `themes` (`id`, `name`, `preview_img`, `preview_url`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
('1b06f7e5-b6dc-4d17-8a6d-417a48e9a6a4', 'Pink Elegance', '/templates/pink-elegance/thumbnail.webp', 'https://invitation.permata-wedding.my.id/januar-sundari/', 'minimalis', 1, '2026-10-23 05:36:32', '2026-10-23 05:36:32'),
('1e3df48b-1813-4803-be2b-8aa7969ac08f', 'Premium Eternal Luxe', '/templates/premium-eternal-luxe/thumbnail.png', 'https://invitation.permatawedding.com/templates/premium-eternal-luxe/', 'premium', 0, '2026-09-16 08:29:24', '2026-10-23 05:36:51'),
('2a224abe-0ac2-48c1-b069-ad993123b024', 'Premium Elegant Javanese', '/templates/premium-elegant-javanese/thumbnail.png', 'https://invitation.permatawedding.com/templates/premium-elegant-javanese', 'premium', 1, '2026-09-16 08:31:27', '2026-09-16 08:33:46'),
('78141ba3-fcd8-4220-9f58-d57c7ddf62ea', 'Premium Ivory Grace', 'https://invitation.permatawedding.com/templates/premium-ivory-grace/thumbnail.png', 'https://invitation.permatawedding.com/templates/premium-ivory-grace/', NULL, 0, '2026-10-22 05:44:41', '2026-10-23 05:37:03'),
('847bef73-4481-4e4e-b3fe-2674bf0016d8', 'Sakura Zen', '/templates/sakura-zen/thumbnail.png', 'https://invitation.permatawedding.com/templates/sakura-zen/', 'minimalis', 1, '2026-09-16 08:14:33', '2026-09-16 08:27:59');

-- --------------------------------------------------------

--
-- Stand-in struktur untuk tampilan `v_invitation_summary`
-- (Lihat di bawah untuk tampilan aktual)
--
CREATE TABLE `v_invitation_summary` (
`order_id` char(36)
,`order_code` varchar(20)
,`package_type` enum('basic','premium','exclusive')
,`is_active` tinyint(1)
,`theme_name` varchar(100)
,`slug_url` varchar(100)
,`cover_photo_url` varchar(255)
,`groom_name` varchar(150)
,`groom_nickname` varchar(50)
,`bride_name` varchar(150)
,`bride_nickname` varchar(50)
);

-- --------------------------------------------------------

--
-- Struktur untuk view `v_invitation_summary`
--
DROP TABLE IF EXISTS `v_invitation_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_invitation_summary`  AS SELECT `o`.`id` AS `order_id`, `o`.`order_code` AS `order_code`, `o`.`package_type` AS `package_type`, `o`.`is_active` AS `is_active`, `t`.`name` AS `theme_name`, `c`.`slug_url` AS `slug_url`, `c`.`cover_photo_url` AS `cover_photo_url`, `c`.`groom_name` AS `groom_name`, `c`.`groom_nickname` AS `groom_nickname`, `c`.`bride_name` AS `bride_name`, `c`.`bride_nickname` AS `bride_nickname` FROM ((`orders` `o` join `couples` `c` on(`c`.`order_id` = `o`.`id`)) left join `themes` `t` on(`t`.`id` = `o`.`theme_id`)) WHERE `o`.`is_active` = 1 ;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admins_username` (`username`);

--
-- Indeks untuk tabel `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comments_order` (`order_id`);

--
-- Indeks untuk tabel `couples`
--
ALTER TABLE `couples`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_couples_slug` (`slug_url`),
  ADD UNIQUE KEY `uq_couples_order` (`order_id`);

--
-- Indeks untuk tabel `digital_wallets`
--
ALTER TABLE `digital_wallets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_digital_wallets_order` (`order_id`);

--
-- Indeks untuk tabel `entertainment`
--
ALTER TABLE `entertainment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_entertainment_order` (`order_id`);

--
-- Indeks untuk tabel `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_events_order` (`order_id`);

--
-- Indeks untuk tabel `galleries`
--
ALTER TABLE `galleries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_galleries_order` (`order_id`);

--
-- Indeks untuk tabel `livestreaming`
--
ALTER TABLE `livestreaming`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_livestreaming_order` (`order_id`);

--
-- Indeks untuk tabel `love_stories`
--
ALTER TABLE `love_stories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_love_stories_order` (`order_id`);

--
-- Indeks untuk tabel `music`
--
ALTER TABLE `music`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_music_order` (`order_id`);

--
-- Indeks untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_orders_code` (`order_code`),
  ADD KEY `fk_orders_theme` (`theme_id`);

--
-- Indeks untuk tabel `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_testimonials_order` (`order_id`),
  ADD KEY `idx_testimonials_published` (`is_published`);

--
-- Indeks untuk tabel `themes`
--
ALTER TABLE `themes`
  ADD PRIMARY KEY (`id`);

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `fk_comments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `couples`
--
ALTER TABLE `couples`
  ADD CONSTRAINT `fk_couples_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `digital_wallets`
--
ALTER TABLE `digital_wallets`
  ADD CONSTRAINT `fk_digital_wallets_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `entertainment`
--
ALTER TABLE `entertainment`
  ADD CONSTRAINT `fk_entertainment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `fk_events_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `galleries`
--
ALTER TABLE `galleries`
  ADD CONSTRAINT `fk_galleries_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `livestreaming`
--
ALTER TABLE `livestreaming`
  ADD CONSTRAINT `fk_livestreaming_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `love_stories`
--
ALTER TABLE `love_stories`
  ADD CONSTRAINT `fk_love_stories_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `music`
--
ALTER TABLE `music`
  ADD CONSTRAINT `fk_music_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_theme` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
