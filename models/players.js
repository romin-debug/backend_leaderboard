const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    player: {type: String, required: true, minLength: 3},
    score: {type: Number, required: true, minLength: 0},
    avatar: {type: String},
    lastPlayed : Date
});
// Function to calculate player statistics
playerSchema.methods.calculateStats = function () {
    const totalGames = this.score.length;
    const totalScore = this.score.reduce((sum, score) => sum + score, 0);
    const averageScore = totalGames > 0 ? (totalScore / totalGames).toFixed(2) : 0;
    const lastGameScore = totalGames > 0 ? this.score[totalGames - 1] : 0;

    return {
        totalGames,
        totalScore,
        averageScore,
        lastGameScore,
        lastPlayed: this.lastPlayed,
    };
};

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;