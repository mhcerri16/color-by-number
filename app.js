/******************************************
 app.js — Bedrock-inspired blocks, lazy load,
 numbered grid, palette with numbered swatches,
 strict color-only filling, drag + touch support.
******************************************/

/* -------------------------
 Utilities
------------------------- */
function q(sel){ return document.querySelector(sel); }
function qs(sel){ return Array.from(document.querySelectorAll(sel)); }
function getQueryParam(k){ return new URL(location.href).searchParams.get(k); }

/* -------------------------
 Bedrock-inspired name list (120)
 We include many real names and many color variants to reach 120.
 We append " (inspired)" so it's clear these are NOT official textures.
------------------------- */
const bedrockNames = (function buildNames(){
  const core = [
    "Grass Block","Dirt","Stone","Cobblestone","Sand","Red Sand","Gravel","Oak Planks","Spruce Planks",
    "Birch Planks","Jungle Planks","Acacia Planks","Dark Oak Planks","Oak Log","Spruce Log","Birch Log",
    "Jungle Log","Acacia Log","Dark Oak Log","Bedrock","Obsidian","End Stone","Netherrack","Soul Sand",
    "Basalt","Blackstone","Polished Blackstone","Nether Bricks","Red Nether Bricks","Quartz Block",
    "Sandstone","Smooth Sandstone","Red Sandstone","Smooth Red Sandstone","Stone Bricks","Mossy Stone Bricks",
    "Cracked Stone Bricks","Bricks","Mossy Cobblestone","Glass","Glass Pane","Glowstone","Sea Lantern",
    "Concrete (White)","Concrete (Orange)","Concrete (Magenta)","Concrete (Light Blue)","Concrete (Yellow)",
    "Concrete (Lime)","Concrete (Pink)","Concrete (Gray)","Concrete (Light Gray)","Concrete (Cyan)",
    "Concrete (Purple)","Concrete (Blue)","Concrete (Brown)","Concrete (Green)","Concrete (Red)",
    "Concrete (Black)","Terracotta (White)","Terracotta (Orange)","Terracotta (Magenta)",
    "Terracotta (Light Blue)","Terracotta (Yellow)","Terracotta (Lime)","Terracotta (Pink)",
    "Terracotta (Gray)","Terracotta (Light Gray)","Terracotta (Cyan)","Terracotta (Purple)",
    "Terracotta (Blue)","Terracotta (Brown)","Terracotta (Green)","Terracotta (Red)","Gold Ore",
    "Iron Ore","Coal Ore","Diamond Ore","Redstone Ore","Lapis Ore","Emerald Ore","Copper Ore",
    "TNT","Furnace","Crafting Table","Chest","Bookshelf","Anvil","Beacon","End Portal Frame",
    "Prismarine","Prismarine Bricks","Dark Prismarine","Sea Lantern (alt)","Purpur Block","End Stone Bricks",
    "Hay Bale","Wool (White)","Wool (Red)","Wool (Blue)","Wool (Green)","Wool (Yellow)","Wool (Pink)","Wool (Black)",
    "Iron Block","Gold Block","Diamond Block","Lapis Block","Redstone Lamp","Coal Block","Emerald Block",
    "Nether Wart Block","Warped Nylium","Crimson Nylium","Shroomlight","Soul Soil","NETHER_GOLD_ORE",
    "Frosted Ice","Packed Ice","Blue Ice","Moss Block","Lichen","Copper Block","Amethyst Block",
    "Smooth Stone","Smooth Quartz","Hay Block","End Gateway Block","Barrel","Smoker","Blast Furnace",
    "Cartography Table","Loom","Grindstone","Composter","Stonecutter","Smithing Table","Bell","Lantern"
  ];
  // If core < 120, append color-conjugates to reach 120
  const names = core.slice();
  let c = 1;
  while (names.length < 120) {
    names.push("Variant Block " + String(c++).padStart(3,'0'));
  }
  // append "(inspired)"
  return names.map(n => n + " (inspired)");
})();

