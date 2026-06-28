const scenes = [...document.querySelectorAll(".scene")];
const journeySteps = [...document.querySelectorAll(".journey-step")];
const funnelCards = [...document.querySelectorAll(".funnel-card")];
const dreamSteps = [...document.querySelectorAll(".dream-step")];
const experimentGrid = document.querySelector("#experimentGrid");
const transcript = document.querySelector("#transcript");
const predictionBars = document.querySelector("#predictionBars");
const translationCard = document.querySelector("#translationCard");

const prevBtn = document.querySelector("#prevStep");
const nextBtn = document.querySelector("#nextStep");
const replayBtn = document.querySelector("#replayStep");

const sceneKicker = document.querySelector("#sceneKicker");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneCopy = document.querySelector("#sceneCopy");
const scenePhase = document.querySelector("#scenePhase");
const sceneMetric = document.querySelector("#sceneMetric");
const mainKicker = document.querySelector("#mainKicker");
const mainTitle = document.querySelector("#mainTitle");
const rightKicker = document.querySelector("#rightKicker");
const rightTitle = document.querySelector("#rightTitle");
const branchStatus = document.querySelector("#branchStatus");
const mapStatus = document.querySelector("#mapStatus");
const timer = document.querySelector("#timer");
const handoffJson = document.querySelector("#handoffJson");

const sentimentLabel = document.querySelector("#sentimentLabel");
const sentimentFill = document.querySelector("#sentimentFill");
const sentimentNote = document.querySelector("#sentimentNote");
const containmentMetric = document.querySelector("#containmentMetric");
const npsMetric = document.querySelector("#npsMetric");
const recontactMetric = document.querySelector("#recontactMetric");
const predictionMetric = document.querySelector("#predictionMetric");

