require("dotenv").config();

const connectDatabase =
  require("./config/database");

const collaborationServer =
  require("./collaboration/collaborationServer");

const startCollaborationServer =
  async () => {
    try {
      await connectDatabase();

      await collaborationServer.listen();

      console.log(
        "🚀 COLLABSPHERE collaboration server started"
      );
    } catch (error) {
      console.error(
        "❌ Collaboration server failed:",
        error
      );

      process.exit(1);
    }
  };

startCollaborationServer();