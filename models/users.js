//models/user_models.js
const mongoose = require("mongoose");
const pbkdf2 = require("pbkdf2-password");
const hash = pbkdf2();
const {admin_password} = require("../credentials.js");

const userSchema = new mongoose.Schema({
    user: {type: String, required: true},
    password: {type: String, required: true},
    salt: {type: String, required: true},
    clear_pw: {type: String},
}, {
    statics: {
        // authenticate method updated to handle async correctly
        async authenticate(user, pw) {
            console.log('Authenticating user: ', user);

            try {
                let doc = await this.findOne({user}); // Ensure to await the async findOne
                if (doc) {
                    let salt = doc.salt;
                    console.log('Salt: ', salt);

                    return new Promise((resolve, reject) => {
                        hash({password: pw, salt: salt}, (err, pass, salt, hashed) => {
                            if (err) return reject(err);
                            if (hashed === doc.password) {
                                resolve(true); // Password matched
                            } else {
                                resolve(false); // Password did not match
                            }
                        });
                    });
                } else {
                    console.log("No user found");
                    return false; // No user found
                }
            } catch (err) {
                console.log("Error during authenticating:", err);
                return false; // Error during authentication
            }
        },
    }
});

const User = mongoose.model("user", userSchema);

async function seedUser() {
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection is not established.');
    }

    const newUser = new User({
        user: 'Admin',
        password: '',
        salt: '',
    });

    // Hash the password
    await new Promise((resolve, reject) => {
        hash({password: 'SuperSecret'}, (err, pass, salt, hashed) => {
            if (err) return reject(err);
            newUser.password = hashed;
            newUser.salt = salt;
            resolve();
        });
    });

    // Drop the users collection if it exists
    const collections = await mongoose.connection.db.listCollections({name: 'users'}).toArray();
    if (collections.length > 0) {
        await mongoose.connection.db.collection('users').drop();
        console.log('Users collection dropped.');
    }

    // Save the new user
    await newUser.save();
    console.log("Admin user seeded successfully.");
}

module.exports = {
    User: User,
    seedUser: seedUser,
};
