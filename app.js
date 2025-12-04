/* --- main.js --- */
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
0: "#ffffff", // background
1: "#ff0000", // red outline
2: "#ff6666" // inside
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
};