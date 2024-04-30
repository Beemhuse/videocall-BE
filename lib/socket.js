
// Import necessary modules
const io = require('socket.io');
const users = require('./users');  // Manages user sessions and IDs.

module.exports = (server) => {
  const serverIo = io({
    path: '/bridge',
    serveClient: false
  }).listen(server);

  // Store information about each call room
  const calls = {};

  // Handle incoming connections
  serverIo.on('connection', socket => {
    // console.log('A client connected:', socket.id);

    // Handle user initialization
    socket.on('init', (userData) => {
      if (userData && userData.id && userData.name) {
        const user = users.createOrUpdate(socket, userData.id, userData.name);
        if (user) {
          socket.emit('init', { id: userData.id, name: userData.name });
          console.log(`User registered: ${userData.name} with ID ${userData.id}`);
        } else {
          socket.emit('error', { message: 'Failed to register user.' });
        }
      } else {
        socket.emit('error', { message: 'Invalid user data provided.' });
      }
    });

    // Handle call creation
    socket.on('create-call', data => {
      console.log('Creating call:', data);
      const receiver = users.get(data.to);
      if (receiver && receiver.emit) {
        const callId = `call_${new Date().getTime()}`; // Generate a unique call ID
        // Initialize call information
        calls[callId] = { caller: socket.id, receiver: data.to };
        // Emit the event to the receiver to prompt the modal
        receiver.emit('call-created', { from: socket.id, callId: callId });
        console.log('Call created with ID:', callId);
      } else {
        console.log('Receiver not found or is not a socket:', data.to);
        socket.emit('error', { message: 'Receiver not found or is not a socket' });
      }
    });
    
    // Handle WebRTC offer messages
socket.on('webrtc_offer', (event) => {
  console.log("webrtc_offer ==> ", event);
  const callId = getCallIdForUser(socket.id);
  if (callId) {
    console.log(`Broadcasting webrtc_offer event to peers in call ${callId}`);
    const call = calls[callId];
    const receiver = users.get(call.receiver);
    if (receiver && receiver.emit) {
      receiver.emit('webrtc_offer', { sdp: event.sdp, from: socket.id });
    } else {
      console.log('Receiver not found or is not a socket:', call.receiver);
      socket.emit('error', { message: 'Receiver not found or is not a socket' });
    }
  } else {
    console.log('User is not in a call');
    socket.emit('error', { message: 'User is not in a call' });
  }
});

    // Handle WebRTC answer messages
    socket.on('webrtc_answer', (event) => {
      console.log("webrtc_answer ==> ", event);
      const callId = getCallIdForUser(socket.id);
      if (callId) {
        console.log(`Broadcasting webrtc_answer event to peers in call ${callId}`);
        const call = calls[callId];
        const receiver = users.get(call.receiver);
        if (receiver && receiver.emit) {
          receiver.emit('webrtc_answer', { sdp: event.sdp, from: socket.id });
        } else {
          console.log('Receiver not found or is not a socket:', call.receiver);
          socket.emit('error', { message: 'Receiver not found or is not a socket' });
        }
      } else {
        console.log('User is not in a call');
        socket.emit('error', { message: 'User is not in a call' });
      }
    });
    
    // Handle WebRTC ICE candidate messages
    socket.on('webrtc_ice_candidate', (event) => {
      const callId = getCallIdForUser(socket.id);
      if (callId) {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in call ${callId}`);
        const call = calls[callId];
        const receiver = users.get(call.receiver);
        if (receiver && receiver.emit) {
          receiver.emit('webrtc_ice_candidate', { candidate: event.candidate, from: socket.id });
        } else {
          console.log('Receiver not found or is not a socket:', call.receiver);
          socket.emit('error', { message: 'Receiver not found or is not a socket' });
        }
      } else {
        console.log('User is not in a call');
        socket.emit('error', { message: 'User is not in a call' });
      }
    });
    
    // Function to get the call ID for a user
    function getCallIdForUser(userId) {
      for (const callId in calls) {
        const call = calls[callId];
        if (call.caller === userId || call.receiver === userId) {
          return callId;
        }
      }
      return null;
    }
    
    
    // Function to get the room ID for a user
    function getRoomIdForUser(userId) {
      for (const roomId in rooms) {
        if (rooms[roomId].includes(userId)) {
          return roomId;
        }
      }
      return null;
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`${socket.id} disconnected`);
      // Remove the socket from all rooms it was part of
      for (const roomId in rooms) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];  // Delete the room if it's empty
        }
      }
      users.remove(socket.id);
    });
  });
};
