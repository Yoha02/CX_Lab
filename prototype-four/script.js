const views = [...document.querySelectorAll(".content-view")];
const navItems = [...document.querySelectorAll(".nav-item")];
const pageTitle = document.querySelector("#pageTitle");
const primaryAction = document.querySelector("#primaryAction");
const resetDemo = document.querySelector("#resetDemo");
const canvas = document.querySelector("#experimentCanvas");
const inspectorStatus = document.querySelector("#inspectorStatus");
const inspectorBody = document.querySelector("#inspectorBody");
const expandNodes = document.querySelector("#expandNodes");
const collapseNodes = document.querySelector("#collapseNodes");
const createExperiment = document.querySelector("#createExperiment");
const seedCall = document.querySelector("#seedCall");
const processCall = document.querySelector("#processCall");
const liveTranscript = document.querySelector("#liveTranscript");
const liveProfile = document.querySelector("#liveProfile");
const predictionBars = document.querySelector("#predictionBars");
const sentimentValue = document.querySelector("#sentimentValue");
const sentimentFill = document.querySelector("#sentimentFill");
const liveContainment = document.querySelector("#liveContainment");
const liveNps = document.querySelector("#liveNps");
const liveRisk = document.querySelector("#liveRisk");
const runDream = document.querySelector("#runDream");

const titles = {
  personas: "Persona experiment canvas",
  history: "Interaction history",
  live: "Live call workspace",
  pruning: "Call pruning review",
  dream: "Offline dream pass",
  analytics: "Advanced containment analytics"
};

const primaryLabels = {
  personas: "Generate 128 arms",
  history: "Start similar call",
  live: "Seed mock call",
  pruning: "Zoom out to canvas",
  dream: "Run dream pass",
  analytics: "Run next call"
};

const families = [
  { id: "policy", label: "Policy first", state: "pruned", score: "0.31", detail: "Explain shipping rules before rescue." },
  { id: "deadline", label: "Deadline first", state: "promoted", score: "0.91", detail: "Acknowledge event urgency first." },
  { id: "inventory", label: "Inventory first", state: "promoted", score: "0.88", detail: "Check replacement stock before policy." },
  { id: "refund", label: "Refund first", state: "preserved", score: "0.62", detail: "Offer fallback too early for VIP customers." },
  { id: "discount", label: "Discount first", state: "pruned", score: "0.38", detail: "Coupon does not solve birthday deadline." },
  { id: "empathy", label: "Empathy first", state: "preserved", score: "0.74", detail: "Improves sentiment but needs tool follow-up." },
  { id: "tool", label: "Tool preload", state: "promoted", score: "0.86", detail: "Preloads order and inventory lookups." },
  { id: "escalate", label: "Escalation guard", state: "preserved", score: "0.55", detail: "Escalates only after failed rescue." },
  { id: "translate", label: "Language signal", state: "promoted", score: "0.79", detail: "Captures Spanish frustration as sentiment evidence." },
  { id: "hybrid", label: "Hybrid rescue", state: "promoted", score: "0.83", detail: "Deadline + inventory + refund fallback." }
];

const childLabels = [
  "short opener", "warm opener", "tool before policy", "refund fallback", "courier option",
  "price protect", "loyalty mention", "confirm deadline", "manager guard", "NPS close"
];

const liveScript = [
  {
    speaker: "agent",
    text: "Thanks for calling. Is this Maya R. on the order ending 4471?",
    predictions: [["late delivery", 44], ["refund request", 24], ["tracking ask", 20], ["other", 12]],
    sentiment: ["neutral", "44%"],
    metrics: ["52%", "31", "42%"],
    identify: true
  },
  {
    speaker: "shopper",
    text: "Yes. My daughter's birthday is tomorrow and this still has not arrived.",
    predictions: [["deadline pressure", 51], ["cancel order", 27], ["asks guarantee", 14], ["thanks", 8]],
    sentiment: ["frustrated", "28%"],
    metrics: ["48%", "28", "48%"]
  },
  {
    speaker: "shopper",
    text: "No puedo seguir explicando esto. I need it fixed, not another policy answer.",
    predictions: [["cancel/refund threat", 55], ["human escalation", 19], ["replacement ask", 18], ["tracking ask", 8]],
    sentiment: ["angry", "16%"],
    metrics: ["41%", "24", "58%"],
    system: "Gemini Translate: I cannot keep explaining this. Signal: frustration spike + urgent family event."
  },
  {
    speaker: "agent",
    text: "I hear you. I am checking local replacement inventory before discussing refund policy.",
    predictions: [["accept replacement", 46], ["asks refund safety", 22], ["asks tracking", 20], ["cancel order", 12]],
    sentiment: ["recovering", "58%"],
    metrics: ["68%", "49", "24%"],
    system: "Tool preload: order lookup + local inventory + replacement shipping options."
  },
  {
    speaker: "agent",
    text: "There is one replacement nearby. I can reserve it with upgraded shipping, and keep the refund path open if it misses.",
    predictions: [["resolution accepted", 63], ["asks confirmation", 20], ["thanks agent", 12], ["recontact risk", 5]],
    sentiment: ["relieved", "82%"],
    metrics: ["81%", "68", "12%"]
  }
];

