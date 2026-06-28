import { useEffect, useState } from "react";
import { useRunStore } from "../../state/runStore.js";
import { getDataSource } from "../../data/index.js";
import type { Profile, Memory } from "../../lib/contracts.js";

export function SideRail() {
  const { displayMode, toggleDisplayMode } = useRunStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memory, setMemory] = useState<Memory[]>([]);

  useEffect(() => {
    const ds = getDataSource(displayMode);
    ds.getProfile().then(setProfile);
    ds.getProfileMemory().then(setMemory);
  }, [displayMode]);

  return (
    <aside className="w-[260px] bg-panel border-r border-black/10 p-4 overflow-y-auto">
      <div className="text-xs uppercase tracking-wide text-muted mb-1">active profile</div>
      <h2 className="text-xl font-medium">{profile?.customer_name ?? "—"}</h2>
      <p className="text-sm text-muted">{profile?.shopper_mode}</p>
      <div className="flex flex-wrap gap-1.5 my-3">
        {profile?.badges.map((b) => (
          <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{b}</span>
        ))}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted mt-4 mb-1">loaded memory</div>
      <ul className="text-sm space-y-1">{memory.map((m) => <li key={m.id} className="text-muted">• {m.text}</li>)}</ul>
      <label className="flex items-center gap-2 mt-6 text-sm cursor-pointer">
        <input type="checkbox" checked={displayMode} onChange={toggleDisplayMode} />
        display mode — fixture data
      </label>
    </aside>
  );
}