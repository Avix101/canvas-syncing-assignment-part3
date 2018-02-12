const http = require('http');
const app = require('express')();

// Allows for path resolution, which is required by express
const path = require('path');

const server = http.Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || process.env.NODE_PORT || 3000;

server.listen(port);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../client/index.html`));
});

const users = {};
const usernames = {};

const onUpdateUser = (socket) => {
  socket.on('updateUser', (data) => {
    const message = data;
    if (!users[socket.id]) {
      users[socket.id] = message.user;
      usernames[socket.id] = message.username;
      message.user.color = 'red';
      io.sockets.in('room1').emit('updateUser', message);
    } else if (users[socket.id].lastUpdate < message.user.lastUpdate) {
      users[socket.id] = message.user;
      message.user.color = 'red';
      io.sockets.in('room1').emit('updateUser', message);
    }
  });
};

const onUserDisconnect = (socket) => {
  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('removeUser', { username: usernames[socket.id] });
    delete usernames[socket.id];
    delete users[socket.id];
  });
};

io.on('connection', (socket) => {
  socket.join('room1');
  onUpdateUser(socket);
  onUserDisconnect(socket);

  const userObjects = Object.keys(users);
  for (let i = 0; i < userObjects.length; i++) {
    const user = users[userObjects[i]];
    socket.emit('updateUser', { username: usernames[userObjects[i]], user });
  }
});
