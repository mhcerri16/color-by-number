// ============================================================================
//  COLORING ENGINE — Auto-Select Option A + Jiggle + Mobile Precision
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

  title.textContent = currentPicture.name || pictureName;

  // ========================================================================
  // STATE
  // ========================================================================
  const rows = currentPicture.data.length;
  const cols = currentPicture.data[0].length;
  const basePixelSize = currentPicture.pixelSize;

  let isDragging = false;
  let currentColor = null;
  let manualOverride = false; // when true, auto-select will not override user choice

  // ========================================================================
  // LOAD / SAVE
  // ========================================================================
  const loadUserGrid = () => {
    try {
      const saved = localStorage.getItem("progress_" + pictureName);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const saveUserGrid = () => {
    localStorage.setItem("progress_" + pictureName, JSON.stringify(userGrid));
  };

  let userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const restored = loadUserGrid();
  if (restored && restored.length === rows) userGrid = restored;

  // ========================================================================
  // SCALING
  // ========================================================================
  const computePixelSize = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let size = basePixelSize;

    if (vw >= 768) {
      const maxW = vw * 0.70;
      const maxH = vh * 0.60;

      const sizeW = Math.floor(maxW / cols);
      const sizeH = Math.floor(maxH / rows);

      const chosen = Math.min(sizeW, sizeH);
      size = Math.max(basePixelSize, Math.min(chosen, basePixelSize * 2));
    }

    return size;
  };

  // ========================================================================
  // OVERLAY CANVAS (brush indicator)
  // ========================================================================
  const overlay = document.createElement("canvas");
  overlay.id = "paint-overlay";
  overlay.style.position = "absolute";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.pointerEvents = "none";
  canvas.parentNode.appendChild(overlay);

  const positionOverlay = () => {
    overlay.width = canvas.width;
    overlay.height = canvas.height;
  };

  // ========================================================================
  // PALETTE
  // ========================================================================
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
    colorBar.appendChild(sw);

    // Manual selection: pause auto-select
    sw.addEventListener("click", () => {
      manualOverride = true;
      selectColor(num, sw, true);
    });
  });

  // ========================================================================
  // SELECT COLOR
  // ========================================================================
  function selectColor(num, swatchElement, userClicked = true) {
    currentColor = num;

    if (userClicked) {
      manualOverride = true;
    }

    document.querySelectorAll(".color-swatch")
      .forEach(s => s.classList.remove("selected"));

    swatchElement.classList.add("selected");
    drawPixels();
  }

  // ========================================================================
  // COMPLETION SPARKLE
  // ========================================================================
  const playCompletionSparkle = () => {
    canvas.classList.add("sparkle");
    setTimeout(() => canvas.classList.remove("sparkle"), 900);
  };

  // ========================================================================
  // PROGRESS BAR
  // ========================================================================
  const updateProgress = () => {
    let filled = 0;
    const total = rows * cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (userGrid[r][c] !== null) filled++;
      }
    }

    const pct = Math.floor((filled / total) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = pct + "%";

    if (pct === 100) {
      const was = localStorage.getItem("completed_" + pictureName);
      localStorage.setItem("completed_" + pictureName, "true");
      canvas.classList.add("complete-picture");
      if (!was) playCompletionSparkle();
    } else {
      canvas.classList.remove("complete-picture");
    }
  };

  // ========================================================================
  // COLOR COMPLETION CHECK + JIGGLE
  // ========================================================================
  const updateColorChecks = () => {
    Object.keys(currentPicture.colors).forEach(num => {
      const swatch = document.querySelector(
        `.color-swatch[data-value="${num}"]`
      );
      if (!swatch) return;

      const label = swatch.querySelector(".swatch-number");

      let needed = 0;
      let filled = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (String(userGrid[r][c]) === String(num)) filled++;
          }
        }
      }

      const isComplete = needed > 0 && filled === needed;
      const wasCheck = label.textContent === "✔";

      if (isComplete) {
        label.textContent = "✔";
        label.style.fontSize = "22px";

        if (!wasCheck) {
          swatch.classList.remove("swatch-jiggle");
          void swatch.offsetWidth; // force reflow
          swatch.classList.add("swatch-jiggle");
        }

        // If the color that just finished is the current one, let auto-select resume
        if (String(currentColor) === String(num)) {
          manualOverride = false;
        }

      } else {
        label.textContent = num;
        label.style.fontSize = "20px";
      }
    });
  };

  // ========================================================================
  // AUTO-SELECT NEXT COLOR (Option A)
  // ========================================================================
  const autoSelectNextColorIfReady = () => {
    if (manualOverride) return; // do not override a manual choice

    const nums = Object.keys(currentPicture.colors)
      .map(n => Number(n))
      .sort((a, b) => a - b);

    for (const num of nums) {
      let needed = 0;
      let filled = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (String(userGrid[r][c]) === String(num)) filled++;
          }
        }
      }

      // Pick the first color that has SOME pixels and is not fully complete
      if (needed > 0 && filled < needed) {
        const swatch = document.querySelector(
          `.color-swatch[data-value="${num}"]`
        );
        if (swatch) selectColor(String(num), swatch, false);
        return;
      }
    }
  };

  // ========================================================================
  // DRAW PIXELS
  // ========================================================================
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

        ctx.fillStyle =
          painted === null
            ? "#ffffff"
            : currentPicture.colors[painted];

        ctx.fillRect(c * size, r * size, size, size);

        const highlight =
          painted === null &&
          currentColor !== null &&
          String(target) === String(currentColor);

        if (highlight) {
          ctx.fillStyle = "rgba(250,204,21,0.35)";
          ctx.fillRect(c * size, r * size, size, size);
        }

        if (painted === null) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = highlight
            ? `${size * 0.65}px Courier New`
            : `${size * 0.5}px Courier New`;
          ctx.fillStyle = "#000";
          ctx.fillText(target, c * size + size / 2, r * size + size / 2);
        }
      }
    }
  };

  // ========================================================================
  // PAINTING
  // ========================================================================
  const BRUSH_RADIUS = 1;

  const paintPixel = (clientX, clientY) => {
    if (currentColor === null) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const baseCol = Math.floor(x / size);
    const baseRow = Math.floor(y / size);

    for (let dr = -BRUSH_RADIUS; dr <= BRUSH_RADIUS; dr++) {
      for (let dc = -BRUSH_RADIUS; dc <= BRUSH_RADIUS; dc++) {
        const rr = baseRow + dr;
        const cc = baseCol + dc;

        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;

        if (String(currentPicture.data[rr][cc]) === String(currentColor)) {
          userGrid[rr][cc] = currentColor;
        }
      }
    }

    drawPixels();
    updateProgress();
    updateColorChecks();
    autoSelectNextColorIfReady();
    saveUserGrid();
  };

  // ========================================================================
  // BRUSH INDICATOR
  // ========================================================================
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
    octx.strokeStyle = "rgba(15,23,42,0.8)";
    octx.lineWidth = 2;
    octx.stroke();
  };

  // ========================================================================
  // POINTER EVENTS
  // ========================================================================
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    isDragging = true;
    paintPixel(e.clientX, e.clientY);
    drawIndicator(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointermove", e => {
    if (isDragging) paintPixel(e.clientX, e.clientY);
    drawIndicator(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointerup", e => {
    canvas.releasePointerCapture(e.pointerId);
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  // ========================================================================
  // BUTTONS
  // ========================================================================
  backBtn.onclick = () => (window.location.href = "index.html");

  resetBtn.onclick = () => {
    if (!confirm("Reset this picture and clear all progress?")) return;

    userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
    localStorage.removeItem("progress_" + pictureName);
    localStorage.removeItem("completed_" + pictureName);
    canvas.classList.remove("complete-picture");

    manualOverride = false; // fresh auto-select allowed

    drawPixels();
    updateProgress();
    updateColorChecks();
    autoSelectNextColorIfReady();
  };

  // ========================================================================
  // INIT
  // ========================================================================
  drawPixels();
  updateProgress();
  updateColorChecks();

  manualOverride = false;      // ensure auto-select is active on load
  autoSelectNextColorIfReady();

  window.addEventListener("resize", () => {
    drawPixels();
    updateColorChecks();
  });
}

window.setupColoring = setupColoring;
