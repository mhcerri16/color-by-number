// Simple kid-friendly smiley image (numbers = color indexes)
const smiley = [
  [0,0,0,0,0,0,0,0],
  [0,1,1,0,0,1,1,0],
  [0,1,1,0,0,1,1,0],
  [0,0,0,0,0,0,0,0],
  [0,2,0,0,0,0,2,0],
  [0,0,2,2,2,2,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,0,0,0,0,0]
];

// Colors for each number
const colors = [
  "#FFD93D",  // yellow
  "#000000",  // black
  "#FF6B6B"   // red
];

let selectedColorIndex = 0;

// ------- Load colors -------
const palette = document.getElementById("color-palette");
colors.forEach((c, idx) => {
    const btn = document.createElement("div");
    btn.className = "color-btn";
    btn.style.backgroundColor = c;
    btn.onclick = () => {
        selectedColorIndex = idx;
    };
    palette.appendChild(btn);
});

// ------- Build grid -------
const grid = document.getElementById("grid");
grid.style.gridTemplateColumns = `repeat(${smiley[0].length}, 1fr)`;

smiley.forEach((row, r) => {
    row.forEach((num, c) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.innerText = num;
        cell.dataset.correct = num;

        cell.onclick = () => {
            // Fill with selected color
            cell.style.backgroundColor = colors[selectedColorIndex];

            // Clear number to show it's "done"
            cell.innerText = "";
        };

        grid.appendChild(cell);
    });
});
