/*******************************
 app.js — single-file app logic
 - generates many block pictures (Block-001 ... Block-120)
 - renders numbered grid, numbered color swatches
 - only correct color can fill the matching number
 - drag-to-fill (mouse + touch)
 - canvas auto-sizes but keeps crisp pixel look
*******************************/

/* -------------------------
  Utilities
------------------------- */
function q(name){ return document.querySelector(name); }
function qs(name){ return document.querySelectorAll(name); }
function getQueryParam(key){
  const u = new URL(location.href);
  return u.searchParams.get(key);
}

/* -------------------------
  Picture generation
  We'll programmatically create 120 "blocks" using palettes.
  Each picture has:
    - name (Block-###)
    - size (pixels per side) e.g., 16, 20
    - data: array of strings with numeric digits (0..N)
    - colors: object mapping digit->hex color
------------------------- */

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// A few Minecraft-ish palettes (simplified)
const palettes = [
  // Grass (0=bg,1=top,2=side)
  {name:'Grass', colors:{0:'#2b2b2b',1:'#71b95b',2:'#8fb05a'}},
  // Dirt
  {name:'Dirt', colors:{0:'#261b13',1:'#6b452b',2:'#845534'}},
  // Stone
  {name:'Stone', colors:{0:'#1f2021',1:'#8b8e90',2:'#c7c9ca'}},
  // Wood
  {name:'Wood', colors:{0:'#2b1f12',1:'#9b6b3b',2:'#8a4f2a'}},
  // Sand
  {name:'Sand', colors:{0:'#f1e2b3',1:'#e7d08a',2:'#c8b07a'}},
  // Water-ish
  {name:'Water', colors:{0:'#081620',1:'#2b7fa1',2:'#64b5d6'}},
  // Brick
  {name:'Brick', colors:{0:'#210808',1:'#a83a2b',2:'#7a1f16'}},
  // Leaf
  {name:'Leaf', colors:{0:'#0d1a0d',1:'#2f8a3d',2:'#4fbf6b'}},
];

// deterministic seeded RNG so every load generates same blocks
function seededRng(seed){
  let s = seed >>> 0;
  return function(){
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Generate patterns using simple noise-like rules
function generateBlocks(count){
  const seed = 12345; // fixed for deterministic output
  const rnd = seededRng(seed);
  const blocks = {};
  for(let i=1;i<=count;i++){
    const id = 'Block-' + String(i).padStart(3,'0');
    const size = 16 + (i % 3 === 0 ? 4 : 0); // mostly 16, some 20 for variety
    // pick a palette deterministically
    const palette = palettes[Math.floor(rnd() * palettes.length)];
    // number of distinct colors for block (1..3)
    const colorCount = 2 + Math.floor(rnd()*2);
    // map color indexes to palette shades
    const keys = Object.keys(palette.colors);
    // build colors object mapping digits "0..(colorCount)" where 0 is background (darker)
    const colors = {};
    // ensure index 0 is a darker background variant
    colors[0] = palette.colors[0] || '#000000';
    // assign 1..colorCount using available palette shades or variations
    const shades = Object.values(palette.colors).slice(1);
    for(let c=1;c<=colorCount;c++){
      colors[c] = shades[(c-1) % shades.length] || pick(['#ff8888','#88ff88','#8888ff']);
    }

    // create an empty grid of zeros
    const grid = Array.from({length:size}, ()=> Array(size).fill(0));

    // fill central area with primary color, add border/texture
    const primary = 1;
    const secondary = colorCount >=2 ? 2 : 1;

    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        // basic layered rules to produce block-feel:
        const cx = x - size/2;
        const cy = y - size/2;
        const dist = Math.sqrt(cx*cx + cy*cy);
        // base fill: primary with noise
        if (Math.abs((x+y+i) % (3 + Math.floor(rnd()*3))) === 0){
          grid[y][x] = secondary;
        } else {
          grid[y][x] = primary;
        }
        // add subtle seam at edges for some blocks
        if (x<2 || x>size-3 || y<2 || y>size-3){
          if (rnd() > 0.5) grid[y][x] = 0; // dark edge
        }
      }
    }

    // convert rows to strings of digits
    const data = grid.map(row => row.map(d => String(d)).join(''));
    blocks[id] = {
      name: id,
      pixelSize: 18, // logical pixel size (canvas will scale)
      data,
      colors
    };
  }
  return blocks;
}

/* generate 120 blocks */
const generatedPictures = generateBlocks(120);

/* This object can contain custom or hand-crafted pictures that override generated ones.
   Add entries like:
   generatedPictures['Block-001'] = { name:'Block-001', pixelSize:16, data:[...], colors: {...} }
*/
const customPictures = {
  // Example override (optional)
  // 'Block-002': { name:'Block-002', pixelSize:16, data:[ "000", "010", "000" ], colors: {0:'#ffffff',1:'#ff0000'} }
};

// merge custom onto generated
for(const k in customPictures) generatedPictures[k] = customPictures[k];

/* Expose a function to list picture names (optional) */
window.listPictureNames = function(){ return Object.keys(generatedPictures); };

/* -------------------------
  App logic: loads picture by query param name
------------------------- */
const pictureParam = getQueryParam('name') || 'Block-001';
const picture = generatedPictures[pictureParam];

