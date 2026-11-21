<?php 
include '../D4t@bAs3.php'; 

if (!isset($conn)) {
    die("Koneksi database tidak tersedia!");
}

$filter_id = 1; // ID orders yang ingin difilter
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no, maximum-scale=1.0, user-scalable=no">
    <!-- Primary Meta Tags -->
    <title>Aldi & Menik</title>
    <meta name="title" content="Aldi & Menik" />
    <meta name="description" content="Wedding Invitation Aldi & Menik" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://invitation.permata-wedding.my.id/Aldi-Menik/" />
    <meta property="og:title" content="Aldi & Menik" />
    <meta property="og:description" content="Wedding Invitation Aldi & Menik" />
    <meta property="og:image" content="https://invitation.permata-wedding.my.id/Aldi-Menik/assets/img/bg/opening.jpg" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://invitation.permata-wedding.my.id/Aldi-Menik/" />
    <meta property="twitter:title" content="Aldi & Menik" />
    <meta property="twitter:description" content="Wedding Invitation Aldi & Menik" />
    <meta property="twitter:image" content="https://invitation.permata-wedding.my.id/Aldi-Menik/assets/img/bg/opening.jpg" />


    <!-- Favicon -->
    <link rel="icon" href="https://invitation.permata-wedding.my.id/Aldi-Menik/assets/img/bg/opening.jpg" type="image/jpeg">

    <!-- CSS  -->
    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous">
    <!-- Root-Icon -->
    <link rel="stylesheet" href="https://cdn.rootpixel.net/assets/rooticon/v2/rooticon.css">
    <!-- Glide -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/css/glide.core.min.css" integrity="sha512-YQlbvfX5C6Ym6fTUSZ9GZpyB3F92hmQAZTO5YjciedwAaGRI9ccNs4iw2QTCJiSPheUQZomZKHQtuwbHkA9lgw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/css/glide.theme.min.css" integrity="sha512-wCwx+DYp8LDIaTem/rpXubV/C1WiNRsEVqoztV0NZm8tiTvsUeSlA/Uz02VTGSiqfzAHD4RnqVoevMcRZgYEcQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- Lightgallery -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lightgallery-js/1.4.0/css/lightgallery.min.css" integrity="sha512-kwJUhJJaTDzGp6VTPBbMQWBFUof6+pv0SM3s8fo+E6XnPmVmtfwENK0vHYup3tsYnqHgRDoBDTJWoq7rnQw2+g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- Aos Animation on scroll -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <!-- App -->
    <link rel="stylesheet" href="assets/css/app.min.css">
