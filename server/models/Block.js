const mongoose = require('mongoose');

// _id is a "row-col" string key (e.g. "12-5")
const blockSchema = new mongoose.Schema({
  _id: String,
  ownerId: String,
  ownerName: String,
  ownerColor: String,
  claimedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Block', blockSchema);
