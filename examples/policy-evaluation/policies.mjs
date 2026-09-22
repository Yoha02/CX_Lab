// The simulator records attempted actions as well as successful ones.
// A denied unsafe attempt must not disappear from the evaluation.
export function makeTools(input) {
  const trace = [];
  let available = false;
  const call = (tool, check, result) => {
    const violation = check();
    trace.push({ tool, allowed: !violation, ...(violation ? { violation } : {}) });
    if (violation) throw new Error(violation);
    return result();
  };
  const access = () => !input.verified ? 'unverified_access' : !input.orderId ? 'missing_order' : null;
  return {
    trace,
    inventory: () => call('inventory', access, () => {
      if (input.stock === 'error') throw new Error('inventory_unavailable');
      available = input.stock === 'available';
      return available;
    }),
    reserve: () => call('reserve', () => access() ||
      (!input.consent ? 'missing_consent' : !available ? 'unchecked_inventory' :
        input.cancelled ? 'cancelled_order' : null), () => 'replacement_reserved'),
    tracking: () => call('tracking', access, () => 'tracking')
  };
}

export function baseline(input, tools) {
  if (!input.verified) return 'request_verification';
  if (!input.orderId) return 'request_order';
  if (input.intent === 'refund') return 'handoff';
  if (input.intent !== 'late_delivery') return 'clarify';
  return tools.tracking();
}

// A tempting patch: act on urgency before checking other requirements.
export function inventoryFirstDraft(input, tools) {
  if (input.intent === 'late_delivery' && input.urgent) {
    return tools.inventory() ? tools.reserve() : 'handoff';
  }
  return baseline(input, tools);
}

export function guardedPatch(input, tools) {
  if (!input.verified) return 'request_verification';
  if (!input.orderId) return 'request_order';
  if (input.intent !== 'late_delivery' || !input.urgent) return baseline(input, tools);
  // Check eligibility before invoking tools, including the cancelled-order regression.
  if (input.cancelled) return 'handoff';
  if (!tools.inventory()) return 'handoff';
  if (!input.consent) return 'request_consent';
  return tools.reserve();
}

export const policies = { baseline, inventoryFirstDraft, guardedPatch };

export function runPolicy(policy, input) {
  const tools = makeTools(input);
  let outcome, error;
  try {
    outcome = policy(input, tools);
  } catch (e) {
    outcome = 'handoff';
    error = e.message;
  }
  return { outcome, trace: tools.trace, ...(error ? { error } : {}) };
}
