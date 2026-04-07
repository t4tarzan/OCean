import type { RPCSchema } from "electrobun";

export type MainRPC = {
  bun: RPCSchema<{
    requests: {
      ping: {
        params: Record<string, never>;
        response: string;
      };
      fetchUrl: {
        params: { url: string };
        response: {
          title: string;
          description: string;
          excerpt: string;
          statusCode: number;
        } | null;
      };
    };
    messages: {
      log: { msg: string };
    };
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: Record<string, never>;
  }>;
};