</head>
<body class="opening-show">
<!-- <body> -->

    <section id="opening">
        <div class="container text-center" data-aos="fade-in" data-aos-duration="1500">
            <div class="text-dec text-dec-white mb-4">Wedding Invitation</div>
            <h2 class="font-type-secondary mb-2">Aldi Nugroho & Menik Makmurrutin</h2>
            <img src="assets/img/decoration/foliage-horizontal-1.svg" alt="" class="w-75 w-md-30rem my-3">

            <div class="mt-8 mb-2">Dengan rahmat Allah SWT, kami mengundang Bapak/Ibu/Saudara/i</div>
            <div class="fw-bold mb-2"><span id="guest"></span> </div>
            <div>untuk menghadiri pernikahan kami pada Minggu, 19 Oktober 2025</div>

            <div id="countdown-row" class="row justify-content-center mt-8 mb-5">
                <div class="col-auto">
                    <div class="text-sm fw-bold" data-days id="days">00</div>
                    <div class="text-sm fw-bold">HARI</div>
                </div>
                <div class="col-auto">
                    <div class="text-sm fw-bold" data-hours id="hours">00</div>
                    <div class="text-sm fw-bold">JAM</div>
                </div>
                <div class="col-auto">
                    <div class="text-sm fw-bold" data-minutes id="minutes">00</div>
                    <div class="text-sm fw-bold">MENIT</div>
                </div>
                <div class="col-auto">
                    <div class="text-sm fw-bold" data-seconds id="seconds">00</div>
                    <div class="text-sm fw-bold">DETIK</div>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-auto">
                    <button id="btn-open-opening" class="btn btn-primary">Buka Undangan</button>
                </div>
            </div>
        </div>
    </section>

    <nav class="navbar navbar-expand-md">
        <div class="container">
            <div class="navbar-brand px-0 d-md-none">
                <h4 class="font-type-secondary text-white">Our Invitation</h4>
            </div>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <h6 class="mb-0"><i class="ri ri-menu"></i></h6>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto">
                    <li class="nav-item">
                        <a class="nav-link page-scroll" href="#section-1">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link page-scroll" href="#section-2">Undangan</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link page-scroll"  href="#section-4">Cerita kami</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link page-scroll"  href="#section-5">Galeri</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link page-scroll"  href="#section-8">Hadiah</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link page-scroll"  href="#section-6">RSVP</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <header id="header">
        <div class="container py-10 text-white text-center">
            <h6 class="text-dec text-dec-white mb-4">Wedding Invitation</h6>
            <h1 class="font-type-secondary mb-2">Aldi Nugroho & Menik Makmurrutin</h1>
            <img src="assets/img/decoration/foliage-horizontal-1.svg" alt="" class="w-75 w-md-30rem mt-3" style="margin-bottom: 16rem;">
            
            <div class="row justify-content-center mb-8">
                <div class="col-auto">
                    <a href="#section-1" class="btn btn-primary page-scroll">Buka Undangan</a>
                </div>
            </div>
        </div>
    </header>

    <section id="section-1">
        <div class="container">
            <h2 class="font-type-secondary text-dark text-center mb-5 mb-lg-10" data-aos="fade-up" data-aos-duration="1000">Mohon Doa & Restu</h2>
            <div class="row g-0 justify-content-around justify-content-lg-center">
                <div class="col-md-auto order-2 order-lg-1 d-flex flex-column align-items-center d-md-block text-center text-md-start mb-10 mb-lg-0" data-aos="fade-right" data-aos-duration="1400">
                    <div class="img-wrapper img-wrapper-left mb-8">
                        <img src="assets/img/gallery/2.jpg" alt="">
                    </div>
                    <h3 class="font-type-secondary text-dark">Aldi Nugroho</h3>
                    <div class="text-md text-dark font-normal mb-3">Putra dari Bpk Suyatno & Ibu Sriyatun</div>
                    <p class="text-dark-500 font-light max-w-100 max-w-md-27rem">
                        Alamat: Siwalan, Blangu, Gesi, Sragen
                    </p>
                </div>
                <div class="col-lg-auto order-1 order-lg-2 d-flex justify-content-center align-items-center align-items-lg-start mb-10 mb-lg-0" data-aos="fade-up" data-aos-duration="1200">
                    <img src="assets/img/decoration/foliage-horizontal-2.svg" alt="" class="w-75 w-md-30rem">
                </div>
                <div class="col-md-auto order-3 d-flex flex-column align-items-center d-md-block text-center text-md-start" data-aos="fade-left" data-aos-duration="1400">
                    <div class="img-wrapper img-wrapper-right mb-8">
                        <img src="assets/img/gallery/1.jpg" alt="">
                    </div>
                    <h3 class="font-type-secondary text-dark">Menik Makmurrutin</h3>
                    <div class="text-md text-dark font-normal mb-3">Putri dari Bpk Suratman & Ibu Murtini</div>
                    <p class="text-dark-500 font-light max-w-100 max-w-md-27rem">
                        Alamat: Gumping, Blangu, Gesi, Sragen
                    </p>
                </div>
            </div>
        </div>
    </section>

    <section id="section-2" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="200">
        <div class="container d-flex flex-column align-items-center justify-content-center text-white text-center">
            <h2 class="font-type-secondary">Join us & Celebrate!</h2>
            <div class="text-lg text-spacing-default">Akad nikah & Resepsi</div>
            <div id="text-dec-section-2">
                <h2>A & M</h2>
            </div>
            
            <div class="row">
                <div class="col-auto">
                    <h6>Minggu, 19 Oktober 2025 <i class="ri ri-calendar ml-1"></i></h6>
                </div>
                <div class="col-auto font-light">|</div>
                <div class="col-auto">
                    <h6><i class="ri ri-calendar mr-1"></i> 07.00 WIB</h6>
                </div>
            </div>
            <h6 class="my-2">Rumah Mempelai Perempuan</h6>
            <div class="text-md">Gumping, Blangu, Gesi, Sragen</div>
            <!-- Tombol Google Maps -->
            <a href="https://maps.app.goo.gl/m2QHpaN3KxmdnDqg7"
               target="_blank"
               class="btn btn-primary mt-3">Google Maps</a>
        </div>
    </section>
    
    <section id="section-3">
        <div class="container">
            <div class="text-lg text-dark-500 text-center font-semibold mb-4" data-aos="fade-up" data-aos-duration="1000">
                “Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.”
            </div>
            <div class="text-lg text-dark-500 text-center font-light" data-aos="fade-up" data-aos-duration="1200">
                QS. Ar-Rum (30): 21
            </div>
        </div>
    </section>

    <section id="section-4">
        <div class="container text-dark-500">
            <div class="text-center mb-8">
                <h2 class="font-type-secondary">How we met?</h2>
                <div class="text-lg text-spacing-default my-2">Cerita kami</div>
                <img src="assets/img/decoration/foliage-horizontal-2.svg" alt="" class="w-75 w-md-30rem">
            </div>

            <div class="row overflow-hidden" id="section-3-row">
                <div class="col-lg">
                    <div id="section-3-card-1" class="card" data-aos="fade-right" data-aos-duration="1000">
                        <div class="card-body">
                            <div class="text-md text-dark mb-4">9 September 2024 - Pacaran</div>
                            <p class="text-dark-500">
                                Tapi siapa sangka, hari itu menjadi awal dari segalanya. 
                                Hari di mana dua hati yang sebelumnya berjalan sendiri akhirnya memilih untuk berjalan berdampingan.
                            </p>
                        </div>
                    </div>
                    <div id="section-3-card-3" class="card" data-aos="fade-right" data-aos-duration="1000">
                        <div class="card-body">
                            <div class="text-md text-dark mb-4">17 Mei 2025 - Lamaran</div>
                            <p class="text-dark-500">
                                Kami mengikat janji dalam sebuah lamaran hangat penuh haru. Bukan hanya antara dua insan, tapi juga dua keluarga. 
                                Hari itu, kami tidak hanya menyatukan niat, tapi juga restu.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-auto d-none d-lg-block">
                    <img src="assets/img/decoration/list-decoration-section-3.svg" alt="">
                </div>
                <div class="col-lg">
                    <div id="section-3-card-2" class="card" data-aos="fade-left" data-aos-duration="1000">
                        <div class="card-body">
                            <div class="text-md text-dark mb-4">19 Oktober 2025 - Pernikahan</div>
                            <p class="text-dark-500">
                                Kami akan mengikrarkan janji suci. Menjadi satu dalam cinta dan keyakinan. 
                                Bukan lagi "aku dan kamu", tapi "kita", untuk selamanya.
                            </p>
                        </div>
                    </div>
                    <div id="section-3-card-4" class="card" style="display: none;" data-aos="fade-left" data-aos-duration="1000">
                        <div class="card-body">
                            <div class="text-md text-dark mb-4">kami satu sekolah</div>
                            <p class="text-dark-500">
                                Malesuada nibh amet, dui lectus vitae nam malesuada arcu sagittis. Natoque viverra condimentum at condimentum dolor quis aliquam. At sed pellentesque rhoncus nascetur. Iaculis gravida euismod aliquet sed nunc id. Arcu hac eget 
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <section id="section-5">
        <div class="container text-dark text-center">
            <h2 class="font-type-secondary">Look at Our Happiness</h2>
            <div class="text-lg text-spacing-default my-2">Galeri</div>

            <div id="row-lightgallery" class="row g-4 mt-4 overflow-hidden">
                <div class="col-6 col-md-4" data-aos="fade-up" data-aos-duration="1000">
                    <div data-src="assets/img/gallery/1.jpg" class="obj-fit obj-fit-cover w-100 h-18rem h-sm-30rem h-lg-50rem">
                        <img src="assets/img/gallery/1.jpg" alt="">
                    </div>
                </div>
                <div class="col-6 col-md-4" data-aos="fade-up" data-aos-duration="1200">
                    <div data-src="assets/img/gallery/2.jpg"  class="obj-fit obj-fit-cover w-100 h-18rem h-sm-30rem h-lg-50rem">
                        <img src="assets/img/gallery/2.jpg" alt="">
                    </div>
                </div>
                <div class="col-6 col-md-4" data-aos="fade-up" data-aos-duration="1400">
                    <div data-src="assets/img/gallery/3.jpg"  class="obj-fit obj-fit-cover w-100 h-18rem h-sm-30rem h-lg-50rem">
                        <img src="assets/img/gallery/3.jpg" alt="">
                    </div>
                </div>
                <div class="col-6 col-md-4" data-aos="fade-up" data-aos-duration="1600">
                    <div data-src="assets/img/gallery/4.jpg" class="obj-fit obj-fit-cover w-100 h-18rem h-sm-30rem h-lg-50rem">
                        <img src="assets/img/gallery/4.jpg" alt="">
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Gift Section -->
    <section id="section-8" class="section bg-light">
        <div class="container text-dark-500">
            <div class="text-center mb-8">
                <h2 class="font-type-secondary">Hadiah Pernikahan</h2>
                <div class="text-md text-dark mb-4">Kehadiran dan doa Anda adalah hadiah terbaik bagi kami. Namun, jika Anda berkenan memberikan hadiah, berikut informasinya:</div>
                <img src="assets/img/decoration/foliage-horizontal-2.svg" alt="" class="w-75 w-md-30rem">
            </div>
        <div class="container">
            <div class="row justify-content-center">                
                <div class="col-md-5 mb-4" data-aos="fade-up" data-aos-delay="100" data-aos-offset="-350">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body text-center p-4">
                            <h4 class="font-type-secondary">Amplop Digital</h4>
                            <p class="text-dark-500">Anda juga dapat memberikan hadiah melalui:</p>
                            <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-3">
                                <p class="mb-0 fw-bold">BRI</p>
                                <p class="mb-0">014001132515503</p>
                            </div>
                            <p class="fw-bold">a.n. Menik Makmurrutin</p>
                            <button class="btn btn-sm btn-outline-custom copy-text text-dark-500" data-text="014001132515503">
                                 Salin Rekening
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="section-6">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="text-center mb-8">
                        <p class="text-dark-500 mb-8">
                            Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga apabila Bapak/Ibu/Saudara/i <br class="d-none d-lg-block">
                            berkenan hadir untuk memeriahkan acara pernikahan kami, terima kasih.
                        </p>
                        <h2 class="font-type-secondary text-dark">Will You Attend</h2>
                        <div class="text-md text-dark mb-4">RSVP</div>
                    </div>

                    <!-- form -->
