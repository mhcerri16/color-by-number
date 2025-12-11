// ===============================
// ELEMENTS
// ===============================
const grid = document.getElementById("thumb-grid");
const completionSummary = document.getElementById("completion-summary");
const categorySummary = document.getElementById("category-summary");
const catBtns = document.querySelectorAll(".cat-btn");
const searchBox = document.getElementById("search-box");
const randomBtn = document.getElementById("random-btn");

// ===============================
// SPLASH TEXT
// ===============================
(() => {
  const splashEl = document.getElementById("splash");
  if (!splashEl) return;

  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const index = day % window.SPLASHES.length;
  splashEl.textContent = window.SPLASHES[index];
})();

let activeCategory = "all";

// Alphabetize picture list
const ENTRIES = Object.entries(window.PICTURES).sort((a, b) =>
  (a[1].name || a[0]).localeCompare(b[1].name || b[0])
);

// ===============================
// OLD FAST SEARCH (substring only)
// (kept for future use if needed)
// ===============================
function matchesSimple(pic, term) {
  if (!term) return true;

  const nameStr = (pic.name || "").toLowerCase();
  const idStr   = pic.id?.toLowerCase?.() || "";
  const t = term.toLowerCase();

  return nameStr.includes(t) || idStr.includes(t);
}

// ===============================
// RENDER GALLERY
// ===============================
function renderGallery() {
  grid.innerHTML = "";
  const searchTerm = searchBox.value.trim().toLowerCase();

  ENTRIES.forEach(([id, pic]) => {
    // Category filter
    if (activeCategory !== "all" && pic.category !== activeCategory) return;

    // Fast substring search
    const nameStr = (pic.name || id).toLowerCase();
    if (searchTerm && !nameStr.includes(searchTerm)) return;

    // Create tile
    const tile = document.createElement("a");
    tile.className = "thumb";
    tile.href = `color.html?name=${encodeURIComponent(id)}`;

    // ✅ Save list state *before* leaving the page
    tile.addEventListener("click", () => {
      sessionStorage.setItem("listScrollY", String(window.scrollY));
      sessionStorage.setItem("listCategory", activeCategory);
      sessionStorage.setItem("listSearch", searchBox.value.trim());
    });

    // Completed tag
    if (localStorage.getItem("completed_" + id) === "true") {
      tile.classList.add("completed");
    }

    // Thumbnail canvas
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

  const totalCompleted = ENTRIES.filter(([id]) =>
    localStorage.getItem("completed_" + id) === "true"
  ).length;

  completionSummary.textContent =
    `Completed: ${totalCompleted} / ${totalCount}`;

  if (activeCategory === "all") {
    categorySummary.style.display = "none";
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
// SEARCH INPUT
// ===============================
searchBox.addEventListener("input", () => {
  renderGallery();
});

// ===============================
// RANDOM BUTTON
// ===============================
randomBtn.addEventListener("click", () => {
  const term = searchBox.value.trim().toLowerCase();

  let list = ENTRIES.filter(([id, pic]) => {
    if (activeCategory !== "all" && pic.category !== activeCategory) return false;

    if (term) {
      const nameStr = (pic.name || id).toLowerCase();
      if (!nameStr.includes(term)) return false;
    }

    return true;
  });

  if (list.length === 0) return;

  const [randomId] = list[Math.floor(Math.random() * list.length)];
  window.location.href = `color.html?name=${randomId}`;
});

// ===============================
// INITIAL LOAD WITH RESTORE
// ===============================
function initFromSavedState() {
  const savedCategory = sessionStorage.getItem("listCategory");
  const savedSearch = sessionStorage.getItem("listSearch");
  const savedScrollY = sessionStorage.getItem("listScrollY");

  // Restore category (or default to "all")
  if (savedCategory) {
    activeCategory = savedCategory;
  }

  // Update category button selection
  catBtns.forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.cat === activeCategory);
  });

  // Restore search box
  if (savedSearch) {
    searchBox.value = savedSearch;
  }

  // Render gallery with restored filters
  renderGallery();

  // Restore scroll AFTER layout
  if (savedScrollY !== null) {
    const y = parseInt(savedScrollY, 10) || 0;
    setTimeout(() => {
      window.scrollTo(0, y);
    }, 0);
  }
}

window.addEventListener("DOMContentLoaded", initFromSavedState);
