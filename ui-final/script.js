const views = [...document.querySelectorAll(".content-view")];
const navItems = [...document.querySelectorAll(".nav-item")];
const pageTitle = document.querySelector("#pageTitle");
const primaryAction = document.querySelector("#primaryAction");
const resetDemo = document.querySelector("#resetDemo");
const brandMark = document.querySelector("#brandMark");
const navCollapse = document.querySelector("#navCollapse");
const collapseArrows = navCollapse.querySelector(".collapse-arrows");
const collapseLabel = navCollapse.querySelector("strong");
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
const historyTabs = [...document.querySelectorAll(".history-tab")];
const historyPanels = [...document.querySelectorAll(".history-panel")];
const historyCanvas = document.querySelector("#historyExperimentCanvas");

const API_BASE = "http://127.0.0.1:8000";
const demoState = {
  apiOnline: false,
  goldenSeed: null,
  activeCall: "baseline",
  currentResult: null,
  currentRunSaved: false,
  dreamClusters: [],
  playbooks: [],
  promoted: false,
  lastApiError: null
};

const apiBadge = document.createElement("span");
apiBadge.className = "api-badge";
apiBadge.textContent = "API checking";
pageTitle.insertAdjacentElement("afterend", apiBadge);

const titles = {
  home: "Home",
  personas: "Persona experiment planning",
  history: "Interaction history",
  live: "Live call workspace",
  pruning: "Call pruning review",
  dream: "Offline dream pass",
  analytics: "Advanced containment analytics"
};

const primaryLabels = {
  home: "Open canvas",
  personas: "Generate draft arms",
  history: "Start similar call",
  live: "Seed mock call",
  pruning: "Zoom out to canvas",
  dream: "Run dream pass",
  analytics: "Run next call"
};

const families = [
  { id: "policy", label: "Policy contrast", state: "", detail: "Draft a baseline branch that explains shipping policy after rescue options are checked." },
  { id: "deadline", label: "Deadline first", state: "", detail: "Test whether acknowledging the event deadline lowers frustration before tool use." },
  { id: "inventory", label: "Inventory first", state: "", detail: "Test local replacement lookup before any refund or policy language." },
  { id: "refund", label: "Refund safety", state: "", detail: "Test refund fallback timing after replacement options are offered." },
  { id: "discount", label: "Value recovery", state: "", detail: "Test whether price protection helps value-sensitive callers without hiding resolution." },
  { id: "empathy", label: "Empathy opener", state: "", detail: "Test emotional acknowledgement depth before transactional recovery." },
  { id: "tool", label: "Tool preload", state: "", detail: "Test order, inventory, and courier lookup before the agent speaks again." },
  { id: "escalate", label: "Escalation guard", state: "", detail: "Test when to preserve human handoff without inviting escalation too early." },
  { id: "translate", label: "Language signal", state: "", detail: "Test cross-language frustration detection during urgent-event calls." },
  { id: "hybrid", label: "Hybrid rescue", state: "", detail: "Test deadline acknowledgement plus inventory lookup plus refund safety." }
];

const childLabels = [
  "short opener", "warm opener", "tool before policy", "refund fallback", "courier option",
  "price protect", "loyalty mention", "confirm deadline", "manager guard", "NPS close"
];

const historyFamilyOrder = ["deadline", "inventory", "policy", "refund", "discount", "empathy", "tool", "escalate", "translate", "hybrid"];
const historyChildLabels = [
  "Maya R.", "Alex T.", "Jordan K.", "birthday gift", "cancel threat",
  "refund ask", "sentiment drop", "translation spike", "human handoff", "low NPS"
];

