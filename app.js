    // ==========================================
    // 🎨 CUSTOM STUDIO MODAL SYSTEM (ALERT / CONFIRM / PROMPT)
    // ==========================================
    const customModalOverlay = document.getElementById('customModalOverlay');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalInput = document.getElementById('modalInput');
    const btnModalCancel = document.getElementById('btnModalCancel');
    const btnModalConfirm = document.getElementById('btnModalConfirm');

    let currentModalResolver = null;

    function showCustomModal({ title = 'Notice', message = '', type = 'info', defaultValue = null, isConfirm = false, isPrompt = false }) {
      return new Promise((resolve) => {
        currentModalResolver = resolve;

        modalTitle.innerText = title;
        modalMessage.innerText = message;

        modalIcon.className = 'custom-modal-icon ' + type;
        if (type === 'info') modalIcon.innerText = 'ℹ️';
        else if (type === 'confirm') modalIcon.innerText = '⚠️';
        else if (type === 'prompt') modalIcon.innerText = '✂️';

        btnModalConfirm.className = 'btn-modal-confirm' + (type === 'confirm' ? ' danger' : '');
        btnModalConfirm.innerText = isPrompt ? 'Apply' : (isConfirm ? 'Confirm' : 'OK');

        if (isPrompt) {
          modalInput.style.display = 'block';
          modalInput.value = defaultValue || '';
          btnModalCancel.style.display = 'block';
          setTimeout(() => {
            modalInput.focus();
            modalInput.select();
          }, 50);
        } else if (isConfirm) {
          modalInput.style.display = 'none';
          btnModalCancel.style.display = 'block';
        } else {
          modalInput.style.display = 'none';
          btnModalCancel.style.display = 'none';
        }

        customModalOverlay.classList.remove('hidden');
      });
    }

    function closeModalWithResult(val) {
      customModalOverlay.classList.add('hidden');
      if (currentModalResolver) {
        currentModalResolver(val);
        currentModalResolver = null;
      }
    }

    btnModalConfirm.addEventListener('click', () => {
      if (modalInput.style.display !== 'none') {
        closeModalWithResult(modalInput.value);
      } else {
        closeModalWithResult(true);
      }
    });

    btnModalCancel.addEventListener('click', () => {
      closeModalWithResult(null);
    });

    modalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        closeModalWithResult(modalInput.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModalWithResult(null);
      }
    });

    // Custom wrappers
    function customAlert(msg, title = 'Notice') {
      return showCustomModal({ title, message: msg, type: 'info' });
    }

    function customConfirm(msg, title = 'Confirmation') {
      return showCustomModal({ title, message: msg, type: 'confirm', isConfirm: true });
    }

    function customPrompt(msg, defVal = '', title = 'Input') {
      return showCustomModal({ title, message: msg, defaultValue: defVal, type: 'prompt', isPrompt: true });
    }

    let pixelsPerSecond = 95;
    let editMode = 'words';
    let items = [];
    let selectedItemIds = new Set();

    let isSpotifyConnected = false;
    let spotifyIsPlaying = false;
    let currentPositionSec = 0;
    let songDurationSec = 300;

    let isDraggingSelection = false;
    let isResizingLeft = false;
    let isResizingRight = false;
    let activeResizeItem = null;
    let dragStartX = 0;
    let initialItemPositions = new Map();

    let isMarqueeActive = false;
    let marqueeStartX = 0;
    let marqueeStartY = 0;

    const spotifyStatusBadge = document.getElementById('spotifyStatusBadge');
    const spotifyStatusText = document.getElementById('spotifyStatusText');
    const ttmlFileInput = document.getElementById('ttmlFileInput');
    const btnPlay = document.getElementById('btnPlay');
    const timeDisplay = document.getElementById('timeDisplay');
    const rawLyrics = document.getElementById('rawLyrics');
    const btnGenerateBlocks = document.getElementById('btnGenerateBlocks');
    const btnFetchLyrics = document.getElementById('btnFetchLyrics');
    let lastFetchedTrackKey = '';
    const timelineWrapper = document.getElementById('timelineWrapper');
    const timelineScroll = document.getElementById('timelineScroll');
    const ruler = document.getElementById('ruler');
    const playhead = document.getElementById('playhead');
    const tracksContainer = document.getElementById('tracksContainer');
    const zoomRange = document.getElementById('zoomRange');
    const previewLine = document.getElementById('previewLine');
    const btnExport = document.getElementById('btnExport');
    const btnSaveProject = document.getElementById('btnSaveProject');
    const projectFileInput = document.getElementById('projectFileInput');
    const modeWords = document.getElementById('modeWords');
    const modeLines = document.getElementById('modeLines');
    const marqueeBox = document.getElementById('marqueeBox');
    const btnSplit = document.getElementById('btnSplit');
    const btnMerge = document.getElementById('btnMerge');
    const btnSelectAll = document.getElementById('btnSelectAll');
    const btnDeleteSelected = document.getElementById('btnDeleteSelected');
    const selectedCountBadge = document.getElementById('selectedCountBadge');
    const btnShiftBack = document.getElementById('btnShiftBack');
    const btnShiftForward = document.getElementById('btnShiftForward');
    const btnSnapToPlayhead = document.getElementById('btnSnapToPlayhead');
    const btnSplitWordSyllable = document.getElementById('btnSplitWordSyllable');
    const btnToggleBgVocal = document.getElementById('btnToggleBgVocal');
    const btnTapSync = document.getElementById('btnTapSync');
    const chkAutoTurkishSyllables = document.getElementById('chkAutoTurkishSyllables');
    const btnClearAll = document.getElementById('btnClearAll');
    const saveStatusIndicator = document.getElementById('saveStatusIndicator');

    const STORAGE_KEY = 'spicy_studio_autosave_v1';

    // Otomatik Kayıt Fonksiyonu
    let saveTimeout = null;
    function autoSaveState() {
      if (saveStatusIndicator) {
        saveStatusIndicator.innerText = '⏳ Saving...';
        saveStatusIndicator.style.color = 'var(--accent)';
      }
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        try {
          const state = {
            rawLyrics: rawLyrics.value,
            editMode: editMode,
            items: items,
            zoom: pixelsPerSecond
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          if (saveStatusIndicator) {
            saveStatusIndicator.innerText = '☁️ Saved';
            saveStatusIndicator.style.color = 'var(--text-dim)';
          }
        } catch (e) {
          console.error("AutoSave error:", e);
        }
      }, 350);
    }

    // Kayıtlı Durumu Yükleme
    function loadSavedState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          if (state.rawLyrics !== undefined) rawLyrics.value = state.rawLyrics;
          if (state.editMode) {
            editMode = state.editMode;
            if (editMode === 'lines') {
              modeLines.classList.add('active');
              modeWords.classList.remove('active');
            } else {
              modeWords.classList.add('active');
              modeLines.classList.remove('active');
            }
          }
          if (state.zoom) {
            pixelsPerSecond = state.zoom;
            zoomRange.value = state.zoom;
          }
          if (Array.isArray(state.items) && state.items.length > 0) {
            items = state.items;
          }
        } else {
          // Varsayılan şarkı
          rawLyrics.value = `Nefesimi tuttum, korkmuyorum
Bugün vazgeçmek için çok erken
Uzar mı yol giderken sormuyorum
Adımlarım hep büyük kendimden
Belki çok üzülüp giderim gelmem
Belki yağmur olup yağarım bilmem
Hiç bitmez bu masal
Belki zor seçmek gelir içimden
Belki hayatla yüzleştiğimden
Hiç bitmez bu masal
Ben yazar, ben yaşarım`;
        }
      } catch (err) {
        console.error("Load state error:", err);
      }
    }

    // Söz kutusundaki her değişiklikte kaydet
    rawLyrics.addEventListener('input', autoSaveState);

    // ==========================================
    // 🇹🇷 TÜRKÇE OTOMATİK HECELEME ALGORİTMASI
    // ==========================================
    const TR_VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü']);

    function isVowel(ch) {
      return TR_VOWELS.has(ch);
    }

    function hyphenateTurkishWord(rawWord) {
      if (!rawWord || rawWord.length <= 2) return [rawWord];

      // Noktalama işaretlerini ayır
      const match = rawWord.match(/^([^\p{L}\d]*)([\p{L}\d\-']+)([^\p{L}\d]*)$/u);
      let prefix = '';
      let word = rawWord;
      let suffix = '';
      if (match) {
        prefix = match[1];
        word = match[2];
        suffix = match[3];
      }

      // Kelimedeki sesli harf sayısı 1 veya daha azsa hecelenemez
      let vowelCount = 0;
      for (const ch of word) {
        if (isVowel(ch)) vowelCount++;
      }
      if (vowelCount <= 1) return [rawWord];

      const syllables = [];
      let i = word.length - 1;

      while (i >= 0) {
        // Sondan başa doğru sesli harf ara
        while (i >= 0 && !isVowel(word[i])) {
          i--;
        }
        if (i < 0) break;

        // word[i] bir sesli harf. Ondan önceki karakterlere bak:
        let prevVowelIdx = -1;
        for (let j = i - 1; j >= 0; j--) {
          if (isVowel(word[j])) {
            prevVowelIdx = j;
            break;
          }
        }

        if (prevVowelIdx === -1) {
          // Başka sesli kalmadı, kelimenin başından i'nin sonuna kadar tek hece
          syllables.unshift(word.slice(0));
          break;
        }

        // İki sesli harf (prevVowelIdx ile i) arasındaki ünsüz harf sayısı
        const consonantsBetween = i - prevVowelIdx - 1;

        let splitAt = i;
        if (consonantsBetween === 0) {
          // Yan yana iki ünlü (örn: şa-ir, sa-at)
          splitAt = i;
        } else if (consonantsBetween === 1) {
          // Tek ünsüz (örn: a-ra-ba, ge-li-rim) -> Ünsüz sağdaki heceye geçer
          splitAt = prevVowelIdx + 1;
        } else if (consonantsBetween === 2) {
          // İki ünsüz (örn: kork-ma, gel-dim) -> Biri solda, biri sağda
          splitAt = prevVowelIdx + 2;
        } else {
          // Üç veya daha fazla ünsüz (örn: türk-çe) -> İkisi solda, biri sağda
          splitAt = prevVowelIdx + (consonantsBetween - 1);
        }

        syllables.unshift(word.slice(splitAt));
        word = word.slice(0, splitAt);
        i = splitAt - 1;
      }

      if (syllables.length === 0) return [rawWord];

      // Prefix ve suffix'i ilk ve son heceye geri ekle
      syllables[0] = prefix + syllables[0];
      syllables[syllables.length - 1] = syllables[syllables.length - 1] + suffix;

      return syllables.filter(s => s.length > 0);
    }
    async function pollSpotifyStatus() {
      try {
        const res = await fetch('http://localhost:48484/status');
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            isSpotifyConnected = true;
            spotifyIsPlaying = data.isPlaying;
            currentPositionSec = data.position;
            if (data.duration > 0) songDurationSec = data.duration;

            spotifyStatusBadge.className = 'spotify-pill connected';
            spotifyStatusText.innerText = `${data.artist} - ${data.title}`;

            if (spotifyIsPlaying) {
              btnPlay.innerHTML = '<span>⏸</span> Pause';
            } else {
              btnPlay.innerHTML = '<span>▶</span> Play';
            }

            timeDisplay.innerText = formatTime(currentPositionSec);
            playhead.style.left = (currentPositionSec * pixelsPerSecond) + 'px';
            updatePreview(currentPositionSec);
          }
        }
      } catch (err) {
        isSpotifyConnected = false;
        spotifyStatusBadge.className = 'spotify-pill';
        spotifyStatusText.innerText = 'Waiting for Spotify';
      }
    }
    setInterval(pollSpotifyStatus, 60);

    btnPlay.addEventListener('click', toggleSpotifyPlay);
    async function toggleSpotifyPlay() {
      if (isSpotifyConnected) {
        try {
          await fetch('http://localhost:48484/playpause', { method: 'POST' });
        } catch {}
      } else {
        customAlert("Please run 'Spotify_Koprusunu_Baslat.bat' in the project folder first!", "Spotify Disconnected");
      }
    }

    // Ruler Tıklayarak Zamanı Değiştirme
    ruler.addEventListener('click', async (e) => {
      const rect = timelineWrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const targetTime = Math.max(0, clickX / pixelsPerSecond);

      if (isSpotifyConnected) {
        try {
          await fetch(`http://localhost:48484/seek?sec=${targetTime.toFixed(3)}`, { method: 'POST' });
          currentPositionSec = targetTime;
          playhead.style.left = clickX + 'px';
          timeDisplay.innerText = formatTime(currentPositionSec);
        } catch {}
      } else {
        currentPositionSec = targetTime;
        playhead.style.left = clickX + 'px';
        timeDisplay.innerText = formatTime(currentPositionSec);
      }
    });

    // ==========================================
    // Çizgiye Çekme Fonksiyonu (Snapping)
    // ==========================================
    function snapSelectedToPlayhead() {
      if (selectedItemIds.size === 0) {
        customAlert("Please select a block to snap to playhead first!", "Selection Required");
        return;
      }
      const selectedList = items.filter(it => selectedItemIds.has(it.id)).sort((a,b) => a.start - b.start);
      const minStart = selectedList[0].start;
      const delta = currentPositionSec - minStart;

      selectedList.forEach(it => {
        const dur = it.end - it.start;
        it.start = Math.max(0, it.start + delta);
        it.end = it.start + dur;
      });

      renderAllBlocks();
      timelineScroll.scrollLeft = Math.max(0, (currentPositionSec * pixelsPerSecond) - 80);
      autoSaveState();
    }

    btnSnapToPlayhead.addEventListener('click', snapSelectedToPlayhead);

    // ==========================================
    // Kelimeyi Hecelere Ayırma Fonksiyonu
    // ==========================================
    async function splitWordIntoSyllables() {
      if (selectedItemIds.size !== 1) {
        customAlert("Please select exactly ONE word block to split into syllables!");
        return;
      }

      const targetId = Array.from(selectedItemIds)[0];
      const targetItem = items.find(it => it.id === targetId);
      if (!targetItem) return;

      const currentText = targetItem.text.trim();
      const trParts = hyphenateTurkishWord(currentText);
      const defaultVal = trParts.length > 1 ? trParts.join('-') : currentText;

      const promptResult = await customPrompt(
        `Split "${currentText}" into syllables:\n(Use hyphens '-' or space between syllables)`,
        defaultVal,
        'Syllable Splitter'
      );

      if (!promptResult) return;

      const parts = promptResult.split(/[\s\-]+/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length <= 1) {
        customAlert("Word must be split into at least 2 syllables!");
        return;
      }

      const totalDur = targetItem.end - targetItem.start;
      const partDur = totalDur / parts.length;
      const groupId = targetItem.wordGroupId || ('wgrp_' + Date.now());

      const newSyllables = [];
      parts.forEach((partText, idx) => {
        newSyllables.push({
          id: 'syl_' + Date.now() + '_' + idx,
          text: partText,
          start: targetItem.start + (idx * partDur),
          end: targetItem.start + ((idx + 1) * partDur),
          lineIndex: targetItem.lineIndex,
          trackIndex: targetItem.trackIndex,
          isWord: true,
          isSyllable: true,
          wordGroupId: groupId,
          isLastSyllableOfWord: (idx === parts.length - 1)
        });
      });

      const targetIndex = items.findIndex(it => it.id === targetId);
      items.splice(targetIndex, 1, ...newSyllables);

      selectedItemIds.clear();
      newSyllables.forEach(s => selectedItemIds.add(s.id));
      renderAllBlocks();
      updateSelectedBadge();
      autoSaveState();
    }

    btnSplitWordSyllable.addEventListener('click', splitWordIntoSyllables);

    // ==========================================
    // 🎯 CANLI TAP-TO-SYNC FONKSİYONU
    // ==========================================
    function triggerTapSync() {
      if (items.length === 0) return;

      const sorted = [...items].sort((a,b) => a.start - b.start);
      // Henüz playhead'in (kırmızı çizginin) önünde olan veya seçili olan ilk bloğu bul
      let nextBlock = null;

      if (selectedItemIds.size > 0) {
        const selectedList = items.filter(it => selectedItemIds.has(it.id)).sort((a,b) => a.start - b.start);
        nextBlock = selectedList[0];
      } else {
        // Çizginin hemen sonrasındaki bloğu bul
        nextBlock = sorted.find(b => b.start >= currentPositionSec - 0.2);
        if (!nextBlock) {
          // Eğer çizgi hepsini geçmişse son bloğu al
          nextBlock = sorted[sorted.length - 1];
        }
      }

      if (nextBlock) {
        const nextIdxInSorted = sorted.findIndex(b => b.id === nextBlock.id);
        const dur = nextBlock.end - nextBlock.start;
        const delta = currentPositionSec - nextBlock.start;

        // Bu bloktan sonraki tüm blokları da aynı oranda kaydır ki birbirine girmesinler
        for (let i = nextIdxInSorted; i < sorted.length; i++) {
          const it = sorted[i];
          const itDur = it.end - it.start;
          it.start = Math.max(0, it.start + delta);
          it.end = it.start + itDur;
        }

        // Bir sonraki bloğu otomatik seç ve odakla
        selectedItemIds.clear();
        if (nextIdxInSorted + 1 < sorted.length) {
          selectedItemIds.add(sorted[nextIdxInSorted + 1].id);
        } else {
          selectedItemIds.add(nextBlock.id);
        }

        renderAllBlocks();
        updateSelectedBadge();
        autoSaveState();
      }
    }

    btnTapSync.addEventListener('click', triggerTapSync);

    // ==========================================
    // 🎛️ NUDGE (MİLİSANİYELİK İNCE AYAR)
    // ==========================================
    function nudgeSelectedItems(deltaSeconds, resizeOnly = false) {
      if (selectedItemIds.size === 0) return;

      selectedItemIds.forEach(id => {
        const it = items.find(b => b.id === id);
        if (!it) return;

        if (resizeOnly) {
          it.end = Math.max(it.start + 0.05, it.end + deltaSeconds);
        } else {
          const dur = it.end - it.start;
          it.start = Math.max(0, it.start + deltaSeconds);
          it.end = it.start + dur;
        }
      });

      renderAllBlocks();
      autoSaveState();
    }

    // Kısayollar
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleSpotifyPlay();
      }
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSelectedBgVocal();
      }
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        triggerTapSync();
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        snapSelectedToPlayhead();
      }
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        splitWordIntoSyllables();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        // Shift ile 50ms, normalde 10ms
        const step = (e.shiftKey ? 0.05 : 0.01) * (e.key === 'ArrowLeft' ? -1 : 1);
        nudgeSelectedItems(step, e.altKey);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedItems();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllItems();
      }
    });

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }

    // ==========================================
    // 🎙️ TOGGLE BACKGROUND VOCAL (OPPOSING / RIGHT ALIGN)
    // ==========================================
    function toggleSelectedBgVocal() {
      if (selectedItemIds.size === 0) {
        customAlert("Please select at least one block to toggle as Background Vocal!", "Selection Required");
        return;
      }

      const selectedList = items.filter(it => selectedItemIds.has(it.id));
      const hasAnyNonBg = selectedList.some(it => !it.isBgVocal);
      // If any is not BG, make all BG. If all are already BG, toggle off.
      const targetState = hasAnyNonBg;

      selectedList.forEach(it => {
        it.isBgVocal = targetState;
      });

      renderAllBlocks();
      autoSaveState();
    }

    if (btnToggleBgVocal) {
      btnToggleBgVocal.addEventListener('click', toggleSelectedBgVocal);
    }

    // ==========================================
    // ⚡ AUTO FETCH LYRICS (LRCLIB API)
    // ==========================================
    async function fetchLyricsForTrack(artist, title) {
      if (!artist || !title) return null;
      try {
        const cleanTitle = title.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();
        const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(cleanTitle)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.error("LRCLIB fetch error:", err);
      }
      return null;
    }

    if (btnFetchLyrics) {
      btnFetchLyrics.addEventListener('click', async () => {
        let artist = '';
        let title = '';

        if (isSpotifyConnected && spotifyStatusText.innerText && !spotifyStatusText.innerText.includes('Waiting')) {
          const parts = spotifyStatusText.innerText.split(' - ');
          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }
        }

        if (!artist || !title) {
          const query = await customPrompt("Enter Artist - Song Title to search lyrics:", "Kolpa - Hiç Bitmez Bu Masal", "Search Lyrics");
          if (!query) return;
          const qParts = query.split('-');
          if (qParts.length >= 2) {
            artist = qParts[0].trim();
            title = qParts.slice(1).join('-').trim();
          } else {
            artist = query.trim();
            title = query.trim();
          }
        }

        btnFetchLyrics.innerHTML = '<span>⏳</span> Fetching...';
        const result = await fetchLyricsForTrack(artist, title);
        btnFetchLyrics.innerHTML = '<span>⚡</span> Auto Fetch';

        if (result && (result.plainLyrics || result.syncedLyrics)) {
          // Eğer senkronize sözler varsa direkt import edilsin mi diye soralım
          if (result.syncedLyrics) {
            const loadSynced = await customConfirm(
              `Found synced lyrics with timestamps for "${artist} - ${title}"!\n\nDo you want to automatically load them onto the timeline?`,
              "Synced Lyrics Found"
            );
            if (loadSynced) {
              parseAndLoadImportedFile(result.syncedLyrics, `${artist} - ${title}.lrc`);
              return;
            }
          }

          rawLyrics.value = (result.plainLyrics || '').trim();
          autoSaveState();
          customAlert(`Lyrics successfully fetched for "${artist} - ${title}"!`, "Lyrics Loaded");
        } else {
          customAlert(`Could not find lyrics for "${artist} - ${title}". You can paste them manually into the box.`, "Not Found");
        }
      });
    }

    // ==========================================
    // Çizgiden İtibaren Blokları Dizme
    // ==========================================
    btnGenerateBlocks.addEventListener('click', () => {
      const lines = rawLyrics.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;

      items = [];
      selectedItemIds.clear();

      let curTime = Math.max(0, currentPositionSec);

      if (editMode === 'words') {
        const autoSyllable = chkAutoTurkishSyllables && chkAutoTurkishSyllables.checked;

        lines.forEach((lineText, lIdx) => {
          const words = lineText.split(' ').filter(w => w.length > 0);
          const track = lIdx % 4;

          words.forEach((w, wIdx) => {
            const wDur = Math.max(0.35, w.length * 0.12);

            if (autoSyllable) {
              const sylParts = hyphenateTurkishWord(w);
              if (sylParts.length > 1) {
                const partDur = wDur / sylParts.length;
                const groupId = 'wgrp_' + Date.now() + '_' + lIdx + '_' + wIdx;

                sylParts.forEach((partText, pIdx) => {
                  items.push({
                    id: 'item_' + Date.now() + '_' + lIdx + '_' + wIdx + '_' + pIdx,
                    text: partText,
                    start: curTime + (pIdx * partDur),
                    end: curTime + ((pIdx + 1) * partDur),
                    lineIndex: lIdx,
                    trackIndex: track,
                    isWord: true,
                    isSyllable: true,
                    wordGroupId: groupId,
                    isLastSyllableOfWord: (pIdx === sylParts.length - 1)
                  });
                });
                curTime += wDur + 0.05;
                return;
              }
            }

            // Normal kelime bloğu
            items.push({
              id: 'item_' + Date.now() + '_' + lIdx + '_' + wIdx,
              text: w,
              start: curTime,
              end: curTime + wDur,
              lineIndex: lIdx,
              trackIndex: track,
              isWord: true,
              isSyllable: false
            });
            curTime += wDur + 0.05;
          });
          curTime += 1.2;
        });
      } else {
        lines.forEach((lineText, lIdx) => {
          const lineDur = 4.0;
          items.push({
            id: 'item_' + Date.now() + '_' + lIdx,
            text: lineText,
            start: curTime,
            end: curTime + lineDur,
            lineIndex: lIdx,
            trackIndex: lIdx % 3,
            isWord: false
          });
          curTime += lineDur + 0.6;
        });
      }

      renderAllBlocks();
      updateSelectedBadge();
      timelineScroll.scrollLeft = Math.max(0, (currentPositionSec * pixelsPerSecond) - 50);
      autoSaveState();
    });

    // İçe Aktarma
    ttmlFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const content = evt.target.result;
        parseAndLoadImportedFile(content, file.name);
      };
      reader.readAsText(file, 'utf-8');
    });

    function parseTimeStrToSeconds(str) {
      if (!str) return 0;
      str = str.trim();
      if (str.endsWith('s')) str = str.slice(0, -1);
      const parts = str.split(':');
      if (parts.length === 3) {
        return (parseFloat(parts[0]) * 3600) + (parseFloat(parts[1]) * 60) + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
      } else {
        return parseFloat(str) || 0;
      }
    }

    function parseAndLoadImportedFile(content, filename) {
      try {
        const newItems = [];
        let detectedLines = [];

        if (content.includes('<tt') || content.includes('<p') || content.includes('<span')) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          const pElements = xmlDoc.querySelectorAll("p");

          if (pElements.length > 0) {
            pElements.forEach((p, pIdx) => {
              const lineBegin = parseTimeStrToSeconds(p.getAttribute("begin"));
              const lineEnd = parseTimeStrToSeconds(p.getAttribute("end"));
              const spans = p.querySelectorAll("span");

              if (spans.length > 0) {
                let currentWordStart = lineBegin;
                spans.forEach((span, sIdx) => {
                  const sText = span.textContent.trim();
                  if (!sText) return;
                  const sBeginAttr = span.getAttribute("begin");
                  const sEndAttr = span.getAttribute("end");

                  const sStart = sBeginAttr ? parseTimeStrToSeconds(sBeginAttr) : currentWordStart;
                  const sEnd = sEndAttr ? parseTimeStrToSeconds(sEndAttr) : (sStart + 0.5);

                  newItems.push({
                    id: 'import_' + Date.now() + '_' + pIdx + '_' + sIdx,
                    text: sText,
                    start: sStart,
                    end: sEnd,
                    lineIndex: pIdx,
                    trackIndex: pIdx % 4,
                    isWord: true,
                    isSyllable: false
                  });
                  currentWordStart = sEnd;
                });
              } else {
                const pText = p.textContent.trim();
                if (pText) {
                  newItems.push({
                    id: 'import_' + Date.now() + '_' + pIdx,
                    text: pText,
                    start: lineBegin,
                    end: lineEnd > lineBegin ? lineEnd : (lineBegin + 4.0),
                    lineIndex: pIdx,
                    trackIndex: pIdx % 3,
                    isWord: false
                  });
                }
              }
              detectedLines.push(p.textContent.trim());
            });
          }
        } else if (content.includes('[')) {
          const lrcLines = content.split('\n');
          let tempLrc = [];

          lrcLines.forEach((l, idx) => {
            const match = l.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/);
            if (match) {
              const min = parseFloat(match[1]);
              const sec = parseFloat(match[2]);
              const time = (min * 60) + sec;
              const text = match[3].trim();
              if (text) {
                tempLrc.push({ time, text, lineIdx: idx });
                detectedLines.push(text);
              }
            }
          });

          tempLrc.forEach((cur, i) => {
            const nextTime = (i + 1 < tempLrc.length) ? tempLrc[i + 1].time : (cur.time + 4.0);
            newItems.push({
              id: 'lrc_' + Date.now() + '_' + i,
              text: cur.text,
              start: cur.time,
              end: Math.min(nextTime, cur.time + 5.0),
              lineIndex: i,
              trackIndex: i % 3,
              isWord: false
            });
          });
        }

        if (newItems.length > 0) {
          items = newItems;
          selectedItemIds.clear();
          rawLyrics.value = detectedLines.join('\n');
          renderAllBlocks();
          updateSelectedBadge();

          const firstStart = Math.min(...items.map(i => i.start));
          timelineScroll.scrollLeft = Math.max(0, (firstStart * pixelsPerSecond) - 80);
          autoSaveState();

          customAlert(`🎉 "${filename}" successfully imported!\nTotal ${items.length} blocks placed.`, "Import Successful");
        } else {
          customAlert("No timestamped lyrics found in file!", "Import Failed");
        }
      } catch (err) {
        alert("Error parsing file: " + err.message);
      }
    }

    modeWords.addEventListener('click', () => {
      editMode = 'words';
      modeWords.classList.add('active');
      modeLines.classList.remove('active');
      autoSaveState();
    });
    modeLines.addEventListener('click', () => {
      editMode = 'lines';
      modeLines.classList.add('active');
      modeWords.classList.remove('active');
      autoSaveState();
    });

    zoomRange.addEventListener('input', (e) => {
      const oldPPS = pixelsPerSecond;
      const newPPS = parseInt(e.target.value);
      if (newPPS === oldPPS) return;

      // Zoom sırasında ekranın ortasındaki zaman noktasını koru
      const viewportWidth = timelineScroll.clientWidth;
      const centerTime = (timelineScroll.scrollLeft + viewportWidth / 2) / oldPPS;

      pixelsPerSecond = newPPS;
      renderRuler();
      renderAllBlocks();

      playhead.style.left = (currentPositionSec * pixelsPerSecond) + 'px';

      // Ekranı tam olarak önceki merkezdeki zamana ortala
      timelineScroll.scrollLeft = Math.max(0, (centerTime * pixelsPerSecond) - viewportWidth / 2);
      autoSaveState();
    });

    function renderRuler() {
      const duration = Math.max(songDurationSec, 300);
      const totalWidth = duration * pixelsPerSecond;
      timelineWrapper.style.width = totalWidth + 'px';
      ruler.innerHTML = '';

      const step = pixelsPerSecond < 40 ? 5 : (pixelsPerSecond < 100 ? 2 : 1);
      for (let sec = 0; sec <= duration; sec += step) {
        const mark = document.createElement('div');
        mark.style.position = 'absolute';
        mark.style.left = (sec * pixelsPerSecond) + 'px';
        mark.style.top = '0';
        mark.style.bottom = '0';
        mark.style.borderLeft = '1px solid rgba(255,255,255,0.06)';
        mark.style.fontSize = '9px';
        mark.style.fontFamily = "var(--font-mono)";
        mark.style.paddingLeft = '4px';
        mark.style.color = 'var(--text-dim)';
        mark.innerText = formatTime(sec).slice(3, 8);
        ruler.appendChild(mark);
      }
    }
    // Sıfırla Düğmesi
    btnClearAll.addEventListener('click', async () => {
      const ok = await customConfirm("Are you sure you want to reset all lyrics and timeline blocks? This cannot be undone.", "Reset Workspace");
      if (ok) {
        localStorage.removeItem(STORAGE_KEY);
        items = [];
        selectedItemIds.clear();
        rawLyrics.value = '';
        renderAllBlocks();
        updateSelectedBadge();
        if (saveStatusIndicator) {
          saveStatusIndicator.innerText = '🗑️ Reset';
        }
      }
    });

    function renderAllBlocks() {
      tracksContainer.innerHTML = '';
      const maxTrack = Math.max(...items.map(i => i.trackIndex || 0), 3);
      tracksContainer.style.height = ((maxTrack + 1) * 48 + 40) + 'px';

      items.forEach(b => {
        const el = document.createElement('div');
        el.className = 'block-clip' + 
          (b.isSyllable ? ' type-syllable' : (b.isWord ? ' type-word' : '')) + 
          (b.isBgVocal ? ' is-bg-vocal' : '') +
          (selectedItemIds.has(b.id) ? ' selected' : '');
        el.id = b.id;

        const leftPx = b.start * pixelsPerSecond;
        const widthPx = Math.max(16, (b.end - b.start) * pixelsPerSecond);
        const topPx = b.trackIndex * 46 + 6;

        el.style.left = leftPx + 'px';
        el.style.width = widthPx + 'px';
        el.style.top = topPx + 'px';

        el.innerHTML = `
          <div class="edge-handle left"></div>
          <div class="clip-text">${b.text}</div>
          <div class="edge-handle right"></div>
        `;

        setupBlockInteractions(el, b);
        tracksContainer.appendChild(el);
      });
    }

    function setupBlockInteractions(el, item) {
      const handleL = el.querySelector('.edge-handle.left');
      const handleR = el.querySelector('.edge-handle.right');

      handleL.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizingLeft = true;
        activeResizeItem = item;
        dragStartX = e.clientX;
        initialItemPositions.set(item.id, { start: item.start, end: item.end });
      });

      handleR.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizingRight = true;
        activeResizeItem = item;
        dragStartX = e.clientX;
        initialItemPositions.set(item.id, { start: item.start, end: item.end });
      });

      el.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('edge-handle')) return;
        e.stopPropagation();

        const isCtrl = e.ctrlKey || e.metaKey || e.shiftKey;

        if (isCtrl) {
          if (selectedItemIds.has(item.id)) {
            selectedItemIds.delete(item.id);
            el.classList.remove('selected');
          } else {
            selectedItemIds.add(item.id);
            el.classList.add('selected');
          }
        } else {
          if (!selectedItemIds.has(item.id)) {
            selectedItemIds.clear();
            document.querySelectorAll('.block-clip').forEach(c => c.classList.remove('selected'));
            selectedItemIds.add(item.id);
            el.classList.add('selected');
          }
        }

        updateSelectedBadge();

        isDraggingSelection = true;
        dragStartX = e.clientX;
        initialItemPositions.clear();
        selectedItemIds.forEach(id => {
          const obj = items.find(it => it.id === id);
          if (obj) {
            initialItemPositions.set(id, { start: obj.start, end: obj.end });
          }
        });
      });
    }

    timelineScroll.addEventListener('mousedown', (e) => {
      if (e.target.closest('.block-clip') || e.target.closest('.ruler-bar')) return;

      const rect = timelineWrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      isMarqueeActive = true;
      marqueeStartX = clickX;
      marqueeStartY = clickY;

      marqueeBox.style.left = marqueeStartX + 'px';
      marqueeBox.style.top = marqueeStartY + 'px';
      marqueeBox.style.width = '0px';
      marqueeBox.style.height = '0px';
      marqueeBox.style.display = 'block';

      if (!e.ctrlKey && !e.shiftKey) {
        selectedItemIds.clear();
        document.querySelectorAll('.block-clip').forEach(c => c.classList.remove('selected'));
        updateSelectedBadge();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingSelection || isMarqueeActive || isResizingLeft || isResizingRight) {
        const scrollRect = timelineScroll.getBoundingClientRect();
        const edgeThreshold = 50;
        if (e.clientX < scrollRect.left + edgeThreshold) {
          timelineScroll.scrollLeft -= 15;
        } else if (e.clientX > scrollRect.right - edgeThreshold) {
          timelineScroll.scrollLeft += 15;
        }
      }

      if (isMarqueeActive) {
        const rect = timelineWrapper.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;

        const left = Math.min(marqueeStartX, curX);
        const top = Math.min(marqueeStartY, curY);
        const width = Math.abs(curX - marqueeStartX);
        const height = Math.abs(curY - marqueeStartY);

        marqueeBox.style.left = left + 'px';
        marqueeBox.style.top = top + 'px';
        marqueeBox.style.width = width + 'px';
        marqueeBox.style.height = height + 'px';

        items.forEach(item => {
          const el = document.getElementById(item.id);
          if (!el) return;
          const bLeft = item.start * pixelsPerSecond;
          const bRight = item.end * pixelsPerSecond;
          const bTop = item.trackIndex * 46 + 6;
          const bBottom = bTop + 36;

          const inX = bLeft < (left + width) && bRight > left;
          const inY = bTop < (top + height) && bBottom > top;

          if (inX && inY) {
            selectedItemIds.add(item.id);
            el.classList.add('selected');
          }
        });
        updateSelectedBadge();
        return;
      }

      if (isResizingLeft && activeResizeItem) {
        const deltaX = e.clientX - dragStartX;
        const deltaTime = deltaX / pixelsPerSecond;
        const init = initialItemPositions.get(activeResizeItem.id);
        const newStart = Math.max(0, init.start + deltaTime);
        if (newStart < activeResizeItem.end - 0.05) {
          activeResizeItem.start = newStart;
          updateBlockDOM(activeResizeItem);
        }
        return;
      }
      if (isResizingRight && activeResizeItem) {
        const deltaX = e.clientX - dragStartX;
        const deltaTime = deltaX / pixelsPerSecond;
        const init = initialItemPositions.get(activeResizeItem.id);
        const newEnd = Math.max(activeResizeItem.start + 0.05, init.end + deltaTime);
        activeResizeItem.end = newEnd;
        updateBlockDOM(activeResizeItem);
        return;
      }

      if (isDraggingSelection) {
        const deltaX = e.clientX - dragStartX;
        const deltaTime = deltaX / pixelsPerSecond;

        let minStart = Infinity;
        selectedItemIds.forEach(id => {
          const init = initialItemPositions.get(id);
          if (init && init.start < minStart) minStart = init.start;
        });

        const effectiveDeltaTime = (minStart + deltaTime < 0) ? -minStart : deltaTime;

        selectedItemIds.forEach(id => {
          const item = items.find(it => it.id === id);
          const init = initialItemPositions.get(id);
          if (item && init) {
            const dur = init.end - init.start;
            item.start = Math.max(0, init.start + effectiveDeltaTime);
            item.end = item.start + dur;
            updateBlockDOM(item);
          }
        });
      }
    });

    window.addEventListener('mouseup', () => {
      const wasManipulating = isDraggingSelection || isResizingLeft || isResizingRight;
      if (isMarqueeActive) {
        isMarqueeActive = false;
        marqueeBox.style.display = 'none';
      }
      isDraggingSelection = false;
      isResizingLeft = false;
      isResizingRight = false;
      activeResizeItem = null;

      if (wasManipulating) {
        autoSaveState();
      }
    });

    function updateBlockDOM(item) {
      const el = document.getElementById(item.id);
      if (!el) return;
      el.style.left = (item.start * pixelsPerSecond) + 'px';
      el.style.width = Math.max(16, (item.end - item.start) * pixelsPerSecond) + 'px';
    }

    function updateSelectedBadge() {
      const count = selectedItemIds.size;
      selectedCountBadge.innerText = `${count} selected`;
    }

    function selectAllItems() {
      selectedItemIds.clear();
      items.forEach(it => selectedItemIds.add(it.id));
      document.querySelectorAll('.block-clip').forEach(c => c.classList.add('selected'));
      updateSelectedBadge();
    }

    function deleteSelectedItems() {
      if (selectedItemIds.size === 0) return;
      items = items.filter(it => !selectedItemIds.has(it.id));
      selectedItemIds.clear();
      renderAllBlocks();
      updateSelectedBadge();
      autoSaveState();
    }

    btnSelectAll.addEventListener('click', selectAllItems);
    btnDeleteSelected.addEventListener('click', deleteSelectedItems);

    btnShiftBack.addEventListener('click', () => {
      if (items.length === 0) return;
      items.forEach(it => {
        it.start = Math.max(0, it.start - 0.25);
        it.end = Math.max(0.05, it.end - 0.25);
      });
      renderAllBlocks();
      autoSaveState();
    });

    btnShiftForward.addEventListener('click', () => {
      if (items.length === 0) return;
      items.forEach(it => {
        it.start += 0.25;
        it.end += 0.25;
      });
      renderAllBlocks();
      autoSaveState();
    });

    btnSplit.addEventListener('click', () => {
      if (selectedItemIds.size === 0) {
        customAlert("Please select a line block to split into words!", "Split Line");
        return;
      }
      let splitCount = 0;
      const newItems = [];
      items.forEach(item => {
        if (selectedItemIds.has(item.id) && !item.isWord) {
          const words = item.text.split(' ').filter(w => w.length > 0);
          if (words.length > 1) {
            splitCount++;
            const totalDur = item.end - item.start;
            const wordDur = totalDur / words.length;
            words.forEach((w, idx) => {
              newItems.push({
                id: 'split_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                text: w,
                start: item.start + (idx * wordDur),
                end: item.start + ((idx + 1) * wordDur),
                lineIndex: item.lineIndex,
                trackIndex: item.trackIndex,
                isWord: true,
                isSyllable: false
              });
            });
          } else {
            newItems.push(item);
          }
        } else {
          newItems.push(item);
        }
      });

      if (splitCount > 0) {
        items = newItems;
        selectedItemIds.clear();
        renderAllBlocks();
        updateSelectedBadge();
        autoSaveState();
      }
    });

    btnMerge.addEventListener('click', () => {
      if (selectedItemIds.size < 2) {
        customAlert("Select at least 2 word blocks to merge!", "Merge Words");
        return;
      }
      const selectedList = items.filter(it => selectedItemIds.has(it.id)).sort((a,b) => a.start - b.start);
      const combinedText = selectedList.map(it => it.text).join(' ');
      const minStart = selectedList[0].start;
      const maxEnd = selectedList[selectedList.length - 1].end;
      const trackIndex = selectedList[0].trackIndex;
      const lineIndex = selectedList[0].lineIndex;

      items = items.filter(it => !selectedItemIds.has(it.id));
      const mergedBlock = {
        id: 'merged_' + Date.now(),
        text: combinedText,
        start: minStart,
        end: maxEnd,
        lineIndex: lineIndex,
        trackIndex: trackIndex,
        isWord: false,
        isSyllable: false
      };
      items.push(mergedBlock);

      selectedItemIds.clear();
      selectedItemIds.add(mergedBlock.id);
      renderAllBlocks();
      updateSelectedBadge();
      autoSaveState();
    });

    function updatePreview(curTime) {
      const currentBlock = items.find(b => curTime >= b.start && curTime <= b.end);
      if (!currentBlock) {
        previewLine.innerHTML = `<span style="color:var(--text-dim); font-size:14px; font-weight:400;">...</span>`;
        return;
      }

      if (currentBlock.isWord) {
        const sameLine = items.filter(w => w.lineIndex === currentBlock.lineIndex).sort((a,b) => a.start - b.start);
        
        let html = '';
        let wordBuffer = [];

        function flushWordBuffer() {
          if (wordBuffer.length === 0) return;
          html += `<span class="word-unit">`;
          wordBuffer.forEach(s => {
            const isCur = curTime >= s.start && curTime <= s.end;
            const isPast = curTime > s.end;
            const cls = isPast ? 'past' : (isCur ? 'active' : 'future');
            html += `<span class="syl-unit ${cls}">${s.text}</span>`;
          });
          html += `</span>`;
          wordBuffer = [];
        }

        sameLine.forEach(it => {
          if (it.isSyllable) {
            wordBuffer.push(it);
            if (it.isLastSyllableOfWord) {
              flushWordBuffer();
            }
          } else {
            flushWordBuffer();
            wordBuffer.push(it);
            flushWordBuffer();
          }
        });
        flushWordBuffer();

        previewLine.innerHTML = html;
      } else {
        const words = currentBlock.text.split(' ');
        const totalDur = currentBlock.end - currentBlock.start;
        const progress = (curTime - currentBlock.start) / totalDur;
        const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

        let html = '';
        words.forEach((w, i) => {
          if (i < activeWordIndex) {
            html += `<span class="syl-unit past" style="margin-right:8px;">${w}</span>`;
          } else if (i === activeWordIndex) {
            html += `<span class="syl-unit active" style="margin-right:8px;">${w}</span>`;
          } else {
            html += `<span class="syl-unit future" style="margin-right:8px;">${w}</span>`;
          }
        });
        previewLine.innerHTML = html;
      }
    }

    // ==========================================
    // 💾 TTML İNDİR (SPICY LYRICS TAM UYUMLU)
    // ==========================================
    btnExport.addEventListener('click', () => {
      if (items.length === 0) {
        customAlert("No blocks on the timeline to export!", "Export Failed");
        return;
      }

      const sorted = [...items].sort((a,b) => a.start - b.start);

      let ttml = `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" 
    xmlns:ttm="http://www.w3.org/ns/ttml#metadata">
  <head>
    <metadata>
      <ttm:title>Spicy Lyrics Synced</ttm:title>
    </metadata>
  </head>
  <body>
    <div>\n`;

      const groups = [];
      let currentGroup = [];

      sorted.forEach(it => {
        if (currentGroup.length === 0) {
          currentGroup.push(it);
        } else {
          const prev = currentGroup[currentGroup.length - 1];
          if (it.lineIndex === prev.lineIndex && (it.start - prev.end) < 2.5) {
            currentGroup.push(it);
          } else {
            groups.push(currentGroup);
            currentGroup = [it];
          }
        }
      });
      if (currentGroup.length > 0) groups.push(currentGroup);

      groups.forEach(grp => {
        const pStart = toTTMLTime(grp[0].start);
        const pEnd = toTTMLTime(grp[grp.length - 1].end);
        const isGroupBg = grp.some(b => b.isBgVocal);
        const bgAttrs = isGroupBg ? ' ttm:role="x-bg" tts:textAlign="right"' : '';
        ttml += `      <p begin="${pStart}" end="${pEnd}"${bgAttrs}>\n        `;

        grp.forEach(b => {
          if (b.isSyllable) {
            const trailingSpace = b.isLastSyllableOfWord ? ' ' : '';
            ttml += `<span begin="${toTTMLTime(b.start)}" end="${toTTMLTime(b.end)}">${b.text}</span>${trailingSpace}`;
          } else if (b.isWord) {
            ttml += `<span begin="${toTTMLTime(b.start)}" end="${toTTMLTime(b.end)}">${b.text}</span> `;
          } else {
            const words = b.text.split(' ').filter(w => w.length > 0);
            const wordDur = (b.end - b.start) / words.length;
            words.forEach((w, idx) => {
              const wS = toTTMLTime(b.start + (idx * wordDur));
              const wE = toTTMLTime(b.start + ((idx + 1) * wordDur));
              ttml += `<span begin="${wS}" end="${wE}">${w}</span> `;
            });
          }
        });

        ttml += `\n      </p>\n`;
      });

      ttml += `    </div>
  </body>
</tt>`;

      const blob = new Blob([ttml], { type: 'application/xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'SpicyLyrics_Spotify_Synced.ttml';
      a.click();
    });

    // ==========================================
    // 📁 PROJE SİSTEMİ (.JSON İNDİR / GERİ YÜKLE)
    // ==========================================
    btnSaveProject.addEventListener('click', () => {
      if (items.length === 0 && !rawLyrics.value.trim()) {
        customAlert("No project data to save!", "Save Project");
        return;
      }

      // Spotify şarkı ismi varsa dosya adına ekle
      let songName = 'Project';
      if (isSpotifyConnected && spotifyStatusText.innerText && !spotifyStatusText.innerText.includes('Bekleniyor')) {
        songName = spotifyStatusText.innerText.replace(/[\/\\?%*:|"<>]/g, '_');
      }

      const projectData = {
        version: "1.0",
        app: "SpicyLyricsStudio",
        savedAt: new Date().toISOString(),
        rawLyrics: rawLyrics.value,
        editMode: editMode,
        zoom: pixelsPerSecond,
        items: items
      };

      const jsonStr = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${songName}_SpicyProject.json`;
      a.click();

      // Recent work listesine ekle
      addRecentProjectEntry(songName, projectData);
    });

    projectFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const loaded = JSON.parse(evt.target.result);
          if (!loaded.items || !Array.isArray(loaded.items)) {
            throw new Error("Not a valid Spicy Studio project file!");
          }

          rawLyrics.value = loaded.rawLyrics || '';
          if (loaded.editMode) {
            editMode = loaded.editMode;
            if (editMode === 'lines') {
              modeLines.classList.add('active');
              modeWords.classList.remove('active');
            } else {
              modeWords.classList.add('active');
              modeLines.classList.remove('active');
            }
          }
          if (loaded.zoom) {
            pixelsPerSecond = loaded.zoom;
            zoomRange.value = loaded.zoom;
          }

          items = loaded.items;
          selectedItemIds.clear();
          renderRuler();
          renderAllBlocks();
          updateSelectedBadge();
          autoSaveState();

          if (items.length > 0) {
            const firstStart = Math.min(...items.map(i => i.start));
            timelineScroll.scrollLeft = Math.max(0, (firstStart * pixelsPerSecond) - 80);
          }

          // Recent work listesine ekle
          addRecentProjectEntry(file.name.replace('_SpicyProject.json', '').replace('.json', ''), loaded);
          customAlert(`🎉 "${file.name}" project successfully loaded!\nTotal ${items.length} blocks loaded.`, "Project Loaded");
        } catch (err) {
          alert("Error loading project file: " + err.message);
        }
      };
      reader.readAsText(file, 'utf-8');
      projectFileInput.value = ''; // Aynı dosyayı tekrar seçebilmek için sıfırla
    });

    function toTTMLTime(totalSeconds) {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
    }

    // ==========================================
    // 🖥️ VISUAL STUDIO TARZI BAŞLANGIÇ EKRANI MANTIĞI
    // ==========================================
    const vsWelcomeOverlay = document.getElementById('vsWelcomeOverlay');
    const vsRecentList = document.getElementById('vsRecentList');
    const vsSearchInput = document.getElementById('vsSearchInput');
    const vsCardNewProject = document.getElementById('vsCardNewProject');
    const vsCardOpenProject = document.getElementById('vsCardOpenProject');
    const vsCardImportTTML = document.getElementById('vsCardImportTTML');
    const vsCardContinueLast = document.getElementById('vsCardContinueLast');
    const vsSkipLink = document.getElementById('vsSkipLink');
    const btnVsClose = document.getElementById('btnVsClose');
    const chkAlwaysShowVs = document.getElementById('chkAlwaysShowVs');
    const btnSwitchProject = document.getElementById('btnSwitchProject');

    const VS_ALWAYS_SHOW_KEY = 'spicy_studio_always_show_vs_start';

    // Başlangıç ekranını aç
    function openVsWelcome() {
      if (vsWelcomeOverlay) {
        renderVsRecentList();
        vsWelcomeOverlay.classList.remove('hidden');
      }
    }

    function closeVsWelcome() {
      if (vsWelcomeOverlay) {
        vsWelcomeOverlay.classList.add('hidden');
      }
    }

    if (btnVsClose) btnVsClose.addEventListener('click', closeVsWelcome);
    if (vsSkipLink) vsSkipLink.addEventListener('click', closeVsWelcome);
    if (btnSwitchProject) btnSwitchProject.addEventListener('click', openVsWelcome);

    // Her zaman aç onay kutusu ayarı
    const savedAlwaysShow = localStorage.getItem(VS_ALWAYS_SHOW_KEY);
    // Varsayılan olarak true (açılsın)
    const shouldAlwaysShow = savedAlwaysShow !== null ? (savedAlwaysShow === 'true') : true;
    if (chkAlwaysShowVs) {
      chkAlwaysShowVs.checked = shouldAlwaysShow;
      chkAlwaysShowVs.addEventListener('change', () => {
        localStorage.setItem(VS_ALWAYS_SHOW_KEY, chkAlwaysShowVs.checked ? 'true' : 'false');
      });
    }

    // Eğer kullanıcı 'Her zaman göster' ayarını kapatmışsa ilk açılışta gösterme
    if (!shouldAlwaysShow) {
      closeVsWelcome();
    }

    // Yeni Proje
    vsCardNewProject.addEventListener('click', async () => {
      if (items.length > 0) {
        const ok = await customConfirm("Start a new song? Current unsaved work will be cleared.", "Create New Project");
        if (!ok) return;
        localStorage.removeItem(STORAGE_KEY);
        items = [];
        selectedItemIds.clear();
        rawLyrics.value = '';
        renderAllBlocks();
        updateSelectedBadge();
      } else {
        rawLyrics.value = '';
        renderAllBlocks();
      }
      closeVsWelcome();
      rawLyrics.focus();
    });

    // Proje Aç (.json)
    vsCardOpenProject.addEventListener('click', () => {
      closeVsWelcome();
      projectFileInput.click();
    });

    // TTML/LRC İçe Aktar
    vsCardImportTTML.addEventListener('click', () => {
      closeVsWelcome();
      ttmlFileInput.click();
    });

    // Kaldığım Yerden Devam Et
    vsCardContinueLast.addEventListener('click', () => {
      closeVsWelcome();
    });

    // Son Kullanılanlar Listesini Oluştur & Yönet
    const RECENT_PROJECTS_KEY = 'spicy_studio_recent_projects_v1';

    function getSavedRecentProjects() {
      try {
        const r = localStorage.getItem(RECENT_PROJECTS_KEY);
        return r ? JSON.parse(r) : [];
      } catch {
        return [];
      }
    }

    function saveRecentProjects(list) {
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(list));
    }

    function addRecentProjectEntry(title, projectData) {
      let list = getSavedRecentProjects();
      list = list.filter(p => p.title !== title);
      list.unshift({
        id: 'rec_' + Date.now(),
        title: title,
        type: 'Saved Project',
        date: new Date().toLocaleDateString(),
        data: projectData
      });
      if (list.length > 8) list = list.slice(0, 8);
      saveRecentProjects(list);
    }

    function renderVsRecentList() {
      vsRecentList.innerHTML = '';
      const recentList = getSavedRecentProjects();
      const saved = localStorage.getItem(STORAGE_KEY);
      
      const itemsToRender = [];

      // Autosaved Session (Varsa)
      if (saved) {
        try {
          const st = JSON.parse(saved);
          const firstLine = (st.rawLyrics || '').split('\n').filter(l => l.trim().length > 0)[0] || 'Autosaved Session';
          itemsToRender.push({
            id: 'autosave_session',
            title: firstLine.length > 28 ? firstLine.slice(0, 28) + '...' : firstLine,
            type: 'Current Autosave',
            date: 'Live',
            isAutosave: true,
            onOpen: () => {
              loadSavedState();
              renderAllBlocks();
              closeVsWelcome();
            },
            onDelete: (e) => {
              e.stopPropagation();
              if (confirm('Delete current autosaved session and clear timeline?')) {
                localStorage.removeItem(STORAGE_KEY);
                items = [];
                selectedItemIds.clear();
                rawLyrics.value = '';
                renderAllBlocks();
                updateSelectedBadge();
                renderVsRecentList();
              }
            }
          });
        } catch {}
      }

      // Kullanıcının kaydettiği veya açtığı projeler
      recentList.forEach(rec => {
        itemsToRender.push({
          id: rec.id,
          title: rec.title,
          type: rec.type || 'Project',
          date: rec.date || 'Recent',
          onOpen: () => {
            if (rec.data) {
              rawLyrics.value = rec.data.rawLyrics || '';
              if (rec.data.editMode) {
                editMode = rec.data.editMode;
                if (editMode === 'lines') {
                  modeLines.classList.add('active');
                  modeWords.classList.remove('active');
                } else {
                  modeWords.classList.add('active');
                  modeLines.classList.remove('active');
                }
              }
              if (rec.data.zoom) {
                pixelsPerSecond = rec.data.zoom;
                zoomRange.value = rec.data.zoom;
              }
              items = rec.data.items || [];
              selectedItemIds.clear();
              renderRuler();
              renderAllBlocks();
              updateSelectedBadge();
              autoSaveState();
              if (items.length > 0) {
                const firstStart = Math.min(...items.map(i => i.start));
                timelineScroll.scrollLeft = Math.max(0, (firstStart * pixelsPerSecond) - 80);
              }
            }
            closeVsWelcome();
          },
          onDelete: (e) => {
            e.stopPropagation();
            const filtered = getSavedRecentProjects().filter(p => p.id !== rec.id);
            saveRecentProjects(filtered);
            renderVsRecentList();
          }
        });
      });

      // Örnek / Varsayılan parça (Gizlenmediyse)
      const hideSample = localStorage.getItem('spicy_hide_sample_project');
      if (!hideSample) {
        itemsToRender.push({
          id: 'sample_kolpa',
          title: 'Kolpa - Hiç Bitmez Bu Masal',
          type: 'Sample Project',
          date: 'Sample',
          onOpen: () => {
            rawLyrics.value = `Nefesimi tuttum, korkmuyorum\nBugün vazgeçmek için çok erken\nUzar mı yol giderken sormuyorum\nAdımlarım hep büyük kendimden\nBelki çok üzülüp giderim gelmem\nBelki yağmur olup yağarım bilmem\nHiç bitmez bu masal\nBelki zor seçmek gelir içimden\nBelki hayatla yüzleştiğimden\nHiç bitmez bu masal\nBen yazar, ben yaşarım`;
            btnGenerateBlocks.click();
            closeVsWelcome();
          },
          onDelete: (e) => {
            e.stopPropagation();
            localStorage.setItem('spicy_hide_sample_project', 'true');
            renderVsRecentList();
          }
        });
      }

      if (itemsToRender.length === 0) {
        vsRecentList.innerHTML = '<div style="font-size:12px; color:var(--text-dim); padding:10px;">No recent projects found.</div>';
        return;
      }

      itemsToRender.forEach(item => {
        const el = document.createElement('div');
        el.className = 'vs-recent-item';
        el.innerHTML = `
          <div class="vs-item-left">
            <span class="vs-item-icon">🎵</span>
            <div>
              <div class="vs-item-title">${item.title}</div>
              <div class="vs-item-meta">${item.type}</div>
            </div>
          </div>
          <div class="vs-item-right">
            <span class="vs-item-meta">${item.date}</span>
            <button class="btn-delete-recent" title="Remove from list">✕</button>
          </div>
        `;
        el.addEventListener('click', item.onOpen);
        const delBtn = el.querySelector('.btn-delete-recent');
        if (delBtn) delBtn.addEventListener('click', item.onDelete);
        vsRecentList.appendChild(el);
      });
    }

    renderVsRecentList();

    // Arama Filtresi
    vsSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.vs-recent-item').forEach(item => {
        const txt = item.innerText.toLowerCase();
        item.style.display = txt.includes(q) ? 'flex' : 'none';
      });
    });

    // ESC tuşuyla da pencereyi kapatabilme
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !vsWelcomeOverlay.classList.contains('hidden')) {
        closeVsWelcome();
      }
    });

    // ==========================================
    // 🚀 SAYFA İLK AÇILIŞINDA ÇALIŞTIR
    // ==========================================
    loadSavedState();
    renderRuler();
    renderAllBlocks();
    updateSelectedBadge();
    if (items.length > 0) {
      const firstStart = Math.min(...items.map(i => i.start));
      timelineScroll.scrollLeft = Math.max(0, (firstStart * pixelsPerSecond) - 80);
    }
