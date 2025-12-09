// ===============================
// ELEMENTS
// ===============================
const grid = document.getElementById("thumb-grid");
const completionSummary = document.getElementById("completion-summary");
const categorySummary = document.getElementById("category-summary");
const catBtns = document.querySelectorAll(".cat-btn");

let activeCategory = "all";

// ===============================
// GALLERY RENDERING FUNCTION
// ===============================
function renderGallery() {
  grid.innerHTML = "";

  Object.entries(PICTURES).forEach(([id, pic]) => {

    // Skip non-matching categories
    if (activeCategory !== "all" && pic.category !== activeCategory) return;

    const tile = document.createElement("a");
    tile.className = "thumb";
    tile.href = `color.html?name=${encodeURIComponent(id)}`;

    // Mark completed
    if (localStorage.getItem("completed_" + id)) {
      tile.classList.add("completed");
    }

    // --- Create thumbnail canvas ---
    const canvas = document.createElement("canvas");
    const size = 6; // scale factor for thumbnails
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

  updateSummaries();
}

// ===============================
// SUMMARY COUNTERS
// ===============================
function updateSummaries() {
  const allPics = Object.entries(PICTURES);
  const totalCount = allPics.length;

  // --- total completed ---
  const totalCompleted = allPics.filter(([id]) =>
    localStorage.getItem("completed_" + id) === "true"
  ).length;

  completionSummary.textContent =
    `Completed: ${totalCompleted} / ${totalCount}`;

  // --- category summary ---
  if (activeCategory === "all") {
    categorySummary.innerHTML = "";
    categorySummary.style.display = "none";  // hide cleanly
    return;
  }

  const picsInCat = allPics.filter(([id, pic]) => pic.category === activeCategory);
  const completedInCat = picsInCat.filter(([id]) =>
    localStorage.getItem("completed_" + id) === "true"
  ).length;

  categorySummary.style.display = ""; // show when needed
  categorySummary.textContent =
    `${activeCategory}: ${completedInCat} / ${picsInCat.length} completed`;
}

// ===============================
// CATEGORY BUTTON HANDLING
// ===============================
catBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    catBtns.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    activeCategory = btn.dataset.cat;
    renderGallery();
  });
});

// ===============================
// INITIAL LOAD
// ===============================
renderGallery();
