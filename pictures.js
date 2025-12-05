window.PICTURES = {};
window.pictureList = [];

const blockTemplates = [
  { name: "Grass Block", colors: ["#ffffff","#4c9b26","#7ec850","#8B4513"] },
  { name: "Dirt", colors: ["#ffffff","#8B4513","#A0522D","#C68642"] },
  { name: "Stone", colors: ["#ffffff","#808080","#A9A9A9","#696969"] },
  { name: "Bedrock", colors: ["#ffffff","#2C2C2C","#3D3D3D","#1C1C1C"] },
  { name: "Sand", colors: ["#ffffff","#FFF5BA","#FFE68F","#FFD700"] },
  { name: "Cobblestone", colors: ["#ffffff","#808080","#A9A9A9","#696969"] },
  { name: "Oak Planks", colors: ["#ffffff","#DEB887","#D2A679","#A0522D"] },
  { name: "Birch Planks", colors: ["#ffffff","#F5DEB3","#FFEBCD","#D2B48C"] },
  { name: "Bow", colors: ["#ffffff","#8B4513","#A0522D","#D2B48C"] },
  { name: "Trident", colors: ["#ffffff","#00CED1","#20B2AA","#5F9EA0"] },
  { name: "Bowl", colors: ["#ffffff","#A0522D","#D2B48C","#FFE4C4"] },
  { name: "Arrow", colors: ["#ffffff","#8B4513","#D2B48C","#C0C0C0"] },
  { name: "Iron Sword", colors: ["#ffffff","#C0C0C0","#808080","#A9A9A9"] },
  { name: "Diamond Sword", colors: ["#ffffff","#00FFFF","#00CED1","#20B2AA"] },
  { name: "Pickaxe", colors: ["#ffffff","#8B4513","#A0522D","#C0C0C0"] },
  { name: "Shovel", colors: ["#ffffff","#8B4513","#C0C0C0","#D2B48C"] },
  // add more blocks/items as desired
];

for(let i=0;i<blockTemplates.length;i++){
  const blk = blockTemplates[i];
  const id = "Block-" + String(i+1).padStart(3,"0");
  const rows = 16;
  const cols = 16;
  const data = [];
  for(let r=0;r<rows;r++){
    let row = "";
    for(let c=0;c<cols;c++){
      row += ((r + c + i) % blk.colors.length).toString();
    }
    data.push(row);
  }
  window.PICTURES[id] = { name: blk.name, pixelSize: 20, data, colors: blk.colors };
  window.pictureList.push({ id, name: blk.name });
}
