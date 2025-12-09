function setupColoring(pictureName, PICTURES) {
  const currentPicture = PICTURES[pictureName];
  if (!currentPicture) return;

  const canvas = document.getElementById("pixel-canvas");
  const ctx = canvas.getContext("2d");

  const colorBar = document.getElementById("color-bar");
  const backBtn = document.getElementById("back-btn");
  const title = document.getElementById("picture-title");

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  let currentColor = null;
  let isDragging = false;

  title.textContent = currentPicture.name || pictureName;

  const rows = currentPicture.data.length;
  const cols = currentPicture.data[0].length;

  const basePixelSize = currentPicture.pixelSize;

  // === SMART SCALING FOR LARGE SCREENS ===
  function computePixelSize() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let size = basePixelSize;

    // Scale up ONLY on iPads, laptops, desktops
    if (viewportWidth >= 768) {
      const maxCanvasWidth = viewportWidth * 0.70;
      const maxCanvasHeight = viewportHeight * 0.60;

      const sizeByWidth = Math.floor(maxCanvasWidth / cols);
      const sizeByHeight = Math.floor(maxCanvasHeight / rows);

      const candidate = Math.min(sizeByWidth, sizeByHeight);

      // Prevent ridiculous scaling
      size = Math.max(basePixelSize, Math.min(candidate, basePixelSize * 2));
    }

    return size;
  }

  // === USER GRID (null = white/unpainted) ===
  const userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

  // === OVERLAY CANVAS FOR BRUSH CIRCLE ===
  const overlay = document.createElement("canvas");
  overlay.id = "paint-overlay";
  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  canvas.parentNode.appendChild(overlay);

  function positionOverlay() {
    overlay.style.left = "0px";
    overlay.style.top = "0px";
    overlay.width = canvas.width;
    overlay.height = canvas.height;
  }

  // === BUILD PALETTE ===
  colorBar.innerHTML = "";
  Object.entries(currentPicture.colors).forEach(([num, hex]) => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.dataset.value = num;

    const label = document.createElement("div");
    label.className = "swatch-number";
    label.textContent = num;

    swatch.style.background = hex;
    swatch.appendChild(label);

    swatch.onclick = () => selectColor(num, swatch);
    colorBar.appendChild(swatch);
  });

  function selectColor(num, swatchElement) {
    currentColor = num;

    document.querySelectorAll(".color-swatch")
      .forEach(s => s.classList.remove("selected"));

    swatchElement.classList.add("selected");
    drawPixels();
  }

  // === PROGRESS BAR ===
  function updateProgress() {
    let count = 0;
    const total = rows * cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (userGrid[r][c] !== null) count++;
      }
    }

    const pct = Math.floor((count / total) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = pct + "%";

    if (pct === 100) {
      localStorage.setItem("completed_" + pictureName, "true");
      canvas.classList.add("complete-picture");
    } else {
      canvas.classList.remove("complete-picture");
    }
  }

  // === CHECKMARK FOR COMPLETED COLORS ===
  function updateColorChecks() {
    for (const num in currentPicture.colors) {
      const swatch = document.querySelector(
        `.color-swatch[data-value="${num}"]`
      );
      if (!swatch) continue;

      const label = swatch.querySelector(".swatch-number");

      let needed = 0;
      let filled = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (String(currentPicture.data[r][c]) === String(num)) {
            needed++;
            if (userGrid[r][c] === num) filled++;
          }
        }
      }

      if (needed > 0 && needed === filled) {
        label.textContent = "✔";
        label.style.fontSize = "22px";
      } else {
        label.textContent = num;
        label.style.fontSize = "20px";
      }
    }
  }

  // === MAIN DRAW FUNCTION ===
  function drawPixels() {
    const size = computePixelSize();

    canvas.width = cols * size;
    canvas.height = rows * size;
    positionOverlay();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {

        const pixelVal = currentPicture.data[r][c];
        const paintedVal = userGrid[r][c];

        ctx.fillStyle = paintedVal === null
          ? "#ffffff"
          : currentPicture.colors[paintedVal];

        ctx.fillRect(c * size, r * size, size, size);

        const isTarget =
          paintedVal === null &&
          currentColor !== null &&
          String(pixelVal) === String(currentColor);

        if (isTarget) {
          ctx.fillStyle = "rgba(250, 204, 21, 0.35)";
          ctx.fillRect(c * size, r * size, size, size);
        }

        if (paintedVal === null) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (isTarget) {
            ctx.font = `bold ${size * 0.65}px Courier New`;
            ctx.fillStyle = "#000";
          } else {
            ctx.font = `${size * 0.5}px Courier New`;
            ctx.fillStyle = "#000";
          }

          ctx.fillText(
            pixelVal,
            c * size + size / 2,
            r * size + size / 2
          );
        }
      }
    }
  }

  // === BRUSH (3×3) ===
  const BRUSH_RADIUS = 1;

  function paintPixel(x, y) {
    if (!currentColor) return;

    const size = computePixelSize();
    const col = Math.floor(x / size);
    const row = Math.floor(y / size);

    for (let dr = -BRUSH_RADIUS; dr <= BRUSH_RADIUS; dr++) {
      for (let dc = -BRUSH_RADIUS; dc <= BRUSH_RADIUS; dc++) {
        const rr = row + dr;
        const cc = col + dc;

        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;

        if (String(currentPicture.data[rr][cc]) === String(currentColor)) {
          userGrid[rr][cc] = currentColor;
        }
      }
    }

    drawPixels();
    updateProgress();
    updateColorChecks();
  }

  // === DRAW BRUSH OVERLAY CIRCLE ===
  function drawIndicator(x, y) {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (!isDragging) return;

    const size = computePixelSize();
    const radius = BRUSH_RADIUS * size + size / 2;

    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.strokeStyle = "rgba(15, 23, 42, 0.8)";
    octx.lineWidth = 2;
    octx.stroke();
  }

  // === INPUT EVENTS ===
  canvas.addEventListener("mousedown", e => {
    isDragging = true;
    paintPixel(e.offsetX, e.offsetY);
    drawIndicator(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  canvas.addEventListener("mousemove", e => {
    if (isDragging) paintPixel(e.offsetX, e.offsetY);
    drawIndicator(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("touchstart", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    isDragging = true;
    paintPixel(x, y);
    drawIndicator(x, y);
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    if (isDragging) paintPixel(x, y);
    drawIndicator(x, y);
  });

  canvas.addEventListener("touchend", () => {
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  backBtn.onclick = () => (window.location.href = "index.html");

  // Initialize
  drawPixels();
  updateProgress();
  updateColorChecks();

  window.addEventListener("resize", () => {
    drawPixels();   // recalc size
  });
}

window.setupColoring = setupColoring;