let expanded = false;
let activeView = "personas";
let liveIndex = 0;
let liveTimer = null;
let dreamIndex = 0;
let dreamTimer = null;

function switchView(view) {
  activeView = view;
  views.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  pageTitle.textContent = titles[view];
  primaryAction.textContent = primaryLabels[view];
}

function addEdge(x1, y1, x2, y2) {
  const edge = document.createElement("div");
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  edge.className = "canvas-edge";
  edge.style.left = `${x1}px`;
  edge.style.top = `${y1}px`;
  edge.style.width = `${length}px`;
  edge.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  canvas.appendChild(edge);
}

function addNode(node) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `exp-node ${node.kind || ""} ${node.state || ""}`;
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.dataset.nodeId = node.id;
  el.innerHTML = `<span>${node.type}</span><strong>${node.label}</strong><small>${node.meta}</small>`;
  el.addEventListener("click", () => {
    if (node.id === "root") {
      expanded = true;
      renderCanvas();
      return;
    }
    if (node.id === "policy") {
      switchView("history");
      return;
    }
    showInspector(node);
    document.querySelectorAll(".exp-node").forEach((item) => item.classList.remove("selected"));
    el.classList.add("selected");
  });
  canvas.appendChild(el);
}

function renderCanvas() {
  canvas.innerHTML = "";
  canvas.style.minWidth = "0";
  canvas.style.minHeight = expanded ? "940px" : "740px";
  const root = { id: "root", kind: "root", type: "Persona root", label: "Maya R.", meta: "late_delivery + urgent_event_deadline", x: 60, y: expanded ? 420 : 310 };
  addNode(root);
  families.forEach((family, index) => {
    const x = 330 + (index % 5) * 260;
    const y = 70 + Math.floor(index / 5) * (expanded ? 430 : 190);
    addEdge(280, (expanded ? 464 : 354), x, y + 44);
    addNode({ ...family, type: "strategy family", kind: "", x, y, meta: `${family.score} reward - click for detail` });
    if (expanded) {
      addEdge(x + 96, y + 92, x + 96, y + 126);
      childLabels.forEach((label, childIndex) => {
        const childX = x - 8 + (childIndex % 2) * 126;
        const childY = y + 126 + Math.floor(childIndex / 2) * 48;
        addNode({
          id: `${family.id}-${childIndex}`,
          type: "experiment",
          label,
          meta: childIndex % 3 === 0 ? "tested" : "candidate",
          state: family.state,
          kind: "child",
          x: childX,
          y: childY
        });
      });
    }
  });
  canvas.scrollLeft = 0;
  canvas.scrollTop = 0;
  showInspector(root);
}

function showInspector(node) {
  inspectorStatus.textContent = node.id === "root" ? "persona root" : node.state || "candidate";
  inspectorBody.innerHTML = `
    <div class="inspect-card">
      <strong>${node.label}</strong>
      <p>${node.detail || node.meta}</p>
    </div>
    <div class="inspect-card">
      <strong>Advanced containment</strong>
      <p>${node.id === "root" ? "128 generated arms across 10 strategy families." : `Reward score ${node.score || "simulated"} with state ${node.state || "candidate"}.`}</p>
    </div>
    <div class="inspect-card">
      <strong>Demo action</strong>
      <p>${node.id === "policy" ? "Opening this node shows Maya's previous call and pruning trace." : "Use the canvas to expand, compare, and create experiments."}</p>
    </div>
  `;
}

function renderPredictions(items) {
  predictionBars.innerHTML = "";
  items.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `<div class="bar-copy"><span>${label}</span><span>${value}%</span></div><div class="bar-track"><div class="bar-fill"></div></div>`;
    predictionBars.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector(".bar-fill").style.width = `${value}%`;
    });
  });
}

