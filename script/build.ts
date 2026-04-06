import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import path from "path";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  await rm("api", { recursive: true, force: true });

  console.log("Building client...");
  await viteBuild();

  console.log("Building Vercel serverless function...");
  await esbuild({
    entryPoints: ["server/vercel.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "api/index.js",
    alias: {
      "@shared": path.resolve("shared"),
    },
    external: ["pg-native", "bufferutil", "utf-8-validate"],
    logLevel: "info",
  });

  console.log("Build complete. api/index.js ready for Vercel.");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
