const API_KEY = "AIzaSyDHkLh2vGgxUJpVo11o1kKqtH1DQ5Toeu4";
const CHANNEL_ID = "UCwgc-ODtpi4OKxnbYGmyTig";

const RECENT_VIDEOS = 24;

let allVideos = [];
let filteredVideos = [];
let currentVideoIndex = 0;

let player;

window.onload = function(){

startApp();

};

async function startApp(){

await fetchRecentVideos();

loadContinueWatching();

loadSubscribeButton();

}

async function getUploadsPlaylist(){

const url =
`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;

const response = await fetch(url);

const data = await response.json();

return data.items[0]
.contentDetails
.relatedPlaylists
.uploads;

}

async function fetchRecentVideos(){

showLoading(true);

try{

const uploads =
await getUploadsPlaylist();

const url =
`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploads}&maxResults=${RECENT_VIDEOS}&key=${API_KEY}`;

const response = await fetch(url);

const data = await response.json();

allVideos = data.items;

filteredVideos = allVideos;

renderVideos(filteredVideos);

if(filteredVideos.length > 0){

setupHero(filteredVideos[0]);

}

showLoading(false);

}catch(error){

console.error(error);

alert("Erro ao carregar vídeos");

showLoading(false);

}

}

function renderVideos(videos){

const grid =
document.getElementById("videoGrid");

grid.innerHTML = "";

videos.forEach((video,index)=>{

grid.innerHTML += createCard(video,index);

});

}

function createCard(video,index){

const videoId =
video.snippet.resourceId
? video.snippet.resourceId.videoId
: video.id.videoId;

return `

<div
class="video-card"
onclick="playVideo(${index})"
>

<img
loading="lazy"
src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg"
>

<div class="video-info">

<h3>
${video.snippet.title}
</h3>

</div>

</div>

`;

}

function setupHero(video){

const videoId =
video.snippet.resourceId
? video.snippet.resourceId.videoId
: video.id.videoId;

document.getElementById("hero").style.backgroundImage =
`url(https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg)`;

document.getElementById("heroTitle").innerText =
video.snippet.title;

document.getElementById("heroDescription").innerText =
video.snippet.description;

}

function onYouTubeIframeAPIReady(){

player = new YT.Player("player",{

height:"100%",
width:"100%",

playerVars:{
autoplay:1,
rel:0
},

events:{
onStateChange:onPlayerStateChange
}

});

}

function playVideo(index){

currentVideoIndex = index;

const video =
filteredVideos[index];

const videoId =
video.snippet.resourceId
? video.snippet.resourceId.videoId
: video.id.videoId;

player.loadVideoById(videoId);

setupHero(video);

saveContinueWatching(video);

window.scrollTo({
top:0,
behavior:"smooth"
});

}

function playCurrentVideo(){

playVideo(currentVideoIndex);

}

function onPlayerStateChange(event){

if(event.data === 0){

currentVideoIndex++;

if(currentVideoIndex >= filteredVideos.length){

currentVideoIndex = 0;

}

playVideo(currentVideoIndex);

}

}

async function searchVideos(){

const term =
document.getElementById("searchInput")
.value
.trim();

if(term === ""){

filteredVideos = allVideos;

renderVideos(filteredVideos);

document.getElementById("catalogTitle").innerText =
"Vídeos Recentes";

return;

}

showLoading(true);

try{

const url =
`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${CHANNEL_ID}&maxResults=50&q=${encodeURIComponent(term)}&key=${API_KEY}`;

const response = await fetch(url);

const data = await response.json();

filteredVideos = data.items;

renderVideos(filteredVideos);

document.getElementById("catalogTitle").innerText =
`Resultados para "${term}"`;

}catch(error){

console.error(error);

alert("Erro na pesquisa");

}

showLoading(false);

}

function clearSearch(){

document.getElementById("searchInput").value =
"";

filteredVideos = allVideos;

renderVideos(filteredVideos);

document.getElementById("catalogTitle").innerText =
"Vídeos Recentes";

}

function loadSubscribeButton(){

document.getElementById("subscribeBtn").href =
`https://youtube.com/channel/${CHANNEL_ID}`;

}

function addFavorite(){

const current =
filteredVideos[currentVideoIndex];

let favorites =
JSON.parse(
localStorage.getItem("favorites")
) || [];

const currentId =
current.snippet.resourceId
? current.snippet.resourceId.videoId
: current.id.videoId;

const exists =
favorites.find(video=>{

const id =
video.snippet.resourceId
? video.snippet.resourceId.videoId
: video.id.videoId;

return id === currentId;

});

if(!exists){

favorites.unshift(current);

localStorage.setItem(
"favorites",
JSON.stringify(favorites)
);

alert("Favoritado");

}

}

function showFavorites(){

const favorites =
JSON.parse(
localStorage.getItem("favorites")
) || [];

filteredVideos = favorites;

renderVideos(filteredVideos);

document.getElementById("catalogTitle").innerText =
"Favoritos";

}

function showAllVideos(){

filteredVideos = allVideos;

renderVideos(filteredVideos);

document.getElementById("catalogTitle").innerText =
"Vídeos Recentes";

}

function saveContinueWatching(video){

let continueList =
JSON.parse(
localStorage.getItem("continueWatching")
) || [];

const currentId =
video.snippet.resourceId
? video.snippet.resourceId.videoId
: video.id.videoId;

continueList =
continueList.filter(v=>{

const id =
v.snippet.resourceId
? v.snippet.resourceId.videoId
: v.id.videoId;

return id !== currentId;

});

continueList.unshift(video);

continueList = continueList.slice(0,15);

localStorage.setItem(
"continueWatching",
JSON.stringify(continueList)
);

loadContinueWatching();

}

function loadContinueWatching(){

const container =
document.getElementById("continueWatching");

container.innerHTML = "";

const continueList =
JSON.parse(
localStorage.getItem("continueWatching")
) || [];

continueList.forEach((video,index)=>{

container.innerHTML +=
createCard(video,index);

});

}

function showLoading(show){

document.getElementById("loading").style.display =
show ? "flex" : "none";

}
