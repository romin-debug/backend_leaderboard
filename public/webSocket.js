//Romin Patel - 3164066- Gamer Leaderboard

const WebSocket = require('ws');
const Player = require('../models/players');

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    // Broadcast leaderboard on connection
    const sendLeaderboardUpdate = async () => {
        const leaderboard = await Player.find().sort({ score: -1 });
        ws.send(JSON.stringify({ type: 'leaderboardUpdate', leaderboard }));
    };

    sendLeaderboardUpdate();

    ws.on('message', (message) => {
        console.log('Received:', message);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Function to initialize the WebSocket connection
function initWebSocket() {
    const socket = new WebSocket('ws://localhost:3000');

    socket.addEventListener('open', () => {
        console.log('WebSocket connection opened');
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);

        // Updating leaderboard or other UI components based on server data
        if (data.type === 'leaderboardUpdate') {
            updateLeaderboard(data.leaderboard);
        }
    });

    socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Function to send messages to the WebSocket server
    function sendMessage(message) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.log('WebSocket is not open.');
        }
    }

    sendMessage({type: 'greeting', message: 'Hello from client!'});
}

// Updating the leaderboard based on WebSocket data
function updateLeaderboard(leaderboard) {
    // Example logic to update leaderboard in the UI
    const leaderboardContainer = document.getElementById('leaderboard');
    leaderboardContainer.innerHTML = ''; // Clear current leaderboard

    leaderboard.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.textContent = `${player.player}: ${player.score}`;
        leaderboardContainer.appendChild(playerElement);
    });
}

// Initialize WebSocket when the page is loaded
window.addEventListener('load', initWebSocket);
