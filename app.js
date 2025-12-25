const COLORS = [
  { name: "Weiß",   bg: "#ffffff", fg: "#111111" },
  { name: "Schwarz",bg: "#111111", fg: "#ffffff" },
  { name: "Grau",   bg: "#6b7280", fg: "#ffffff" },
  { name: "Silber", bg: "#c0c0c0", fg: "#111111" },
  { name: "Blau",   bg: "#2563eb", fg: "#ffffff" },
  { name: "Rot",    bg: "#ef4444", fg: "#ffffff" },
  { name: "Grün",   bg: "#16a34a", fg: "#ffffff" },
  { name: "Gelb",   bg: "#fde047", fg: "#111111" },
  { name: "Orange", bg: "#fb923c", fg: "#111111" },
  { name: "Braun",  bg: "#7c3f2a", fg: "#ffffff" }
];

const STORAGE_KEY = "carColorCounts.v1";
const HISTORY_KEY = "carColorHistory.v1";

let counts = {};
let history = [];

function loadState(){
  try{
    counts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  }catch{
    counts = {};
    history = [];
  }
  for(const c of COLORS){
    if(typeof counts[c.name] !== "number") counts[c.name] = 0;
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function total(){
  return Object.values(counts).reduce((a,b)=>a+b,0);
}

function pct(n){
  const t = total();
  if(t === 0) return 0;
  return (n / t) * 100;
}

function renderButtons(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  COLORS.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "colorBtn";
    btn.type = "button";
    btn.style.background = c.bg;
    btn.style.color = c.fg;

    const left = document.createElement("span");
    left.textContent = c.name;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = counts[c.name] ?? 0;

    btn.appendChild(left);
    btn.appendChild(badge);

    btn.addEventListener("click", () => {
      counts[c.name] = (counts[c.name] ?? 0) + 1;
      history.push(c.name);
      saveState();
      rerender();
      // kleine haptische Rückmeldung (wenn verfügbar)
      if (navigator.vibrate) navigator.vibrate(10);
    });

    grid.appendChild(btn);
  });
}

function renderStats(){
  const t = total();
  document.getElementById("totalChip").textContent  = `Gesamt: ${t}`;
  document.getElementById("totalChip2").textContent = `Gesamt: ${t}`;

  const sorted = [...COLORS].sort((a,b)=>(counts[b.name]??0)-(counts[a.name]??0));
  const top3 = sorted.slice(0,3);

  const top3El = document.getElementById("top3");
  top3El.innerHTML = "";

  if(t === 0){
    const p = document.createElement("p");
    p.className = "small";
    p.textContent = "Noch keine Autos gezählt 🙂";
    top3El.appendChild(p);
  }else{
    top3.forEach((c, idx) => {
      const card = document.createElement("div");
      card.className = "topCard";
      card.style.background = c.bg;
      card.style.color = c.fg;

      const rank = document.createElement("div");
      rank.className = "rank";
      rank.textContent = `#${idx+1}`;

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = c.name;

      const n = counts[c.name] ?? 0;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${n} Autos • ${pct(n).toFixed(1)}%`;

      card.appendChild(rank);
      card.appendChild(name);
      card.appendChild(meta);
      top3El.appendChild(card);
    });
  }

  const list = document.getElementById("list");
  list.innerHTML = "";
  sorted.forEach(c => {
    const n = counts[c.name] ?? 0;

    const row = document.createElement("div");
    row.className = "row";

    const left = document.createElement("div");
    left.className = "left";

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.background = c.bg;

    const labelWrap = document.createElement("div");
    const label = document.createElement("div");
    label.style.fontWeight = "1000";
    label.textContent = c.name;
    const sub = document.createElement("div");
    sub.className = "small";
    sub.textContent = `${pct(n).toFixed(1)}%`;

    labelWrap.appendChild(label);
    labelWrap.appendChild(sub);

    left.appendChild(dot);
    left.appendChild(labelWrap);

    const right = document.createElement("div");
    right.style.fontWeight = "1000";
    right.style.fontSize = "18px";
    right.textContent = String(n);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  });
}

function rerender(){
  renderButtons();
  renderStats();
}

function setupTabs(){
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const id = btn.dataset.tab;
      document.getElementById(id).classList.add("active");

      document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t === btn ? "true" : "false"));
    });
  });
}

function setupActions(){
  document.getElementById("undoBtn").addEventListener("click", () => {
    if(history.length === 0) return;
    const last = history.pop();
    if(typeof counts[last] === "number" && counts[last] > 0) counts[last] -= 1;
    saveState();
    rerender();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    const ok = confirm("Alles zurücksetzen? Alle gezählten Autos werden auf 0 gesetzt.");
    if(!ok) return;
    for(const c of COLORS) counts[c.name] = 0;
    history = [];
    saveState();
    rerender();
  });
}

// Service Worker registrieren (offline)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

loadState();
setupTabs();
setupActions();
rerender();
