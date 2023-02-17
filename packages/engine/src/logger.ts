/* eslint-disable no-console */

import type { Logger } from "./types";

export const defaultLog: Logger = {
  info: (...args: any[]) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[INFO ${time}] ${args.join(" ")}`);
  },
  error: (...args: any[]) => {
    const time = new Date().toLocaleTimeString();
    for (let i = 0; i < args.length; i++) {
      if (args[i] instanceof Error) {
        const err = args[i] as Error;
        args[i] = `[ERROR ${err.name}] ${err.message}\n${err.stack}`;
      }
    }
    console.error(`[ERROR ${time}] ${args.join(" ")}`);
  },
  warn: (...args: any[]) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[WARN ${time}] ${args.join(" ")}`);
  }
};
