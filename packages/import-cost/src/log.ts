export const defaultLog = {
  info: (...args: any[]) => {
    console.log(...args);
    const time = new Date().toLocaleTimeString();
    console.log(`[INFO ${time}] ${args.join(" ")}`);
  },
  error: (...args: any[]) => {
    console.error(...args);
    const time = new Date().toLocaleTimeString();
    for (let i = 0; i < args.length; i++) {
      if (args[i] instanceof Error) {
        const err = args[i] as Error;
        args[i] = `[ERROR ${err.name}] ${err.message}\n${err.stack}`;
      }
    }
    console.error(`[ERROR ${time}] ${args.join(" ")}`);
  }
} as const;
