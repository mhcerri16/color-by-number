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

    if (restored) return; // already filled

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
  // OVERLAY (cursor indicator)
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
      .forEach(s => s.classList.remove("selected"));

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
  // SWATCH COMPLETION + JIGGLE
  // ========================================================================
  function updateColorChecks() {
    Object.keys(currentPicture.colors).forEach(num => {
      const swatch = document.querySelector(
        `.color-swatch[data-value="${num}"]`
      );
      const label = swatch.querySelector(".swatch-number");

      let needed = 0,
        filled = 0;

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
  // AUTO-SELECT NEXT COLOR (0–9, a–z)
  // ========================================================================
  function autoSelectNextColorIfReady() {
    if (manualOverride) return;

    // sort keys in 0–9, a–z order using base-36 parsing
    const nums = Object.keys(currentPicture.colors).sort(
      (a, b) => parseInt(a, 36) - parseInt(b, 36)
    );

    for (const num of nums) {
      let needed = 0;
      let filled = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (currentPicture.data[r][c] == num) {
            needed++;
            if (userGrid[r][c] == num) filled++;
          }
        }
      }

      // If this color is not fully done, auto-select it
      if (needed > 0 && filled < needed) {
        const swatch = document.querySelector(
          `.color-swatch[data-value="${num}"]`
        );
        if (swatch) {
          selectColor(num, swatch, false); // userClicked = false
        }
        return;
      }
    }
  }

  // ========================================================================
  // DRAWING THE CANVAS
  // ========================================================================
  function drawPixels() {
    const size = computePixelSize();
    canvas.width = cols * size;
    canvas.height = rows * size;

    positionOverlay();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const value = currentPicture.data[r][c];
        const painted = userGrid[r][c];

        ctx.fillStyle =
          painted === null ? "#ffffff" : currentPicture.colors[painted];
        ctx.fillRect(c * size, r * size, size, size);

        if (
          painted === null &&
          currentColor !== null &&
          String(value) === String(currentColor)
        ) {
          ctx.fillStyle = "rgba(250,204,21,0.35)";
          ctx.fillRect(c * size, r * size, size, size);
        }

        if (painted === null) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const highlight =
            painted === null &&
            currentColor !== null &&
            String(value) === String(currentColor);
          
          ctx.font = highlight
            ? `bold ${size * 0.85}px Courier New`
            : `${size * 0.50}px Courier New`;
          
          ctx.fillStyle = "#000";
          ctx.fillText(value, c * size + size / 2, r * size + size / 2);
        }
      }
    }
  }

  // ========================================================================
  // PAINTING LOGIC
  // ========================================================================
  const BRUSH_RADIUS = 2;

  function paintPixel(clientX, clientY) {
    if (!currentColor) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const OFFSET = 40;
    const iy = y - OFFSET;

    const col = Math.floor(x / size);
    const row = Math.floor(iy / size);

    for (let dr = -BRUSH_RADIUS; dr <= BRUSH_RADIUS; dr++)
      for (let dc = -BRUSH_RADIUS; dc <= BRUSH_RADIUS; dc++) {
        const rr = row + dr;
        const cc = col + dc;

        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
          if (currentPicture.data[rr][cc] == currentColor) {
            userGrid[rr][cc] = currentColor;
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
  // INDICATOR LOGIC
  // ========================================================================
  function drawIndicator(clientX, clientY) {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (!isDragging || !currentColor) return;

    const rect = canvas.getBoundingClientRect();
    const size = computePixelSize();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const OFFSET = 40;
    const ix = x;
    const iy = y - OFFSET;

    const radius = BRUSH_RADIUS * size + size / 2;

    const swatch = document.querySelector(
      `.color-swatch[data-value="${currentColor}"]`
    );
    const brushColor = swatch ? swatch.style.background : "#fff";

    const grad = octx.createRadialGradient(ix, iy, radius * 0.1, ix, iy, radius);
    grad.addColorStop(0, addAlpha(brushColor, "20"));
    grad.addColorStop(1, "rgba(0,0,0,0)");

    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(ix, iy, radius, 0, Math.PI * 2);
    octx.fill();

    octx.strokeStyle = brushColor;
    octx.lineWidth = 3;
    octx.shadowColor = brushColor;
    octx.shadowBlur = 6;

    octx.beginPath();
    octx.arc(ix, iy, radius, 0, Math.PI * 2);
    octx.stroke();

    octx.shadowBlur = 0;

    const stage = getBreakingStage();
    const img = BREAK_FRAMES[stage];
    if (img.complete && stage > 0) {
      octx.save();
      octx.beginPath();
      octx.arc(ix, iy, radius, 0, Math.PI * 2);
      octx.clip();
      octx.imageSmoothingEnabled = false;
      octx.drawImage(img, ix - radius, iy - radius, radius * 2, radius * 2);
      octx.restore();
    }
  }

  // ========================================================================
  // POINTER EVENTS
  // ========================================================================
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    isDragging = true;
    paintPixel(e.clientX, e.clientY);
    drawIndicator(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (isDragging) paintPixel(e.clientX, e.clientY);
    drawIndicator(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointerup", (e) => {
    canvas.releasePointerCapture(e.pointerId);
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  // Prevent scroll on touch
  canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  // ========================================================================
  // BUTTONS
  // ========================================================================
  backBtn.onclick = () => {
    window.location.href = "index.html"; 
  };

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

// Export globally
window.setupColoring = setupColoring;
