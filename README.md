# GridClaim

A real-time shared grid where anyone can claim tiles. Every connected user sees changes instantly via WebSockets.

## Stack

- **Backend** — Node.js, Express, Socket.io, Mongoose
- **Database** — MongoDB Atlas
- **Frontend** — React (CDN), Tailwind CSS (Play CDN), Babel (in-browser JSX)

No frontend build step — the client is plain static files.

---

## Project Structure

```
server/
  index.js              Express + Socket.io entry
  db.js                 MongoDB connection
  models/Block.js       Block schema (_id: "row-col", owner info)
  socket/handlers.js    Claim, unclaim, cooldown, leaderboard logic

client/
  index.html            CDN scripts + Tailwind
  App.jsx               Socket setup, state, grid layout
  components/
    Cell.jsx            Single tile (React.memo + pulse animation)
    UI.jsx              Leaderboard + UserBadge panels
```

---

## Run Locally

**Terminal 1 — server**
```bash
cd server
cp .env.example .env   # add your MongoDB Atlas URI
npm install
npm run dev
```

**Terminal 2 — client**
```bash
cd client
npm run dev            # serves on http://localhost:5500
```

---

## How It Works

- Each browser tab gets a random name + unique color on connect (socket ID = user identity)
- Clicking a tile emits `claim` → server validates cooldown → updates MongoDB → broadcasts `block_updated` to all clients
- Leaderboard is recomputed via MongoDB aggregation after every claim
- **3-second cooldown** enforced server-side (in-memory Map, no DB writes needed)
- Right-click your own tile to unclaim it (server verifies ownership before deleting)

---
