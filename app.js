// Each page must define `pictureName` variable before including this script
// Example in heart.html: <script>const pictureName = 'Heart';</script>

const pictures = {
    Heart: {
        pixelSize: 20,
        data: [
            "000110000",
            "001221100",
            "012222210",
            "122222221",
            "122222221",
            "012222210",
            "001222100",
            "000110000"
        ],
        colors: { 0: "#ffffff", 1: "#ff0000", 2: "#ff6666" }
    },
    Star: {
        pixelSize: 20,
        data: [
            "0001000",
            "0011100",
            "1112111",
            "0111110",
            "0011100",
            "0001000"
        ],
        colors: { 0: "#ffffff", 1: "#ffd700", 2: "#ffea00" }
    },
    Smiley: {
        pixelSize: 20,
        data: [
            "00111100",
            "01222210",
            "12200221",
            "12222221",
            "12220221",
            "01222210",
            "00111100"
        ],
        colors: { 0: "#ffffff", 1: "#000000", 2: "#ffff66" }
    }
};

// Get elements
const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const colorBar = document.getElementById("color-bar");
const backBtn = document.getElementById("back-btn");
const title = document.getElementById("picture-title");

let currentPicture = pictures[pictureName];
let currentColor = null;
let isDragging = false;

// Show title
if (title) title.textContent = pictureName;

// Build color bar
if (colorBar) {
    Object.entries(currentPicture.colors).forEach(([num, color]) => {
        const swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.background = color;
        swatch.dataset.value = num;
        swatch.onclick = () => selectColor(num, swatch);
        colorBar.appendChild(swatch);
    });
}

function selectColor(value, element) {
    currentColor = value;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
}

// Draw blank grid
function drawPixels() {
    const size = currentPicture.pixelSize;
    const rows = currentPicture.data.length;
    const cols = currentPicture.data[0].length;
    canvas.width = cols * size;
    canvas.height = rows * size;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.fillStyle = currentPicture.colors[0]; // blank
            ctx.fillRect(c * size, r * size, size, size);
        }
    }
}
drawPixels();

// Paint pixel if correct
function paintPixel(x, y) {
    if (!currentColor) return;
    const size = currentPicture.pixelSize;
    const c = Math.floor(x / size);
    const r = Math.floor(y / size);
    const targetVal = currentPicture.data[r][c];
    if (String(currentColor) !== String(targetVal)) return;
    ctx.fillStyle = currentPicture.colors[currentColor];
    ctx.fillRect(c * size, r * size, size, size);
}

// Mouse / touch events
canvas.addEventListener('mousedown', () => isDragging = true);
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);
canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        paintPixel(e.clientX - rect.left, e.clientY - rect.top);
    }
});
canvas.addEventListener('touchstart', e => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    paintPixel(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener('touchmove', e => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    paintPixel(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener('touchend', () => isDragging = false);

// Back button
if (backBtn) backBtn.onclick = () => window.location.href = 'index.html';