const baselineScript = [
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
    text: "My daughter's birthday is tomorrow and the tracking says the package has not even shipped yet.",
    predictions: [["shipping complaint", 62], ["refund status", 18], ["escalate request", 12], ["cancel/refund", 8]],
    sentiment: ["frustrated", "28%"],
    metrics: ["48%", "28", "48%"]
  },
  {
    speaker: "agent",
    text: "I understand your frustration. According to our policy, standard shipping takes three to five business days.",
    predictions: [["cancel/refund threat", 45], ["human escalation", 23], ["tracking ask", 18], ["accept", 14]],
    sentiment: ["worsening", "18%"],
    metrics: ["34%", "25", "66%"],
    system: "Policy-first branch selected. Tool missed: replacement_inventory_lookup."
  },
  {
    speaker: "shopper",
    text: "Eso no me ayuda. Es para el cumpleaños de mi hija mañana. Can I just cancel or get a refund?",
    predictions: [["cancel/refund threat", 55], ["human escalation", 19], ["replacement ask", 18], ["tracking ask", 8]],
    sentiment: ["angry", "12%"],
    metrics: ["19%", "24", "81%"],
    system: "Gemini Translate: That does not help me. It is for my daughter's birthday tomorrow. Signal: frustration spike + urgent family event."
  }
];

const successScript = [
  {
    speaker: "agent",
    text: "Thanks for calling. Is this Sam P. on the order ending 8832?",
    predictions: [["late delivery", 48], ["deadline pressure", 24], ["refund request", 16], ["other", 12]],
    sentiment: ["neutral", "48%"],
    metrics: ["57%", "39", "34%"],
    identify: "sam"
  },
  {
    speaker: "shopper",
    text: "This gift is for my son's party tomorrow and the tracking has not moved.",
    predictions: [["accept replacement", 38], ["asks confirmation", 25], ["cancel/refund threat", 19], ["human escalation", 18]],
    sentiment: ["anxious", "34%"],
    metrics: ["59%", "42", "31%"]
  },
  {
    speaker: "agent",
    text: "I see the party deadline. Before I talk policy, I am checking local replacement inventory and courier options now.",
    predictions: [["accept replacement", 63], ["asks confirmation", 20], ["thanks agent", 12], ["recontact risk", 5]],
    sentiment: ["recovering", "62%"],
    metrics: ["76%", "61", "20%"],
    system: "Gen 3 playbook active. Tool preload: replacement_inventory_lookup + local_courier_quote."
  },
  {
    speaker: "shopper",
    text: "Okay, if you can actually reserve one locally, that would solve it.",
    predictions: [["resolution accepted", 72], ["asks confirmation", 16], ["thanks agent", 9], ["refund", 3]],
    sentiment: ["relieved", "82%"],
    metrics: ["88%", "72", "14%"]
  },
  {
    speaker: "agent",
    text: "I found one in the local warehouse and can reserve it for courier delivery. If anything misses, your refund path stays open.",
    predictions: [["resolution accepted", 63], ["asks confirmation", 20], ["thanks agent", 12], ["recontact risk", 5]],
    sentiment: ["relieved", "82%"],
    metrics: ["91%", "72", "18%"]
  }
];

let expanded = false;
let selectedNodeId = "root";
const expandedFamilies = new Set();
const historyExpandedFamilies = new Set(["policy"]);
let activeView = "home";
let liveIndex = 0;
let liveTimer = null;
let dreamIndex = 0;
let dreamTimer = null;

function setNavCollapsed(collapsed) {
  document.body.classList.toggle("nav-collapsed", collapsed);
  brandMark.textContent = collapsed ? "CXL" : "CX LAB";
  navCollapse.setAttribute("aria-expanded", String(!collapsed));
  collapseArrows.textContent = collapsed ? ">>" : "<<";
  collapseLabel.textContent = collapsed ? "Show nav" : "Hide nav";
  refreshPersonaCanvasLayout();
}

function switchView(view) {
  activeView = view;
  document.body.dataset.view = view;
  views.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  pageTitle.textContent = titles[view];
  primaryAction.textContent = primaryLabels[view];
  if (view === "history") {
    switchHistoryTab("runs");
  }
  if (view === "personas") {
    refreshPersonaCanvasLayout();
  }
}

function switchHistoryTab(tab) {
  historyTabs.forEach((item) => item.classList.toggle("active", item.dataset.historyTab === tab));
  historyPanels.forEach((item) => item.classList.toggle("active", item.dataset.historyPanel === tab));
  if (tab === "runs") {
    refreshHistoryCanvasLayout();
  }
}

