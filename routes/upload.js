const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

// Handling file upload (player avatars)
router.post('/upload-avatar', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        if (err) return res.status(500).send('Error parsing the file.');

        const playerName = fields.player[0];
        const playerIndex = leaderboard.findIndex(p => p.player === playerName);

        if (playerIndex !== -1 && files.avatar) {
            const tempPath = files.avatar[0].path;
            const filePath = path.join(__dirname, 'uploads', files.avatar[0].originalFilename);

            fs.rename(tempPath, filePath, (err) => {
                if (err) return res.status(500).send('Error saving the file.');

                leaderboard[playerIndex].avatar = `/uploads/${files.avatar[0].originalFilename}`;
                broadcastLeaderboard();
                res.redirect('/leaderboard');
            });
        } else {
            res.status(404).send('Player not found or no file uploaded.');
        }
    });
});

module.exports = router;
