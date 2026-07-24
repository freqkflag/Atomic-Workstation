import { join } from "node:path";
import { startServer } from "./server.js";

const dataDir = process.env.ATOMIC_DATA_DIR ?? join(process.cwd(), "data");
const port = Number(process.env.ORCHESTRATOR_PORT ?? 4310);
const host = process.env.ORCHESTRATOR_HOST ?? "127.0.0.1";

startServer({ dataDir, port, host }).catch((err) => {
  console.error(err);
  process.exit(1);
});
