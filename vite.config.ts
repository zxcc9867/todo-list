import react from "@vitejs/plugin-react";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { defaultData, normalizeData } from "./src/storage/appData";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(rootDir, "data", "tasks.json");

async function loadAppData() {
  try {
    return normalizeData(JSON.parse(await readFile(dataPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return normalizeData(defaultData);
    }
    throw error;
  }
}

async function saveAppData(data: unknown) {
  const normalizedData = normalizeData(data);
  const directory = path.dirname(dataPath);
  await mkdir(directory, { recursive: true });

  const tempPath = path.join(directory, `.tasks.json.${process.pid}.${Date.now()}.tmp`);
  await writeFile(tempPath, `${JSON.stringify(normalizedData, null, 2)}\n`, "utf8");
  await rename(tempPath, dataPath);
  return normalizedData;
}

async function readRequestBody(request: import("node:http").IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
  }
  return body;
}

function sendJson(response: import("node:http").ServerResponse, statusCode: number, data: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(data));
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "jini-app-data-api",
      configureServer(server) {
        server.middlewares.use("/api/app-data", async (request, response) => {
          try {
            if (request.method === "GET") {
              sendJson(response, 200, await loadAppData());
              return;
            }

            if (request.method === "POST") {
              const body = await readRequestBody(request);
              sendJson(response, 200, await saveAppData(JSON.parse(body)));
              return;
            }

            response.statusCode = 405;
            response.setHeader("Allow", "GET, POST");
            response.end();
          } catch (error) {
            if (error instanceof SyntaxError) {
              sendJson(response, 400, { error: "Invalid JSON" });
              return;
            }

            server.config.logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
            sendJson(response, 500, { error: "Unable to read or write app data" });
          }
        });
      },
    },
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