function identifyMaya() {
  liveProfile.classList.add("identified");
  liveProfile.innerHTML = `
    <div class="profile-hero">
      <span class="avatar large">MR</span>
      <h2>Maya R.</h2>
      <p>Matched from caller ID, order history, loyalty profile, and active late-delivery intent.</p>
    </div>
    <dl class="profile-grid">
      <div><dt>Mode</dt><dd>VIP parent</dd></div>
      <div><dt>Risk</dt><dd>High</dd></div>
      <div><dt>LTV</dt><dd>$2.4k</dd></div>
      <div><dt>Prior issue</dt><dd>Yes</dd></div>
    </dl>
    <div class="mini-card">
      <span>Loaded playbook</span>
      <strong>deadline_inventory_first_v1</strong>
      <p>Dream-updated branch selected for this urgent event journey.</p>
    </div>
  `;
}

function appendLiveTurn(turn) {
  if (turn.identify) identifyMaya();
  const item = document.createElement("article");
  item.className = `turn ${turn.speaker === "agent" ? "agent" : "shopper"}`;
  item.innerHTML = `<span>${turn.speaker}</span><p>${turn.text}</p>`;
  liveTranscript.appendChild(item);
  if (turn.system) {
    const system = document.createElement("article");
    system.className = "turn system";
    system.innerHTML = `<span>system signal</span><p>${turn.system}</p>`;
    liveTranscript.appendChild(system);
  }
  renderPredictions(turn.predictions);
  sentimentValue.textContent = turn.sentiment[0];
  sentimentFill.style.width = turn.sentiment[1];
  [liveContainment.textContent, liveNps.textContent, liveRisk.textContent] = turn.metrics;
}

function seedLiveCall() {
  clearInterval(liveTimer);
  liveTranscript.innerHTML = "";
  liveIndex = 0;
  appendLiveTurn(liveScript[liveIndex]);
  liveIndex += 1;
  liveTimer = setInterval(() => {
    if (liveIndex >= liveScript.length) {
      clearInterval(liveTimer);
      return;
    }
    appendLiveTurn(liveScript[liveIndex]);
    liveIndex += 1;
  }, 1200);
}

function runDreamPass() {
  const columns = [...document.querySelectorAll(".dream-column")];
  clearInterval(dreamTimer);
  dreamIndex = 0;
  columns.forEach((column) => column.classList.remove("active"));
  columns[0].classList.add("active");
  dreamTimer = setInterval(() => {
    dreamIndex += 1;
    if (dreamIndex >= columns.length) {
      columns.forEach((column) => column.classList.add("active"));
      clearInterval(dreamTimer);
      return;
    }
    columns.forEach((column, index) => column.classList.toggle("active", index === dreamIndex));
  }, 850);
}

navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
document.querySelectorAll("[data-view-target]").forEach((item) => item.addEventListener("click", () => switchView(item.dataset.viewTarget)));

primaryAction.addEventListener("click", () => {
  if (activeView === "personas") {
    expanded = true;
    renderCanvas();
  } else if (activeView === "history") {
    switchView("live");
  } else if (activeView === "live") {
    seedLiveCall();
  } else if (activeView === "pruning") {
    switchView("personas");
  } else if (activeView === "dream") {
    runDreamPass();
  } else if (activeView === "analytics") {
    switchView("live");
  }
});

resetDemo.addEventListener("click", () => {
  clearInterval(liveTimer);
  clearInterval(dreamTimer);
  expanded = false;
  liveTranscript.innerHTML = "";
  liveProfile.classList.remove("identified");
  liveProfile.innerHTML = `<div class="empty-profile"><span>Awaiting caller identification</span><p>LiveKit audio is simulated here. Persona will populate after greeting.</p></div>`;
  renderPredictions([["late delivery", 44], ["refund request", 24], ["tracking ask", 20], ["other", 12]]);
  switchView("personas");
  renderCanvas();
});

expandNodes.addEventListener("click", () => {
  expanded = true;
  renderCanvas();
});

collapseNodes.addEventListener("click", () => {
  expanded = false;
  renderCanvas();
});

createExperiment.addEventListener("click", () => {
  expanded = true;
  renderCanvas();
  showInspector({
    id: "new",
    label: "New challenger arm",
    state: "candidate",
    score: "pending",
    detail: "A blank experiment arm would be created here for this persona-intent cluster."
  });
});

seedCall.addEventListener("click", seedLiveCall);
processCall.addEventListener("click", () => switchView("pruning"));
runDream.addEventListener("click", runDreamPass);

renderCanvas();
renderPredictions([["late delivery", 44], ["refund request", 24], ["tracking ask", 20], ["other", 12]]);
