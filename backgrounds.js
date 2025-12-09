window.BACKGROUNDS = {
  "End": "backgrounds/End_Background_dark.webp",
  "Dirt": "backgrounds/Dirt_Background_dark.webp",
  "End Stone": "backgrounds/EndStone_Background_dark.webp",
  "Nether": "backgrounds/Nether_Background_dark.webp",
  "Portal": "backgrounds/Portal_Background_dark.webp"
};
<script>
const bgSelect = document.getElementById("background-select");

// Load saved background
const saved = localStorage.getItem("cbn_background") || "End";
document.body.style.backgroundImage = `url('${window.BACKGROUNDS[saved]}')`;
bgSelect.value = saved;

bgSelect.addEventListener("change", () => {
  const choice = bgSelect.value;
  localStorage.setItem("cbn_background", choice);

  document.body.style.backgroundImage = `url('${window.BACKGROUNDS[choice]}')`;
});
</script>
