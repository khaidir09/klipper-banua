import { execSync } from "node:child_process";

/** Resets the demo campaign to a fresh draft before every run. */
export default function globalSetup() {
  execSync("npm run seed:demo:reset", { stdio: "inherit" });
}
