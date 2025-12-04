// Built-in pixel art templates (expandable later)
const pictures = [
    {
        name: "Heart",
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
        colors: {
            0: "#ffffff",
            1: "#ff0000",
            2: "#ff6666"
        }
    },
    {
        name: "Star",
        pixelSize: 20,
        data: [
            "0001000",
            "0011100",
            "1112111",
            "0111110",
            "0011100",
            "0001000"
        ],
        colors: {
            0: "#ffffff",
            1: "#ffd700",
            2: "#ffea00"
        }
    },
    {
        name: "Smiley",
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
        colors: {
            0: "#ffffff",
            1: "#000000",
            2: "#ffff66"
        }
    }
];

// UI Elements
const homeScreen = document.getElementById("home-screen");
const appScreen = document.getElementById("app-screen");
const pictureList = document.getElementById("picture-list");
const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const colorBar = document.getElementById("color-bar");
const backBtn = document.getElementById("back-btn");
const title = document.getElementById("picture-title");

let currentPicture = null;
let currentColor = null;
let isDragging = false;

// Build home screen
function loadPictureList() {
    pictureList.innerHTML = "";
    pictures.forEach((pic, index) => {
        const div = document.createElement("div");
        div.className = "picture-option";
        div.textContent = pic.name;
        div.onclick = () => startPicture(index);
        pictureList.appendChild(div);
    });
}

// Start chosen picture
function startPicture(index) {
    currentPicture = pictures[index];
    homeScreen.classList.remove("active");
    appScreen.classList.add("active");
    title.textContent = currentPicture.name;
    buildColorBar();
    drawPixels();
}

// Build color bar
function buildColorBar() {
    colorBar.innerHTML = "";
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

// Draw pixel grid
function drawPixels() {
    const size = currentPicture.pixelSize;
    const rows = currentPicture.data.length;
    const cols = currentPicture.data[0].length;

    canvas.width = cols * size;
    canvas.height = rows * size;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = currentPicture.data[r][c];
            ctx.fillStyle = currentPicture.colors[val];
            ctx.fillRect(c * size, r * size, size, size);
        }
    }
}

// Paint pixel if correct
function paintPixel(x, y) {
    if (!currentPicture || currentColor === null) return;

    const size = currentPicture.pixelSize;
    const c = Math.floor(x / size);
    const r = Math.floor(y / size);

    const targetVal = currentPicture.data[r][c];

    // Only color if match
    if (String(currentColor) !== String(targetVal)) return;

    ctx.fillStyle = currentPicture.colors[currentColor];
    ctx.fillRect(c * size, r * size, size, size);
}

//
