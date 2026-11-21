/**
 * CDN Permata Wedding - Main Application JavaScript
 * cdn.permatawedding.com
 */

class PermataCdnApp {
    constructor() {
        this.musicList = [];
        this.videoList = [];
        this.currentPlayingId = null;
        this.currentAudioEl = null;
        this.activeTab = 'music';
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadMusicList();
        this.loadVideoList();
        this.loadApiStats();

        // Initialize Audio Studio
        if (window.audioStudio) {
            window.audioStudio.init();
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-tab-btn');
        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                this.switchTab(target);
            });
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;

        // Update Nav button states
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        // Update Tab Panes
        document.querySelectorAll('.tab-content-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabId}`);
        });

        if (tabId === 'music') {
            this.loadMusicList();
        } else if (tabId === 'videos') {
            this.loadVideoList();
        }
    }

    setupEventListeners() {
        // Search inputs
        const musicSearch = document.getElementById('musicSearchInput');
        if (musicSearch) {
            musicSearch.addEventListener('input', (e) => this.filterMusic(e.target.value));
        }

        // Category pill filters (from invitation gallery)
        document.querySelectorAll('.category-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedCategory = btn.getAttribute('data-category');
                const query = document.getElementById('musicSearchInput')?.value || '';
                this.filterMusic(query);
            });
        });

        const videoSearch = document.getElementById('videoSearchInput');
        if (videoSearch) {
            videoSearch.addEventListener('input', (e) => this.filterVideos(e.target.value));
        }

        // Import URL Modal
        const importBtn = document.getElementById('openImportModalBtn');
        const importModal = document.getElementById('importModal');
        const closeImportBtn = document.getElementById('closeImportModalBtn');
        const importForm = document.getElementById('importForm');

        if (importBtn && importModal) {
            importBtn.addEventListener('click', () => importModal.classList.add('active'));
        }
        if (closeImportBtn && importModal) {
            closeImportBtn.addEventListener('click', () => importModal.classList.remove('active'));
        }
        if (importForm) {
            importForm.addEventListener('submit', (e) => this.handleImportSubmit(e));
        }

        // Upload Form Modal
        const uploadBtn = document.getElementById('openUploadModalBtn');
        const uploadModal = document.getElementById('uploadModal');
        const closeUploadBtn = document.getElementById('closeUploadModalBtn');
        const uploadForm = document.getElementById('uploadForm');

        if (uploadBtn && uploadModal) {
            uploadBtn.addEventListener('click', () => uploadModal.classList.add('active'));
        }
        if (closeUploadBtn && uploadModal) {
            closeUploadBtn.addEventListener('click', () => uploadModal.classList.remove('active'));
        }

        // Drag and drop upload zone
        const dropZone = document.getElementById('uploadDropZone');
        const fileInput = document.getElementById('uploadFileInput');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    this.handleFileSelected(fileInput.files[0]);
                }
            });
        }

        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUploadSubmit(e));
        }

        // Close Studio Modal
        const closeStudioBtn = document.getElementById('closeStudioModalBtn');
        if (closeStudioBtn) {
            closeStudioBtn.addEventListener('click', () => {
                if (window.audioStudio) window.audioStudio.closeStudio();
            });
        }

        // Copy Base API endpoint
        const copyApiBtn = document.getElementById('copyBaseApiBtn');
        if (copyApiBtn) {
            copyApiBtn.addEventListener('click', () => {
                const apiUrl = copyApiBtn.getAttribute('data-url');
                this.copyToClipboard(apiUrl, 'Endpoint API Musik berhasil disalin!');
            });
        }

        // API Test Playground
        const testApiBtn = document.getElementById('runApiTestBtn');
        if (testApiBtn) {
            testApiBtn.addEventListener('click', () => this.runApiTest());
        }
    }

    handleFileSelected(file) {
        const nameEl = document.getElementById('selectedFileName');
        const sizeEl = document.getElementById('selectedFileSize');
        const detailsEl = document.getElementById('selectedFileDetails');
        const titleInput = document.getElementById('uploadTitleInput');

        if (detailsEl) detailsEl.style.display = 'flex';
        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = this.formatBytes(file.size);

        if (titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
            let clean = file.name.replace(/\.[^/.]+$/, "");
            clean = clean.replace(/(ytdown[\s\.\-_]*com|snaptube|yt1s[\s\.\-_]*com|mp3cut[\s\.\-_]*net|youtube[\s\.\-_]*media|official[\s\.\-_]*(music)?[\s\.\-_]*video|\b\d{2,3}k\b|[a-zA-Z0-9]{11}|\(mp3cut\.net\))/gi, " ");
            
            const artistInput = document.getElementById('uploadArtistInput');
            if (clean.includes(' - ')) {
                const parts = clean.split(' - ');
                if (artistInput && !artistInput.value) {
                    artistInput.value = parts[1].replace(/[-_.]+/g, " ").trim();
                }
                clean = parts[0];
            }
            clean = clean.replace(/[-_.]+/g, " ").replace(/\s+/g, " ").trim();
            if (clean) {
                titleInput.value = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }
        }
    }

    async handleUploadSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const fileInput = document.getElementById('uploadFileInput');
        if (!fileInput.files.length) {
            alert('Silakan pilih file audio atau video terlebih dahulu.');
            return;
        }

        const progressBar = document.getElementById('uploadProgressBar');
        const progressContainer = document.getElementById('uploadProgressContainer');
        const submitBtn = document.getElementById('uploadSubmitBtn');

        if (progressContainer) progressContainer.style.display = 'block';
        if (submitBtn) submitBtn.disabled = true;

        const formData = new FormData(form);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'api/upload.php', true);

            xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable && progressBar) {
                    const percent = Math.round((evt.loaded / evt.total) * 100);
                    progressBar.style.width = percent + '%';
                    progressBar.textContent = percent + '%';
                }
            };

            xhr.onload = () => {
                if (submitBtn) submitBtn.disabled = false;
                if (progressContainer) progressContainer.style.display = 'none';

                try {
                    const res = JSON.parse(xhr.responseText);
                    if (xhr.status === 200 && res.status === 'success') {
                        document.getElementById('uploadModal').classList.remove('active');
                        form.reset();
                        document.getElementById('selectedFileDetails').style.display = 'none';
                        this.showToast('Asset berhasil diunggah ke CDN!', 'success');

                        if (res.type === 'music') {
                            this.switchTab('music');
                            this.loadMusicList();
                        } else {
                            this.switchTab('videos');
                            this.loadVideoList();
                        }
                    } else {
                        alert('Upload gagal: ' + (res.message || 'Error tidak diketahui'));
                    }
                } catch (err) {
                    alert('Respons server tidak valid: ' + xhr.responseText);
                }
            };

            xhr.onerror = () => {
                if (submitBtn) submitBtn.disabled = false;
                if (progressContainer) progressContainer.style.display = 'none';
                alert('Terjadi kesalahan jaringan saat upload.');
            };

            xhr.send(formData);

        } catch (err) {
            if (submitBtn) submitBtn.disabled = false;
            console.error('Upload error:', err);
            alert('Upload error: ' + err.message);
        }
    }

    /**
     * Handle Import from URL (TikTok, YouTube, or Direct MP3/M4A)
     */
    async handleImportSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const urlInput = document.getElementById('importUrlInput');
        const url = urlInput ? urlInput.value.trim() : '';

        if (!url) {
            alert('Silakan masukkan URL sumber media terlebih dahulu.');
            return;
        }

        const submitBtn = document.getElementById('importSubmitBtn');
        const progressContainer = document.getElementById('importProgressContainer');
        const progressBar = document.getElementById('importProgressBar');
        const progressText = document.getElementById('importProgressText');

        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite; display: inline-block;"></i> Mengunduh...';
        }
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        if (progressBar) {
            progressBar.style.width = '30%';
        }
        if (progressText) {
            progressText.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite; display: inline-block;"></i> Menghubungkan ke server sumber...';
        }

        let progressInterval = setInterval(() => {
            if (progressBar) {
                let currentWidth = parseInt(progressBar.style.width) || 30;
                if (currentWidth < 85) {
                    progressBar.style.width = (currentWidth + 10) + '%';
                }
            }
        }, 700);

        const formData = new FormData(form);

        try {
            const response = await fetch('api/import-url.php', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            if (progressBar) progressBar.style.width = '100%';

            const res = await response.json();

            if (response.ok && res.status === 'success') {
                this.showToast(res.message || 'Media berhasil diimpor ke CDN!', 'success');
                document.getElementById('importModal')?.classList.remove('active');
                form.reset();

                // Reload music and stats
                this.switchTab('music');
                await this.loadMusicList();
                this.loadApiStats();
            } else {
                alert('Import Gagal: ' + (res.message || 'Terjadi kesalahan pada server.'));
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Import error:', err);
            alert('Terjadi kesalahan jaringan atau server saat mengimpor: ' + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
            if (progressContainer) {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    if (progressBar) progressBar.style.width = '0%';
                }, 400);
            }
        }
    }

    /**
     * Load music list from API
     */
    async loadMusicList() {
        const container = document.getElementById('musicListContainer');
        const emptyState = document.getElementById('musicEmptyState');
        const countBadge = document.getElementById('musicCountBadge');

        if (!container) return;

        try {
            const res = await fetch('api/music.php?manage=1');
            const data = await res.json();

            if (data.status === 'success') {
                this.musicList = data.data;
                if (countBadge) countBadge.textContent = `${this.musicList.length} Lagu`;
                this.renderMusicList(this.musicList);
                this.updateStats();
            }
        } catch (err) {
            console.error('Failed to load music list:', err);
        }
    }

    renderMusicList(tracks) {
        const container = document.getElementById('musicListContainer');
        const emptyState = document.getElementById('musicEmptyState');

        if (!container) return;
        container.innerHTML = '';

        if (!tracks || tracks.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'media-card';
            card.id = `track-${track.id}`;

            card.innerHTML = `
                <div class="media-card-body">
                    <div class="media-play-icon" role="button" aria-label="Play Track">
                        <i class="bi bi-play-fill" id="playIcon-${this.escapeHtml(track.id)}"></i>
                    </div>

                    <div class="media-info">
                        <div class="media-header-row">
                            <div>
                                <h4 class="media-title" title="${this.escapeHtml(track.name)}">${this.escapeHtml(track.name)}</h4>
                                ${track.artist ? `<div class="media-artist" style="font-size: 0.85rem; color: var(--brand-rose); font-weight: 600; margin-top: 2px;"><i class="bi bi-mic-fill" style="font-size: 0.78rem;"></i> ${this.escapeHtml(track.artist)}</div>` : ''}
                            </div>
                            <span class="badge badge-category">${this.escapeHtml(track.category || 'Romantic')}</span>
                        </div>

                        <div class="media-meta-row">
                            <span class="meta-item"><i class="bi bi-clock"></i> ${this.escapeHtml(track.duration)}</span>
                            <span class="meta-item"><i class="bi bi-hdd"></i> ${this.escapeHtml(track.size)}</span>
                            <span class="meta-item badge-bitrate"><i class="bi bi-soundwave"></i> ${this.escapeHtml(track.bitrate || '128 kbps')}</span>
                        </div>

                        <!-- Mini Audio Player Element -->
                        <div class="mini-player-wrapper" id="playerWrap-${this.escapeHtml(track.id)}" style="display: none;">
                            <audio id="audio-${this.escapeHtml(track.id)}" src="${this.escapeHtml(track.url)}" preload="none"></audio>
                            <div class="player-progress-bar">
                                <div class="player-progress-fill" id="progressFill-${this.escapeHtml(track.id)}"></div>
                            </div>
                            <div class="player-time-row">
                                <span id="timeCurrent-${this.escapeHtml(track.id)}">00:00</span>
                                <span id="timeTotal-${this.escapeHtml(track.id)}">${this.escapeHtml(track.duration)}</span>
                            </div>
                        </div>

                        <div class="media-url-box">
                            <input type="text" readonly value="${this.escapeHtml(track.url)}" class="media-url-input" id="url-${this.escapeHtml(track.id)}">
                            <button class="preview-btn btn-copy-url" style="padding: 4px 14px; font-size: 0.8rem;" title="Salin URL CDN">
                                <i class="bi bi-clipboard"></i> Salin URL
                            </button>
                        </div>
                    </div>

                    <div class="media-actions">
                        <button class="preview-btn btn-open-studio" title="Buka Studio Potong, Fade & Kompres">
                            <i class="bi bi-scissors"></i> Potong & Fade
                        </button>
                        <div class="dropdown-actions">
                            <button class="btn-icon-subtle btn-menu-toggle" aria-label="Menu Opsi">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <div class="action-menu-dropdown" id="actionMenu-${this.escapeHtml(track.id)}">
                                <a href="javascript:void(0)" class="btn-copy-tag">
                                    <i class="bi bi-code-slash"></i> Salin Tag &lt;audio&gt;
                                </a>
                                <a href="javascript:void(0)" class="btn-edit-title">
                                    <i class="bi bi-pencil"></i> Edit Judul & Artist
                                </a>
                                <a href="${this.escapeHtml(track.url)}" download class="text-success">
                                    <i class="bi bi-download"></i> Unduh File MP3
                                </a>
                                <a href="javascript:void(0)" class="btn-delete-track text-danger">
                                    <i class="bi bi-trash"></i> Hapus Asset
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Anti-XSS Event Bindings
            card.querySelector('.media-play-icon').addEventListener('click', () => this.togglePlayTrack(track.id));
            card.querySelector('.btn-copy-url').addEventListener('click', () => this.copyToClipboard(track.url, 'Direct URL CDN lagu berhasil disalin!'));
            card.querySelector('.btn-open-studio').addEventListener('click', () => this.openStudio(track.id));
            card.querySelector('.btn-menu-toggle').addEventListener('click', () => this.toggleActionMenu(track.id));
            card.querySelector('.btn-copy-tag').addEventListener('click', () => this.copyHtmlTag(track.url, track.name));
            card.querySelector('.btn-edit-title').addEventListener('click', () => this.editTrackDetails(track));
            card.querySelector('.btn-delete-track').addEventListener('click', () => this.deleteAsset(track.id, 'music'));

            container.appendChild(card);
            this.setupAudioListeners(track.id);
        });
    }

    setupAudioListeners(id) {
        const audio = document.getElementById(`audio-${id}`);
        const fill = document.getElementById(`progressFill-${id}`);
        const current = document.getElementById(`timeCurrent-${id}`);
        const icon = document.getElementById(`playIcon-${id}`);

        if (!audio) return;

        audio.addEventListener('timeupdate', () => {
            if (audio.duration && fill) {
                const percent = (audio.currentTime / audio.duration) * 100;
                fill.style.width = percent + '%';
            }
            if (current) {
                const min = Math.floor(audio.currentTime / 60);
                const sec = Math.floor(audio.currentTime % 60);
                current.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
            }
        });

        audio.addEventListener('ended', () => {
            if (icon) icon.className = 'bi bi-play-fill';
            const wrap = document.getElementById(`playerWrap-${id}`);
            if (wrap) wrap.style.display = 'none';
            this.currentPlayingId = null;
        });

        audio.addEventListener('pause', () => {
            if (icon) icon.className = 'bi bi-play-fill';
        });

        audio.addEventListener('play', () => {
            if (icon) icon.className = 'bi bi-pause-fill';
        });
    }

    togglePlayTrack(id) {
        const audio = document.getElementById(`audio-${id}`);
        const wrap = document.getElementById(`playerWrap-${id}`);
        const icon = document.getElementById(`playIcon-${id}`);

        if (!audio) return;

        // If another audio is playing, pause it
        if (this.currentAudioEl && this.currentAudioEl !== audio) {
            this.currentAudioEl.pause();
            if (this.currentPlayingId) {
                const prevIcon = document.getElementById(`playIcon-${this.currentPlayingId}`);
                const prevWrap = document.getElementById(`playerWrap-${this.currentPlayingId}`);
                if (prevIcon) prevIcon.className = 'bi bi-play-fill';
                if (prevWrap) prevWrap.style.display = 'none';
            }
        }

        if (audio.paused) {
            audio.play();
            if (wrap) wrap.style.display = 'block';
            if (icon) icon.className = 'bi bi-pause-fill';
            this.currentAudioEl = audio;
            this.currentPlayingId = id;
        } else {
            audio.pause();
            if (icon) icon.className = 'bi bi-play-fill';
        }
    }

    openStudio(id) {
        // Pause any currently playing mini player
        if (this.currentAudioEl) {
            this.currentAudioEl.pause();
        }

        const track = this.musicList.find(t => t.id === id);
        if (!track) return;

        const modal = document.getElementById('studioModal');
        if (modal) {
            modal.classList.add('active');
            if (window.audioStudio) {
                window.audioStudio.loadTrack(track);
            }
        }
    }

    filterMusic(query) {
        const catFilter = this.selectedCategory || 'all';
        const q = (query || '').toLowerCase().trim();

        const filtered = this.musicList.filter(track => {
            const matchesQuery = !q || track.name.toLowerCase().includes(q) || (track.artist && track.artist.toLowerCase().includes(q)) || track.filename.toLowerCase().includes(q);
            const matchesCategory = (catFilter === 'all') || (track.category && track.category.toLowerCase() === catFilter.toLowerCase());
            return matchesQuery && matchesCategory;
        });

        this.renderMusicList(filtered);
    }

    /**
     * Load video list from API
     */
    async loadVideoList() {
        const countBadge = document.getElementById('videoCountBadge');
        try {
            const res = await fetch('api/videos.php');
            const data = await res.json();
            if (data.status === 'success') {
                this.videoList = data.data;
                if (countBadge) countBadge.textContent = `${this.videoList.length} Video`;
                this.renderVideoList(this.videoList);
                this.updateStats();
            }
        } catch (err) {
            console.error('Failed to load video list:', err);
        }
    }

    renderVideoList(videos) {
        const container = document.getElementById('videoListContainer');
        const emptyState = document.getElementById('videoEmptyState');

        if (!container) return;
        container.innerHTML = '';

        if (!videos || videos.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        videos.forEach(vid => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';

            col.innerHTML = `
                <div class="video-card">
                    <div class="video-preview-wrapper">
                        <video src="${this.escapeHtml(vid.url)}" controls preload="metadata" class="video-preview-el"></video>
                    </div>
                    <div class="video-card-body">
                        <h5 class="video-title" title="${this.escapeHtml(vid.name)}">${this.escapeHtml(vid.name)}</h5>
                        <div class="video-meta">
                            <span><i class="bi bi-hdd"></i> ${this.escapeHtml(vid.size)}</span>
                            <span class="badge-category">${this.escapeHtml(vid.category || 'Highlights')}</span>
                        </div>
                        <div class="media-url-box mt-2">
                            <input type="text" readonly value="${this.escapeHtml(vid.url)}" class="media-url-input">
                            <button class="preview-btn btn-copy-video-url" style="padding: 4px 12px; font-size: 0.8rem;" title="Salin URL Video">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <div class="video-card-actions mt-3" style="display: flex; justify-content: flex-end;">
                            <button class="btn-pill-subtle btn-delete-video" style="color: #e11d48;" title="Hapus Video">
                                <i class="bi bi-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Anti-DOM-XSS: Bind events safely
            col.querySelector('.btn-copy-video-url').addEventListener('click', () => this.copyToClipboard(vid.url, 'Direct URL CDN video berhasil disalin!'));
            col.querySelector('.btn-delete-video').addEventListener('click', () => this.deleteAsset(vid.id, 'video'));

            container.appendChild(col);
        });
    }

    filterVideos(query) {
        const q = query.toLowerCase().trim();
        const filtered = this.videoList.filter(v => !q || v.name.toLowerCase().includes(q) || v.filename.toLowerCase().includes(q));
        this.renderVideoList(filtered);
    }

    async deleteAsset(id, type = 'music') {
        const name = type === 'music' ? 'lagu' : 'video';
        if (!confirm(`Apakah Anda yakin ingin menghapus ${name} ini dari CDN? File fisik juga akan dihapus.`)) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('type', type);

            const res = await fetch('api/delete.php', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.status === 'success') {
                this.showToast(`${type === 'music' ? 'Musik' : 'Video'} berhasil dihapus dari CDN.`, 'info');
                if (type === 'music') {
                    this.loadMusicList();
                } else {
                    this.loadVideoList();
                }
            } else {
                alert('Gagal menghapus: ' + data.message);
            }
        } catch (err) {
            alert('Kesalahan saat menghapus asset: ' + err.message);
        }
    }

    async editTrackDetails(track) {
        const currentTitle = track.name || '';
        const currentArtist = track.artist || '';

        const newTitle = prompt('Ubah judul lagu:', currentTitle);
        if (newTitle === null) return;
        const finalTitle = newTitle.trim() !== '' ? newTitle.trim() : currentTitle;

        const newArtist = prompt('Ubah nama penyanyi / artist:', currentArtist);
        if (newArtist === null) return;
        const finalArtist = newArtist.trim();

        if (finalTitle === currentTitle && finalArtist === currentArtist) return;

        try {
            const formData = new FormData();
            formData.append('id', track.id);
            formData.append('title', finalTitle);
            formData.append('artist', finalArtist);
            formData.append('type', 'music');

            const res = await fetch('api/update.php', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.status === 'success') {
                this.showToast('Judul & Penyanyi berhasil diperbarui!', 'success');
                this.loadMusicList();
            } else {
                alert('Gagal memperbarui: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Gagal memperbarui: ' + err.message);
        }
    }

    copyHtmlTag(url, title) {
        const tag = `<!-- Background Music Wedding Invitation -->\n<audio id="weddingBgMusic" src="${url}" preload="auto" loop></audio>\n<script>\n  // Play on user first touch / click to comply with mobile autoplay policies\n  document.addEventListener('click', () => {\n    const audio = document.getElementById('weddingBgMusic');\n    if (audio && audio.paused) audio.play();\n  }, { once: true });\n</script>`;
        this.copyToClipboard(tag, 'Snippet HTML audio wedding berhasil disalin!');
    }

    copyToClipboard(text, successMessage = 'Disalin ke clipboard!') {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(successMessage, 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text, successMessage);
            });
        } else {
            this.fallbackCopyToClipboard(text, successMessage);
        }
    }

    fallbackCopyToClipboard(text, successMessage) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            this.showToast(successMessage, 'success');
        } catch (err) {
            prompt('Salin tautan secara manual:', text);
        }
        document.body.removeChild(textarea);
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        const icon = type === 'success' ? 'bi-check-circle-fill' : (type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill');

        toast.innerHTML = `
            <i class="bi ${icon} me-2"></i>
            <span>${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    toggleActionMenu(id) {
        const dropdown = document.getElementById(`actionMenu-${id}`);
        if (!dropdown) return;

        // Close other dropdowns and reset their card z-indexes
        document.querySelectorAll('.action-menu-dropdown.active').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('active');
                const parentCard = d.closest('.media-card');
                if (parentCard) parentCard.classList.remove('has-active-dropdown');
            }
        });

        const card = dropdown.closest('.media-card');
        const isNowActive = dropdown.classList.toggle('active');
        if (card) {
            card.classList.toggle('has-active-dropdown', isNowActive);
        }

        // Close on outside click
        const closeHandler = (e) => {
            if (!dropdown.contains(e.target) && !e.target.closest('.btn-icon-subtle')) {
                dropdown.classList.remove('active');
                if (card) card.classList.remove('has-active-dropdown');
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 10);
    }

    updateStats() {
        const totalMusicEl = document.getElementById('statTotalMusic');
        const totalVideoEl = document.getElementById('statTotalVideo');
        const totalSizeEl = document.getElementById('statTotalStorage');

        if (totalMusicEl) totalMusicEl.textContent = this.musicList.length;
        if (totalVideoEl) totalVideoEl.textContent = this.videoList.length;

        let totalBytes = 0;
        this.musicList.forEach(m => totalBytes += (m.size_bytes || 0));
        this.videoList.forEach(v => totalBytes += (v.size_bytes || 0));

        if (totalSizeEl) totalSizeEl.textContent = this.formatBytes(totalBytes);
    }

    async loadApiStats() {
        try {
            const res = await fetch('api/');
            const data = await res.json();
            const ffmpegBadge = document.getElementById('ffmpegStatusBadge');
            if (ffmpegBadge && data.server_capabilities) {
                if (data.server_capabilities.ffmpeg_available) {
                    ffmpegBadge.innerHTML = '<span class="badge bg-success"><i class="bi bi-cpu"></i> FFmpeg Server Aktif</span>';
                } else {
                    ffmpegBadge.innerHTML = '<span class="badge bg-info"><i class="bi bi-browser-chrome"></i> Client WebAudio Studio Aktif</span>';
                }
            }
        } catch (e) {
            // silent
        }
    }

    async runApiTest() {
        const endpointSelect = document.getElementById('apiEndpointSelect');
        const resultPre = document.getElementById('apiTestResultPre');
        const statusBadge = document.getElementById('apiTestStatusBadge');
        const timeBadge = document.getElementById('apiTestTimeBadge');

        const endpoint = endpointSelect ? endpointSelect.value : 'api/music.php';
        if (resultPre) resultPre.textContent = 'Memanggil API...';

        const startTime = performance.now();
        try {
            const resp = await fetch(endpoint);
            const endTime = performance.now();
            const ms = Math.round(endTime - startTime);

            const json = await resp.json();

            if (statusBadge) {
                statusBadge.textContent = `${resp.status} ${resp.statusText || 'OK'}`;
                statusBadge.className = resp.ok ? 'badge bg-success' : 'badge bg-danger';
            }
            if (timeBadge) timeBadge.textContent = `${ms} ms`;

            if (resultPre) {
                resultPre.textContent = JSON.stringify(json, null, 2);
            }
        } catch (err) {
            if (statusBadge) {
                statusBadge.textContent = 'Error';
                statusBadge.className = 'badge bg-danger';
            }
            if (resultPre) {
                resultPre.textContent = 'Error calling API: ' + err.message;
            }
        }
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Instantiate and attach to window
window.app = new PermataCdnApp();
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
