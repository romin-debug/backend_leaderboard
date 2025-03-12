// user_routes.js
const express = require("express");
const router = express.Router();
const {User} = require("../models/users");
const Player = require("../models/players");

router.use((req, res, next) => {
    req.model = User
    next();
})

//Check authentication
function restrict(req, res, next) {
    if (req.session.user) {
        console.log("Access granted")
        next()
    } else {
        console.log("Access denied")
        res.redirect("/user/login")
    }
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log('Checking authentication:', req.session.user);
    if (!req.session.user) {
        console.log("User not authenticated")
        return res.redirect("/user/login");
    }
    console.log("User authenticated: ", req.session.user);
    next();
}

// Login route
router.get("/login", (req, res) => {
    if (req.session.user) {
        console.log("Already authenticated, redirecting to leaderboard");
        return res.redirect("/leaderboard");
    }
    console.log("Not authenticated, rendering login");
    res.render("login.njk");
});

router.post("/login", async (req, res) => {
    try {
        const userAuthenticated = await req.model.authenticate(req.body.user, req.body.password);
        if (userAuthenticated) {
            console.log("Authenticated user");
            req.session.user = req.body.user;
            res.redirect("/leaderboard");
        } else {
            console.log("Authentication failed");
            res.render("login.njk", {error: "Invalid username or password"});
        }
    } catch (err) {
        console.error("Authentication error:", err);
        res.status(500).send("Internal server error");
    }
});


// Restricted content
router.route("/restricted").get(restrict, (req, res) => {
    res.send("Very secret key, User: " + req.session.user);
});


// Route to fetch statistics for a player
router.get('/player-stats/:playerName', async (req, res) => {
    const {playerName} = req.params;

    try {
        const player = await Player.findOne({name: playerName});

        if (!player) {
            return res.status(404).send('Player not found');
        }

        const stats = player.calculateStats();
        res.render('player-stats.njk', {player, stats});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching player statistics');
    }
});

// Protect the leaderboard route with isAuthenticated middleware
router.get("/leaderboard", isAuthenticated, (req, res) => {
    console.log("Session on leaderboard page:", req.session);  // Log session
    res.render("leaderboard.njk");
});

router.get('/', isAuthenticated, (req, res) => {
    console.log("Root route hit");
    res.redirect('/leaderboard');
})

// Protect other routes like adding a player or updating a score
router.get("/update-score", isAuthenticated, (req, res) => {
    res.render("update-score.njk");
});

router.get("/add-player", isAuthenticated, (req, res) => {
    res.render("add-player.njk");
});

//Logout
router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out.');
        }
        res.redirect('/user/login'); // Redirect to login page after logout
    });
});

module.exports = router;
