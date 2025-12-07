function setupColoring(pictureName, PICTURES) {
  const currentPicture = PICTURES[pictureName];
  if (!currentPicture) return;

  const canvas = document.getElementById("pixel-canvas");
  const ctx = canvas.getContext("2d");

  const colorBar = document.getElementById("color-bar");
  const backBtn = document.getElementById("back-btn");
  const title = document.getElementById("picture-title");

  let currentColor = null;
  let isDragging = false;

  title.textContent = currentPicture.name;

  const rows = currentPicture.data.length;
  const cols = currentPicture.data[0].length;

  // === MAIN USER GRID ===
  // null = unpainted/white
  const userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

  // === CREATE OVERLAY CANVAS (PAINT RADIUS INDICATOR) ===
  const overlay = document.createElement("canvas");
  overlay.id = "paint-overlay";
  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  canvas.parentNode.appendChild(overlay);

  // Update overlay position after DOM layout
function positionOverlay() {
  const canvasRect = canvas.getBoundingClientRect();
  const parentRect = canvas.parentNode.getBoundingClientRect();
  overlay.style.left = (canvasRect.left - parentRect.left) + "px";
  overlay.style.top  = (canvasRect.top  - parentRect.top)  + "px";
}
  positionOverlay();
  window.addEventListener("resize", positionOverlay);

  // === BUILD COLOR BAR ===
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

  // === SELECT A COLOR ===
  function selectColor(value, element) {
    currentColor = value;
    document.querySelectorAll(".color-swatch")
      .forEach(s => s.classList.remove("selected"));
    element.classList.add("selected");

    drawPixels();
  }

  // === DRAW FULL IMAGE ===
  function drawPixels() {
    const size = currentPicture.pixelSize;
    canvas.width = cols * size;
    canvas.height = rows * size;
    overlay.width = canvas.width;
    overlay.height = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pixelVal = currentPicture.data[r][c];
        const paintedVal = userGrid[r][c];

        // White background if unpainted
        if (paintedVal === null) {
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = currentPicture.colors[paintedVal];
        }
        ctx.fillRect(c * size, r * size, size, size);

        // Draw number only if unpainted
        if (paintedVal === null) {
          const isMatch = currentColor !== null &&
                          String(pixelVal) === String(currentColor);

          if (isMatch) {
            // BIG + glowing
            ctx.font = `bold ${size * 0.7}px Arial`;
            ctx.fillStyle = "#000000";
            ctx.shadowColor = "rgba(255,255,0,0.8)";
            ctx.shadowBlur = 6;
          } else {
            // Normal number
            ctx.font = `${size * 0.5}px Arial`;
            ctx.fillStyle = "#000";
            ctx.shadowBlur = 0;
          }

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pixelVal, c * size + size / 2, r * size + size / 2);
        }
      }
    }
  }

  // === PAINTING LOGIC (3×3 BRUSH) ===
  const BRUSH_RADIUS = 1; // 1 = 3×3, 2 = 5×5

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
  }

  // === DRAW PAINT INDICATOR CIRCLE ===
  function drawIndicator(x, y) {
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (!isDragging) return;

    const size = currentPicture.pixelSize;
    const radius = BRUSH_RADIUS * size + size / 2;

    octx.beginPath();
    octx.arc(x, y, radius, 0, Math.PI * 2);
    octx.strokeStyle = "rgba(0,0,0,0.4)";
    octx.lineWidth = 2;
    octx.stroke();
  }

  // === MOUSE EVENTS ===
  canvas.addEventListener("mousedown", (e) => {
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

  canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX, y = e.offsetY;
    if (isDragging) paintPixel(x, y);
    drawIndicator(x, y);
  });

  // === TOUCH EVENTS ===
  canvas.addEventListener("touchstart", (e) => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

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

  // === BACK BUTTON ===
  backBtn.onclick = () => (window.location.href = "index.html");

  drawPixels();
}

window.setupColoring = setupColoring;
