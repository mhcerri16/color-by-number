function setupColoring(pictureName, PICTURES) {
  const currentPicture = PICTURES[pictureName];
  if (!currentPicture) return;

  const canvas = document.getElementById('pixel-canvas');
  const ctx = canvas.getContext('2d');
  const colorBar = document.getElementById('color-bar');
  const backBtn = document.getElementById('back-btn');
  const title = document.getElementById('picture-title');
  let currentColor = null;
  let isDragging = false;

  title.textContent = currentPicture.name || pictureName;

  const rows = currentPicture.data.length;
  const cols = currentPicture.data[0].length;

  // Track user progress (null = unpainted)
  const userGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

  // Build color bar
  colorBar.innerHTML = '';
  Object.entries(currentPicture.colors).forEach(([num, color]) => {
  const swatch = document.createElement("div");
  swatch.className = "color-swatch";
  swatch.dataset.value = num;

  const innerNumber = document.createElement("div");
  innerNumber.className = "swatch-number";
  innerNumber.textContent = num;

  swatch.appendChild(innerNumber);
  swatch.style.background = color;
  swatch.onclick = () => selectColor(num, swatch);

  colorBar.appendChild(swatch);

  });

  function selectColor(value, element) {
    currentColor = value;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    drawPixels();
  }

  // Paint a 3x3 block around (r, c)
  function paintAtCell(r, c) {
    if (!currentColor) return;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;

        const targetVal = currentPicture.data[rr][cc];
        if (String(currentColor) === String(targetVal)) {
          userGrid[rr][cc] = currentColor;
        }
      }
    }
  }

  function drawPixels() {
    const size = currentPicture.pixelSize;
    canvas.width = cols * size;
    canvas.height = rows * size;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const userVal = userGrid[r][c];
        const targetVal = currentPicture.data[r][c];

        // Reveal real color ONLY when painted
        if (userVal !== null) {
          ctx.fillStyle = currentPicture.colors[targetVal];
        } else {
          ctx.fillStyle = "#ffffff"; // blank
        }
        ctx.fillRect(c * size, r * size, size, size);

        // Draw number if not painted
        if (userVal === null) {
          ctx.fillStyle = "#000";
          ctx.font = (currentColor !== null && String(targetVal) === String(currentColor))
            ? `bold ${size / 2}px Arial`
            : `${size / 2}px Arial`;

          ctx.fillText(
            targetVal,
            c * size + size / 2,
            r * size + size / 2
          );
        }
      }
    }
  }

  function paintPixel(x, y) {
    if (!currentColor) return;
    const size = currentPicture.pixelSize;
    const c = Math.floor(x / size);
    const r = Math.floor(y / size);
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;

    paintAtCell(r, c);
    drawPixels();
  }

  // Mouse / touch events
  canvas.addEventListener('mousedown', () => { isDragging = true; });
  canvas.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mouseleave', () => { isDragging = false; });
  canvas.addEventListener('mousemove', e => {
    if (isDragging) paintPixel(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    paintPixel(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      paintPixel(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    }
  });
  canvas.addEventListener('touchend', () => { isDragging = false; });

  backBtn.onclick = () => window.location.href = 'index.html';

  drawPixels();
}

window.setupColoring = setupColoring;
