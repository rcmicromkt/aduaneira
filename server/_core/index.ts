import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function createExpressApp() {
  const app = express();

  // Configure body parser with larger size limit
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

// Support for traditional Node.js server (Development)
if (process.env.NODE_ENV === "development") {
  const startLocalServer = async () => {
    const net = await import("net");

    function isPortAvailable(port: number): Promise<boolean> {
      return new Promise(resolve => {
        const server = net.createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on("error", () => resolve(false));
      });
    }

    async function findAvailablePort(startPort: number = 3000): Promise<number> {
      for (let port = startPort; port < startPort + 20; port++) {
        if (await isPortAvailable(port)) {
          return port;
        }
      }
      throw new Error(`No available port found starting from ${startPort}`);
    }

    const app = await createExpressApp();
    const server = createServer(app);
    await setupVite(app, server);

    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  };

  startLocalServer().catch(console.error);
}

// Cloudflare Workers / Production entry point
// Note: If running on Workers, we'll need an adapter like `hono` or a custom bridge
// For now, we export the app for potential use in Cloudflare Pages Functions
const appPromise = createExpressApp().then(async app => {
  if (process.env.NODE_ENV !== "development") {
    serveStatic(app);
  }
  return app;
});

export default {
  async fetch(request: any, env: any, ctx: any) {
    // This is a placeholder for Cloudflare Workers compatibility.
    // In a real Worker environment, Express needs an adapter.
    // However, Cloudflare Pages with "nodejs_compat" might support this 
    // depending on how it's bundled.
    console.log("Worker fetch received:", request.url);
    return new Response("API is running (Worker Mode). Please use /api/trpc", { status: 200 });
  }
};
