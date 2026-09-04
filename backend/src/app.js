const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const workspaceMemberRoutes = require("./routes/workspaceMemberRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectMemberRoutes = require("./routes/projectMemberRoutes");
const projectFileRoutes = require("./routes/projectFileRoutes");
const fileRoutes = require("./routes/fileRoutes");
const documentRoutes = require("./routes/documentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const workspaceFileRoutes = require("./routes/workspaceFileRoutes");
const projectActivityRoutes = require("./routes/projectActivityRoutes");
const messageRoutes = require("./routes/messageRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const organizationMemberRoutes = require("./routes/organizationMemberRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const organizationChatRoutes = require("./routes/organizationChatRoutes");

const notificationRoutes =
  require(
    "./routes/notificationRoutes"
  );

  
const superAdminRoutes =
  require("./routes/superAdminRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "COLLABSPHERE API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "COLLABSPHERE API is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use(
  "/api/organizations",
  organizationRoutes
);
app.use(
  "/api/organizations",
  organizationMemberRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

app.use("/api", projectRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces", workspaceMemberRoutes);

app.use("/api/workspaces", projectMemberRoutes);
app.use("/api", projectFileRoutes);
app.use(
  "/api",
  workspaceFileRoutes
);

app.use("/api", fileRoutes);
app.use("/api", projectActivityRoutes);
app.use("/api/documents", documentRoutes);

app.use("/api/workspaces", taskRoutes);
app.use(
  "/api/tasks",
  taskRoutes
);

app.use("/api", messageRoutes);

app.use(
  "/api/organization-chat",
  organizationChatRoutes
);




app.use(
  "/api/notifications",
  notificationRoutes
);






app.use(
  "/api/superadmin",
  superAdminRoutes
);


module.exports = app;
