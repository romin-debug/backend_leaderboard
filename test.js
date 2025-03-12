//server.js
require('dotenv').config();
const session = require('express-session');
const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const path = require('path');
const mongoose = require('mongoose');
const {MONGODB, SESSION} = require('./credentials');
const {seedUser} = require('./models/users');
const leaderboardRoutes = require('./routes/leaderboard');
const playerRoutes = require('./routes/player');
const uploadRoutes = require('./routes/upload');
const downloadRoutes = require('./routes/download');

// Create HTTP server for WebSocket
const server = http.createServer(app);

// Setup middlewares
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'njk');

// Session middleware
app.use(session({
    secret: SESSION.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false, httpOnly: true} // set to true only in production
}));

// Configure Nunjucks for templating
nunjucks.configure('views', {
    noCache: true,
    express: app
});

// Import and use routes (all routes are defined in user_routes.js)
const user_routes = require("./routes/user_routes");
app.use("/user", user_routes);  // This mounts the routes in 'user_routes.js' under '/user'

// MongoDB connection and seed
(async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://${MONGODB.user}:${MONGODB.pw}@cluster0.nvdip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
            {useNewUrlParser: true, useUnifiedTopology: true}
        );
        console.log('MongoDB connected successfully.');

        // Seed the database with an admin user if needed
        await seedUser();
        console.log('Admin user seeded successfully.');

        // Start the server after MongoDB is connected
        const port = 3000;
        server.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
})();

// routes
// Use routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(leaderboardRoutes);
app.use(playerRoutes);
app.use(uploadRoutes);
app.use(downloadRoutes);
app.use((req, res, next) => {
    res.locals.session = req.session || {}; // Make session globally available in Nunjucks
    next();
});


// Custom 404 and 500
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.use((err, req, res, next) => {
    console.error('Error stack', err.stack);
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
});


