const express = require("express")
const authMiddleware = require("./middleware/authMiddleware")
const connectToDb = require("./config/db.js")

const app = express();
connectToDb()

app.all("/", (req, res) => {
    res.json({ status: true, msg: "Server Running" })
})

app.all('/public', (req, res) => {
    res.json({ status: true, msg: "Public Route" })
})

app.all('/private', authMiddleware, (req, res) => {
    res.json({ status: true, msg: "Welcome to private route" })
})

app.listen(3000, (err) => {
    if (err) return console.log("Error while starting the server", err);
    console.log("Running on port 3000")
})