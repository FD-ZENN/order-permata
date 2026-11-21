/**
 * CDN Permata Wedding - Audio Studio Engine
 * Handles Audio Waveform Visualizer, Trimming/Cutting, Fade In/Out, Compression & MP3 Export
 */

class AudioStudio {
    constructor() {
        this.audioCtx = null;
        this.audioBuffer = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.sourceNode = null;
        this.gainNode = null;
        this.playStartTime = 0;
        this.playStartOffset = 0;
        this.animationFrameId = null;

        // Settings
        this.startTime = 0;
        this.endTime = 0;
        this.duration = 0;
        this.fadeIn = 2.0;
        this.fadeOut = 3.0;
        this.bitrate = 128;
        this.isProcessing = false;

        // Canvas Elements
        this.canvas = null;
        this.ctx = null;
        this.waveformPeaks = [];

        // Dragging state
        this.isDraggingStart = false;
        this.isDraggingEnd = false;
        this.isHoveringStart = false;
        this.isHoveringEnd = false;
    }

    init() {
        this.canvas = document.getElementById('waveformCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvasEvents();
        }
        this.setupControlEvents();
    }

    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    /**
     * Load audio from URL into AudioBuffer
     */
    async loadTrack(track) {
        this.currentTrack = track;
        this.stopPlayback();
        this.showLoading(true, 'Mengunduh dan menganalisis audio...');

        try {
            const response = await fetch(track.url);
            if (!response.ok) throw new Error('Gagal mengambil file audio dari CDN.');
            const arrayBuffer = await response.arrayBuffer();

            const ctx = this.getAudioContext();
            this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;

            // Initialize default crop range (full track initially)
            this.startTime = 0;
            this.endTime = this.duration;
            this.fadeIn = Math.min(2.0, Math.floor(this.duration / 4));
            this.fadeOut = Math.min(3.0, Math.floor(this.duration / 4));

            this.updateInputFields();
            this.computeWaveformPeaks();
            this.drawWaveform();
            this.showLoading(false);

            // Update modal info
            document.getElementById('studioTrackTitle').textContent = track.name;
            document.getElementById('studioTrackMeta').textContent = 
                `${track.duration} • ${track.bitrate || '128 kbps'} • ${track.size}`;
            document.getElementById('exportTitleInput').value = track.name + ' (Trimmed)';
            const artistInput = document.getElementById('exportArtistInput');
            if (artistInput) {
                artistInput.value = track.artist || '';
            }

        } catch (err) {
            console.error('Audio load error:', err);
            this.showLoading(false);
            alert('Gagal memuat audio: ' + err.message);
        }
    }

