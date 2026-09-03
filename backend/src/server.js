require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDatabase = require("./config/database");
const { Server } = require("socket.io");

const collaborationServer =
  require("./collaboration/collaborationServer");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {

  console.log(
    "Socket connected:",
    socket.id
  );


  // ================================
  // PROJECT CHAT
  // ================================

  socket.on(
    "join-project",
    ({ projectId }) => {

      const room =
        `project:${projectId}`;

      socket.join(room);

      console.log(
        `${socket.id} joined ${room}`
      );

    }
  );


  socket.on(
    "leave-project",
    ({ projectId }) => {

      const room =
        `project:${projectId}`;

      socket.leave(room);

      console.log(
        `${socket.id} left ${room}`
      );

    }
  );


  // ================================
  // PRIVATE / 1-TO-1 CHAT
  // ================================

  socket.on(
    "join-conversation",
    ({ conversationId }) => {

      if (!conversationId) return;

      const room =
        `conversation:${conversationId}`;

      socket.join(room);

      console.log(
        `${socket.id} joined ${room}`
      );

    }
  );


  socket.on(
    "leave-conversation",
    ({ conversationId }) => {

      if (!conversationId) return;

      const room =
        `conversation:${conversationId}`;

      socket.leave(room);

      console.log(
        `${socket.id} left ${room}`
      );

    }
  );


  // ================================
  // DISCONNECT
  // ================================

  socket.on("disconnect", () => {

    console.log(
      "Socket disconnected:",
      socket.id
    );

  });

});


const startServer = async () => {

  await connectDatabase();

  server.listen(PORT, () => {

    console.log(
      `🚀 COLLABSPHERE backend running on port ${PORT}`
    );

  });

  collaborationServer.listen();
};

startServer();