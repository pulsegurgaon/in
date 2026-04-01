import app from "./app.js";
import { logger } from "./lib/logger.js";
import { refreshNews } from "./lib/newsService.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Initial news fetch on startup
  try {
    logger.info("Starting initial news fetch...");
    const newArticles = await refreshNews();
    logger.info({ newArticles }, "Initial news fetch complete");
  } catch (err) {
    logger.error({ err }, "Initial news fetch failed");
  }

  // Schedule auto-refresh every 30 minutes
  const THIRTY_MINUTES = 30 * 60 * 1000;
  setInterval(async () => {
    try {
      logger.info("Auto-refreshing news...");
      const newArticles = await refreshNews();
      logger.info({ newArticles }, "Auto-refresh complete");
    } catch (err) {
      logger.error({ err }, "Auto-refresh failed");
    }
  }, THIRTY_MINUTES);
});
