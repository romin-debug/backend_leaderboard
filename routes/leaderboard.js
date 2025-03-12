//routes/leaderboard.js
const express = require('express');
const app = express();
const router = express.Router();
const http = require("http");
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({server});
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/auth');
const fs = require('fs')
const Leaderboard = require('../models/leaderboard');


// Gamer information
let leaderboard = [
    {player: 'Alice', score: 50, avatar: '/uploads/alice.png'},
    {player: 'Bob', score: 40, avatar: '/uploads/bob.png'},
    {player: 'Charlie', score: 30, avatar: '/uploads/charlie.png'}
];
router.use(authMiddleware);
console.log('Leaderboard type:', typeof leaderboard);
console.log('Leaderboard data:', leaderboard);


// Automatically redirect to the leaderboard on server start
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/leaderboard'); // Redirect to leaderboard if logged in
    } else {
        res.redirect('/user/login'); // Otherwise, show login page
    }
});

// Leaderboard route to display players and scores using Query String Params
router.get('/leaderboard', async (req, res) => {
    console.log('Session user: ', req.session.user);
    const filter = req.query.filter; // optional query parameter to filter results
    let filteredLeaderboard = await Leaderboard.find();

    if (filter === 'top') {
        filteredLeaderboard = filteredLeaderboard.slice(0, 3); // Show top 3 players
    }

    res.render('leaderboard.njk', {leaderboard: filteredLeaderboard});
});

router.get('/download-leaderboard', (req, res) => {
    const csvData = leaderboard.map(player =>
        `${player.player},${player.score},${player.avatar || ''}`).join('\n');
    const filePath = path.join(__dirname, 'leaderboard.csv');

    fs.writeFileSync(filePath, `Player,Score,Avatar\n${csvData}`);

    res.download(filePath, 'leaderboard.csv', (err) => {
        if (err) {
            console.error('Error downloading CSV:', err);
            res.status(500).send('Error generating CSV');
        }
    });
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads/');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}_${file.originalname}`);
    }
});

const upload = multer({storage: storage});

router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const {player} = req.body;
        if (!player || !req.file) {
            return res.status(400).send('Player or avatar missing.');
        }

        const avatarPath = `/uploads/${req.file.filename}?${Date.now()}`;
        console.log('Uploaded avatar path:', avatarPath);

        // Update in-memory leaderboard
        let playerEntry = leaderboard.find(p => p.player === player);
        if (playerEntry) {
            playerEntry.avatar = avatarPath;
        } else {
            leaderboard.push({player, score: 0, avatar: avatarPath});
        }

        // Update MongoDB as well
        await Leaderboard.findOneAndUpdate(
            { player },
            { avatar: avatarPath },
            { upsert: true, new: true }
        );

        broadcastLeaderboard(); // Notify WebSocket clients about the change
        res.redirect('/leaderboard');
    } catch (err) {
        console.error('Error in uploading avatar:', err);
        res.status(500).send('Error uploading avatar.');
    }
});


const broadcastLeaderboard = async () => {
    const updatedLeaderboard = await Leaderboard.find(); // Fetch from MongoDB
    const data = JSON.stringify({type: 'leaderboardUpdate', updatedLeaderboard});
    console.log("Broadcasting leaderboard: ", data)

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// WebSocket event handling (for real-time leaderboard)
wss.on('connection', ws => {
    console.log('New WebSocket connection');
    ws.send(JSON.stringify({type: 'leaderboardUpdate', leaderboard}));

    ws.on('message', message => {
        const data = JSON.parse(message);
        if (data.type === 'updateScore') {
            const player = leaderboard.find(p => p.player === data.player);
            if (player) {
                player.score += data.score;//updating player score
                broadcastLeaderboard(); //notify updated leaderboard
            }
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});


module.exports = router;
