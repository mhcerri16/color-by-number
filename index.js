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
// FUZZY SEARCH
// ===============================
function fuzzyMatch(haystack, needle) {
  haystack = haystack.toLowerCase();
  needle = needle.toLowerCase();
  const parts = needle.split(/\s+/).filter(Boolean);

  return parts.every(part => {
    let hIdx = 0;
    for (let nIdx = 0; nIdx < part.length; nIdx++) {
      hIdx = haystack.indexOf(part[nIdx], hIdx);
      if (hIdx === -1) return false;  
      hIdx++;
    }
    return true;
  });
}

// ===============================
// RENDER GALLERY
// ===============================
function renderGallery() {
  grid.innerHTML = "";
  const searchTerm = searchBox.value.trim().toLowerCase();

  ENTRIES.forEach(([id, pic]) => {
    if (activeCategory !== "all" && pic.category !== activeCategory) return;

    if (searchTerm) {
      const nameStr = (pic.name || id).toLowerCase();
      const idStr   = id.toLowerCase();

      if (
        !fuzzyMatch(nameStr, searchTerm) &&
        !fuzzyMatch(idStr, searchTerm)
      ) return;
    }

    const tile = document.createElement("a");
    tile.className = "thumb";
    tile.href = `color.html?name=${encodeURIComponent(id)}`;

    if (localStorage.getItem("completed_" + id) === "true") {
      tile.classList.add("completed");
    }

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
// SEARCH INPUT HANDLING
// ===============================
searchBox.addEventListener("input", () => {
  renderGallery();
});

// ===============================
// RANDOM BUTTON
// ===============================
randomBtn.addEventListener("click", () => {
  let list = ENTRIES;

  if (activeCategory !== "all") {
    list = list.filter(([_, pic]) => pic.category === activeCategory);
  }

  const searchTerm = searchBox.value.trim().toLowerCase();
  if (searchTerm) {
    list = list.filter(([id, pic]) =>
      fuzzyMatch((pic.name || id).toLowerCase(), searchTerm) ||
      fuzzyMatch(id.toLowerCase(), searchTerm)
    );
  }

  if (list.length === 0) return;

  const [randomId] = list[Math.floor(Math.random() * list.length)];
  window.location.href = `color.html?name=${randomId}`;
});

// ===============================
// INITIAL LOAD
// ===============================
renderGallery();
