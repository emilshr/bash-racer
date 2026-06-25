import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { env } from "./lib/env";
import { initSocketServer } from "./lib/socket/server";

const dev = env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`> Bash Racer ready on http://localhost:${env.PORT}`);
  });
});
