//routes/player.js
const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');
const Leaderboard = require('../models/leaderboard');
const { MongoClient } = require('mongodb');
const authMiddleware = require('../middlewares/auth');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
}

// Serving HTML form for adding new player
router.get('/add-player', (req, res) => {
    res.render('add-player.njk');
});

// Handling form submission to add a new player
router.post('/add-player', async (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).send('Error parsing form data.');
        }

        const playerName = fields.player[0];
        const playerScore = parseInt(fields.score[0], 10);

        if (!playerName || isNaN(playerScore)) {
            return res.status(400).send('Invalid player data.');
        }

        try {
            // Handle avatar upload
            let avatarPath = null;
            if (files.avatar && files.avatar[0]) {
                const avatar = files.avatar[0];
                const tempPath = avatar.path;
                const fileName = avatar.originalFilename;
                const targetPath = path.join(__dirname, '../uploads', fileName);

                fs.renameSync(tempPath, targetPath);
                avatarPath = `/uploads/${fileName}`;
            }

            // Save player data to MongoDB
            const newPlayer = new Leaderboard({
                player: playerName,
                score: playerScore,
                avatar: avatarPath,
            });

            await newPlayer.save();
            res.redirect('/leaderboard');
        } catch (err) {
            console.error('Error saving player:', err);
            res.status(500).send('Error saving player.');
        }
    });
});

// Handling player deletion
router.post('/delete-player', async (req, res) => {
    const playerName = req.body.player;

    try {
        const player = await Leaderboard.findOneAndDelete({ player: playerName });

        if (!player) {
            return res.status(404).send('Player not found.');
        }

        if (player.avatar) {
            const avatarPath = path.join(__dirname, '../', player.avatar.replace('/uploads', 'uploads'));
            fs.unlink(avatarPath, err => {
                if (err) console.error(`Error deleting avatar file: ${err}`);
            });
        }

        res.redirect('/leaderboard');
    } catch (err) {
        console.error('Error deleting player:', err);
        res.status(500).send('Internal server error.');
    }
});

// Update score page (GET)
router.get('/update-score', authMiddleware, (req, res) => {
    res.render('update-score.njk');
});


// Update player score route
router.post('/update-score', async (req, res) => {
    const { player, score } = req.body;

    if (!player || isNaN(score)) {
        return res.status(400).send('Invalid player or score.');
    }

    try {
        // Find the player by name and update their score
        const updatedPlayer = await Leaderboard.findOneAndUpdate(
            { player: player },
            { $set: { score: score } },
            { new: true }  // Return the updated player
        );

        if (!updatedPlayer) {
            return res.status(404).send('Player not found.');
        }

        console.log(`Updated ${updatedPlayer.player}'s score to ${updatedPlayer.score}`);
        res.redirect('/leaderboard');  // Redirect back to leaderboard
    } catch (err) {
        console.error('Error updating score:', err);
        res.status(500).send('Error updating player score.');
    }
});

module.exports = router;