function refreshPersonaCanvasLayout() {
  if (activeView !== "personas") return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => renderCanvas({ preserveInspector: true }));
  });
  window.setTimeout(() => {
    if (activeView === "personas") {
      renderCanvas({ preserveInspector: true });
    }
  }, 260);
}

function refreshHistoryCanvasLayout() {
  if (activeView !== "history" || !historyCanvas) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(renderHistoryCanvas);
  });
  window.setTimeout(() => {
    if (activeView === "history") {
      renderHistoryCanvas();
    }
  }, 260);
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

function addHistoryEdge(x1, y1, x2, y2) {
  const edge = document.createElement("div");
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  edge.className = "canvas-edge";
  edge.style.left = `${x1}px`;
  edge.style.top = `${y1}px`;
  edge.style.width = `${length}px`;
  edge.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  historyCanvas.appendChild(edge);
}

function addHistoryNode(node) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `exp-node ${node.kind || ""} ${node.state || ""}`;
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.dataset.historyNodeId = node.id;
  el.innerHTML = `<span>${node.type}</span><strong>${node.label}</strong><small>${node.meta}</small>`;
  if (node.selected) {
    el.addEventListener("click", () => switchHistoryTab("details"));
  } else if (node.kind !== "child" && node.id !== "history-root") {
    el.addEventListener("click", () => {
      if (historyExpandedFamilies.has(node.id)) {
        historyExpandedFamilies.delete(node.id);
      } else {
        historyExpandedFamilies.add(node.id);
      }
      renderHistoryCanvas();
    });
  }
  historyCanvas.appendChild(el);
}

function addNode(node) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `exp-node ${node.kind || ""} ${node.state || ""}`;
  if (node.id === selectedNodeId) {
    el.classList.add("selected");
  }
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.dataset.nodeId = node.id;
  el.innerHTML = `<span>${node.type}</span><strong>${node.label}</strong><small>${node.meta}</small>`;
  el.addEventListener("click", () => {
    if (node.id === "root") {
      selectedNodeId = "root";
      expanded = true;
      expandedFamilies.clear();
      renderCanvas();
      return;
    }
    selectedNodeId = node.id;
    if (node.kind !== "child") {
      if (expanded) {
        expanded = false;
        families.forEach((family) => expandedFamilies.add(family.id));
      }
      if (expandedFamilies.has(node.id)) {
        expandedFamilies.delete(node.id);
      } else {
        expandedFamilies.add(node.id);
      }
      renderCanvas({ preserveInspector: true });
    }
    showInspector(node);
    document.querySelectorAll(".exp-node").forEach((item) => item.classList.remove("selected"));
    document.querySelector(`[data-node-id="${node.id}"]`)?.classList.add("selected");
  });
  canvas.appendChild(el);
}

function renderCanvas(options = {}) {
  canvas.innerHTML = "";
  canvas.style.minWidth = "0";
  const hasOpenFamilies = expanded || expandedFamilies.size > 0;
  const columns = 5;
  const familyStartX = 60;
  const familyGapX = 260;
  const familyWidth = 190;
  const rootWidth = 220;
  const treeLeft = familyStartX;
  const treeRight = familyStartX + (columns - 1) * familyGapX + familyWidth;
  const treeCenter = Math.round((treeLeft + treeRight) / 2);
  const contentWidth = treeCenter * 2;
  const root = {
    id: "root",
    kind: "root",
    type: "Persona root",
    label: "VIP parent",
    meta: "urgent_event_deadline + high_loyalty",
    x: treeCenter - Math.round(rootWidth / 2),
    y: 52
  };
  const rowHasOpenFamily = [0, 1].map((row) => {
    const rowFamilies = families.slice(row * columns, row * columns + columns);
    return rowFamilies.some((family) => expanded || expandedFamilies.has(family.id));
  });
  const rowY = [230, 230 + (rowHasOpenFamily[0] ? 430 : 188)];
  const contentHeight = rowY[1] + (rowHasOpenFamily[1] ? 460 : 210);
  canvas.style.minHeight = `${contentHeight}px`;
  addNode(root);
  families.forEach((family, index) => {
    const row = Math.floor(index / columns);
    const x = familyStartX + (index % columns) * familyGapX;
    const y = rowY[row];
    const familyOpen = expanded || expandedFamilies.has(family.id);
    addEdge(root.x + 110, root.y + 90, x + 95, y);
    addNode({ ...family, type: "strategy family", kind: "", x, y, meta: familyOpen ? "expanded - 10 draft experiments" : "draft family - awaiting calls" });
    if (familyOpen) {
      addEdge(x + 96, y + 92, x + 96, y + 126);
      childLabels.forEach((label, childIndex) => {
        const childX = x - 8 + (childIndex % 2) * 126;
        const childY = y + 126 + Math.floor(childIndex / 2) * 48;
        addNode({
          id: `${family.id}-${childIndex}`,
          type: "experiment",
          label,
          meta: childIndex % 3 === 0 ? "drafted" : "candidate",
          state: family.state,
          kind: "child",
          x: childX,
          y: childY
        });
      });
    }
  });
  const spacer = document.createElement("div");
  spacer.className = "canvas-spacer";
  spacer.style.left = `${contentWidth}px`;
  spacer.style.top = `${contentHeight}px`;
  canvas.appendChild(spacer);
  const targetScrollLeft = Math.max(0, Math.round(treeCenter - (canvas.clientWidth / 2)));
  canvas.scrollLeft = targetScrollLeft;
  canvas.scrollTop = 0;
  requestAnimationFrame(() => {
    canvas.scrollLeft = targetScrollLeft;
    canvas.scrollTop = 0;
  });
  if (!options.preserveInspector) {
    selectedNodeId = "root";
    showInspector(root);
  }
}

