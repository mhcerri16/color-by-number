// ============================================================================
//  COLORING ENGINE (Improved for Mobile Precision + Auto-Select + Jiggle Fix)
// ============================================================================

function setupColoring(pictureName, PICTURES) {
  const currentPicture = PICTURES[pictureName];
  if (!currentPicture) return;

  // --- DOM elements ---
  const canvas = document.getElementById("pixel-canvas");
  const ctx = canvas.getContext("2d");
  const colorBar = document.getElementById("color-bar");
  const backBtn = document.getElementById("back-btn");
  const resetBtn = document.getElementById("reset-btn");
  const title = document.getElementById("picture-title");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  let currentColor = null;
  let isDragging = false;
  let autoSelectPaused = false;

  title.textContent = currentPicture.name || pictureName;

  const rows = currentPicture.data.length;
  const cols = currentPicture.data[0].length;
  const basePixelSize = currentPicture.pixelSize;

  // ============================================================================
  //  SAVE / LOAD PROGRESS
  // ============================================================================
  const loadUserGrid = () => {
    const saved = localStorage.getItem("progress_" + pictureName);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  };

  const saveUserGrid = () =>
    localStorage.setItem("progress_" + pictureName, JSON.stringify(userGrid));

  // ============================================================================
  //  SMART SCALING
  // ============================================================================
  const computePixelSize = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    let size = basePixelSize;

    if (vw >= 768) {
      const maxW = vw * 0.70;
      const maxH = vh * 0.60;
      const sizeW = Math.floor(maxW / cols);
      const sizeH = Math.floor(maxH / rows);
      const best = Math.min(sizeW, sizeH);
      size = Math.max(basePixelSize, Math.min(best, basePixelSize * 2));
    }
    return size;
  };

  // ============================================================================
  //  USER GRID
  // ============================================================================
  let userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const restored = loadUserGrid();
  if (restored && restored.length === rows) userGrid = restored;

  // ============================================================================
  //  GET NEXT UNFINISHED COLOR
  // ============================================================================
  function getNextUnfilledColor() {
    for (const num in currentPicture.colors) {
      let needed = 0, filled = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (userGrid[r][c] === num) filled++;
          }
        }
      }

      if (needed > 0 && filled < needed) return num; 
    }
    return null;
  }

  // ============================================================================
  //  OVERLAY CANVAS
  // ============================================================================
  const overlay = document.createElement("canvas");
  overlay.id = "paint-overlay";
  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  canvas.parentNode.appendChild(overlay);

  const positionOverlay = () => {
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.left = "0px";
    overlay.style.top = "0px";
  };

  // ============================================================================
  //  BUILD PALETTE
  // ============================================================================
  colorBar.innerHTML = "";
  Object.entries(currentPicture.colors).forEach(([num, hex]) => {
    const sw = document.createElement("div");
    sw.className = "color-swatch";
    sw.dataset.value = num;
    sw.style.background = hex;

    const label = document.createElement("div");
    label.className = "swatch-number";
    label.textContent = num;

    sw.appendChild(label);

    // manual override
    sw.onclick = () => {
      autoSelectPaused = true;
      selectColor(num, sw, true);
    };

    colorBar.appendChild(sw);
  });

  // ============================================================================
  //  SELECT COLOR
  // ============================================================================
  function selectColor(num, swatchElement, manual = false) {
    currentColor = num;

    document.querySelectorAll(".color-swatch")
      .forEach(s => s.classList.remove("selected"));

    swatchElement.classList.add("selected");

    if (manual) {
      autoSelectPaused = true;
    }

    drawPixels();
  }

  // ============================================================================
  //  COMPLETION SPARKLE
  // ============================================================================
  const playCompletionSparkle = () => {
    canvas.classList.add("sparkle");
    setTimeout(() => canvas.classList.remove("sparkle"), 900);
  };

  // ============================================================================
  //  PROGRESS BAR UPDATES
  // ============================================================================
  const updateProgress = () => {
    let count = 0;
    const total = rows * cols;

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (userGrid[r][c] !== null) count++;

    const pct = Math.floor((count / total) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = pct + "%";

    if (pct === 100) {
      const already = localStorage.getItem("completed_" + pictureName);
      localStorage.setItem("completed_" + pictureName, "true");
      canvas.classList.add("complete-picture");
      if (!already) playCompletionSparkle();
    } else {
      canvas.classList.remove("complete-picture");
    }
  };

  // ============================================================================
  //  CHECKMARK + JIGGLE + DELAYED AUTO-SELECT
  // ============================================================================
  const updateColorChecks = () => {
    let completedThisFrame = false;
    let lastCompletedColor = null;

    for (const num in currentPicture.colors) {
      const swatch = document.querySelector(`.color-swatch[data-value="${num}"]`);
      if (!swatch) continue;

      const label = swatch.querySelector(".swatch-number");

      let needed = 0, filled = 0;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (userGrid[r][c] === num) filled++;
          }

      const isCompleted = needed > 0 && filled === needed;
      const wasCompletedBefore = (label.textContent === "✔");

      if (isCompleted) {
        label.textContent = "✔";
        label.style.fontSize = "22px";

        if (!wasCompletedBefore) {
          // JIGGLE FIX
          swatch.classList.remove("swatch-jiggle");
          void swatch.offsetWidth;
          swatch.classList.add("swatch-jiggle");

          completedThisFrame = true;
          lastCompletedColor = num;
        }

        autoSelectPaused = false;

      } else {
        label.textContent = num;
        label.style.fontSize = "20px";
      }
    }

    // ============================================================
    // DELAYED AUTO-SELECT (Jiggle Fix)
    // ============================================================
    if (!autoSelectPaused) {
      const next = getNextUnfilledColor();

      if (next !== null && next !== currentColor) {
        setTimeout(() => {
          const sw = document.querySelector(`.color-swatch[data-value="${next}"]`);
          if (sw) selectColor(next, sw);
        }, 120);  // delay ensures jiggle is visible
      }
    }
  };

  // ============================================================================
  //  DRAW PIXELS
  // ============================================================================
  const drawPixels = () => {
    const size = computePixelSize();
    canvas.width = cols * size;
    canvas.height = rows * size;
    positionOverlay();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const target = currentPicture.data[r][c];
        const painted = userGrid[r][c];

        ctx.fillStyle = painted === null ? "#ffffff" : currentPicture.colors[painted];
        ctx.fillRect(c * size, r * size, size, size);

        const highlight =
          painted === null &&
          currentColor !== null &&
          String(target) === String(currentColor);

        if (highlight) {
          ctx.fillStyle = "rgba(250, 204, 21, 0.35)";
          ctx.fillRect(c * size, r * size, size, size);
        }

        if (painted === null) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = highlight
            ? `bold ${size * 0.65}px Courier New`
            : `${size * 0.5}px Courier New`;
          ctx.fillStyle = "#000";
          ctx.fillText(target, c * size + size / 2, r * size + size / 2);
        }
      }
    }
  };

  // ============================================================================
  //  PIXEL PAINTING (High Accuracy)
  // ============================================================================
  const BRUSH_RADIUS = 1;

  const paintPixel = (clientX, clientY) => {
    if (!currentColor) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const col = Math.floor(x / size);
    const row = Math.floor(y / size);

    for (let dr = -BRUSH_RADIUS; dr <= BRUSH_RADIUS; dr++) {
      for (let dc = -BRUSH_RADIUS; dc <= BRUSH_RADIUS; dc++) {
        const rr = row + dr, cc = col + dc;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;

        if (String(currentPicture.data[rr][cc]) === String(currentColor)) {
          userGrid[rr][cc] = currentColor;
        }
      }
    }

    drawPixels();
    updateProgress();
    updateColorChecks();
    saveUserGrid();
  };

  // ============================================================================
  //  BRUSH INDICATOR
  // ============================================================================
  const drawIndicator = (clientX, clientY) => {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const radius = BRUSH_RADIUS * size + size / 2;

    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.strokeStyle = "rgba(15, 23, 42, 0.8)";
    octx.lineWidth = 2;
    octx.stroke();
  };

  // ============================================================================
  //  POINTER EVENTS
  // ============================================================================
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    isDragging = true;
    paintPixel(e.clientX, e.clientY);
    drawIndicator(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointermove", e => {
    if (isDragging) {
      paintPixel(e.clientX, e.clientY);
    }
    drawIndicator(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointerup", e => {
    canvas.releasePointerCapture(e.pointerId);
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  // ============================================================================
  //  BUTTONS
  // ============================================================================
  backBtn.onclick = () => (window.location.href = "index.html");

  resetBtn.onclick = () => {
    if (!confirm("Reset this picture and clear all progress?")) return;

    userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
    localStorage.removeItem("progress_" + pictureName);
    localStorage.removeItem("completed_" + pictureName);
    canvas.classList.remove("complete-picture");

    drawPixels();
    updateProgress();
    updateColorChecks();
  };

  // ============================================================================
  //  INIT
  // ============================================================================
  drawPixels();
  updateProgress();
  updateColorChecks();

  window.addEventListener("resize", () => {
    drawPixels();
    updateColorChecks();
  });
}

window.setupColoring = setupColoring;
