window.PICTURES = {};
window.pictureList = [];

const blockTemplates = [
  { name: "Grass Block", colors: ["#4c9b26","#7ec850","#8B4513","#a3d977"] },
  { name: "Dirt", colors: ["#8B4513","#A0522D","#C68642","#B5651D"] },
  { name: "Stone", colors: ["#808080","#A9A9A9","#696969","#B0B0B0"] },
  { name: "Bedrock", colors: ["#2C2C2C","#3D3D3D","#1C1C1C","#4B4B4B"] },
  { name: "Sand", colors: ["#FFF5BA","#FFE68F","#FFD700","#F5DEB3"] },
  { name: "Cobblestone", colors: ["#808080","#A9A9A9","#696969","#999999"] },
  { name: "Oak Planks", colors: ["#DEB887","#D2A679","#A0522D","#C19A6B"] },
  { name: "Birch Planks", colors: ["#F5DEB3","#FFEBCD","#D2B48C","#EED9B6"] },
  { name: "Bow", colors: ["#8B4513","#A0522D","#D2B48C","#FFF","#B5651D"] },
  { name: "Trident", colors: ["#00CED1","#20B2AA","#5F9EA0","#008080","#2E8B57"] },
  { name: "Bowl", colors: ["#A0522D","#D2B48C","#FFE4C4","#8B4513","#C19A6B"] },
  { name: "Arrow", colors: ["#8B4513","#D2B48C","#C0C0C0","#000000","#808080"] },
  { name: "Iron Sword", colors: ["#C0C0C0","#808080","#A9A9A9","#FFFFFF","#D3D3D3"] },
  { name: "Diamond Sword", colors: ["#00FFFF","#00CED1","#20B2AA","#5F9EA0","#40E0D0"] },
  { name: "Pickaxe", colors: ["#8B4513","#A0522D","#C0C0C0","#808080","#D2B48C"] },
  { name: "Shovel", colors: ["#8B4513","#C0C0C0","#D2B48C","#808080","#A0522D"] },
  // …add more blocks/items as needed…
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
      row += ((r+c+i) % blk.colors.length).toString();
    }
    data.push(row);
  }
  window.PICTURES[id] = { name: blk.name, pixelSize: 20, data, colors: blk.colors };
  window.pictureList.push({ id, name: blk.name });
}