function renderHistoryCanvas() {
  if (!historyCanvas) return;
  historyCanvas.innerHTML = "";
  historyCanvas.style.minWidth = "0";

  const orderedFamilies = historyFamilyOrder
    .map((id) => families.find((family) => family.id === id))
    .filter(Boolean);
  const columns = 5;
  const familyStartX = 60;
  const familyGapX = 260;
  const familyWidth = 190;
  const rootWidth = 220;
  const treeLeft = familyStartX;
  const treeRight = familyStartX + (columns - 1) * familyGapX + familyWidth;
  const treeCenter = Math.round((treeLeft + treeRight) / 2);
  const contentWidth = treeCenter * 2;
  const root = {
    id: "history-root",
    kind: "root",
    state: "history-active",
    type: "Persona root",
    label: "VIP parent",
    meta: "36 active late-delivery runs",
    x: treeCenter - Math.round(rootWidth / 2),
    y: 44
  };
  const rowHasOpenFamily = [0, 1].map((row) => {
    const rowFamilies = orderedFamilies.slice(row * columns, row * columns + columns);
    return rowFamilies.some((family) => historyExpandedFamilies.has(family.id));
  });
  const rowY = [214, 214 + (rowHasOpenFamily[0] ? 430 : 188)];
  const contentHeight = rowY[1] + (rowHasOpenFamily[1] ? 460 : 210);

  historyCanvas.style.minHeight = `${contentHeight}px`;
  addHistoryNode(root);

  orderedFamilies.forEach((family, index) => {
    const row = Math.floor(index / columns);
    const x = familyStartX + (index % columns) * familyGapX;
    const y = rowY[row];
    const isPolicy = family.id === "policy";
    const familyOpen = historyExpandedFamilies.has(family.id);
    addHistoryEdge(root.x + 110, root.y + 90, x + 95, y);
    addHistoryNode({
      ...family,
      type: "strategy family",
      state: isPolicy ? "history-failed" : "history-active",
      x,
      y,
      meta: familyOpen ? "expanded - active runs" : "collapsed - active runs"
    });
    if (familyOpen) {
      addHistoryEdge(x + 96, y + 92, x + 96, y + 126);
      historyChildLabels.forEach((label, childIndex) => {
        const childX = x - 8 + (childIndex % 2) * 126;
        const childY = y + 126 + Math.floor(childIndex / 2) * 48;
        const selected = family.id === "policy" && childIndex === 0;
        addHistoryNode({
          id: `${family.id}-${childIndex}`,
          type: "active run",
          label,
          meta: selected ? "selected run" : "scored",
          state: selected ? "history-selected" : "history-active",
          kind: "child",
          selected,
          x: childX,
          y: childY
        });
      });
    }
  });

  const spacer = document.createElement("div");
  spacer.className = "canvas-spacer";
  spacer.style.left = `${contentWidth}px`;
  spacer.style.top = `${contentHeight}px`;
  historyCanvas.appendChild(spacer);

  const selectedNodeCenter = familyStartX + 2 * familyGapX - 8 + 58;
  const targetScrollLeft = Math.max(0, Math.round(selectedNodeCenter - (historyCanvas.clientWidth / 2)));
  historyCanvas.scrollLeft = targetScrollLeft;
  historyCanvas.scrollTop = 0;
  requestAnimationFrame(() => {
    historyCanvas.scrollLeft = targetScrollLeft;
    historyCanvas.scrollTop = 0;
  });
}