const canvas = q('#pixel-canvas');
const ctx = canvas.getContext('2d');
const colorBar = q('#color-bar');
const pageTitle = q('#page-title');

// Basic guard
if (!picture) {
  // display friendly message
  if (pageTitle) pageTitle.textContent = 'Picture not found';
  if (canvas) {
    canvas.width = 400; canvas.height = 200;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#111'; ctx.font='16px sans-serif';
    ctx.fillText('Picture "'+pictureParam+'" not found.',20,40);
  }
  throw new Error('Picture not found: ' + pictureParam);
}

// show title
if (pageTitle) pageTitle.textContent = picture.name;

// Build palette UI (number labels inside swatches)
function buildPalette(){
  if (!colorBar) return;
  colorBar.innerHTML = '';
  const keys = Object.keys(picture.colors).sort((a,b)=>Number(a)-Number(b));
  keys.forEach(k=>{
    const sw = document.createElement('div');
    sw.className = 'color-swatch';
    sw.style.background = picture.colors[k];
    sw.dataset.value = k;
    // label as number inside swatch (ensure readable)
    sw.textContent = k;
    sw.style.color = (luma(picture.colors[k]) > 160) ? '#111' : '#fff';
    sw.onclick = () => selectColor(k, sw);
    colorBar.appendChild(sw);
  });
}

function luma(hex){
  // hex -> approximate brightness
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  return 0.299*r + 0.587*g + 0.114*b;
}

let currentColor = null;
function selectColor(val, el){
  currentColor = String(val);
  qs('.color-swatch').forEach(x=>x.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

/* Draw the numbered grid (numbers visible until colored) */
let rows = picture.data.length;
let cols = picture.data[0].length;
let logicalPixel = picture.pixelSize; // base pixel size
// We'll render at a scale so the whole image fits comfortably on screen.
function computeCanvasSize(){
  const maxWidth = Math.min(window.innerWidth - 40, 800); // leave margins
  const maxHeight = Math.min(window.innerHeight - 220, 900);
  // desired cell size tries to be between 12 and 36
  const idealCell = Math.floor(Math.min(maxWidth/cols, maxHeight/rows));
  const cell = Math.max(12, Math.min(36, idealCell));
  return {width: cols*cell, height: rows*cell, cell};
}

let state = {
  filled: Array.from({length:rows}, ()=>Array(cols).fill(false))
};

function drawGrid(){
  const sizeInfo = computeCanvasSize();
  canvas.width = sizeInfo.width;
  canvas.height = sizeInfo.height;
  // clear
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const cell = sizeInfo.cell;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // draw each cell background as blank (light)
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const val = picture.data[r][c];
      // base cell background: light neutral
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c*cell, r*cell, cell, cell);
      // border
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(c*cell+0.5, r*cell+0.5, cell-1, cell-1);

      // if cell has been filled, draw color; otherwise draw number
      if (state.filled[r][c]){
        const colVal = picture.data[r][c];
        ctx.fillStyle = picture.colors[colVal] || '#000';
        ctx.fillRect(c*cell, r*cell, cell, cell);
      } else {
        // draw the number (small, but readable)
        ctx.fillStyle = '#222';
        const fontSize = Math.max(10, Math.floor(cell * 0.45));
        ctx.font = fontSize + 'px sans-serif';
        ctx.fillText(String(picture.data[r][c]), c*cell + cell/2, r*cell + cell/2);
      }
    }
  }
}

/* Paint logic — only allow painting if selected color matches target */
function paintAtClient(x,y){
  const rect = canvas.getBoundingClientRect();
  const cx = x - rect.left;
  const cy = y - rect.top;
  const sizeInfo = computeCanvasSize();
  const cell = sizeInfo.cell;
  const c = Math.floor(cx / cell);
  const r = Math.floor(cy / cell);
  if (r<0 || r>=rows || c<0 || c>=cols) return;
  const target = String(picture.data[r][c]);
  if (!currentColor) return; // no color selected
  if (target !== currentColor) return; // must match
  // set filled
  state.filled[r][c] = true;
  // draw the single cell quickly
  ctx.fillStyle = picture.colors[currentColor];
  ctx.fillRect(c*cell, r*cell, cell, cell);
}

/* Drag and touch handling */
let isDown = false;
canvas.addEventListener('mousedown', e=>{ isDown=true; paintAtClient(e.clientX, e.clientY); });
window.addEventListener('mouseup', ()=> isDown=false);
canvas.addEventListener('mousemove', e=>{ if (isDown) paintAtClient(e.clientX, e.clientY); });

// touch
canvas.addEventListener('touchstart', e=>{
  isDown = true;
  const t = e.touches[0];
  paintAtClient(t.clientX, t.clientY);
});
canvas.addEventListener('touchmove', e=>{
  const t = e.touches[0];
  paintAtClient(t.clientX, t.clientY);
});
window.addEventListener('touchend', ()=> isDown=false);

/* Keyboard: number keys to select color */
window.addEventListener('keydown', e=>{
  if (/^[0-9]$/.test(e.key)){
    // try to find swatch with that number
    const sw = document.querySelector('.color-swatch[data-value="'+e.key+'"]');
    if (sw) sw.click();
  }
});

/* Re-draw on resize (responsive) */
window.addEventListener('resize', ()=> drawGrid());

/* initialize */
buildPalette();
drawGrid();
