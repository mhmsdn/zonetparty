const matches=[
 {name:"Alex",score:94,initial:"A",meta:"Valorant • Diamond • EU",tags:["Competitive","Voice ON","Evening"],reason:"Same rank, region and schedule. Similar communication style."},
 {name:"Sam",score:89,initial:"S",meta:"Minecraft • PC • EU",tags:["Casual","Weekend","Voice ON"],reason:"Shared interests and overlapping free time."},
 {name:"Daniel",score:86,initial:"D",meta:"CS2 • Faceit • EU",tags:["Competitive","Night","Voice ON"],reason:"Compatible gaming style and communication preferences."}
];
const games=[
 ["Valorant","PC • Console"],["Fortnite","PC • Console • Mobile"],["Minecraft","Java • Bedrock"],
 ["CS2","PC"],["GTA Online","PC • Console"],["Roblox","Cross-platform"],["Apex Legends","PC • Console"],["Overwatch 2","PC • Console"],["Rocket League","Cross-platform"]
];
const zones=[
 ["♡","Date Zone","Find a compatible relationship partner","date"],
 ["♧","Friend Zone","Find people who fit your vibe","friend"],
 ["◈","Game Zone","Find your perfect gaming partner","game"],
 ["⌁","Study Zone","Find a study partner","study"],
 ["◇","Pro Zone","Build your professional network","pro"],
 ["✦","Create Zone","Find collaborators for ideas and projects","create"]
];
function shell(content){document.getElementById("screen").innerHTML=`<div class="content">${content}</div>`;bind();}
function home(){
 shell(`<div class="eyebrow">Welcome to ZonetParty</div><h1 class="title">Find your people.</h1><p class="muted">AI-powered matching based on what you choose to share.</p>
 <div class="hero"><h2>3 new potential matches</h2><p class="muted">Your strongest match is waiting in Game Zone.</p><button class="primary" data-go="match">View Matches</button></div>
 <div class="section-title"><h2>Explore Zones</h2></div><div class="zones">${zones.map(z=>`<button class="zone" data-zone="${z[3]}"><span class="emoji">${z[0]}</span><h3>${z[1]}</h3><p>${z[2]}</p></button>`).join("")}</div>
 <div class="section-title"><h2>Why ZonetParty?</h2></div><div class="card"><b>Consent first.</b><p class="reason">You control what is used for matching. A connection becomes a chat only after mutual consent.</p></div>`);
}
function match(){
 shell(`<div class="eyebrow">Match Zone</div><h1 class="title">Your people.</h1><p class="muted">Choose a Zone, then discover compatible people.</p><div class="filter-row">${zones.map(z=>`<button class="filter" data-zone="${z[3]}">${z[0]} ${z[1]}</button>`).join("")}</div>
 <div class="section-title"><h2>Recommended</h2><span class="muted">AI compatibility</span></div><div class="cards">${matches.map(m=>card(m)).join("")}</div>`);
}
function card(m){return `<div class="card"><div class="match-head"><div class="person"><div class="avatar">${m.initial}</div><div><b>${m.name}</b><div class="muted" style="font-size:12px;margin-top:3px">${m.meta}</div></div></div><div class="score">${m.score}%</div></div><div style="margin-top:10px">${m.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div><p class="reason">${m.reason}</p><button class="primary" data-request="${m.name}">Request Match</button></div>`}
function game(){
 shell(`<div class="eyebrow">Game Zone</div><h1 class="title">Find your duo.</h1><p class="muted">Search a game and match by game + human compatibility.</p><input class="search" id="gameSearch" placeholder="Search any game..."><div class="filter-row"><button class="filter">EU</button><button class="filter">PC</button><button class="filter">Voice ON</button><button class="filter">Competitive</button><button class="filter">Evening</button></div><div class="section-title"><h2>Popular Games</h2></div><div class="game-list" id="gameList">${games.map(g=>`<button class="game" data-game="${g[0].toLowerCase()}"><strong>🎮 ${g[0]}</strong><small>${g[1]}</small></button>`).join("")}</div><div class="section-title"><h2>Top Gaming Match</h2></div>${card(matches[0])}`);
}
function chat(){shell(`<div class="eyebrow">Chat Zone</div><h1 class="title">Your connections.</h1><p class="muted">Only mutual matches appear here.</p><div class="cards"><div class="card"><div class="person"><div class="avatar">A</div><div><b>Alex</b><div class="muted">Game Zone • Valorant</div></div></div><p class="reason">“Ready for a duo tonight?”</p><button class="primary" data-toast="Chat opened">Open Chat</button></div><div class="empty">No other mutual matches yet.<br>Find more people in Match Zone.</div></div>`)}
function profile(){shell(`<div class="eyebrow">My Zone</div><h1 class="title">Your profile.</h1><div class="profile-row"><div class="large-avatar">M</div><div><b>My ZonetParty Profile</b><div class="muted">Control what you share.</div></div></div><div class="section-title"><h2>Privacy & preferences</h2></div><div class="card"><div class="setting"><span>Use interests for matching</span><b>ON</b></div><div class="setting"><span>Use availability</span><b>ON</b></div><div class="setting"><span>Show gaming profile</span><b>ON</b></div><div class="setting"><span>Chat requires mutual consent</span><b>ON</b></div></div><button class="secondary" data-toast="Profile settings saved">Save changes</button>`)}
function bind(){
 document.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>navigate(x.dataset.go));
 document.querySelectorAll("[data-zone]").forEach(x=>x.onclick=()=>{ if(x.dataset.zone==="game") navigate("game"); else navigate("match");});
 document.querySelectorAll("[data-request]").forEach(x=>x.onclick=()=>toast(`Match request sent to ${x.dataset.request}`));
 document.querySelectorAll("[data-toast]").forEach(x=>x.onclick=()=>toast(x.dataset.toast));
 const search=document.getElementById("gameSearch");
 if(search) search.oninput=()=>{const q=search.value.toLowerCase();document.querySelectorAll("#gameList .game").forEach(x=>x.style.display=x.dataset.game.includes(q)?"block":"none")};
 document.querySelectorAll(".nav-item").forEach(x=>x.onclick=()=>navigate(x.dataset.screen));
}
function navigate(s){document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.screen===s));({home,match,game,chat,profile}[s]||home)();}
function toast(t){const x=document.createElement("div");x.className="toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2200)}
navigate("home");
