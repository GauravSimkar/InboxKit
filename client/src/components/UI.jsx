import { useEffect, useRef } from 'react';

function Leaderboard({ entries }) {
  return (
    <div className="fixed top-4 right-4 bg-gray-900 border border-gray-800 rounded-xl p-4 w-48 shadow-2xl">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Leaderboard
      </p>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-600 italic">No claims yet</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, i) => (
            <li key={entry.name} className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 w-3 shrink-0 text-xs">{i + 1}</span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-gray-300 flex-1">{entry.name}</span>
              <span className="text-gray-500 text-xs font-mono tabular-nums">{entry.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function UserBadge({ user, cooldown }) {
  const barRef = useRef(null);

  // Direct DOM mutation — animates the bar without triggering React re-renders on every frame
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (cooldown) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(() => {
        bar.style.transition = 'width 3s linear';
        bar.style.width = '0%';
      });
    } else {
      bar.style.transition = 'none';
      bar.style.width = '0%';
    }
  }, [cooldown]);

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 shadow-2xl min-w-40">
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
          style={{ backgroundColor: user.color }}
        />
        <span className="text-sm font-semibold text-gray-200">{user.name}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: '0%', backgroundColor: user.color }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-1.5">
        {cooldown ? 'Cooling down…' : 'Ready to claim'}
      </p>
    </div>
  );
}

export { Leaderboard, UserBadge };
