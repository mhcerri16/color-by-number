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
  // FIX: SAFE ALPHA APPLY FOR ANY COLOR (#rrggbb OR rgb())
  // ========================================================================
  function addAlpha(color, alphaHex) {
    // Hex format (#RRGGBB)
    if (color.startsWith("#")) {
      return color + alphaHex; // → #RRGGBBAA
    }

    // rgb(r,g,b)
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [_, r, g, b] = match;
      const alpha = parseInt(alphaHex, 16) / 255;
      return `rgba(${r},${g},${b},${alpha})`;
    }

    return color;
  }

  // ========================================================================
  // BREAKING TEXTURES destroy_stage_0–9
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

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (String(currentPicture.data[r][c]) === String(currentColor)) {
          needed++;
          if (userGrid[r][c] === currentColor) filled++;
        }
      }
    }

    if (needed === 0) return 0;

    return Math.min(9, Math.floor((filled / needed) * 10));
  }

  // ========================================================================
  // LOAD / SAVE USER GRID
  // ========================================================================
  const loadUserGrid = () => {
    const saved = localStorage.getItem("progress_" + pictureName);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  };

  const saveUserGrid = () =>
    localStorage.setItem("progress_" + pictureName, JSON.stringify(userGrid));

  let userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const restored = loadUserGrid();
  if (restored) userGrid = restored;

  // ========================================================================
  // SCALING
  // ========================================================================
  const computePixelSize = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let size = basePixelSize;

    if (vw >= 768) {
      const sizeW = Math.floor((vw * 0.7) / cols);
      const sizeH = Math.floor((vh * 0.6) / rows);
      size = Math.max(basePixelSize, Math.min(sizeW, sizeH, basePixelSize * 2));
    }

    return size;
  };

  // ========================================================================
  // OVERLAY CANVAS
  // ========================================================================
  const overlay = document.createElement("canvas");
  overlay.style.position = "absolute";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.pointerEvents = "none";
  canvas.parentNode.appendChild(overlay);

  function positionOverlay() {
    overlay.width = canvas.width;
    overlay.height = canvas.height;
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

  function selectColor(num, swatchElement, userClicked = true) {
    currentColor = num;
    if (userClicked) manualOverride = true;

    document.querySelectorAll(".color-swatch")
      .forEach(s => s.classList.remove("selected"));

    swatchElement.classList.add("selected");
    drawPixels();
  }

  // ========================================================================
  // PROGRESS
  // ========================================================================
  function updateProgress() {
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
      if (!was) {
        canvas.classList.add("sparkle");
        setTimeout(() => canvas.classList.remove("sparkle"), 900);
      }
    } else {
      canvas.classList.remove("complete-picture");
    }
  }

  // ========================================================================
  // SWATCH CHECKMARKS
  // ========================================================================
  function updateColorChecks() {
    Object.keys(currentPicture.colors).forEach(num => {
      const swatch = document.querySelector(`.color-swatch[data-value="${num}"]`);
      const label = swatch.querySelector(".swatch-number");

      let needed = 0, filled = 0;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (currentPicture.data[r][c] == num) {
            needed++;
            if (userGrid[r][c] == num) filled++;
          }

      const complete = needed > 0 && needed === filled;
      const wasCheck = label.textContent === "✔";

      if (complete) {
        label.textContent = "✔";
        label.style.fontSize = "22px";

        if (!wasCheck) {
          swatch.classList.remove("swatch-jiggle");
          void swatch.offsetWidth;
          swatch.classList.add("swatch-jiggle");
        }

        if (currentColor == num) manualOverride = false;
      } else {
        label.textContent = num;
        label.style.fontSize = "20px";
      }
    });
  }

  // ========================================================================
  // AUTO-SELECT 0–9 → a–z
  // ========================================================================
  function autoSelectNextColorIfReady() {
    if (manualOverride) return;

    const nums = Object.keys(currentPicture.colors)
      .sort((a, b) => parseInt(a, 36) - parseInt(b, 36));

    for (const num of nums) {
      let needed = 0, filled = 0;

      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (currentPicture.data[r][c] == num) {
            needed++;
            if (userGrid[r][c] == num) filled++;
          }

      if (needed > 0 && filled < needed) {
        selectColor(num, document.querySelector(`.color-swatch[data-value="${num}"]`), false);
        return;
      }
    }
  }

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

        ctx.fillStyle = painted ? currentPicture.colors[painted] : "#ffffff";
        ctx.fillRect(c * size, r * size, size, size);

        if (!painted) {
          ctx.fillStyle = "#000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${size * 0.5}px Courier New`;
          ctx.fillText(target, c * size + size / 2, r * size + size / 2);
        }
      }
    }
  }

  // ========================================================================
  // PAINTING
  // ========================================================================
  const BRUSH_RADIUS = 1;

  function paintPixel(clientX, clientY) {
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
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
          if (currentPicture.data[rr][cc] == currentColor) {
            userGrid[rr][cc] = currentColor;
          }
        }
      }
    }

    drawPixels();
    updateProgress();
    updateColorChecks();
    autoSelectNextColorIfReady();
    saveUserGrid();
  }

  // ========================================================================
  // INDICATOR (gradient + glow + destroy texture)
  // ========================================================================
  function drawIndicator(clientX, clientY) {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (!isDragging || !currentColor) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const radius = BRUSH_RADIUS * size + size / 2;

    const swatch = document.querySelector(`.color-swatch[data-value="${currentColor}"]`);
    const brushColor = swatch ? swatch.style.background : "#ffffff";

    // Radial gradient
    const grad = octx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    grad.addColorStop(0, addAlpha(brushColor, "30"));
    grad.addColorStop(1, "rgba(0,0,0,0)");

    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.fill();

    // Glow outline
    octx.strokeStyle = brushColor;
    octx.shadowColor = brushColor;
    octx.shadowBlur = 6;
    octx.lineWidth = 3;
    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.stroke();
    octx.shadowBlur = 0;

    // Breaking texture
    const stage = getBreakingStage();
    const img = BREAK_FRAMES[stage];
    if (img.complete && stage > 0) {
      octx.save();
      octx.beginPath();
      octx.arc(x, y, radius, 0, Math.PI * 2);
      octx.clip();
      octx.imageSmoothingEnabled = false;
      octx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      octx.restore();
    }
  }

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

  // Disable scroll on touch
  canvas.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

  // ========================================================================
  // BUTTONS
  // ========================================================================
  backBtn.onclick = () => (window.location.href = "index.html");

  resetBtn.onclick = () => {
    if (!confirm("Reset this picture?")) return;

    userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
    localStorage.removeItem("progress_" + pictureName);
    localStorage.removeItem("completed_" + pictureName);
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
  autoSelectNextColorIfReady();

  window.addEventListener("resize", () => {
    drawPixels();
    updateColorChecks();
  });
}

window.setupColoring = setupColoring;
