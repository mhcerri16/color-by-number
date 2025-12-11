// ============================================================================
//  COLORING ENGINE — Auto-Select + Jiggle + Mobile Precision + A-Z
//  + Minecraft Breaking Animation (destroy_stage_0–9)
// ============================================================================

// === ADDED FOR RETURN STATE ===
window.APP_STATE = {
  lastScroll: 0,
  lastCategory: "all"
};

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

  // === ADDED FOR RETURN STATE ===
  // Save scroll and selected category BEFORE entering coloring screen
  window.APP_STATE.lastScroll = window.scrollY;
  const selectedBtn = document.querySelector(".cat-btn.selected");
  if (selectedBtn) {
    window.APP_STATE.lastCategory = selectedBtn.dataset.cat;
  }

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
  // SAFE ALPHA APPENDER FOR GRADIENT COLORS
  // ========================================================================
  function addAlpha(color, alphaHex) {
    if (color.startsWith("#")) return color + alphaHex;
    const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgb) {
      const [_, r, g, b] = rgb;
      const a = parseInt(alphaHex, 16) / 255;
      return `rgba(${r},${g},${b},${a})`;
    }
    return color;
  }

  // ========================================================================
  // BREAKING TEXTURES
  // ========================================================================
  const BREAK_FRAMES = [];
  for (let i = 0; i < 10; i++) {
    const img = new Image();
    img.src = `destroy/destroy_stage_${i}.png`;
    BREAK_FRAMES.push(img);
  }

  function getBreakingStage() {
    if (!currentColor) return 0;
    let needed = 0,
      filled = 0;

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (String(currentPicture.data[r][c]) === String(currentColor)) {
          needed++;
          if (userGrid[r][c] === currentColor) filled++;
        }

    if (needed === 0) return 0;
    return Math.min(9, Math.floor((filled / needed) * 10));
  }

  // ========================================================================
  // LOAD / SAVE GRID
  // ========================================================================
  function loadUserGrid() {
    const saved = localStorage.getItem("progress_" + pictureName);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  const saveUserGrid = () =>
    localStorage.setItem("progress_" + pictureName, JSON.stringify(userGrid));

  let userGrid = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );
  const restored = loadUserGrid();
  if (restored) userGrid = restored;

  // ========================================================================
  // AUTO-FILL BACKGROUND IF 0TH COLOR IS WHITE (#ffffff)
  // ========================================================================
  (function autoFillWhiteBackground() {
    const zeroHex = currentPicture.colors["0"];
    const isWhiteZero = zeroHex && zeroHex.toLowerCase() === "#ffffff";

    if (restored) return;

    if (isWhiteZero) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (currentPicture.data[r][c] === "0") {
            userGrid[r][c] = "0";
          }
        }
      }
    }
  })();

  // ========================================================================
  // SCALING
  // ========================================================================
  function computePixelSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let size = basePixelSize;

    if (vw >= 768) {
      const sizeW = Math.floor((vw * 0.7) / cols);
      const sizeH = Math.floor((vh * 0.6) / rows);
      size = Math.max(basePixelSize, Math.min(sizeW, sizeH, basePixelSize * 2));
    }

    return size;
  }

  // ========================================================================
  // OVERLAY
  // ========================================================================
  const overlay = document.createElement("canvas");
  overlay.style.position = "absolute";
  overlay.style.left = 0;
  overlay.style.top = 0;
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

    document
      .querySelectorAll(".color-swatch")
      .forEach((s) => s.classList.remove("selected"));

    swatchElement.classList.add("selected");
    drawPixels();
  }

  // ========================================================================
  // PROGRESS BAR
  // ========================================================================
  function updateProgress() {
    let filled = 0,
      total = rows * cols;

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (userGrid[r][c] !== null) filled++;

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
  // BACK BUTTON — UPDATED
  // ========================================================================
  backBtn.onclick = () => {

    // Go back to list without resetting scroll
    window.location.href = "index.html#" + window.APP_STATE.lastCategory;

    // When index loads, we restore scroll position
    // (Your index.js will read APP_STATE and call scrollTo)
  };

  // ========================================================================
  // RESET BUTTON
  // ========================================================================
  resetBtn.onclick = () => {
    if (!confirm("Reset this picture?")) return;

    userGrid = Array.from({ length: rows }, () =>
      Array(cols).fill(null)
    );
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
