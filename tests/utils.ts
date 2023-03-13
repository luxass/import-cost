import path from "node:path";

export function createFixture(fixtureName: string) {
  return (fileName: string, ...args: string[]) => {
    return path.join(__dirname, "fixtures", fixtureName, fileName, ...args);
  };
}