function showInspector(node) {
  const nodeStatus = node.id === "root" ? "planning root" : node.kind === "child" ? "draft experiment" : "strategy family";
  const designCopy = node.id === "root"
    ? "128 draft arms across 10 strategy families. No outcomes have been collected yet."
    : node.kind === "child"
      ? "This arm is queued for future calls, replay simulations, or holdout evaluation."
      : "This family can be expanded into 10 draft experiment arms before calls are run.";
  inspectorStatus.textContent = nodeStatus;
  inspectorBody.innerHTML = `
    <div class="inspect-card">
      <strong>${node.label}</strong>
      <p>${node.detail || node.meta}</p>
    </div>
    <div class="inspect-card">
      <strong>Pre-run design</strong>
      <p>${designCopy}</p>
    </div>
    <div class="inspect-card">
      <strong>Next step</strong>
      <p>Run the arm through live calls or simulations, then move observed outcomes into History for scoring and pruning.</p>
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

function setApiBadge(status, copy) {
  apiBadge.className = `api-badge ${status}`;
  apiBadge.textContent = copy;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} ${response.status}: ${body}`);
  }
  return response.json();
}

async function hydrateApiState() {
  try {
    await apiFetch("/api/health");
    demoState.goldenSeed = await apiFetch("/api/demo/golden-seed");
    demoState.playbooks = await apiFetch("/api/playbooks").catch(() => []);
    demoState.apiOnline = true;
    demoState.lastApiError = null;
    setApiBadge("online", "API live");
  } catch (error) {
    demoState.apiOnline = false;
    demoState.lastApiError = error;
    setApiBadge("offline", "API fallback");
    console.warn("[ui-final] API unavailable; using local demo state", error);
  }
}

async function callTranslationProbe(text) {
  if (!demoState.apiOnline) return null;
  try {
    return await apiFetch("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text })
    });
  } catch (error) {
    console.warn("[ui-final] translate probe failed", error);
    return null;
  }
}

async function callTtsProbe(text) {
  if (!demoState.apiOnline) return null;
  try {
    return await apiFetch("/api/tts", {
      method: "POST",
      body: JSON.stringify({ text, provider: "elevenlabs" })
    });
  } catch (error) {
    console.warn("[ui-final] tts probe failed", error);
    return null;
  }
}

function identifyCaller(kind = "maya") {
  const isSam = kind === "sam";
  liveProfile.classList.add("identified");
  liveProfile.innerHTML = `
    <div class="profile-hero">
      <span class="avatar large">${isSam ? "SP" : "MR"}</span>
      <h2>${isSam ? "Sam P." : "Maya R."}</h2>
      <p>Matched from caller ID, order history, loyalty profile, and active late-delivery intent.</p>
    </div>
    <dl class="profile-grid">
      <div><dt>Mode</dt><dd>VIP parent</dd></div>
      <div><dt>Risk</dt><dd>${isSam ? "Medium" : "High"}</dd></div>
      <div><dt>LTV</dt><dd>$2.4k</dd></div>
      <div><dt>Prior issue</dt><dd>${isSam ? "Similar" : "Yes"}</dd></div>
    </dl>
    <div class="mini-card">
      <span>Loaded playbook</span>
      <strong>${isSam ? "policy_late_delivery_gen3" : "policy_late_delivery_gen1"}</strong>
      <p>${isSam ? "Dream-updated deadline/inventory-first branch selected." : "Baseline policy-first branch active before dream pass."}</p>
    </div>
  `;
}

