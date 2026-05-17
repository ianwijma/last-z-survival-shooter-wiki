import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD");
  return stdout.trim();
}

export async function getCommitHash(): Promise<string> {
  const { stdout } = await execAsync("git rev-parse HEAD");
  return stdout.trim();
}

export async function getShortCommitHash(): Promise<string> {
  const { stdout } = await execAsync("git rev-parse --short HEAD");
  return stdout.trim();
}

export async function hasUncommittedChanges(): Promise<boolean> {
  const { stdout } = await execAsync("git status --porcelain");
  return stdout.trim().length > 0;
}

export async function stageAll(): Promise<void> {
  await execAsync("git add -A");
}

export async function commit(message: string): Promise<string> {
  const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  return stdout.trim();
}

export async function createBranch(name: string): Promise<void> {
  await execAsync(`git checkout -b ${name}`);
}

export async function checkoutBranch(name: string): Promise<void> {
  await execAsync(`git checkout ${name}`);
}

export async function getFileLastModified(path: string): Promise<string> {
  const { stdout } = await execAsync(`git log -1 --format=%cI -- "${path}"`);
  return stdout.trim() || new Date().toISOString();
}

export async function isGitRepo(): Promise<boolean> {
  try {
    await execAsync("git rev-parse --git-dir");
    return true;
  } catch {
    return false;
  }
}
