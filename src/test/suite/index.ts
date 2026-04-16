import * as path from "path";
import Mocha = require("mocha");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { sync: globSync } = require("glob") as {
  sync: (pattern: string, opts: { cwd: string }) => string[];
};

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true });
  const testsRoot = path.resolve(__dirname, ".");

  return new Promise((resolve, reject) => {
    try {
      const files = globSync("**/*.test.js", { cwd: testsRoot });
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