<form id="form-komentar" method="POST">
    <input type="hidden" name="id_orders" value="<?php echo htmlspecialchars($filter_id); ?>">

    <div class="mb-5">
        <label class="form-label">Nama Anda</label>
        <input id="name" type="text" class="form-control"
            placeholder="Nama lengkap" name="name" required>
    </div>

    <div class="mb-5">
        <label class="form-label">Bersedia hadir di acara kami?</label>
        <select class="form-select" name="attendance" required>
            <option selected disabled>Pilih salah satu</option>
            <option value="1">Ya</option>
            <option value="0">Tidak</option>
        </select>
    </div>

    <div class="mb-5">
        <label class="form-label">Kirim ucapan</label>
        <textarea name="greeting" cols="30" rows="5" 
        class="form-control" placeholder="Anda bisa menuliskan ucapan selamat dan doa"></textarea>
    </div>

    <div class="row justify-content-center">
        <div class="col-auto">
            <button class="btn btn-primary" type="submit" name="submit">Kirim</button>
        </div>
    </div>
</form>

                    <!-- end of form -->
                </div>
            </div>
        </div>
    </section>

    <section id="section-7">
        <div class="container px-1">
            <div class="row gx-0 align-items-center justify-content-between position-relative glide">
                <div class="col-auto glide__arrows" style="left: 0;" data-glide-el="controls">
                    <h6 class="csr-pointer" data-glide-dir="<"><i class="ri ri-chevron-left text-dark-500"></i></h6>
                </div>
                
