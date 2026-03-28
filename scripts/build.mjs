import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const nextBin = path.resolve("node_modules", ".bin", "next");

if (existsSync(nextBin)) {
  const child = spawn(nextBin, ["build"], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  const requiredFiles = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/globals.css",
    "tsconfig.json",
    "postcss.config.mjs",
    "package.json",
  ];

  const missingFiles = requiredFiles.filter((file) => !existsSync(path.resolve(file)));
  if (missingFiles.length > 0) {
    console.error("Offline scaffold validation failed. Missing files:");
    for (const file of missingFiles) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  const pageSource = readFileSync(path.resolve("src/app/page.tsx"), "utf8");
  const layoutSource = readFileSync(path.resolve("src/app/layout.tsx"), "utf8");
  const tsconfig = JSON.parse(readFileSync(path.resolve("tsconfig.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(path.resolve("package.json"), "utf8"));

  const hasTitle = pageSource.includes("AgentForge");
  const hasDarkBackground = layoutSource.includes("bg-zinc-950");
  const isStrictTs = tsconfig?.compilerOptions?.strict === true;
  const hasNextDependency = Boolean(pkg?.dependencies?.next);
  const hasTailwindDependency =
    Boolean(pkg?.dependencies?.tailwindcss) || Boolean(pkg?.devDependencies?.tailwindcss);

  if (!hasTitle || !hasDarkBackground || !isStrictTs || !hasNextDependency || !hasTailwindDependency) {
    console.error("Offline scaffold validation failed.");
    if (!hasTitle) {
      console.error("- src/app/page.tsx must render the AgentForge title.");
    }
    if (!hasDarkBackground) {
      console.error("- src/app/layout.tsx must include a dark background class.");
    }
    if (!isStrictTs) {
      console.error("- tsconfig.json must set compilerOptions.strict to true.");
    }
    if (!hasNextDependency) {
      console.error("- package.json must include next as a dependency.");
    }
    if (!hasTailwindDependency) {
      console.error("- package.json must include tailwindcss.");
    }
    process.exit(1);
  }

  console.log("Offline scaffold validation passed.");
}
