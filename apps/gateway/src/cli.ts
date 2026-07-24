#!/usr/bin/env node
import { startGatewayServer } from "./server.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";

startGatewayServer({ port, host }).catch((err) => {
  console.error(err);
  process.exit(1);
});
