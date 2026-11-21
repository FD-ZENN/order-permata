<?php
return [

    'gowa_base_url' => 'http://103.91.149.145:3000',
    'gowa_device_id' => 'permatawedding',
    'gowa_basic_auth_user' => 'zenx',
    'gowa_basic_auth_pass' => 'botrahasiakita',
    'webhook_secret' => '',
    'dashboard_password' => 'PermataWedding1',
    'db_path' => __DIR__ . '/storage/messages.sqlite',
    'invitation_api_url' => 'https://invitation.permatawedding.com/api/API',
    'invitation_web_url' => 'https://invitation.permatawedding.com',
    'admin_notify_group' => '6282242204889-1481086867@g.us',
    'auto_reply_invitation' => true,
    'working_hours' => [
        'enabled'                => true,
        'timezone'               => 'Asia/Jakarta',
        'start_hour'             => '08:00', 
        'end_hour'               => '17:00',
        'work_days'              => [1, 2, 3, 4, 5, 6], 
        'reply_interval_minutes' => 120, 
        'offline_reply'          => "Halo Kak! Terima kasih sudah menghubungi Permata Wedding.\n\nSaat ini admin kami sedang di luar jam operasional (Jam operasional: Senin - Sabtu, 08.00 - 17.00 WIB).\nPesan Kakak sudah kami terima dan akan segera kami balas begitu jam kerja aktif kembali.\n\nKatalog tema undangan digital dapat dilihat di:\nhttps://invitation.permatawedding.com\n\nTerima kasih atas pengertiannya!",
    ],
    'menu_bot' => [
        'enabled'          => true,
        'trigger_keywords' => ['menu', 'halo', 'hai', 'p', 'bantuan', 'info', 'mulai'],
        'welcome_message'  => "Halo Kak! Selamat datang di layanan WhatsApp Permata Wedding.\n\nSilakan balas dengan mengetik nomor pilihan di bawah ini:\n\n1. Info Paket & Harga Undangan\n2. Cek Link Undangan Saya\n3. Format Form Pemesanan Undangan\n4. Konsultasi / Tunggu Balasan Admin",
        'options' => [
            '1' => "Pilihan Paket Undangan Digital Permata Wedding:\n\n*Paket Basic* (Rp 100.000)\n- Desain Elegan, Countdown, Peta Google Maps, Form Ucapan\n\n*Paket Premium*\n- Semua fitur Basic + Galeri 10 foto, Musik, Love Story, Amplop Digital\n\n*Paket Exclusive*\n- Semua fitur Premium + Live Streaming YouTube & RSVP Tamu\n\nKatalog lengkap: https://invitation.permatawedding.com",
            '2' => '__AUTO_INVITATION__', // Otomatis dicek ke API/DB undangan berdasarkan nomor HP pengirim
            '3' => "Untuk pemesanan undangan digital, silakan melengkapi data berikut:\n\n1. Nama Lengkap & Panggilan Mempelai (Pria & Wanita)\n2. Nama Orang Tua Kedua Mempelai\n3. Hari, Tanggal, Jam & Tempat Akad serta Resepsi\n4. Alamat Lengkap / Shareloc Google Maps\n5. Nomor Rekening / E-Wallet (jika ada amplop digital)\n6. Foto-foto untuk galeri",
            '4' => "Baik Kak, pesan Anda sudah masuk ke antrian pesan masuk. Admin kami akan segera membalas chat ini. Mohon ditunggu ya Kak!",
        ],
    ],

    'auto_replies' => [
        'jam operasional' => "Jam operasional kami: Senin-Sabtu, 08.00-17.00 WIB.",
    ],

    'quick_templates' => [
        'sapaan' => [
            'label' => 'Sapaan Awal',
            'text'  => "Halo Kak! Terima kasih sudah menghubungi *Permata Wedding*.\nAda yang bisa kami bantu seputar pembuatan atau informasi undangan digital pernikahan?",
        ],
        'paket' => [
            'label' => 'Info Paket & Harga',
            'text'  => "Halo Kak, berikut pilihan paket undangan digital *Permata Wedding*:\n\n"
                     . "*Paket Basic* (Rp 100.000)\n- Desain Elegan & Responsif\n- Hitung Mundur (Countdown)\n- Peta Lokasi Google Maps\n- Form Ucapan & Doa Tamu\n\n"
                     . "*Paket Premium*\n- Semua fitur Basic\n- Galeri Foto (hingga 10 foto)\n- Background Musik Pilihan\n- Love Story Timeline\n- Amplop Digital (Bank / E-Wallet)\n\n"
                     . "*Paket Exclusive*\n- Semua fitur Premium\n- Integrasi Live Streaming YouTube\n- Reservasi Kehadiran Tamu (RSVP)\n- Teks Undangan Custom Tamu (Nama Tamu Otomatis)\n\n"
                     . "Katalog tema selengkapnya dapat dilihat di:\nhttps://invitation.permatawedding.com",
        ],
        'form_data' => [
            'label' => 'Form Data Pemesanan',
            'text'  => "Untuk pembuatan undangan digital, silakan lengkapi data berikut ya Kak:\n\n"
                     . "1. Nama Lengkap & Panggilan Pria:\n"
                     . "2. Nama Orang Tua Pria (Bapak & Ibu):\n"
                     . "3. Nama Lengkap & Panggilan Wanita:\n"
                     . "4. Nama Orang Tua Wanita (Bapak & Ibu):\n"
                     . "5. Hari, Tanggal, Jam & Tempat Akad Nikah:\n"
                     . "6. Hari, Tanggal, Jam & Tempat Resepsi:\n"
                     . "7. Alamat Lengkap & Shareloc Google Maps:\n"
                     . "8. Nomor Rekening/E-wallet (opsional untuk amplop digital):\n"
                     . "9. Foto mempelai & galeri (bisa kirim via dokumen WhatsApp)\n\n"
                     . "Jika ada request khusus silakan disampaikan ya Kak.",
        ],
        'pembayaran' => [
            'label' => 'Konfirmasi Pembayaran',
            'text'  => "Terima kasih atas pembayarannya Kak! Pembayaran sudah kami terima dengan baik.\n\n"
                     . "Pesanan undangan digital Anda saat ini sedang dalam proses pengerjaan (estimasi 1-2 hari kerja). Nanti link preview akan kami kirimkan ke chat ini ya Kak.",
        ],
        'undangan_siap' => [
            'label' => 'Undangan Sudah Jadi',
            'text'  => "Halo Kak! Undangan digital pernikahan Anda sudah selesai dan aktif.\n\n"
                     . "Silakan dicek link undangannya di bawah ini ya:\n"
                     . "{INVITATION_URL}\n\n"
                     . "Silakan diperiksa kembali penulisan nama, tanggal, dan lokasi acaranya. Jika ada bagian yang perlu direvisi, langsung infokan ke kami ya Kak.\n\n"
                     . "Untuk mempermudah pengiriman undangan, bisa menggunakan link berikut ya kak :\n\n"
                     . "{KIRIM_URL}\n\n"
                     . "Link tersebut bisa digunakan untuk mengirim undangan melalui WhatsApp, Instagram, Facebook, maupun Messenger.\n\n"
                     . "Terima kasih banyak!",
        ],
        'link_kirim' => [
            'label' => 'Link Kirim Tamu',
            'text'  => "Untuk mempermudah pengiriman undangan, bisa menggunakan link berikut ya kak :\n\n"
                     . "{KIRIM_URL}\n\n"
                     . "Link tersebut bisa digunakan untuk mengirim undangan melalui WhatsApp, Instagram, Facebook, maupun Messenger.",
        ],
        'terima_kasih' => [
            'label' => 'Terima Kasih',
            'text'  => "Sama-sama Kak! Semoga seluruh rangkaian acara pernikahan berjalan lancar dan penuh berkah. Jangan ragu menghubungi kami kembali jika membutuhkan bantuan ya Kak.",
        ],
    ],
];