function appendLiveTurn(turn) {
  if (turn.identify) identifyCaller(turn.identify === true ? "maya" : turn.identify);
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
  setNavCollapsed(true);
  clearInterval(liveTimer);
  liveTranscript.innerHTML = "";
  liveIndex = 0;
  const script = demoState.activeCall === "success" ? successScript : baselineScript;
  appendLiveTurn(script[liveIndex]);
  liveIndex += 1;
  const firstAgent = script.find((turn) => turn.speaker === "agent");
  if (firstAgent) callTtsProbe(firstAgent.text);
  liveTimer = setInterval(() => {
    if (liveIndex >= script.length) {
      clearInterval(liveTimer);
      return;
    }
    const turn = script[liveIndex];
    appendLiveTurn(turn);
    if (turn.text.includes("Eso no")) {
      callTranslationProbe(turn.text).then((translation) => {
        if (!translation) return;
        const system = document.createElement("article");
        system.className = "turn system";
        system.innerHTML = `<span>live API translation</span><p>${translation.english} (${translation.sentiment.label}, ${Math.round(translation.sentiment.frustration * 100)}% frustration)</p>`;
        liveTranscript.appendChild(system);
      });
    }
    liveIndex += 1;
  }, 1200);
}

function renderPruningReview(success) {
  const heading = document.querySelector("#pruningView .section-head h2");
  const pruneGrid = document.querySelector("#pruningView .prune-grid");
  const evidenceStrip = document.querySelector("#pruningView .evidence-strip");
  const flowTitle = document.querySelector("#pruningView .panel-title strong");
  const decisions = document.querySelector("#pruningView .pruning-decisions");
  if (!heading || !pruneGrid || !evidenceStrip || !flowTitle || !decisions) return;

  if (success) {
    heading.textContent = "What gets preserved after the dream update";
    flowTitle.textContent = "Sam P. - improved conversation";
    pruneGrid.innerHTML = `
      <article class="prune-card keep"><span>Keep</span><h3>Urgent event signal</h3><p>Deadline language still anchors the persona-intent match.</p></article>
      <article class="prune-card keep"><span>Keep</span><h3>Tool preload</h3><p>Inventory and courier lookup happen before policy language.</p></article>
      <article class="prune-card promote"><span>Promote</span><h3>Inventory-first recovery</h3><p>Contained the caller while preserving refund safety.</p></article>
      <article class="prune-card keep"><span>Preserve</span><h3>Refund fallback</h3><p>Kept as a safety net after the replacement option is clear.</p></article>
    `;
    evidenceStrip.innerHTML = `
      <div><span>Prediction quality</span><strong>91%</strong></div>
      <div><span>Sentiment delta</span><strong>+0.47</strong></div>
      <div><span>NPS proxy</span><strong>72</strong></div>
      <div><span>Pruning decision</span><strong>champion</strong></div>
    `;
    decisions.innerHTML = `
      <article class="decision-row promote">
        <span>Champion</span>
        <strong>inventory-first recovery</strong>
        <p>Promote for Maya-like urgent delivery calls because containment and NPS moved together.</p>
      </article>
      <article class="decision-row keep">
        <span>Keep</span>
        <strong>deadline acknowledgement</strong>
        <p>Preserve the first-sentence deadline acknowledgement as required context.</p>
      </article>
      <article class="decision-row keep">
        <span>Preserve</span>
        <strong>refund safety net</strong>
        <p>Keep refund language only after inventory options are offered.</p>
      </article>
    `;
    return;
  }

  heading.textContent = "What gets kept, pruned, and sent to dream state";
  flowTitle.textContent = "Maya R. - last conversation";
  pruneGrid.innerHTML = `
    <article class="prune-card keep"><span>Keep</span><h3>Urgent event signal</h3><p>Deadline and frustration markers are retained as cluster evidence.</p></article>
    <article class="prune-card keep"><span>Keep</span><h3>Translation signal</h3><p>Spanish frustration phrase maps to high-risk sentiment movement.</p></article>
    <article class="prune-card prune"><span>Prune</span><h3>Policy-first opening</h3><p>Repeatedly increases cancel/refund threats before rescue options.</p></article>
    <article class="prune-card promote"><span>Promote</span><h3>Inventory-first recovery</h3><p>Best candidate for Maya-like urgent delivery calls.</p></article>
  `;
  evidenceStrip.innerHTML = `
    <div><span>Prediction quality</span><strong>70%</strong></div>
    <div><span>Sentiment delta</span><strong>-0.57</strong></div>
    <div><span>NPS proxy</span><strong>24</strong></div>
    <div><span>Pruning decision</span><strong>soft prune</strong></div>
  `;
  decisions.innerHTML = `
    <article class="decision-row promote">
      <span>Promote</span>
      <strong>inventory-first recovery</strong>
      <p>Open with deadline acknowledgement, then check replacement inventory before policy language.</p>
    </article>
    <article class="decision-row keep">
      <span>Keep</span>
      <strong>offer fallback</strong>
      <p>Preserve discount or refund fallback only after rescue options are clear.</p>
    </article>
    <article class="decision-row prune">
      <span>Prune</span>
      <strong>policy-first opening</strong>
      <p>Soft-pruned for Maya-like urgent event calls because it increased cancel/refund threats.</p>
    </article>
  `;
}

