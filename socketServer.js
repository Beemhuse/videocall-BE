const io = require('./server').io;

const allKnownOffers = {};
const connectedSockets = {};

io.on('connection', (socket) => {
    const userName = socket.handshake.auth.userName;

    // Log the connection
    console.log(`${socket.id} connected as ${userName}`);

    // Store the connected socket
    connectedSockets[socket.id] = { userName, socket };

    // Handle new offers
    socket.on('newOffer', ({ offer, apptInfo }) => {
        allKnownOffers[apptInfo.uuid] = {
            offer,
            professionalsFullName: apptInfo.professionalsFullName,
            clientName: apptInfo.clientName,
            apptDate: apptInfo.apptDate,
            offererIceCandidates: [],
            answerIceCandidates: [],
            answer: null // Initialize answer as null
        };
        // Emit the offer to the other party
        const recipientSocketId = findRecipientSocketId(apptInfo.clientName);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('offerReceived', { offer, from: userName, uuid: apptInfo.uuid });
        }
    });

    // Handle answer
    socket.on('answer', ({ answer, uuid }) => {
        if (allKnownOffers[uuid]) {
            allKnownOffers[uuid].answer = answer;
            const offererSocketId = findRecipientSocketId(allKnownOffers[uuid].professionalsFullName);
            if (offererSocketId) {
                io.to(offererSocketId).emit('answerReceived', { answer, uuid });
            }
        }
    });

    // Handle ICE candidates
    socket.on('iceCandidate', ({ candidate, uuid, from }) => {
        const otherParty = from === userName ? allKnownOffers[uuid].clientName : allKnownOffers[uuid].professionalsFullName;
        const recipientSocketId = findRecipientSocketId(otherParty);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('iceCandidateReceived', { candidate, uuid });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`${socket.id} (${userName}) disconnected`);
        delete connectedSockets[socket.id];
    });
});

// Utility function to find recipient's socket ID by username
function findRecipientSocketId(userName) {
    for (let id in connectedSockets) {
        if (connectedSockets[id].userName === userName) {
            return id;
        }
    }
    return null;
}