/* -------------------------
 Palettes inspired by Bedrock textures
 These are simplified palettes (not copies).
------------------------- */
const palettes = [
  { name: 'grass', shades: ['#0b2d0b','#6dbf4b','#97d97a'] },
  { name: 'dirt', shades: ['#2a1610','#6f3f2a','#9b6b4a'] },
  { name: 'stone', shades: ['#1c1d1f','#7b7d80','#bfc2c4'] },
  { name: 'sand', shades: ['#efe2af','#e2cd86','#bfa96f'] },
  { name: 'wood', shades: ['#2d1608','#8b5a36','#b47d55'] },
  { name: 'nether', shades: ['#2b0a0a','#8a1f1f','#c84b3a'] },
  { name: 'prismarine', shades: ['#002f34','#2f8f8f','#6fd6c6'] },
  { name: 'stone2', shades: ['#0f1416','#6f777a','#bfc6c8'] },
  { name: 'brick', shades: ['#2b0b09','#a23b2a','#8c2a1b'] },
  { name: 'metal', shades: ['#0f0f0f','#9da3a7','#e6e9ea'] },
  { name: 'concrete', shades: ['#121212','#777777','#cfcfcf'] },
  { name: 'glow', shades: ['#2b1b00','#ffd36a','#fff2d0'] }
];

