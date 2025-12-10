// ===============================
// ELEMENTS
// ===============================
const grid = document.getElementById("thumb-grid");
const completionSummary = document.getElementById("completion-summary");
const categorySummary = document.getElementById("category-summary");
const catBtns = document.querySelectorAll(".cat-btn");

// ===============================
// SPLASH TEXT (daily deterministic)
// ===============================
(() => {
  const splashEl = document.getElementById("splash");
  if (!splashEl) return;

  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const index = day % window.SPLASHES.length;
  splashEl.textContent = window.SPLASHES[index];
})();

let activeCategory = "all";

// Pre-sort entries alphabetically ONCE for consistent gallery order
const ENTRIES = Object.entries(window.PICTURES).sort((a, b) =>
  (a[1].name || a[0]).localeCompare(b[1].name || b[0])
);

// ===============================
// GALLERY RENDERING
// ===============================
function renderGallery() {
  grid.innerHTML = "";

  ENTRIES.forEach(([id, pic]) => {
    // Category filter
    if (activeCategory !== "all" && pic.category !== activeCategory) return;

    const tile = document.createElement("a");
    tile.className = "thumb";
    tile.href = `color.html?name=${encodeURIComponent(id)}`;

    // Completed state
    if (localStorage.getItem("completed_" + id) === "true") {
      tile.classList.add("completed");
    }

    // --- Thumbnail canvas ---
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const rows = pic.data.length;
    const cols = pic.data[0].length;
    const scale = 6;

    canvas.width = cols * scale;
    canvas.height = rows * scale;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = pic.colors[pic.data[r][c]];
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    // --- Label ---
    const label = document.createElement("div");
    label.className = "thumb-label";
    label.textContent = pic.name || id;

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
  const totalCount = ENTRIES.length;

  // Total completed across all categories
  const totalCompleted = ENTRIES.filter(([id]) =>
    localStorage.getItem("completed_" + id) === "true"
  ).length;

  completionSummary.textContent =
    `Completed: ${totalCompleted} / ${totalCount}`;

  // Category-specific summary
  if (activeCategory === "all") {
    categorySummary.style.display = "none";
    categorySummary.textContent = "";
    return;
  }

  const picsInCat = ENTRIES.filter(([_, pic]) => pic.category === activeCategory);
  const completedInCat = picsInCat.filter(([id]) =>
    localStorage.getItem("completed_" + id) === "true"
  ).length;

  categorySummary.style.display = "block";
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