async function processCurrentCall() {
  setNavCollapsed(true);
  const success = demoState.activeCall === "success";
  renderPruningReview(success);
  try {
    if (!demoState.apiOnline) throw new Error("API offline");
    const result = await apiFetch("/api/demo/build-result", {
      method: "POST",
      body: JSON.stringify({ success })
    });
    demoState.currentResult = result;
    await apiFetch("/api/runs", {
      method: "POST",
      body: JSON.stringify(result)
    });
    demoState.currentRunSaved = true;
    setApiBadge("online", success ? "success run saved" : "failure run saved");
  } catch (error) {
    demoState.currentRunSaved = false;
    demoState.lastApiError = error;
    setApiBadge("offline", "local pruning");
    console.warn("[ui-final] process call fallback", error);
  }
  switchView("pruning");
}

async function runDreamPass() {
  setNavCollapsed(true);
  const columns = [...document.querySelectorAll(".dream-column")];
  const sankeyCard = document.querySelector("#dreamSankeyCard");
  clearInterval(dreamTimer);
  dreamIndex = 0;
  columns.forEach((column) => column.classList.remove("active"));
  columns[0].classList.add("active");
  if (sankeyCard) {
    sankeyCard.classList.remove("is-building", "is-built");
    void sankeyCard.offsetWidth;
    sankeyCard.classList.add("is-building");
  }

  dreamTimer = setInterval(() => {
    dreamIndex += 1;
    if (dreamIndex >= columns.length) {
      columns.forEach((column) => column.classList.add("active"));
      clearInterval(dreamTimer);
      window.setTimeout(() => {
        sankeyCard?.classList.remove("is-building");
        sankeyCard?.classList.add("is-built");
      }, 650);
      return;
    }
    columns.forEach((column, index) => column.classList.toggle("active", index === dreamIndex));
  }, 850);

  try {
    if (!demoState.apiOnline) throw new Error("API offline");
    const cachedClusters = await apiFetch("/api/dream-clusters").catch(() => []);
    if (cachedClusters.length) {
      demoState.dreamClusters = cachedClusters;
    } else {
      await apiFetch("/api/demo/seed-golden-runs", {
        method: "POST",
        body: JSON.stringify({ includeSuccess: false })
      });
      const dream = await apiFetch("/api/dream-pass", { method: "POST", body: JSON.stringify({}) });
      const pendingClusters = dream.clusters?.length
        ? dream.clusters
        : await apiFetch("/api/dream-clusters?status=pending").catch(() => []);
      demoState.dreamClusters = pendingClusters.length
        ? pendingClusters
        : await apiFetch("/api/dream-clusters").catch(() => []);
    }
    const cluster = demoState.dreamClusters[0];
    const clusterKey = cluster?.dream_cluster_key ?? cluster?.key;
    if (clusterKey) {
      await apiFetch("/api/dream-clusters/approve", {
        method: "POST",
        body: JSON.stringify({ key: clusterKey })
      });
      demoState.promoted = true;
      demoState.activeCall = "success";
      demoState.playbooks = await apiFetch("/api/playbooks").catch(() => []);
      setApiBadge("online", "Gen 3 approved");
    }
  } catch (error) {
    demoState.promoted = true;
    demoState.activeCall = "success";
    demoState.lastApiError = error;
    setApiBadge("offline", "dream simulated");
    console.warn("[ui-final] dream pass fallback", error);
  }
}

