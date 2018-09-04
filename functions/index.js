const admin = require("firebase-admin");
const cors = require("cors")({ origin: false });
const auth0 = require("auth0-js");
const functions = require("firebase-functions");

// https://community.auth0.com/t/no-way-to-delegate-firebase-token-with-v8-web-sdk/6904/7

var auth0Web = new auth0.WebAuth({
  domain: "code82.auth0.com",
  clientID: "lGYegv04mhYn0lTILyPqM9xaIEuNS_DM"
});

var serviceAccount = require("./service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://vuejs-83403.firebaseio.com"
});

exports.delegateToken = functions.https.onRequest((req, res) => {
  req.set("Access-Control-Allow-Origin", "*");
  req.set("Access-Control-Allow-Methods", "POST");
  req.set("Access-Control-Allow-Headers", "*");
  req.set("Access-Control-Allow-Credentials", "true");
  // if (req.method === "OPTIONS") {
  //   res.status(204).send("");
  // }
  cors(req, res, () => {
    let userId = req.body.userId;
    const accessToken = req.headers.authorization.split("Bearer ")[1];

    auth0Web.client.userInfo(accessToken, (err, user) => {
      if (err) {
        console.log(err);
        res.status(403).send("Unauthorized");
      } else {
        if (userId === user.user_id) {
          admin
            .auth()
            .createCustomToken(userId)
            .then(customToken => {
              res.send(customToken);
              return customToken;
            })
            .catch(error => {
              console.log("Error creating custom token:", error);
            });
        } else {
          res.status(403).send("Unauthorized");
        }
      }
    });
  });
});
