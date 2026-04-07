import type { RPCSchema } from "electrobun";

export type EnrichParams = {
  text: string;
  context: Array<{
    id: string;
    text: string;
    category?: string;
    annotation?: string;
  }>;
  forcedType?: string;
  category?: string;
};

export type EnrichResponse = {
  contentType: string;
  category: string;
  annotation: string;
  confidence: number | null;
  influencedByIndices: number[];
  isUnrelated: boolean;
  mergeWithIndex: number | null;
  sources?: Array<{ url: string; title: string; siteName: string }>;
} | null;

export type GhostParams = {
  context: Array<{
    text: string;
    category?: string;
    contentType?: string;
  }>;
  previousSyntheses: string[];
};

export type GhostResponse = {
  text: string;
  category: string;
} | null;

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
      enrichBlock: {
        params: EnrichParams;
        response: EnrichResponse;
      };
      generateGhost: {
        params: GhostParams;
        response: GhostResponse;
      };
      getAnthropicKeyStatus: {
        params: Record<string, never>;
        response: { hasKey: boolean };
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
