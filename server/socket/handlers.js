const Block = require('../models/Block');

const COOLDOWN_MS = 3000;

// In-memory map: socketId → last claim timestamp (no DB write needed for cooldowns)
const cooldowns = new Map();

const ADJECTIVES = ['Swift', 'Bold', 'Calm', 'Fierce', 'Brave', 'Wild', 'Dark', 'Bright', 'Silent', 'Noble'];
const NOUNS      = ['Fox', 'Wolf', 'Bear', 'Eagle', 'Tiger', 'Hawk', 'Lion', 'Shark', 'Raven', 'Drake'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomName()  { return `${pick(ADJECTIVES)}${pick(NOUNS)}`; }
// Golden-ratio hue spread → visually distinct colors even with many users
function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 75%, 58%)`;
}

// MongoDB aggregation → top-5 owners by block count
async function computeLeaderboard() {
  return Block.aggregate([
    { $match: { ownerId: { $exists: true, $ne: null } } },
    { $group: { _id: '$ownerId', name: { $last: '$ownerName' }, color: { $last: '$ownerColor' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: 1, color: 1, count: 1 } },
  ]);
}

async function registerHandlers(io, socket) {
  const user = { id: socket.id, name: randomName(), color: randomColor() };

  const grid = await Block.find({});
  socket.emit('init', { grid, user });
  socket.emit('leaderboard', await computeLeaderboard());

  // ── Claim a block ──────────────────────────────────────────────
  socket.on('claim', async ({ blockId }) => {
    const now = Date.now();
    const lastClaim = cooldowns.get(socket.id) || 0;
    const remaining = COOLDOWN_MS - (now - lastClaim);

    if (remaining > 0) {
      socket.emit('claim_rejected', { reason: 'cooldown', cooldownRemaining: remaining });
      return;
    }

    cooldowns.set(socket.id, now);

    await Block.findByIdAndUpdate(
      blockId,
      { _id: blockId, ownerId: user.id, ownerName: user.name, ownerColor: user.color, claimedAt: new Date() },
      { upsert: true, new: true }
    );

    io.emit('block_updated', {
      blockId,
      ownerId:    user.id,
      ownerName:  user.name,
      ownerColor: user.color,
    });

    io.emit('leaderboard', await computeLeaderboard());
  });

  // owner-only check prevents other users from wiping someone else's block
  socket.on('unclaim', async ({ blockId }) => {
    const block = await Block.findById(blockId);
    if (!block || block.ownerId !== user.id) return;

    await Block.findByIdAndDelete(blockId);
    io.emit('block_cleared', { blockId });
    io.emit('leaderboard', await computeLeaderboard());
  });

  socket.on('disconnect', () => {
    cooldowns.delete(socket.id);
  });
}

module.exports = registerHandlers;
