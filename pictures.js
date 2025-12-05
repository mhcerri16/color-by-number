// pictures.js
// Auto-generated block definitions for 120 blocks
window.PICTURES = {};

for (let i = 1; i <= 120; i++) {
  const id = 'Block-' + String(i).padStart(3, '0');
  const name = `Block ${i}`; // human-readable name
  const pixelSize = 20;

  // Generate simple checker pattern for demo
  const rows = 8;
  const cols = 8;
  const data = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      // Alternate 0 and 1 for simple demo pattern
      row += ((r + c) % 2 === 0) ? '0' : '1';
    }
    data.push(row);
  }

  // Simple color palette: two colors per block (can be replaced with real textures/colors)
  const colors = {
    0: '#cccccc', // light gray
    1: '#888888'  // dark gray
  };

  window.PICTURES[id] = { name, pixelSize, data, colors };
}

// Optional: helper to list all picture IDs
window.getPictureNames = function() {
  return Object.keys(window.PICTURES);
};
