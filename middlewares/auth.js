module.exports = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // User is authenticated, proceed
    } else {
        res.redirect('/user/login'); // Redirect to login page if not authenticated
    }
};
