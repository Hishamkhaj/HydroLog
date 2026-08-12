import React, { useState, useEffect } from "react";
import { Droplet, Plus, Minus, Settings, Bell, X, Clock, Flame, TrendingUp } from "lucide-react";

const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const GLASS_ML = 250;
const STORAGE_KEY = "hydrolog-data";

const TIPS = [
  "Keep a bottle within arm's reach — you drink more when it's visible.",
  "A glass of water right after waking up kickstarts your metabolism.",
  "Thirst is a late signal — by the time you feel it, you're already low.",
  "Herbal tea and soup count too, but plain water is still the best baseline.",
  "Set water breaks next to habits you already have, like after each meal.",
  "Dehydration is one of the most common causes of afternoon fatigue.",
  "Add a slice of lemon or cucumber if plain water feels boring.",
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(ts) {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function last7Days() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ key: dateKey(d), label: d.toLocaleDateString("en-US", { weekday: "short" }) });
  }
  return out;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export default function App() {
  const initial = loadData();
  const [target, setTarget] = useState(initial?.target ?? 8);
  const [entries, setEntries] = useState(initial?.entries ?? []);
  const [showSettings, setShowSettings] = useState(false);
  const [reminderMins, setReminderMins] = useState(initial?.reminderMins ?? 90);
  const [reminderOn, setReminderOn] = useState(initial?.reminderOn ?? true);
  const [nudge, setNudge] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ target, entries, reminderMins, reminderOn }));
  }, [target, entries, reminderMins, reminderOn]);

  const today = dateKey();
  const todayEntries = entries.filter((e) => e.dateKey === today);
  const count = todayEntries.length;
  const pct = Math.min(100, Math.round((count / target) * 100));
  const lastTs = todayEntries.length ? todayEntries[todayEntries.length - 1].ts : null;

  const week = last7Days().map((d) => ({
    ...d,
    count: entries.filter((e) => e.dateKey === d.key).length,
  }));
  let streak = 0;
  for (let i = week.length - 1; i >= 0; i--) {
    const dayCount = week[i].count;
    const isToday = week[i].key === today;
    if (isToday) continue;
    if (dayCount >= target) streak++;
    else break;
  }
  if (count >= target) streak++;

  useEffect(() => {
    if (!reminderOn || !lastTs) return;
    const elapsedMin = (now - lastTs) / 60000;
    if (elapsedMin >= reminderMins && count < target) {
      setNudge(`It's been ${Math.floor(elapsedMin)} min since your last glass — time for water 💧`);
    }
  }, [now, reminderOn, reminderMins, lastTs, count, target]);

  const addGlass = () => {
    setEntries((prev) => [...prev, { ts: Date.now(), dateKey: today }]);
    setNudge(null);
  };

  const removeLast = () => {
    setEntries((prev) => {
      const idxs = prev.map((e, i) => ({ e, i })).filter(({ e }) => e.dateKey === today);
      if (idxs.length === 0) return prev;
      const lastIdx = idxs[idxs.length - 1].i;
      return prev.filter((_, i) => i !== lastIdx);
    });
  };

  const maxWeekCount = Math.max(target, ...week.map((d) => d.count), 1);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-8"
      style={{
        background: "linear-gradient(180deg, #EAF6FA 0%, #DCF0F5 45%, #F7FBFD 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0B4F6C", letterSpacing: "-0.02em" }}>
              HydroLog
            </h1>
            <p className="text-xs text-cyan-700/70 mt-0.5">Stay on top of your water, effortlessly</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 shadow-sm active:scale-95 transition"
            style={{ color: "#0B4F6C" }}
            aria-label="Settings"
          >
            <Settings size={19} />
          </button>
        </div>

        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 justify-center mb-4 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mx-auto"
            style={{ background: "#FF6B3D1A", color: "#C2410C" }}
          >
            <Flame size={14} />
            {streak} day{streak > 1 ? "s" : ""} streak
          </div>
        )}

        <div className="relative flex flex-col items-center mb-5">
          <div
            className="relative w-40 h-56 rounded-t-3xl rounded-b-2xl overflow-hidden border-4"
            style={{ borderColor: "#0B4F6C22", background: "#ffffff90" }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
              style={{ height: `${pct}%`, background: "linear-gradient(180deg, #4FD6E8 0%, #0FA3C7 100%)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, transparent, transparent 8px, #ffffff33 8px, #ffffff33 16px)",
                }}
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold drop-shadow-sm" style={{ color: pct > 45 ? "#fff" : "#0B4F6C" }}>
                {count}/{target}
              </span>
              <span className="text-xs mt-1" style={{ color: pct > 45 ? "#ffffffcc" : "#0B4F6C99" }}>
                glasses
              </span>
            </div>
          </div>
          <div className="w-10 h-4 rounded-t-md -mt-1" style={{ background: "#0B4F6C22" }} />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-sm text-cyan-800/80 mb-4">
          <Clock size={14} />
          {lastTs ? (
            <span>
              Last: {formatTime(lastTs)} ({timeAgo(lastTs)})
            </span>
          ) : (
            <span>No water logged yet today</span>
          )}
        </div>

        {nudge && (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <Bell size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 flex-1">{nudge}</p>
            <button onClick={() => setNudge(null)} className="text-amber-500">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-7">
          <button
            onClick={removeLast}
            disabled={count === 0}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm disabled:opacity-30 active:scale-95 transition"
            style={{ color: "#0B4F6C" }}
            aria-label="Remove last glass"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={addGlass}
            className="flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold shadow-lg active:scale-95 transition text-base"
            style={{ background: "linear-gradient(135deg, #0FA3C7, #0B4F6C)" }}
          >
            <Droplet size={20} fill="white" />
            Drink
          </button>
          <button
            onClick={addGlass}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm active:scale-95 transition"
            style={{ color: "#0B4F6C" }}
            aria-label="Add glass"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="bg-white/70 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={15} style={{ color: "#0B4F6C" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#0B4F6C" }}>
              This week
            </h2>
          </div>
          <div className="flex items-end justify-between gap-2 h-20">
            {week.map((d) => (
              <div key={d.key} className="flex flex-col items-center flex-1 gap-1">
                <div className="w-full h-full flex items-end rounded-md overflow-hidden bg-cyan-900/5">
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: `${Math.max(4, (d.count / maxWeekCount) * 100)}%`,
                      background: d.count >= target ? "#0FA3C7" : "#0FA3C766",
                    }}
                  />
                </div>
                <span className="text-[10px] text-cyan-700/60">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold mb-2.5" style={{ color: "#0B4F6C" }}>
            Today's log
          </h2>
          {todayEntries.length === 0 ? (
            <p className="text-xs text-cyan-700/60">No entries yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {todayEntries.map((e, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#0FA3C71A", color: "#0B4F6C" }}
                >
                  {formatTime(e.ts)}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-cyan-700/50 mt-2.5">Total today: {count * GLASS_ML} ml</p>
        </div>

        <div className="text-center text-[11px] text-cyan-700/60 px-2 mb-2">💡 {tip}</div>

        {pct >= 100 && (
          <div className="text-center text-sm font-medium mt-2" style={{ color: "#0B4F6C" }}>
            🎉 Today's target complete — nice work!
          </div>
        )}
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: "#0B4F6C" }}>
                Settings
              </h3>
              <button onClick={() => setShowSettings(false)} style={{ color: "#0B4F6C" }}>
                <X size={20} />
              </button>
            </div>

            <label className="text-xs font-medium text-cyan-800 mb-1.5 block">Daily target (glasses)</label>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setTarget((t) => Math.max(1, t - 1))}
                className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center"
                style={{ color: "#0B4F6C" }}
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-bold w-10 text-center" style={{ color: "#0B4F6C" }}>
                {target}
              </span>
              <button
                onClick={() => setTarget((t) => Math.min(20, t + 1))}
                className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center"
                style={{ color: "#0B4F6C" }}
              >
                <Plus size={16} />
              </button>
              <span className="text-xs text-cyan-700/60 ml-1">(~{target * GLASS_ML} ml)</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-cyan-800">In-app reminder</label>
              <button
                onClick={() => setReminderOn((r) => !r)}
                className="w-11 h-6 rounded-full relative transition"
                style={{ background: reminderOn ? "#0FA3C7" : "#cbd5e1" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: reminderOn ? "22px" : "2px" }}
                />
              </button>
            </div>

            <label className="text-xs font-medium text-cyan-800 mb-1.5 block mt-3">Remind me every (minutes)</label>
            <input
              type="number"
              min={15}
              max={240}
              value={reminderMins}
              onChange={(e) => setReminderMins(Math.max(15, Number(e.target.value) || 90))}
              className="w-full border border-cyan-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <p className="text-[11px] text-cyan-700/50 mt-2">
              This shows only while the app is open on screen.
            </p>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-5 py-3 rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #0FA3C7, #0B4F6C)" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
  }
