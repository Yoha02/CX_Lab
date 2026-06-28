const transcript = document.querySelector("#transcript");
const predictionBars = document.querySelector("#predictionBars");
const timer = document.querySelector("#timer");
const dreamBtn = document.querySelector("#dreamBtn");
const replayBtn = document.querySelector("#replayBtn");
const dreamStatus = document.querySelector("#dreamStatus");
const branchStatus = document.querySelector("#branchStatus");
const confidenceValue = document.querySelector("#confidenceValue");
const priorValue = document.querySelector("#priorValue");
const containmentMetric = document.querySelector("#containmentMetric");
const predictionMetric = document.querySelector("#predictionMetric");
const sentimentMetric = document.querySelector("#sentimentMetric");
const riskMetric = document.querySelector("#riskMetric");
const dreamSteps = [...document.querySelectorAll(".dream-step")];

const callScript = [
  {
    speaker: "shopper",
    text: "My daughter's birthday is tomorrow and this still has not arrived.",
    predictions: [
      ["deadline pressure", 44],
      ["cancel order", 31],
      ["refund demand", 18],
      ["ask for human", 7],
    ],
    confidence: 72,
    prior: "0.38",
    metrics: ["52%", "61%", "+0.18", "34%"],
  },
  {
    speaker: "agent",
    text: "I understand the timing matters. I am checking replacement inventory and delivery options before we talk refund policy.",
    predictions: [
      ["asks guarantee", 39],
      ["accepts replacement", 28],
      ["cancel order", 21],
      ["escalate", 12],
    ],
    confidence: 76,
    prior: "0.42",
    metrics: ["58%", "65%", "+0.22", "29%"],
  },
  {
    speaker: "shopper",
    text: "Can you actually guarantee it by Saturday, or am I wasting time here?",
    predictions: [
      ["deadline pressure", 51],
      ["trust challenge", 24],
      ["refund demand", 15],
      ["agent escalation", 10],
    ],
    confidence: 81,
    prior: "0.47",
    metrics: ["61%", "69%", "+0.26", "27%"],
  },
  {
    speaker: "agent",
    text: "There is one replacement in the local warehouse. I can reserve it and upgrade shipping. If it misses Saturday, the refund path stays open.",
    predictions: [
      ["accept replacement", 46],
      ["asks refund safety", 22],
      ["asks tracking", 20],
      ["cancel order", 12],
    ],
    confidence: 84,
    prior: "0.51",
    metrics: ["68%", "74%", "+0.33", "21%"],
  },
  {
    speaker: "shopper",
    text: "Okay, reserve it. I just need to know I am not stuck if it still misses.",
    predictions: [
      ["accept replacement", 58],
      ["asks fallback", 23],
      ["asks confirmation", 14],
      ["escalate", 5],
    ],
    confidence: 88,
    prior: "0.56",
    metrics: ["74%", "79%", "+0.41", "16%"],
  },
  {
    speaker: "agent",
    text: "Done. I reserved the replacement, sent confirmation, and kept the refund fallback attached to this case.",
    predictions: [
      ["resolution accepted", 63],
      ["asks confirmation", 20],
      ["thanks agent", 12],
      ["recontact risk", 5],
    ],
    confidence: 91,
    prior: "0.62",
    metrics: ["81%", "84%", "+0.47", "12%"],
  },
];

let callIndex = 0;
let elapsed = 0;
let callInterval;
let clockInterval;

function renderPredictions(items) {
  predictionBars.innerHTML = "";
  for (const [label, value] of items) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-copy">
        <span>${label}</span>
        <span>${value}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill"></div></div>
    `;
    predictionBars.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector(".bar-fill").style.width = `${value}%`;
    });
  }
}

function appendTurn(turn) {
  const item = document.createElement("article");
  item.className = `turn ${turn.speaker}`;
  item.innerHTML = `<span>${turn.speaker}</span><p>${turn.text}</p>`;
  transcript.appendChild(item);
  while (transcript.children.length > 4) {
    transcript.removeChild(transcript.firstElementChild);
  }
}

function applyMetrics(metrics) {
  [containmentMetric.textContent, predictionMetric.textContent, sentimentMetric.textContent, riskMetric.textContent] = metrics;
}

function tickCall() {
  const turn = callScript[callIndex % callScript.length];
  appendTurn(turn);
  renderPredictions(turn.predictions);
  confidenceValue.textContent = `${turn.confidence}%`;
  priorValue.textContent = turn.prior;
  applyMetrics(turn.metrics);
  branchStatus.textContent = callIndex < 3 ? "Branches exploring" : callIndex < 5 ? "Pruning weak paths" : "Champion ready";
  callIndex += 1;
}

function startClock() {
  clearInterval(clockInterval);
  elapsed = 0;
  timer.textContent = "00:00";
  clockInterval = setInterval(() => {
    elapsed += 1;
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    timer.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function replayCall() {
  clearInterval(callInterval);
  transcript.innerHTML = "";
  callIndex = 0;
  startClock();
  tickCall();
  callInterval = setInterval(tickCall, 2600);
}

function resetDreamSteps() {
  dreamSteps.forEach((step) => {
    step.classList.remove("active", "complete");
  });
}

function runDreamPass() {
  resetDreamSteps();
  dreamStatus.textContent = "Running";
  branchStatus.textContent = "Dream reviewing";
  dreamBtn.disabled = true;

  dreamSteps.forEach((step, index) => {
    setTimeout(() => {
      dreamSteps.forEach((s, i) => {
        s.classList.toggle("complete", i < index);
        s.classList.toggle("active", i === index);
      });
    }, index * 900);
  });

  setTimeout(() => {
    dreamSteps.forEach((step) => {
      step.classList.remove("active");
      step.classList.add("complete");
    });
    dreamStatus.textContent = "Patch approved";
    branchStatus.textContent = "Gen 3 champion";
    containmentMetric.textContent = "81%";
    predictionMetric.textContent = "84%";
    sentimentMetric.textContent = "+0.47";
    riskMetric.textContent = "12%";
    dreamBtn.disabled = false;
  }, dreamSteps.length * 900 + 500);
}

dreamBtn.addEventListener("click", runDreamPass);
replayBtn.addEventListener("click", replayCall);

replayCall();
setTimeout(runDreamPass, 4200);
