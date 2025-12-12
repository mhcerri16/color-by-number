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
// RENDER GALLERY
// ===============================
function renderGallery() {
  grid.innerHTML = "";
  const searchTerm = searchBox.value.trim().toLowerCase();

  ENTRIES.forEach(([id, pic]) => {
    if (activeCategory !== "all" && pic.category !== activeCategory) return;

    const nameStr = (pic.name || id).toLowerCase();
    if (searchTerm && !nameStr.includes(searchTerm)) return;

    // Create tile
    const tile = document.createElement("a");
    tile.className = "thumb";
    tile.href = `color.html?name=${encodeURIComponent(id)}`;

    // ===============================
    // SAVE STATE BEFORE LEAVING PAGE
    // ===============================
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

  // Reset category highlights
  catBtns.forEach(btn => btn.classList.remove("complete"));

  // Mark each category if complete
  const categories = [...new Set(ENTRIES.map(([_, pic]) => pic.category))];

  categories.forEach(cat => {
    const catPics = ENTRIES.filter(([_, pic]) => pic.category === cat);
    const catDone = catPics.filter(([id]) =>
      localStorage.getItem("completed_" + id) === "true"
    ).length;

    if (catDone === catPics.length && catPics.length > 0) {
      const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
      if (btn) btn.classList.add("complete");
    }
  });
  
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

  localStorage.setItem("lastScroll", String(window.scrollY));
  localStorage.setItem("lastCategory", activeCategory);
  
  window.location.href = `color.html?name=${randomId}`;
});

// ===============================
// RESTORE STATE WHEN INDEX LOADS
// ===============================
function restoreListState() {
  const savedCategory = sessionStorage.getItem("listCategory");
  const savedSearch = sessionStorage.getItem("listSearch");
  const savedScrollY = sessionStorage.getItem("listScrollY");

  if (savedCategory) {
    activeCategory = savedCategory;
  }

  // Restore button selection
  catBtns.forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.cat === activeCategory);
  });

  // Restore search
  if (savedSearch) {
    searchBox.value = savedSearch;
  }

  // Render the gallery with restored filters
  renderGallery();

  // Restore scroll AFTER render
  if (savedScrollY !== null) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScrollY, 10) || 0);
    }, 0);
  }
}

window.addEventListener("DOMContentLoaded", restoreListState);
