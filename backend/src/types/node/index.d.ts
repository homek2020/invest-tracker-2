declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
  on(event: 'SIGINT' | 'SIGTERM', handler: () => void): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  exit(code?: number): never;
};
