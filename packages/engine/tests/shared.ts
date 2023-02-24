import path from "node:path";

type FixtureName = "parser" | "traverse";

export function createFixture(fixtureName: FixtureName) {
  return (fileName: string, ...args: string[]) => {
    return path.join(__dirname, "fixtures", fixtureName, fileName, ...args);
  };
}
