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
// SMART FAST SEARCH
// ===============================
function smartMatch(haystack, needle) {
  haystack = haystack.toLowerCase();
  needle = needle.toLowerCase();

  if (!needle) return 100;

  // Exact match
  if (haystack === needle) return 100;

  // Starts-with strong match
  if (haystack.startsWith(needle)) return 90;

  // Word-level starts-with (e.g., "gold app" → "Golden Apple")
  const words = haystack.split(/[^a-z0-9]+/);
  if (words.some(w => w.startsWith(needle))) return 80;

  // Simple substring match
  if (haystack.includes(needle)) return 60;

  // Multi-token partial match
  const tokens = needle.split(/\s+/).filter(Boolean);
  let matched = 0;

  for (let token of tokens) {
    if (haystack.includes(token)) matched++;
  }

  if (matched === tokens.length && matched > 0) {
    return 40 + matched * 5;
  }

  return 0; // reject weak matches
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

    // Search filter
    if (searchTerm) {
      const scoreName = smartMatch((pic.name || id), searchTerm);
      const scoreId   = smartMatch(id, searchTerm);
      const score = Math.max(scoreName, scoreId);

      if (score < 50) return; // threshold for relevance
    }

    // Create tile
    const tile = document.createElement("a");
    tile.className = "thumb";
    tile.href = `color.html?name=${encodeURIComponent(id)}`;

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
  const searchTerm = searchBox.value.trim().toLowerCase();

  let list = ENTRIES.filter(([id, pic]) => {
    // Category match
    if (activeCategory !== "all" && pic.category !== activeCategory) return false;

    // Smart search match
    if (searchTerm) {
      const score = Math.max(
        smartMatch((pic.name || id), searchTerm),
        smartMatch(id, searchTerm)
      );
      return score >= 50;
    }

    return true;
  });

  if (list.length === 0) return;

  const [randomId] = list[Math.floor(Math.random() * list.length)];
  window.location.href = `color.html?name=${randomId}`;
});

// ===============================
// INITIAL LOAD
// ===============================
renderGallery();
