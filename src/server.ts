import "dotenv/config";
import app from "./app";
import db from "./config/db.config";

const PORT = process.env.PORT ?? 3000;

async function startServer(): Promise<void> {
  try {
    await db.raw("SELECT 1");
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV ?? "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
