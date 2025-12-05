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

  title.textContent = currentPicture.name;

  // Build color bar
  colorBar.innerHTML = '';
  Object.entries(currentPicture.colors).forEach(([num, color]) => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.background = color;
    swatch.dataset.value = num;
    swatch.onclick = () => selectColor(num, swatch);
    colorBar.appendChild(swatch);
  });

  function selectColor(value, element) {
    currentColor = value;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    drawPixels();
  }

  // Draw blank canvas with numbers
  function drawPixels() {
    const size = currentPicture.pixelSize;
    const rows = currentPicture.data.length;
    const cols = currentPicture.data[0].length;
    canvas.width = cols * size;
    canvas.height = rows * size;

    ctx.font = `${size / 2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Blank pixel
        ctx.fillStyle = currentPicture.colors[0];
        ctx.fillRect(c * size, r * size, size, size);

        // Draw number
        const val = currentPicture.data[r][c];
        ctx.fillStyle = "#000";
        ctx.font = (currentColor !== null && String(val) === String(currentColor))
          ? `bold ${size / 2}px Arial`
          : `${size / 2}px Arial`;
        ctx.fillText(val, c * size + size / 2, r * size + size / 2);
      }
    }
  }

  drawPixels();

  function paintPixel(x, y) {
    if (!currentColor) return;
    const size = currentPicture.pixelSize;
    const c = Math.floor(x / size);
    const r = Math.floor(y / size);
    if (r < 0 || c < 0 || r >= currentPicture.data.length || c >= currentPicture.data[0].length) return;

    const targetVal = currentPicture.data[r][c];
    if (String(currentColor) !== String(targetVal)) return;

    // Paint pixel
    ctx.fillStyle = currentPicture.colors[currentColor];
    ctx.fillRect(c * size, r * size, size, size);

    // Redraw numbers on top
    drawPixels();
  }

  // Mouse / touch events
  canvas.addEventListener('mousedown', () => isDragging = true);
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);
  canvas.addEventListener('mousemove', e => { if (isDragging) paintPixel(e.offsetX, e.offsetY); });

  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    paintPixel(touch.clientX - rect.left, touch.clientY - rect.top);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      paintPixel(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  });
  canvas.addEventListener('touchend', () => isDragging = false);

  backBtn.onclick = () => window.location.href = 'index.html';
}

window.setupColoring = setupColoring;