const demoState = [
  {
    kicker: "Persona Loaded",
    title: "Maya enters a high-risk late-delivery journey",
    copy: "The system starts with persona context, current intent, urgency, and prior memory before picking a strategy arm.",
    metric: "Risk high",
    mainKicker: "Persona Context",
    mainTitle: "Containment starts before the first response",
    rightKicker: "Starting State",
    rightTitle: "Next-turn prior",
    branch: "Persona loaded",
    map: "No branch selected",
    funnel: "generated",
    predictions: [["cancel/refund threat", 38], ["asks tracking", 27], ["deadline pressure", 22], ["accepts policy", 13]],
    sentiment: ["frustrated", 38, "Sentiment starts negative because this is tied to a family event."],
    metrics: ["52%", "31", "42%", "61%"],
    handoff: {
      persona_id: "loyal_shopper_vip_parent",
      intent: "late_delivery",
      situation_tags: ["urgent_event_deadline", "gift_order"],
      starting_risk: "high"
    }
  },
  {
    kicker: "Experiment Pool",
    title: "128 policy arms explore possible recovery strategies",
    copy: "The platform generates a broad strategy pool, then narrows toward replayed calls, repeated failures, challengers, and one champion.",
    metric: "128 arms",
    mainKicker: "100+ Experiments",
    mainTitle: "Strategy arms for Maya-like late-delivery journeys",
    rightKicker: "Arm Scoring",
    rightTitle: "Candidate outcome priors",
    branch: "128 generated",
    map: "Policy branch selected",
    funnel: "replayed",
    predictions: [["policy-first failure", 44], ["inventory-first success", 31], ["discount detour", 15], ["refund-first risk", 10]],
    sentiment: ["mixed", 46, "Offline sims compare strategies before a live branch is trusted."],
    metrics: ["58%", "39", "36%", "66%"],
    handoff: {
      generated_arms: 128,
      replayed_calls: 36,
      selected_baseline: "policy_first_shipping_explanation_v1",
      candidate_champion: "deadline_inventory_first_v1"
    }
  },
  {
    kicker: "Baseline Call",
    title: "The selected policy-first branch fails containment",
    copy: "The agent predicts growing cancel risk, but the response still worsens sentiment because it explains policy before rescue.",
    metric: "Not contained",
    mainKicker: "Simulated Live Call",
    mainTitle: "policy_first_shipping_explanation_v1",
    rightKicker: "Before Shopper Speaks",
    rightTitle: "Next-intent + sentiment",
    branch: "Pruning weak path",
    map: "Policy path failing",
    funnel: "failures",
    predictions: [["cancel order", 52], ["refund demand", 27], ["escalate human", 14], ["accept policy", 7]],
    sentiment: ["angry", 18, "Correct prediction is not enough when the response strategy makes sentiment worse."],
    metrics: ["41%", "24", "58%", "70%"],
    handoff: {
      policy_arm: "policy_first_shipping_explanation_v1",
      actual_next_intent: "cancel_order",
      sentiment_delta: -0.57,
      containment: "failed"
    }
  },
  {
    kicker: "Evaluation",
    title: "Person 2 turns the call into structured experiment evidence",
    copy: "The transcript is scored for prediction quality, sentiment movement, tool timing, NPS proxy, recontact risk, and pruning decision.",
    metric: "Soft prune",
    mainKicker: "Post-call Score",
    mainTitle: "Advanced containment failed even before transfer",
    rightKicker: "Quality Score",
    rightTitle: "Containment is not enough",
    branch: "Soft prune recommended",
    map: "Policy path pruned",
    funnel: "failures",
    predictions: [["bad tool order", 39], ["sentiment drop", 31], ["prediction miss", 18], ["compliance okay", 12]],
    sentiment: ["worse", 14, "The system saves why the branch failed, not just the final transcript."],
    metrics: ["39%", "24", "61%", "70%"],
    handoff: {
      failure_cluster: "late_delivery:urgent_event_deadline:policy_first:cancel_or_refund_threat",
      pruning_decision: "soft_prune",
      nps_proxy: 24,
      recontact_risk: 0.61
    }
  },
  {
    kicker: "Dream Pass",
    title: "Offline consolidation finds a cross-persona failure cluster",
    copy: "Maya, Alex, and Jordan share the same behavioral failure: urgent event customers escalate when policy comes before rescue.",
    metric: "+19% lift",
    mainKicker: "Offline Dream Pass",
    mainTitle: "Cluster, score, patch, promote",
    rightKicker: "Patch Proposal",
    rightTitle: "Playbook update",
    branch: "Promote challenger",
    map: "Deadline inventory promoted",
    funnel: "patches",
    predictions: [["deadline_inventory_first", 63], ["empathy_then_refund", 18], ["discount_offer", 11], ["policy_first", 8]],
    sentiment: ["recovering", 64, "Dream pass promotes the strategy that improves sentiment and contained resolution."],
    metrics: ["68%", "49", "24%", "78%"],
    handoff: {
      dream_cluster_key: "late_delivery:urgent_event_deadline:policy_first",
      remove: ["standard_shipping_policy_first"],
      add: ["acknowledge_deadline", "lookup_inventory", "offer_replacement"],
      status: "ready_for_approval"
    }
  },
  {
    kicker: "Next Iteration",
    title: "The same journey is contained after the playbook update",
    copy: "The second call starts with deadline acknowledgement, preloads inventory, preserves refund fallback, and resolves without a human.",
    metric: "81% contained",
    mainKicker: "Improved Replay",
    mainTitle: "deadline_inventory_first_v1",
    rightKicker: "After Dream",
    rightTitle: "Quality-adjusted containment",
    branch: "Gen 2 champion",
    map: "Champion ready",
    funnel: "champion",
    predictions: [["resolution accepted", 63], ["asks confirmation", 20], ["thanks agent", 12], ["recontact risk", 5]],
    sentiment: ["relieved", 82, "Sentiment recovers because the agent solves the deadline instead of defending policy."],
    metrics: ["81%", "68", "12%", "84%"],
    handoff: {
      active_playbook: "deadline_inventory_first_v1",
      containment_lift: "+29 points",
      nps_proxy_lift: "+37",
      recontact_risk_delta: "-30 points"
    }
  }
];

const baselineTurns = [
  { speaker: "shopper", text: "My daughter's birthday is tomorrow and this still has not arrived." },
  { speaker: "agent", text: "I understand. Standard shipping usually takes 3-5 business days, and the carrier has not updated yet." },
  { speaker: "shopper", text: "No puedo seguir explicando esto. It is for my daughter's birthday." },
  { speaker: "translation", text: "Gemini Live Translate: \"I cannot keep explaining this.\" Signal: frustration spike + urgent family event." },
  { speaker: "shopper", text: "That does not help me. Just cancel it if you cannot fix it." },
  { speaker: "system", text: "Outcome: cancel/refund threat. Sentiment down. Policy-first branch marked for pruning." }
];

const experimentLabels = [
  "policy first", "deadline first", "inventory first", "refund first", "discount first", "empathy first", "tool first", "hybrid",
  "policy first", "deadline first", "inventory first", "refund first", "discount first", "empathy first", "tool first", "hybrid",
  "policy first", "deadline first", "inventory first", "refund first", "discount first", "empathy first", "tool first", "hybrid",
  "policy first", "deadline first", "inventory first", "refund first", "discount first", "empathy first", "tool first", "hybrid",
  "policy first", "deadline first", "inventory first", "refund first", "discount first", "empathy first", "tool first", "hybrid"
];

