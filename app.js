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

  // Track painted state: null = unpainted/white, otherwise = color code ('0','1','A'...)
  const userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

  // === Overlay canvas (for brush circle) ===
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

  // === Build color swatches ===
  colorBar.innerHTML = "";
  Object.entries(currentPicture.colors).forEach(([num, hex]) => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.dataset.value = num;

    const inner = document.createElement("div");
    inner.className = "swatch-number";
    inner.textContent = num;

    swatch.appendChild(inner);
    swatch.style.background = hex;

    swatch.onclick = () => selectColor(num, swatch);
    colorBar.appendChild(swatch);
  });

  function selectColor(value, element) {
    currentColor = value;
    document
      .querySelectorAll(".color-swatch")
      .forEach((s) => s.classList.remove("selected"));
    element.classList.add("selected");

    drawPixels(); // redraw with highlight on target cells
  }

  // === Progress bar ===
  function updateProgress() {
    let filled = 0;
    const total = rows * cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (userGrid[r][c] !== null) filled++;
      }
    }

    const pct = Math.floor((filled / total) * 100);
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressText) progressText.textContent = pct + "%";
  }

  // === Per-color completion check (swatch checkmarks) ===
  function updateColorChecks() {
    for (const [num] of Object.entries(currentPicture.colors)) {
      const swatch = document.querySelector(
        `.color-swatch[data-value="${num}"]`
      );
      if (!swatch) continue;

      let totalForColor = 0;
      let paintedForColor = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = String(currentPicture.data[r][c]);
          if (val === String(num)) {
            totalForColor++;
            if (userGrid[r][c] === num) paintedForColor++;
          }
        }
      }

      const inner = swatch.querySelector(".swatch-number");
      if (!inner) continue;

      if (totalForColor > 0 && paintedForColor === totalForColor) {
        inner.textContent = "✔";
        inner.style.fontSize = "24px";
      } else {
        inner.textContent = num;
        inner.style.fontSize = "20px";
      }
    }
  }

  // === Main draw ===
  function drawPixels() {
    const size = currentPicture.pixelSize;
    canvas.width = cols * size;
    canvas.height = rows * size;
    positionOverlay();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pixelVal = currentPicture.data[r][c]; // "0"-"9","A"-"Z"
        const paintedVal = userGrid[r][c];

        // Base: white if unpainted, true color if painted
        if (paintedVal === null) {
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = currentPicture.colors[paintedVal];
        }
        ctx.fillRect(c * size, r * size, size, size);

        // If unpainted and this pixel matches currentColor, highlight the cell
        const isTarget =
          paintedVal === null &&
          currentColor !== null &&
          String(pixelVal) === String(currentColor);

        if (isTarget) {
          ctx.fillStyle = "rgba(250, 204, 21, 0.35)"; // soft amber
          ctx.fillRect(c * size, r * size, size, size);
        }

        // Draw number if not painted
        if (paintedVal === null) {
          ctx.font = `${size * 0.5}px Arial`;
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            pixelVal,
            c * size + size / 2,
            r * size + size / 2
          );
        }
      }
    }
  }

  // === Brush logic (3x3) ===
  const BRUSH_RADIUS = 1; // 1 = 3×3, 2 = 5×5, etc.

  function paintPixel(x, y) {
    if (!currentColor) return;

    const size = currentPicture.pixelSize;
    const col = Math.floor(x / size);
    const row = Math.floor(y / size);

    for (let dr = -BRUSH_RADIUS; dr <= BRUSH_RADIUS; dr++) {
      for (let dc = -BRUSH_RADIUS; dc <= BRUSH_RADIUS; dc++) {
        const rr = row + dr;
        const cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;

        const targetVal = currentPicture.data[rr][cc];
        if (String(targetVal) === String(currentColor)) {
          userGrid[rr][cc] = currentColor;
        }
      }
    }

    drawPixels();
    updateProgress();
    updateColorChecks();
  }

  // === Brush circle indicator ===
  function drawIndicator(x, y) {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (!isDragging) return;

    const size = currentPicture.pixelSize;
    const radius = BRUSH_RADIUS * size + size / 2;

    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.strokeStyle = "rgba(15, 23, 42, 0.7)";
    octx.lineWidth = 2;
    octx.stroke();
  }

  // === Mouse events ===
  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    const x = e.offsetX;
    const y = e.offsetY;
    paintPixel(x, y);
    drawIndicator(x, y);
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
  });

  canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    if (isDragging) paintPixel(x, y);
    drawIndicator(x, y);
  });

  // === Touch events ===
  canvas.addEventListener("touchstart", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    isDragging = true;
    paintPixel(x, y);
    drawIndicator(x, y);
  });

  canvas.addEventListener("touchmove", (e) => {
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

  // === Back button ===
  backBtn.onclick = () => {
    window.location.href = "index.html";
  };

  // Initial draw
  drawPixels();
  updateProgress();
  updateColorChecks();
  window.addEventListener("resize", positionOverlay);
}

window.setupColoring = setupColoring;
