import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Cell from './components/Cell';
import { Leaderboard, UserBadge } from './components/UI';

const COLS = 30;
const ROWS = 20;

const SERVER_URL = 'https://inboxkit-4reg.onrender.com';

function App() {
  const [grid, setGrid]               = useState({});
  const [user, setUser]               = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cooldown, setCooldown]       = useState(false);
  const [toast, setToast]             = useState('');

  const socketRef   = useRef(null);
  const cooldownRef = useRef(false); // ref avoids stale closure inside claimBlock
  const timerRef    = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('init', ({ grid: blocks, user: me }) => {
      const map = {};
      blocks.forEach((b) => { map[b._id] = b; });
      setGrid(map);
      setUser(me);
    });

    socket.on('block_updated', ({ blockId, ownerId, ownerName, ownerColor }) => {
      setGrid((prev) => ({ ...prev, [blockId]: { ownerId, ownerName, ownerColor } }));
    });

    socket.on('leaderboard', setLeaderboard);

    socket.on('block_cleared', ({ blockId }) => {
      setGrid((prev) => { const next = { ...prev }; delete next[blockId]; return next; });
    });

    socket.on('claim_rejected', ({ cooldownRemaining }) => {
      const secs = (cooldownRemaining / 1000).toFixed(1);
      setToast(`Wait ${secs}s`);
      setTimeout(() => setToast(''), 1500);
    });

    return () => socket.disconnect();
  }, []);

  // useCallback keeps claimBlock's reference stable so React.memo on Cell works
  const claimBlock = useCallback((blockId) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setCooldown(true);
    socketRef.current?.emit('claim', { blockId });

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      cooldownRef.current = false;
      setCooldown(false);
    }, 3000);
  }, []);

  const unclaimBlock = useCallback((blockId) => {
    socketRef.current?.emit('unclaim', { blockId });
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-gray-500 text-lg animate-pulse tracking-wide">Connecting…</p>
      </div>
    );
  }

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = `${r}-${c}`;
      cells.push(
        <Cell
          key={id}
          blockId={id}
          data={grid[id] ?? null}
          userId={user.id}
          claimBlock={claimBlock}
          unclaimBlock={unclaimBlock}
        />
      );
    }
  }

  return (
    <div className="relative min-h-screen bg-gray-950 px-4 py-6">
      <h1 className="text-center font-bold text-2xl tracking-tight mb-5 text-white">
        Grid<span className="text-indigo-400">Claim</span>
        <span className="ml-3 text-xs font-normal text-gray-600 tracking-widest uppercase">30 × 20</span>
      </h1>

      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '2px' }}
        className="max-w-5xl mx-auto"
      >
        {cells}
      </div>

      <Leaderboard entries={leaderboard} />
      <UserBadge user={user} cooldown={cooldown} />

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