let activeStep = 0;
let callTimer;
let callClock;
let elapsed = 0;

function createExperimentTiles() {
  experimentGrid.innerHTML = "";
  experimentLabels.forEach((label, index) => {
    const tile = document.createElement("div");
    tile.className = "experiment-tile";
    if (index === 0 || index === 8 || index === 16) tile.classList.add("selected");
    if (index === 2 || index === 10 || index === 18) tile.classList.add("promoted");
    tile.textContent = label;
    experimentGrid.appendChild(tile);
  });
}

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

function renderTranscript(instant = false) {
  clearInterval(callTimer);
  clearInterval(callClock);
  transcript.innerHTML = "";
  timer.textContent = "00:00";
  elapsed = 0;

  const append = (turn) => {
    const item = document.createElement("article");
    item.className = `turn ${turn.speaker}`;
    item.innerHTML = `<span>${turn.speaker}</span><p>${turn.text}</p>`;
    transcript.appendChild(item);
  };

  if (instant) {
    baselineTurns.forEach(append);
    return;
  }

  let index = 0;
  callClock = setInterval(() => {
    elapsed += 1;
    timer.textContent = `00:${String(elapsed).padStart(2, "0")}`;
  }, 1000);

  append(baselineTurns[index]);
  index += 1;
  callTimer = setInterval(() => {
    if (index >= baselineTurns.length) {
      clearInterval(callTimer);
      clearInterval(callClock);
      return;
    }
    append(baselineTurns[index]);
    index += 1;
  }, 900);
}

function resetDreamSteps() {
  dreamSteps.forEach((step) => step.classList.remove("active", "complete"));
}

function animateDreamSteps() {
  resetDreamSteps();
  dreamSteps.forEach((step, index) => {
    setTimeout(() => {
      dreamSteps.forEach((item, itemIndex) => {
        item.classList.toggle("complete", itemIndex < index);
        item.classList.toggle("active", itemIndex === index);
      });
    }, index * 420);
  });
  setTimeout(() => {
    dreamSteps.forEach((step) => {
      step.classList.remove("active");
      step.classList.add("complete");
    });
  }, dreamSteps.length * 420 + 200);
}

function updateScene(step, replay = false) {
  activeStep = Math.max(0, Math.min(step, demoState.length - 1));
  const state = demoState[activeStep];

  scenes.forEach((scene) => scene.classList.toggle("active", Number(scene.dataset.scene) === activeStep));
  journeySteps.forEach((button) => button.classList.toggle("active", Number(button.dataset.step) === activeStep));
  funnelCards.forEach((card) => card.classList.toggle("active", card.dataset.funnel === state.funnel));

  sceneKicker.textContent = state.kicker;
  sceneTitle.textContent = state.title;
  sceneCopy.textContent = state.copy;
  scenePhase.textContent = `Step ${activeStep + 1} of ${demoState.length}`;
  sceneMetric.textContent = state.metric;
  mainKicker.textContent = state.mainKicker;
  mainTitle.textContent = state.mainTitle;
  rightKicker.textContent = state.rightKicker;
  rightTitle.textContent = state.rightTitle;
  branchStatus.textContent = state.branch;
  mapStatus.textContent = state.map;

  renderPredictions(state.predictions);
  sentimentLabel.textContent = state.sentiment[0];
  sentimentFill.style.width = `${state.sentiment[1]}%`;
  sentimentNote.textContent = state.sentiment[2];
  [containmentMetric.textContent, npsMetric.textContent, recontactMetric.textContent, predictionMetric.textContent] = state.metrics;
  handoffJson.textContent = JSON.stringify(state.handoff, null, 2);

  translationCard.classList.toggle("visible", activeStep === 2 || activeStep === 3);
  prevBtn.disabled = activeStep === 0;
  nextBtn.textContent = activeStep === demoState.length - 1 ? "Restart demo" : "Next step";

  clearInterval(callTimer);
  clearInterval(callClock);
  if (activeStep === 2) renderTranscript(replay);
  if (activeStep === 4) animateDreamSteps();
  if (activeStep !== 4) resetDreamSteps();
}

prevBtn.addEventListener("click", () => updateScene(activeStep - 1, true));
nextBtn.addEventListener("click", () => {
  if (activeStep === demoState.length - 1) {
    updateScene(0);
  } else {
    updateScene(activeStep + 1);
  }
});
replayBtn.addEventListener("click", () => updateScene(activeStep, false));
journeySteps.forEach((button) => {
  button.addEventListener("click", () => updateScene(Number(button.dataset.step)));
});

createExperimentTiles();
updateScene(0);