    /**
     * Compute peaks for fast waveform drawing
     */
    computeWaveformPeaks() {
        if (!this.audioBuffer) return;
        const channelData = this.audioBuffer.getChannelData(0);
        const totalSamples = channelData.length;
        const width = this.canvas ? this.canvas.width : 1000;
        const step = Math.ceil(totalSamples / width);
        this.waveformPeaks = [];

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            const start = i * step;
            const end = Math.min(start + step, totalSamples);

            for (let j = start; j < end; j++) {
                const val = channelData[j];
                if (val < min) min = val;
                if (val > max) max = val;
            }
            this.waveformPeaks.push({ min, max });
        }
    }

    /**
     * Draw visual waveform on Canvas
     */
    drawWaveform(playbackProgressSec = null) {
        if (!this.canvas || !this.ctx || !this.waveformPeaks.length) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const halfH = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Background grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let y = 20; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const startX = (this.startTime / this.duration) * w;
        const endX = (this.endTime / this.duration) * w;

        // Dim unselected left region
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 0, startX, h);

        // Highlight active selected region with Permata Rose glow
        const selGrad = ctx.createLinearGradient(startX, 0, endX, 0);
        selGrad.addColorStop(0, 'rgba(244, 63, 110, 0.18)');
        selGrad.addColorStop(0.5, 'rgba(251, 113, 133, 0.14)');
        selGrad.addColorStop(1, 'rgba(244, 63, 110, 0.18)');
        ctx.fillStyle = selGrad;
        ctx.fillRect(startX, 0, endX - startX, h);

        // Dim unselected right region
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(endX, 0, w - endX, h);

        // Draw waveform bars
        for (let i = 0; i < w; i++) {
            const peak = this.waveformPeaks[i] || { min: 0, max: 0 };
            const barHeight = Math.max(2, (peak.max - peak.min) * halfH * 0.95);
            const isInside = (i >= startX && i <= endX);

            if (isInside) {
                // Permata Rose gradient for selected audio
                const barGrad = ctx.createLinearGradient(0, halfH - barHeight / 2, 0, halfH + barHeight / 2);
                barGrad.addColorStop(0, '#fda4af'); // Light Rose
                barGrad.addColorStop(0.5, '#f43f6e'); // Permata Rose
                barGrad.addColorStop(1, '#e11d48'); // Deep Rose
                ctx.fillStyle = barGrad;
            } else {
                ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
            }

            ctx.fillRect(i, halfH - barHeight / 2, 1, barHeight);
        }

        // Draw Fade In curve
        if (this.fadeIn > 0) {
            const fadeInEndX = ((this.startTime + this.fadeIn) / this.duration) * w;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(startX, h);
            ctx.lineTo(startX, 0);
            ctx.lineTo(fadeInEndX, 0);
            ctx.closePath();
            ctx.fillStyle = 'rgba(244, 63, 110, 0.15)';
            ctx.fill();

            // Fade in boundary line
            ctx.strokeStyle = 'rgba(244, 63, 110, 0.8)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(fadeInEndX, 0);
            ctx.lineTo(fadeInEndX, h);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#f43f6e';
            ctx.font = 'bold 10px Nunito, sans-serif';
            ctx.fillText(`Fade In: ${this.fadeIn.toFixed(1)}s`, startX + 6, 16);
        }

        // Draw Fade Out curve
        if (this.fadeOut > 0 && (this.endTime - this.startTime) > this.fadeOut) {
            const fadeOutStartX = ((this.endTime - this.fadeOut) / this.duration) * w;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(fadeOutStartX, 0);
            ctx.lineTo(endX, 0);
            ctx.lineTo(endX, h);
            ctx.closePath();
            ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
            ctx.fill();

            ctx.strokeStyle = 'rgba(2, 132, 199, 0.8)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(fadeOutStartX, 0);
            ctx.lineTo(fadeOutStartX, h);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 10px Nunito, sans-serif';
            ctx.fillText(`Fade Out: ${this.fadeOut.toFixed(1)}s`, fadeOutStartX - 80, 16);
        }

        // Draw Start Handle
        this.drawHandle(startX, '#f43f6e', 'START', this.isDraggingStart || this.isHoveringStart);

        // Draw End Handle
        this.drawHandle(endX, '#0284c7', 'END', this.isDraggingEnd || this.isHoveringEnd);

        // Draw Playhead cursor if playing
        if (playbackProgressSec !== null) {
            const playX = (playbackProgressSec / this.duration) * w;
            ctx.save();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(playX, 0);
            ctx.lineTo(playX, h);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawHandle(x, color, label, isHighlighted) {
        const ctx = this.ctx;
        const h = this.canvas.height;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = isHighlighted ? 12 : 5;

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        // Top tag badge
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x - 22, 4, 44, 18, 4);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, 16);

        // Bottom triangle grip
        ctx.beginPath();
        ctx.moveTo(x - 7, h);
        ctx.lineTo(x + 7, h);
        ctx.lineTo(x, h - 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Canvas mouse / drag interaction
     */
    setupCanvasEvents() {
        if (!this.canvas) return;

        const getMousePos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const x = (e.clientX - rect.left) * scaleX;
            return { x, time: (x / this.canvas.width) * this.duration };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.audioBuffer) return;
            const pos = getMousePos(e);
            const w = this.canvas.width;
            const startX = (this.startTime / this.duration) * w;
            const endX = (this.endTime / this.duration) * w;

            // Check if clicking near start handle (within 15px)
            if (Math.abs(pos.x - startX) <= 15) {
                this.isDraggingStart = true;
            } else if (Math.abs(pos.x - endX) <= 15) {
                this.isDraggingEnd = true;
            } else {
                // If clicked inside or outside, set current scrub time or preview
                if (pos.time >= this.startTime && pos.time <= this.endTime) {
                    this.playAudition(pos.time);
                } else if (pos.time < this.startTime) {
                    this.startTime = Math.max(0, pos.time);
                    this.updateInputFields();
                    this.drawWaveform();
                } else {
                    this.endTime = Math.min(this.duration, pos.time);
                    this.updateInputFields();
                    this.drawWaveform();
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.audioBuffer) return;
            const pos = getMousePos(e);
            const w = this.canvas.width;
            const startX = (this.startTime / this.duration) * w;
            const endX = (this.endTime / this.duration) * w;

            this.isHoveringStart = Math.abs(pos.x - startX) <= 12;
            this.isHoveringEnd = Math.abs(pos.x - endX) <= 12;

            if (this.isDraggingStart) {
                this.startTime = Math.min(Math.max(0, pos.time), this.endTime - 0.5);
                this.updateInputFields();
                this.drawWaveform();
            } else if (this.isDraggingEnd) {
                this.endTime = Math.max(Math.min(this.duration, pos.time), this.startTime + 0.5);
                this.updateInputFields();
                this.drawWaveform();
            } else {
                this.canvas.style.cursor = (this.isHoveringStart || this.isHoveringEnd) ? 'ew-resize' : 'pointer';
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDraggingStart || this.isDraggingEnd) {
                this.isDraggingStart = false;
                this.isDraggingEnd = false;
                this.drawWaveform();
            }
        });
    }

    /**
     * Wire up form controls & sliders
     */
    setupControlEvents() {
        const startInput = document.getElementById('startTimeInput');
        const endInput = document.getElementById('endTimeInput');
        const fadeInInput = document.getElementById('fadeInInput');
        const fadeInSlider = document.getElementById('fadeInSlider');
        const fadeOutInput = document.getElementById('fadeOutInput');
        const fadeOutSlider = document.getElementById('fadeOutSlider');
        const bitrateSelect = document.getElementById('bitrateSelect');

        if (startInput) {
            startInput.addEventListener('change', () => {
                this.startTime = Math.max(0, Math.min(parseFloat(startInput.value) || 0, this.endTime - 0.5));
                this.updateInputFields();
                this.drawWaveform();
            });
        }

        if (endInput) {
            endInput.addEventListener('change', () => {
                this.endTime = Math.min(this.duration, Math.max(parseFloat(endInput.value) || 0, this.startTime + 0.5));
                this.updateInputFields();
                this.drawWaveform();
            });
        }

        if (fadeInSlider && fadeInInput) {
            const syncFadeIn = (val) => {
                this.fadeIn = parseFloat(val) || 0;
                fadeInSlider.value = this.fadeIn;
                fadeInInput.value = this.fadeIn.toFixed(1);
                this.drawWaveform();
            };
            fadeInSlider.addEventListener('input', (e) => syncFadeIn(e.target.value));
            fadeInInput.addEventListener('change', (e) => syncFadeIn(e.target.value));
        }

        if (fadeOutSlider && fadeOutInput) {
            const syncFadeOut = (val) => {
                this.fadeOut = parseFloat(val) || 0;
                fadeOutSlider.value = this.fadeOut;
                fadeOutInput.value = this.fadeOut.toFixed(1);
                this.drawWaveform();
            };
            fadeOutSlider.addEventListener('input', (e) => syncFadeOut(e.target.value));
            fadeOutInput.addEventListener('change', (e) => syncFadeOut(e.target.value));
        }

        if (bitrateSelect) {
            bitrateSelect.addEventListener('change', (e) => {
                this.bitrate = parseInt(e.target.value, 10) || 128;
                this.updateCompressionEstimate();
            });
        }

        // Quick button: Reset full length
        const resetBtn = document.getElementById('resetCropBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.startTime = 0;
                this.endTime = this.duration;
                this.updateInputFields();
                this.drawWaveform();
            });
        }

        // Audition Button
        const playBtn = document.getElementById('studioPlayBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.stopPlayback();
                } else {
                    this.playAudition(this.startTime);
                }
            });
        }

        // Export Button
        const exportBtn = document.getElementById('studioProcessBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAndUpload());
        }
    }

    updateInputFields() {
        const startInput = document.getElementById('startTimeInput');
        const endInput = document.getElementById('endTimeInput');
        const cropDurationEl = document.getElementById('cropDurationBadge');

        if (startInput) startInput.value = this.startTime.toFixed(1);
        if (endInput) endInput.value = this.endTime.toFixed(1);

        const cropDuration = Math.max(0, this.endTime - this.startTime);
        if (cropDurationEl) {
            const min = Math.floor(cropDuration / 60);
            const sec = (cropDuration % 60).toFixed(1);
            cropDurationEl.textContent = `Durasi Potongan: ${min}:${sec.padStart(4, '0')}`;
        }

        this.updateCompressionEstimate();
    }

    updateCompressionEstimate() {
        const estSizeEl = document.getElementById('estimatedSizeBadge');
        if (!estSizeEl) return;
        const cropDuration = Math.max(0, this.endTime - this.startTime);
        const kbps = this.bitrate;
        const estimatedBytes = (cropDuration * (kbps * 1000)) / 8;
        const mb = (estimatedBytes / (1024 * 1024)).toFixed(2);
        estSizeEl.textContent = `Perkiraan Ukuran: ~${mb} MB (${kbps} kbps)`;
    }

    /**
     * Play selection with real-time fade in / out simulation
     */
    playAudition(startOffset = this.startTime) {
        if (!this.audioBuffer) return;
        this.stopPlayback();

        const ctx = this.getAudioContext();
        this.sourceNode = ctx.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;

        this.gainNode = ctx.createGain();

        // Calculate fade timings relative to current audition start
        const clipDuration = this.endTime - startOffset;
        if (clipDuration <= 0) return;

        const now = ctx.currentTime;
        this.gainNode.gain.setValueAtTime(0, now);

        // Apply Fade In
        if (this.fadeIn > 0 && startOffset < (this.startTime + this.fadeIn)) {
            const remainingFadeIn = Math.max(0.01, (this.startTime + this.fadeIn) - startOffset);
            this.gainNode.gain.linearRampToValueAtTime(1, now + remainingFadeIn);
        } else {
            this.gainNode.gain.setValueAtTime(1, now);
        }

        // Apply Fade Out
        if (this.fadeOut > 0 && clipDuration > this.fadeOut) {
            const fadeOutStartTime = now + (clipDuration - this.fadeOut);
            this.gainNode.gain.setValueAtTime(1, fadeOutStartTime);
            this.gainNode.gain.linearRampToValueAtTime(0, now + clipDuration);
        }

        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(ctx.destination);

        this.sourceNode.start(0, startOffset, clipDuration);
        this.isPlaying = true;
        this.playStartTime = ctx.currentTime;
        this.playStartOffset = startOffset;

        this.updatePlayButtonState(true);

        this.sourceNode.onended = () => {
            this.stopPlayback();
        };

        this.runPlayheadLoop();
    }

    runPlayheadLoop() {
        if (!this.isPlaying) return;
        const ctx = this.getAudioContext();
        const elapsed = ctx.currentTime - this.playStartTime;
        const currentPosSec = this.playStartOffset + elapsed;

        if (currentPosSec >= this.endTime) {
            this.stopPlayback();
            return;
        }

        this.drawWaveform(currentPosSec);
        this.animationFrameId = requestAnimationFrame(() => this.runPlayheadLoop());
    }

    stopPlayback() {
        if (this.sourceNode) {
            try { this.sourceNode.stop(); } catch (e) {}
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isPlaying = false;
        this.updatePlayButtonState(false);
        this.drawWaveform();
    }

    updatePlayButtonState(playing) {
        const playBtn = document.getElementById('studioPlayBtn');
        if (!playBtn) return;
        if (playing) {
            playBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause Preview';
            playBtn.classList.replace('btn-primary-custom', 'btn-warning-custom');
        } else {
            playBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play Seleksi';
            playBtn.classList.replace('btn-warning-custom', 'btn-primary-custom');
        }
    }

    /**
     * Render cropped audio with fade in / fade out using OfflineAudioContext,
     * encode to MP3 using LameJS, and upload to CDN endpoint!
     */
    async exportAndUpload() {
        if (!this.audioBuffer || this.isProcessing) return;
        this.stopPlayback();

        const clipDuration = this.endTime - this.startTime;
        if (clipDuration < 1.0) {
            alert('Durasi potongan audio terlalu pendek (minimal 1 detik).');
            return;
        }

        const overwrite = document.getElementById('exportOverwriteCheck')?.checked || false;
        const customTitle = document.getElementById('exportTitleInput')?.value || '';
        const targetBitrate = this.bitrate;

        this.isProcessing = true;
        this.setProcessingProgress(10, 'Menyiapkan rendering audio buffer...');

        try {
            const sampleRate = this.audioBuffer.sampleRate;
            const numChannels = Math.min(2, this.audioBuffer.numberOfChannels);
            const numFrames = Math.ceil(clipDuration * sampleRate);

            // 1. Create Offline Audio Context for accurate DSP rendering
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
                numChannels,
                numFrames,
                sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = this.audioBuffer;

            const gain = offlineCtx.createGain();

            // Fade In on offline buffer
            gain.gain.setValueAtTime(0, 0);
            if (this.fadeIn > 0) {
                gain.gain.linearRampToValueAtTime(1, Math.min(this.fadeIn, clipDuration));
            } else {
                gain.gain.setValueAtTime(1, 0);
            }

            // Fade Out on offline buffer
            if (this.fadeOut > 0 && clipDuration > this.fadeOut) {
                const fadeStart = clipDuration - this.fadeOut;
                gain.gain.setValueAtTime(1, fadeStart);
                gain.gain.linearRampToValueAtTime(0, clipDuration);
            }

            source.connect(gain);
            gain.connect(offlineCtx.destination);

            source.start(0, this.startTime, clipDuration);

            this.setProcessingProgress(30, 'Menerapkan filter Fade dan Trimming...');
            const renderedBuffer = await offlineCtx.startRendering();

            this.setProcessingProgress(50, `Mengompresi ke MP3 (${targetBitrate} kbps)...`);

            // 2. Encode to MP3 using LameJS
            const mp3Blob = await this.encodeBufferToMp3(renderedBuffer, targetBitrate, (percent) => {
                const p = 50 + Math.floor(percent * 0.35);
                this.setProcessingProgress(p, `Mengompresi audio: ${percent}%`);
            });

            this.setProcessingProgress(88, 'Mengunggah hasil ke Server CDN...');

            // 3. Post to /api/process.php
            const formData = new FormData();
            formData.append('action', 'save_client_processed');
            formData.append('audio_blob', mp3Blob, 'processed.mp3');
            formData.append('source_id', this.currentTrack ? this.currentTrack.id : '');
            formData.append('title', customTitle);
            formData.append('artist', document.getElementById('exportArtistInput')?.value || (this.currentTrack ? (this.currentTrack.artist || '') : ''));
            formData.append('overwrite', overwrite ? 'true' : 'false');
            formData.append('bitrate', `${targetBitrate} kbps`);
            formData.append('duration', Math.round(clipDuration).toString());
            formData.append('category', this.currentTrack ? this.currentTrack.category : 'Romantic Wedding');

            const resp = await fetch('api/process.php', {
                method: 'POST',
                body: formData
            });

            const result = await resp.json();

            if (result.status === 'success') {
                this.setProcessingProgress(100, 'Berhasil disimpan!');
                setTimeout(() => {
                    this.closeStudio();
                    if (window.app) {
                        window.app.loadMusicList();
                        window.app.showToast('Sukses! Audio berhasil dipotong, fade, dikompres dan disimpan ke CDN.', 'success');
                    }
                }, 800);
            } else {
                throw new Error(result.message || 'Gagal menyimpan hasil proses.');
            }

        } catch (err) {
            console.error('Audio processing error:', err);
            alert('Terjadi kesalahan saat memproses audio: ' + err.message);
        } finally {
            this.isProcessing = false;
            this.hideProcessingProgress();
        }
    }

    /**
     * Pure JavaScript MP3 Encoding via LameJS
     */
    encodeBufferToMp3(audioBuffer, bitrate, progressCb) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof lamejs === 'undefined') {
                    throw new Error('LameJS MP3 Encoder belum termuat. Pastikan koneksi atau skrip lokal tersedia.');
                }

                const channels = audioBuffer.numberOfChannels;
                const sampleRate = audioBuffer.sampleRate;
                const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);

                const leftChannel = audioBuffer.getChannelData(0);
                const rightChannel = (channels > 1) ? audioBuffer.getChannelData(1) : leftChannel;

                // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
                const sampleCount = leftChannel.length;
                const leftInt16 = new Int16Array(sampleCount);
                const rightInt16 = new Int16Array(sampleCount);

                for (let i = 0; i < sampleCount; i++) {
                    const l = Math.max(-1, Math.min(1, leftChannel[i]));
                    leftInt16[i] = l < 0 ? l * 0x8000 : l * 0x7FFF;

                    const r = Math.max(-1, Math.min(1, rightChannel[i]));
                    rightInt16[i] = r < 0 ? r * 0x8000 : r * 0x7FFF;
                }

                const mp3Data = [];
                const chunkSize = 1152;
                let chunkIndex = 0;
                const totalChunks = Math.ceil(sampleCount / chunkSize);

                const encodeLoop = () => {
                    const batchLimit = Math.min(chunkIndex + 20, totalChunks);

                    for (; chunkIndex < batchLimit; chunkIndex++) {
                        const start = chunkIndex * chunkSize;
                        const end = Math.min(start + chunkSize, sampleCount);

                        const leftChunk = leftInt16.subarray(start, end);
                        const rightChunk = rightInt16.subarray(start, end);

                        let mp3buf;
                        if (channels === 1) {
                            mp3buf = mp3Encoder.encodeBuffer(leftChunk);
                        } else {
                            mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
                        }

                        if (mp3buf.length > 0) {
                            mp3Data.push(mp3buf);
                        }
                    }

                    if (progressCb) {
                        progressCb(Math.min(99, Math.round((chunkIndex / totalChunks) * 100)));
                    }

                    if (chunkIndex < totalChunks) {
                        setTimeout(encodeLoop, 0); // Non-blocking UI
                    } else {
                        // Flush remaining buffer
                        const finalBuf = mp3Encoder.flush();
                        if (finalBuf.length > 0) {
                            mp3Data.push(finalBuf);
                        }
                        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
                        resolve(blob);
                    }
                };

                encodeLoop();

            } catch (err) {
                reject(err);
            }
        });
    }

    showLoading(show, text = 'Memuat...') {
        const overlay = document.getElementById('studioLoadingOverlay');
        const textEl = document.getElementById('studioLoadingText');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
        if (textEl) {
            textEl.textContent = text;
        }
    }

    setProcessingProgress(percent, label) {
        const bar = document.getElementById('studioProgressBar');
        const text = document.getElementById('studioProgressText');
        const container = document.getElementById('studioProgressContainer');
        if (container) container.style.display = 'block';
        if (bar) bar.style.width = percent + '%';
        if (text) text.textContent = `${label} (${percent}%)`;
    }

    hideProcessingProgress() {
        const container = document.getElementById('studioProgressContainer');
        if (container) container.style.display = 'none';
    }

    closeStudio() {
        this.stopPlayback();
        const modal = document.getElementById('studioModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// Global instance
window.audioStudio = new AudioStudio();
