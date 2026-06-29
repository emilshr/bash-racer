import { connection } from "next/server";
import { experimental_upgradeWebSocket, type WebSocketData } from "@vercel/functions";

export const maxDuration = 300;

export async function GET() {
  await connection();

  return experimental_upgradeWebSocket((ws) => {
    ws.on("message", (data: WebSocketData) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        ws.send(data);
      }
    });
  });
}
