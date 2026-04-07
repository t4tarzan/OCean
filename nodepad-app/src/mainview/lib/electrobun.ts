import { Electroview } from "electrobun/view";
import type { MainRPC } from "shared/rpc";

const rpc = Electroview.defineRPC<MainRPC>({
  maxRequestTime: 30000,
  handlers: {
    requests: {},
    messages: {},
  },
});

export const electrobun = new Electroview({ rpc });

// Expose RPC on window so AI modules can use it without importing electrobun directly
// (avoids issues when running outside Electrobun context)
if (typeof window !== "undefined") {
  (window as any).__electrobun_rpc = rpc;
}