<div id="komentar-list">
    <?php include 'get_komentar.php'; ?>
</div>

                <div class="col-auto glide__arrows" style="right: 0;" data-glide-el="controls">
                    <h6 class="csr-pointer" data-glide-dir=">"><i class="ri ri-chevron-right text-dark-500"></i></h6>
                </div>
            </div>
        </div>
    </section>

<footer id="footer">
  <div class="container">
    <div class="row align-items-center text-center text-md-start">
      <div class="col-md mb-2 mb-md-0">
        <span class="fw-semibold">Aldi &amp; Menik</span><br>
        <span class="fw-semibold">Terima kasih atas doa dan kehadiran Anda dalam momen bahagia kami</span>
      </div>
      <div class="col-md-auto text-center text-md-end">
        <small>© 2025 Permata Wedding</small>
      </div>
    </div>
  </div>
</footer>


    <button id="btn-play" class="btn btn-light">
        <i class="ri ri-volume-high"></i>
    </button>
    <a href="#header" id="btn-to-top" class="btn btn-light page-scroll  ">
        <i class="ri ri-arrow-up"></i>
    </a>

    <audio controls id="audio" class="d-none">
        <source src="assets/music.mp3" type="audio/mpeg">
        <!-- Your browser does not support the audio element. -->
    </audio>

    <!-- JS -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <!-- Bootstrap -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-gtEjrD/SeCtmISkJkNUaaKMoLD0//ElJ19smozuHV6z3Iehds+3Ulb9Bn9Plx0x4" crossorigin="anonymous"></script>
    <!-- Lightgallery -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lightgallery-js/1.4.0/js/lightgallery.min.js" integrity="sha512-b4rL1m5b76KrUhDkj2Vf14Y0l1NtbiNXwV+SzOzLGv6Tz1roJHa70yr8RmTUswrauu2Wgb/xBJPR8v80pQYKtQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- Countdown -->
    <script src="https://cdn.jsdelivr.net/npm/timezz@6.1.0/dist/timezz.min.js"></script>
    <!-- Glide -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/glide.min.js" integrity="sha512-IkLiryZhI6G4pnA3bBZzYCT9Ewk87U4DGEOz+TnRD3MrKqaUitt+ssHgn2X/sxoM7FxCP/ROUp6wcxjH/GcI5Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- Aos Animation os scroll -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <!-- Anime js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js" integrity="sha512-z4OUqw38qNLpn1libAN9BsoDx6nbNFio5lA6CuTp9NlK83b89hgyCVq+N5FdBJptINztxn1Z3SaKSKUS5UP60Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- App -->
    <script src="assets/js/app.js"></script>
    <script async defer src="https://analytic.mbalakcreative.my.id/tracker.js" data-website-id="cmgkbl7zs0008vayzh6pu77wf"></script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  timezz("#countdown-row", {
    date: "october 19, 2025 07:00:00", // format harus english month
    update: function (event) {
      document.getElementById("days").textContent = String(event.days).padStart(2, "0");
      document.getElementById("hours").textContent = String(event.hours).padStart(2, "0");
      document.getElementById("minutes").textContent = String(event.minutes).padStart(2, "0");
      document.getElementById("seconds").textContent = String(event.seconds).padStart(2, "0");
    },
    complete: function () {
      document.getElementById("countdown-row").innerHTML =
        "<div class='col-auto fw-bold'>Acara Sedang Berlangsung!</div>";
    }
  });
});

        // Copy to clipboard functionality
        document.querySelectorAll('.copy-text').forEach(button => {
            button.addEventListener('click', function() {
                const text = this.getAttribute('data-text');
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fa fa-check me-1"></i> Tersalin';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                });
            });
        });

            // Ambil parameter dari URL dan isi ke dalam input dan elemen teks
    window.addEventListener('load', function() {
        const urlParams = new URLSearchParams(window.location.search);
        let guestName = urlParams.get('kepada');

        if (guestName) {
            guestName = guestName.replace(/_/g, ' ');

            // Isi ke dalam elemen dengan ID 'guest-name' (jika ada)
            const guestNameElement = document.getElementById('guest');
            if (guestNameElement) {
                guestNameElement.textContent = guestName;
            }

            // Isi ke dalam input field dengan ID 'name'
            const nameInput = document.getElementById('name');
            if (nameInput) {
                nameInput.value = guestName;
            }
        }
    });

$(document).ready(function(){
  $("#form-komentar").on("submit", function(e){
    e.preventDefault();

    $.ajax({
      url: "simpan_komentar.php",
      type: "POST",
      data: $(this).serialize(),
      success: function(res){
        $("#form-komentar")[0].reset();    // reset form
        // reload komentar dengan id_orders
        $("#komentar-list").load("get_komentar.php?id_orders=<?= (int)$filter_id ?>", function(){
          new Glide('.glide', { type: 'carousel', perView: 1 }).mount();
        });
      },
      error: function(){
        alert("Gagal menyimpan komentar.");
      }
    });
  });
});
</script>

</body>
</html>
