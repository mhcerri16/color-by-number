// ============================================================================
//  COLORING ENGINE — Auto-Select + Jiggle + Mobile Precision + A-Z
//  + Minecraft Breaking Animation (destroy_stage_0–9)
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
  let manualOverride = false;

  // ========================================================================
  // LOAD BREAKING TEXTURES destroy_stage_0–9
  // ========================================================================
  const BREAK_FRAMES = [];
  for (let i = 0; i < 10; i++) {
    const img = new Image();
    img.src = `destroy/destroy_stage_${i}.png`;
    BREAK_FRAMES.push(img);
  }

  function getBreakingStage() {
    if (!currentColor) return 0;

    let needed = 0, filled = 0;

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (String(currentPicture.data[r][c]) === String(currentColor)) {
          needed++;
          if (String(userGrid[r][c]) === String(currentColor)) filled++;
        }

    if (needed === 0) return 0;
    return Math.min(9, Math.floor((filled / needed) * 10));
  }

  // ========================================================================
  // LOAD / SAVE GRID
  // ========================================================================
  const loadUserGrid = () => {
    try {
      return JSON.parse(localStorage.getItem("progress_" + pictureName)) || null;
    } catch {
      return null;
    }
  };

  const saveUserGrid = () =>
    localStorage.setItem("progress_" + pictureName, JSON.stringify(userGrid));

  let userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const restored = loadUserGrid();
  if (restored && restored.length === rows) userGrid = restored;

  // ========================================================================
  // SCALING
  // ========================================================================
  const computePixelSize = () => {
    const vw = window.innerWidth, vh = window.innerHeight;

    let size = basePixelSize;

    if (vw >= 768) {
      const maxW = vw * 0.70;
      const maxH = vh * 0.60;
      size = Math.min(
        Math.floor(maxW / cols),
        Math.floor(maxH / rows),
        basePixelSize * 2
      );
    }

    return Math.max(basePixelSize, size);
  };

  // ========================================================================
  // OVERLAY CANVAS (BUBBLE + BREAKING TEXTURES)
  // ========================================================================
  const overlay = document.createElement("canvas");
  overlay.id = "paint-overlay";
  overlay.style.position = "absolute";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "9999"; // <-- FIXED
  canvas.parentNode.appendChild(overlay);

  function positionOverlay() {
    requestAnimationFrame(() => {
      overlay.width = canvas.width;
      overlay.height = canvas.height;
    });
  }

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

    sw.addEventListener("click", () => {
      manualOverride = true;
      selectColor(num, sw, true);
    });
  });

  // ========================================================================
  // SELECT COLOR
  // ========================================================================
  function selectColor(num, el, userClicked = true) {
    currentColor = num;
    if (userClicked) manualOverride = true;

    document.querySelectorAll(".color-swatch").forEach(s =>
      s.classList.remove("selected")
    );
    el.classList.add("selected");

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
  // PROGRESS
  // ========================================================================
  const updateProgress = () => {
    let filled = 0;

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (userGrid[r][c] !== null) filled++;

    const pct = Math.floor((filled / (rows * cols)) * 100);

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
  // SWATCH CHECKMARK + JIGGLE
  // ========================================================================
  const updateColorChecks = () => {
    Object.keys(currentPicture.colors).forEach(num => {
      const swatch = document.querySelector(`.color-swatch[data-value="${num}"]`);
      if (!swatch) return;

      const label = swatch.querySelector(".swatch-number");

      let needed = 0, filled = 0;
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
  // AUTO-SELECT NEXT COLOR
  // ========================================================================
  const autoSelectNextColorIfReady = () => {
    if (manualOverride) return;

    const nums = Object.keys(currentPicture.colors).sort(
      (a, b) => parseInt(a, 36) - parseInt(b, 36)
    );

    for (const num of nums) {
      let needed = 0,
        filled = 0;

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
        if (swatch) selectColor(num, swatch, false);
        return;
      }
    }
  };

  // ========================================================================
  // DRAW PIXELS
  // ========================================================================
  function drawPixels() {
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
          painted === null ? "#ffffff" : currentPicture.colors[painted];
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
          ctx.font =
            highlight
              ? `${size * 0.65}px Courier New`
              : `${size * 0.50}px Courier New`;
          ctx.fillStyle = "#000";
          ctx.fillText(target, c * size + size / 2, r * size + size / 2);
        }
      }
    }
  }

  // ========================================================================
  // PAINTING LOGIC
  // ========================================================================
  const BRUSH_RADIUS = 1;

  const paintPixel = (clientX, clientY) => {
    if (currentColor === null) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const col = Math.floor(x / size);
    const row = Math.floor(y / size);

    for (let dr = -BRUSH_RADIUS; dr <= BRUSH_RADIUS; dr++)
      for (let dc = -BRUSH_RADIUS; dc <= BRUSH_RADIUS; dc++) {
        const rr = row + dr,
          cc = col + dc;

        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;

        if (String(currentPicture.data[rr][cc]) === String(currentColor)) {
          userGrid[rr][cc] = currentColor;
        }
      }

    drawPixels();
    updateProgress();
    updateColorChecks();
    autoSelectNextColorIfReady();
    saveUserGrid();
  };

  // ========================================================================
  // BRUSH INDICATOR — FIXED VERSION
  // ========================================================================
  function drawIndicator(clientX, clientY) {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);
    if (!isDragging || currentColor === null) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const radius = BRUSH_RADIUS * size + size / 2;

    // Selected swatch color
    const swatch = document.querySelector(
      `.color-swatch[data-value="${currentColor}"]`
    );
    const brushColor = swatch ? swatch.style.background : "#ffffff";

    // Gradient
    const grad = octx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    grad.addColorStop(0, brushColor + "30");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.fill();

    // Outline
    octx.strokeStyle = brushColor;
    octx.shadowColor = brushColor;
    octx.shadowBlur = 6;
    octx.lineWidth = 3;
    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.stroke();
    octx.shadowBlur = 0;

    // Breaking overlay
    const stage = getBreakingStage();
    const img = BREAK_FRAMES[stage];

    if (img.complete && stage > 0) {
      const d = radius * 2;

      octx.save();
      octx.beginPath();
      octx.arc(x, y, radius, 0, Math.PI * 2);
      octx.clip();

      octx.imageSmoothingEnabled = false;
      octx.drawImage(img, x - radius, y - radius, d, d);
      octx.restore();
    }
  }

  // ========================================================================
  // POINTER EVENTS (with overlay sync)
  // ========================================================================
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    isDragging = true;

    paintPixel(e.clientX, e.clientY);
    requestAnimationFrame(() => drawIndicator(e.clientX, e.clientY));
  });

  canvas.addEventListener("pointermove", e => {
    if (isDragging) paintPixel(e.clientX, e.clientY);

    requestAnimationFrame(() => drawIndicator(e.clientX, e.clientY));
  });

  canvas.addEventListener("pointerup", e => {
    canvas.releasePointerCapture(e.pointerId);
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  // Prevent scroll on mobile
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
    positionOverlay();
  });
}

window.setupColoring = setupColoring;