/* -------------------------
 Deterministic generator for N blocks
------------------------- */
function seededRng(seed){
  let s = seed >>> 0;
  return function(){
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function generateBedrockBlocks(count, seed=42){
  const rnd = seededRng(seed);
  const blocks = {};
  for(let i=1;i<=count;i++){
    const id = 'Block-' + String(i).padStart(3,'0');
    // size 16 or 20 occasionally
    const size = (i % 5 === 0) ? 20 : 16;
    // pick a palette
    const p = palettes[Math.floor(rnd() * palettes.length)];
    // number of colors (1..3)
    const colorCount = 1 + Math.floor(rnd() * Math.min(3, p.shades.length));
    // build color mapping: 0 background (darker), 1..N are fill shades
    const colors = {};
    // background dither/darker
    colors[0] = shadeHex(p.shades[0], -14); // darker base for background
    for(let c=1;c<=colorCount;c++){
      colors[c] = p.shades[(c-1) % p.shades.length];
    }
    // generate grid with simple texture rules
    const grid = [];
    for(let y=0;y<size;y++){
      let row = '';
      for(let x=0;x<size;x++){
        // seam edges dark occasionally
        if (x < 1 || x >= size-1 || y < 1 || y >= size-1){
          row += '0';
          continue;
        }
        // noise for variation
        const v = Math.floor((Math.abs(Math.sin((x*13+y*7+i*3)*0.07)) + rnd()) * 10) % (colorCount+1);
        row += String(Math.min(v, colorCount));
      }
      grid.push(row);
    }
    // name mapping from bedrockNames array
    const name = bedrockNames[(i-1) % bedrockNames.length];
    blocks[id] = {
      id,
      name,
      pixelSize: size,
      data: grid,
      colors
    };
  }
  return blocks;
}

// small helper to slightly darken/lighten hex colors
function shadeHex(hex, percent){
  // hex e.g. "#aabbcc"
  const h = hex.replace('#','');
  const r = Math.max(0, Math.min(255, parseInt(h.substring(0,2),16) + percent));
  const g = Math.max(0, Math.min(255, parseInt(h.substring(2,4),16) + percent));
  const b = Math.max(0, Math.min(255, parseInt(h.substring(4,6),16) + percent));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

/* generate 120 blocks deterministically */
const generated = generateBedrockBlocks(120, 20231107);

/* Allow overrides: add named objects here to replace generated ones */
const custom = {
  // Example if you want to handcraft a particular one later:
  // 'Block-001': { id:'Block-001', name:'Grass Block (inspired)', pixelSize:16, data: [...], colors: {...} }
};
for(const k in custom) generated[k] = custom[k];

/* expose helper to list names for index.html if needed */
window.listPictureNames = () => Object.values(generated).map(b => ({id: b.id, name: b.name}));

/* -------------------------
 App logic (one color.html page)
------------------------- */
const pictureParam = getQueryParam('name') || 'Block-001';
const picture = generated[pictureParam];

const canvas = q('#pixel-canvas');
const ctx = canvas.getContext('2d');
const colorBar = q('#color-bar');
const pageTitle = q('#page-title');

// If not found, show friendly text
if (!picture){
  if (pageTitle) pageTitle.textContent = 'Not found';
  if (canvas){
    canvas.width = 640; canvas.height = 240;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#111'; ctx.font = '16px sans-serif';
    ctx.fillText('Picture ' + pictureParam + ' not found.', 20, 30);
  }
  throw new Error('Picture not found: ' + pictureParam);
}

// show title
if (pageTitle) pageTitle.textContent = picture.name;

// Build palette (numbered)
function buildPalette(){
  if (!colorBar) return;
  colorBar.innerHTML = '';
  const keys = Object.keys(picture.colors).sort((a,b)=>Number(a)-Number(b));
  keys.forEach(k=>{
    const sw = document.createElement('div');
    sw.className = 'color-swatch';
    sw.style.background = picture.colors[k];
    sw.dataset.value = k;
    sw.dataset.number = k;
    sw.textContent = k; // show number in swatch
    sw.style.color = (luma(picture.colors[k]) > 160) ? '#111' : '#fff';
    sw.onclick = () => selectColor(k, sw);
    colorBar.appendChild(sw);
  });
}

function luma(hex){
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  return 0.299*r + 0.587*g + 0.114*b;
}

let currentColor = null;
function selectColor(val, el){
  currentColor = String(val);
  qs('.color-swatch').forEach(s => s.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

/* grid state */
const rows = picture.data.length;
const cols = picture.data[0].length;
const state = { filled: Array.from({length:rows}, ()=>Array(cols).fill(false)) };

/* compute canvas size so image is centered and scaled nicely */
function computeCanvasSize(){
  const marginW = 60;
  const marginH = 200; // header + palette space
  const maxWidth = Math.min(window.innerWidth - marginW, 1000);
  const maxHeight = Math.max(200, window.innerHeight - marginH);
  const idealCell = Math.floor(Math.min(maxWidth/cols, maxHeight/rows));
  const cell = Math.max(8, Math.min(36, idealCell)); // keep cells reasonable
  return { cell, width: cols * cell, height: rows * cell };
}

/* Draw grid with numbers where not filled */
function drawGrid(){
  const sz = computeCanvasSize();
  canvas.width = sz.width;
  canvas.height = sz.height;
  // background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // grid
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const val = picture.data[r][c];
      const x = c * sz.cell;
      const y = r * sz.cell;
      if (state.filled[r][c]){
        ctx.fillStyle = picture.colors[val] || '#000';
        ctx.fillRect(x, y, sz.cell, sz.cell);
      } else {
        // blank cell background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, sz.cell, sz.cell);
        // border
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, sz.cell - 1, sz.cell - 1);
        // number
        ctx.fillStyle = '#222';
        const fontSize = Math.max(9, Math.floor(sz.cell * 0.45));
        ctx.font = fontSize + 'px sans-serif';
        ctx.fillText(String(val), x + sz.cell/2, y + sz.cell/2);
      }
    }
  }
}

/* painting logic - only when selected color equals target number */
function paintAtClient(clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  const cx = clientX - rect.left;
  const cy = clientY - rect.top;
  const sz = computeCanvasSize();
  const c = Math.floor(cx / sz.cell);
  const r = Math.floor(cy / sz.cell);
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  const target = String(picture.data[r][c]);
  if (!currentColor) return;
  if (target !== currentColor) return;
  if (state.filled[r][c]) return;
  state.filled[r][c] = true;
  // draw the cell quickly
  ctx.fillStyle = picture.colors[currentColor];
  ctx.fillRect(c * sz.cell, r * sz.cell, sz.cell, sz.cell);
}

/* drag/touch handling */
let isDown = false;
canvas.addEventListener('mousedown', e => { isDown = true; paintAtClient(e.clientX, e.clientY); });
window.addEventListener('mouseup', () => isDown = false);
canvas.addEventListener('mousemove', e => { if (isDown) paintAtClient(e.clientX, e.clientY); });

canvas.addEventListener('touchstart', e => {
  e.preventDefault(); // prevents page scroll
  isDown = true;
  const t = e.touches[0];
  paintAtClient(t.clientX, t.clientY);
}, {passive:false});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const t = e.touches[0];
  paintAtClient(t.clientX, t.clientY);
}, {passive:false});

window.addEventListener('touchend', ()=> isDown = false);

/* keyboard quick select - numbers 0..9 */
window.addEventListener('keydown', e=>{
  if (/^[0-9]$/.test(e.key)){
    const sw = document.querySelector('.color-swatch[data-value="'+e.key+'"]');
    if (sw) sw.click();
  }
});

/* responsive redraw */
window.addEventListener('resize', ()=> drawGrid());

/* init */
buildPalette();
drawGrid();

/* Expose function for index.html if you want to list names dynamically */
window.generatedBlocks = generated;

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
      ctx.fillStyle = currentPicture.colors[0]; // blank
      ctx.fillRect(c * size, r * size, size, size);

      // Draw number if current color matches
      const val = currentPicture.data[r][c];
      if (currentColor && String(val) === String(currentColor)) {
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${size / 2}px Arial`;
        ctx.fillText(val, c * size + size/2, r * size + size/2);
      }
    }
  }
}
