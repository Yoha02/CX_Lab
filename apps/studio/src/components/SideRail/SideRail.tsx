import { useEffect, useState } from "react";
import { getDataSource } from "../../data/index.js";
import { unlockAudio, playAudioFromData } from "../../lib/audio.js";
import type { Profile, Memory } from "../../lib/contracts.js";

export function SideRail() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memory, setMemory] = useState<Memory[]>([]);

  useEffect(() => {
    const ds = getDataSource();
    ds.getProfile().then(setProfile);
    ds.getProfileMemory().then(setMemory);
  }, []);

  return (
    <aside className="side-rail">
      {/* Brand */}
      <div className="brand-lockup">
        <div className="brand-mark">CX</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>CX_lab Dojo</h1>
          <p style={{ fontSize: 13, color: "#68736e", margin: 0 }}>Retail voice RSI prototype</p>
        </div>
      </div>

      {/* Profile */}
      <div className="panel">
        <div className="section-kicker">Active Profile</div>
        {profile ? (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{profile.customer_name}</h2>
            <p style={{ fontSize: 13, color: "#68736e", margin: 0 }}>{profile.shopper_mode}</p>
            <div className="profile-grid">
              <dl className="profile-cell">
                <dt>Segment</dt>
                <dd style={{ fontSize: 14 }}>{profile.shopper_mode.split(" ")[0]}</dd>
              </dl>
              <dl className="profile-cell">
                <dt>Risk</dt>
                <dd style={{ fontSize: 14 }}>{profile.badges.includes("Urgent") ? "High" : "Low"}</dd>
              </dl>
              <dl className="profile-cell">
                <dt>Tickets</dt>
                <dd style={{ fontSize: 14 }}>{(profile.features.prior_tickets as number) ?? 0}</dd>
              </dl>
              <dl className="profile-cell">
                <dt>LTV</dt>
                <dd style={{ fontSize: 14 }}>{profile.features.lifetime_value ?? "—"}</dd>
              </dl>
            </div>
            {profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.badges.map((b) => (
                  <span key={b} style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 999, background: "#ddebf4", color: "#3f7cac" }}>{b}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#68736e", margin: 0 }}>No profile loaded</p>
        )}
      </div>

      {/* Memory */}
      <div className="panel">
        <div className="section-kicker">Loaded Memory</div>
        <ul className="memory-list">
          {memory.map((m) => <li key={m.id}>{m.text}</li>)}
          {memory.length === 0 && <li style={{ color: "#68736e" }}>No memory loaded</li>}
        </ul>
      </div>
    </aside>
  );
}
