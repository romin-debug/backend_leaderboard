//models/leaderboard_model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderboardSchema = new Schema({
    player: {type: String, required: true, unique: true},
    score: {type: Number, required: true, default: 0},
    avatar: {type: String, required: true, default: null}
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;
