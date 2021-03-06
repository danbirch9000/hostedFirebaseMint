const express = require('express');
const config = require("./config");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const firebaseAdmin = require("firebase-admin");
const functions = require("firebase-functions");
const cors = require("cors");

// Auth0 athentication middleware
const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${config.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: config.AUTH0_API_AUDIENCE,
    issuer: `https://${config.AUTH0_DOMAIN}/`,
    algorithm: "RS256"
});

// Initialize Firebase Admin with service account
const serviceAccount = require(config.FIREBASE_KEY);
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: config.FIREBASE_DB
});

const app = express();
app.use(cors({ origin: true }))
// GET object containing Firebase custom token
app.get("/auth", jwtCheck, (req, res) => {
    console.log(req);
    // Create UID from authenticated Auth0 user
    const uid = req.user.sub;
    // Mint token using Firebase Admin SDK
    firebaseAdmin
        .auth()
        .createCustomToken(uid)
        .then(customToken =>
            // Response must be an object or Firebase errors
            res.json({ firebaseToken: customToken })
        )
        .catch(err =>
            res.status(500).send({
                message: "Something went wrong acquiring a Firebase token.",
                error: err
            })
        );
});

const api = functions.https.onRequest(app);

module.exports = {
    api
};


