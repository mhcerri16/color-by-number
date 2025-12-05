// pictures.js - 120 Minecraft-inspired blocks
window.PICTURES = {};

const blockTemplates = [
  { name: "Grass Block", colors: ["#4c9b26","#7ec850","#8B4513"] },
  { name: "Dirt", colors: ["#8B4513","#A0522D","#C68642"] },
  { name: "Stone", colors: ["#808080","#A9A9A9","#696969"] },
  { name: "Bedrock", colors: ["#2C2C2C","#3D3D3D","#1C1C1C"] },
  { name: "Sand", colors: ["#FFF5BA","#FFE68F","#FFD700"] },
  { name: "Cobblestone", colors: ["#808080","#A9A9A9","#696969"] },
  { name: "Oak Planks", colors: ["#DEB887","#D2A679","#A0522D"] },
  { name: "Birch Planks", colors: ["#F5DEB3","#FFEBCD","#D2B48C"] },
  { name: "Spruce Planks", colors: ["#A0522D","#8B4513","#5C3317"] },
  { name: "Sandstone", colors: ["#FFE4B5","#FFDAB9","#FFC87C"] }
  // ... up to 120, will auto-generate names/colors for demo
];

// Generate 120 blocks
for (let i = 1; i <= 120; i++) {
  const id = "Block-" + String(i).padStart(3, "0");
  const template = blockTemplates[(i-1) % blockTemplates.length];
  const name = template.name + (i > template.length ? ` ${i}` : "");
  const pixelSize = 20;
  const rows = 16;
  const cols = 16;
  const colors = {};
  template.colors.forEach((c, idx) => colors[idx] = c);

  // Generate simple diagonal pattern for demo
  const data = [];
  for (let r = 0; r < rows; r++) {
    let row = "";
    for (let c = 0; c < cols; c++) {
      const colorIdx = (r + c + i) % Object.keys(colors).length;
      row += colorIdx.toString();
    }
    data.push(row);
  }

  window.PICTURES[id] = { name, pixelSize, data, colors };
}

// Helper function
window.getPictureNames = function() {
  return Object.keys(window.PICTURES);
};
