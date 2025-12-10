// ============================================================================
//  COLORING ENGINE — Auto-Select Option A + Jiggle + Mobile Precision + A-Z
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
  let manualOverride = false; // when true, auto-select pauses

  // cached normalized crack segments per stage (0–9)
  // crackCache[stage] = [ { x1, y1, x2, y2 }, ... ] with coords in radius units
  const crackCache = {};

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
  // OVERLAY CANVAS
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

    // Manual selection
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

    if (userClicked) manualOverride = true;

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

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (userGrid[r][c] !== null) filled++;

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

      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (String(userGrid[r][c]) === String(num)) filled++;
          }

      const isComplete = needed > 0 && filled === needed;
      const wasCheck = label.textContent === "✔";

      if (isComplete) {
        label.textContent = "✔";
        label.style.fontSize = "22px";

        if (!wasCheck) {
          swatch.classList.remove("swatch-jiggle");
          void swatch.offsetWidth;
          swatch.classList.add("swatch-jiggle");
        }

        // Allow auto-select to resume if this was the manual color
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
  // AUTO-SELECT NEXT COLOR (0–9 then a–z)
  // ========================================================================
  const autoSelectNextColorIfReady = () => {
    if (manualOverride) return;

    const nums = Object.keys(currentPicture.colors)
      .sort((a, b) => {
        const ai = parseInt(a, 36);
        const bi = parseInt(b, 36);
        return ai - bi;
      });

    for (const num of nums) {
      let needed = 0;
      let filled = 0;

      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (String(userGrid[r][c]) === String(num)) filled++;
          }

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

        // Number
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
  // CRACK PATTERN GENERATION (STATIC, CACHED PER STAGE)
  // ========================================================================
  function generateCracksForStage(stage) {
    // Returns array of segments with normalized coords (radius = 1)
    const segments = [];

    if (stage <= 0) return segments;

    const trunkCount = Math.floor(1 + stage * 0.9);        // 1 → ~9 trunks
    const branchChance = 0.08 + stage * 0.04;              // more branches at higher stage
    const maxLen = 1.0 * (0.4 + 0.1 * stage);              // length in radius units

    for (let t = 0; t < trunkCount; t++) {
      let angle = Math.random() * Math.PI * 2;
      let cx = 0;
      let cy = 0;

      const steps = Math.floor(20 + stage * 6);

      for (let s = 0; s < steps; s++) {
        angle += (Math.random() - 0.5) * 0.2;

        const nx = cx + Math.cos(angle) * (maxLen / steps);
        const ny = cy + Math.sin(angle) * (maxLen / steps);

        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });

        // branch after a few steps
        if (s > 5 && Math.random() < branchChance) {
          generateBranchSegments(segments, nx, ny, angle, maxLen * 0.6, stage);
        }

        cx = nx;
        cy = ny;

        if (Math.hypot(cx, cy) > 1) break; // stop at radius boundary
      }
    }

    return segments;
  }

  function generateBranchSegments(segments, startX, startY, baseAngle, length, stage) {
    let cx = startX;
    let cy = startY;

    let angle = baseAngle + (Math.random() - 0.5) * 1.0;  // big fork angle
    const steps = Math.floor(10 + stage * 4);

    for (let i = 0; i < steps; i++) {
      angle += (Math.random() - 0.5) * 0.25;

      const nx = cx + Math.cos(angle) * (length / steps);
      const ny = cy + Math.sin(angle) * (length / steps);

      segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });

      cx = nx;
      cy = ny;

      if (Math.hypot(cx, cy) > 1) break;
    }
  }

  function getCracksForStage(stage) {
    const clampedStage = Math.max(0, Math.min(9, stage | 0));
    if (clampedStage === 0) return [];

    if (!crackCache[clampedStage]) {
      crackCache[clampedStage] = generateCracksForStage(clampedStage);
    }
    return crackCache[clampedStage];
  }

  // ========================================================================
  // DRAW CRACKS (USING CACHED NORMALIZED SEGMENTS)
  // ========================================================================
  function drawCracks(octx, cx, cy, radius, stage) {
    const segments = getCracksForStage(stage);
    if (!segments.length) return;

    octx.save();
    octx.strokeStyle = "rgba(0,0,0,0.45)";
    octx.lineWidth = 1 + stage * 0.25;
    octx.lineCap = "round";

    for (const seg of segments) {
      const x1 = cx + seg.x1 * radius;
      const y1 = cy + seg.y1 * radius;
      const x2 = cx + seg.x2 * radius;
      const y2 = cy + seg.y2 * radius;

      octx.beginPath();
      octx.moveTo(x1, y1);
      octx.lineTo(x2, y2);
      octx.stroke();
    }

    octx.restore();
  }

  // ========================================================================
  // BRUSH INDICATOR (circle + gradient + static cracks)
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

    let strokeColor = "rgba(15,23,42,0.8)";
    let fillColor = "rgba(255,255,255,0.2)";

    if (currentColor !== null) {
      const hex = currentPicture.colors[currentColor];
      if (hex) {
        strokeColor = hex;
        // hex + "33" => #RRGGBBAA for modern browsers, else fallback
        fillColor = hex.length === 7 ? `${hex}33` : "rgba(255,255,255,0.2)";
      }
    }

    // Radial gradient fill
    const grad = octx.createRadialGradient(
      x, y, radius * 0.1,
      x, y, radius
    );
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");

    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.fill();

    // Glowing outline
    octx.strokeStyle = strokeColor;
    octx.shadowColor = strokeColor;
    octx.shadowBlur = 6;
    octx.lineWidth = 3;
    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.stroke();
    octx.shadowBlur = 0;

    // Cracks based on completion of the CURRENT color
    if (currentColor !== null) {
      let needed = 0;
      let filled = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (String(currentPicture.data[r][c]) === String(currentColor)) {
            needed++;
            if (String(userGrid[r][c]) === String(currentColor)) filled++;
          }
        }
      }

      const ratio = needed === 0 ? 0 : filled / needed;
      const stage = Math.floor(ratio * 9); // 0–9

      drawCracks(octx, x, y, radius, stage);
    }
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

  // Prevent scroll on touch
  canvas.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

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

    manualOverride = false;

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

  manualOverride = false;
  autoSelectNextColorIfReady();

  window.addEventListener("resize", () => {
    drawPixels();
    updateColorChecks();
  });
}

window.setupColoring = setupColoring;