function zoomToSelectedHistoryRun() {
  historyExpandedFamilies.clear();
  historyExpandedFamilies.add("policy");
  setNavCollapsed(false);
  switchView("history");
  switchHistoryTab("runs");
  refreshHistoryCanvasLayout();
}

navCollapse.addEventListener("click", () => setNavCollapsed(!document.body.classList.contains("nav-collapsed")));

brandMark.addEventListener("click", () => {
  switchView("home");
  setNavCollapsed(false);
});

navItems.forEach((item) => item.addEventListener("click", () => {
  const view = item.dataset.view;
  switchView(view);
  setNavCollapsed(view !== "home");
}));
document.querySelectorAll("[data-view-target]").forEach((item) => item.addEventListener("click", () => {
  switchView(item.dataset.viewTarget);
  if (item.dataset.viewTarget === "personas" || item.dataset.viewTarget === "analytics") {
    setNavCollapsed(false);
  }
}));

historyTabs.forEach((item) => item.addEventListener("click", () => switchHistoryTab(item.dataset.historyTab)));
document.querySelectorAll("[data-history-detail]").forEach((item) => item.addEventListener("click", () => switchHistoryTab("details")));

primaryAction.addEventListener("click", () => {
  if (activeView === "home") {
    switchView("personas");
  } else if (activeView === "personas") {
    expanded = true;
    expandedFamilies.clear();
    selectedNodeId = "root";
    renderCanvas();
  } else if (activeView === "history") {
    switchView("live");
  } else if (activeView === "live") {
    seedLiveCall();
  } else if (activeView === "pruning") {
    zoomToSelectedHistoryRun();
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
  selectedNodeId = "root";
  expandedFamilies.clear();
  demoState.activeCall = "baseline";
  demoState.currentResult = null;
  demoState.currentRunSaved = false;
  demoState.promoted = false;
  liveTranscript.innerHTML = "";
  liveProfile.classList.remove("identified");
  liveProfile.innerHTML = `<div class="empty-profile"><span>Awaiting caller identification</span><p>LiveKit audio is simulated here. Persona will populate after greeting.</p></div>`;
  renderPredictions([["late delivery", 44], ["refund request", 24], ["tracking ask", 20], ["other", 12]]);
  setNavCollapsed(false);
  switchView("home");
  renderCanvas();
});

expandNodes.addEventListener("click", () => {
  expanded = true;
  expandedFamilies.clear();
  selectedNodeId = "root";
  renderCanvas();
});

collapseNodes.addEventListener("click", () => {
  expanded = false;
  expandedFamilies.clear();
  selectedNodeId = "root";
  renderCanvas();
});

createExperiment.addEventListener("click", () => {
  expanded = true;
  expandedFamilies.clear();
  selectedNodeId = "new";
  renderCanvas({ preserveInspector: true });
  showInspector({
    id: "new",
    label: "New challenger arm",
    state: "candidate",
    score: "pending",
    detail: "A blank experiment arm would be created here for this persona-intent cluster."
  });
});

seedCall.addEventListener("click", seedLiveCall);
processCall.addEventListener("click", processCurrentCall);
document.querySelectorAll("[data-pruning-zoom]").forEach((item) => item.addEventListener("click", zoomToSelectedHistoryRun));
document.querySelectorAll("[data-pruning-dream]").forEach((item) => item.addEventListener("click", () => {
  switchView("dream");
  runDreamPass();
}));
runDream.addEventListener("click", runDreamPass);

switchView("home");
renderCanvas();
renderPredictions([["late delivery", 44], ["refund request", 24], ["tracking ask", 20], ["other", 12]]);
hydrateApiState();
