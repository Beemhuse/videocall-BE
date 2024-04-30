const fs = require ('fs')
const https = require("https")
const express = require('express')
const cors = require('cors')
const socketio = require('socket.io')
const app = express()
app.use(cors())

app.use(express.static(__dirname + '/public'))
app.use(express.json())

const key = fs.readFileSync('./certs/create-cert-key.pem')
const cert = fs.readFileSync('./certs/create-cert.pem')

const expressServer = https.createServer({key, cert}, app)
const io = socketio(expressServer, {
    cors: ['*']
})

const PORT = process.env.PORT || 9000; // Use the environment variable PORT or default to 3000


expressServer.listen(PORT);

module.exports = {io, expressServer, app}