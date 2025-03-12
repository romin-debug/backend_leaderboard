const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Route to download leaderboard as CSV
router.get('/download-leaderboard', (req, res) => {
    const csvContent = leaderboard.map(player => `${player.player},${player.score}`).join('\n');
    const filePath = path.join(__dirname, 'leaderboard.csv');

    fs.writeFileSync(filePath, `Player,Score\n${csvContent}`);
    res.download(filePath, 'leaderboard.csv', (err) => {
        if (err) {
            return res.status(500).send('Error downloading file.');
        }
    });
});

module.exports = router;
