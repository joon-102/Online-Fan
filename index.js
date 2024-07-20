const express = require("express");
const path = require('path');

const webSocket = require("./socket");
const app = express();

app.use(express.static( path.join(__dirname, '/public')))

const express_app = app.listen(3000, function() {
    console.log("listening on http://localhost:3000");
})

webSocket(express_app);