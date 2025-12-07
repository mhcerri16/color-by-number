// Build gallery based on PICTURES object
const grid = document.getElementById("thumb-grid");

Object.entries(PICTURES).forEach(([id, pic]) => {
  const tile = document.createElement("a");
  tile.className = "thumb";
  tile.href = `color.html?name=${encodeURIComponent(id)}`;

  // --- Create thumbnail canvas ---
  const canvas = document.createElement("canvas");
  const size = 6; // scale factor for thumbnail
  const rows = pic.data.length;
  const cols = pic.data[0].length;
  canvas.width = cols * size;
  canvas.height = rows * size;

  const ctx = canvas.getContext("2d");

  // Draw pixel preview
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = pic.data[r][c];
      ctx.fillStyle = pic.colors[val];
      ctx.fillRect(c * size, r * size, size, size);
    }
  }

  // --- Label ---
  const label = document.createElement("div");
  label.className = "thumb-label";
  label.textContent = pic.name || id;

  // Assemble tile
  tile.appendChild(canvas);
  tile.appendChild(label);
  grid.appendChild(tile);
});
