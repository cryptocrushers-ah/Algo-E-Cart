declare module "@perawallet/connect" {
  interface PeraWalletConnect {
    connector?: {
      createSession: () => Promise<{ uri: string }>;
      on: (event: string, callback: () => void) => void;
    };
  }
}
