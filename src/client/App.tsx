import { useEffect, useState } from "react";
import type { AppStatus } from "../shared/status";

type LoadState =
  | { state: "loading" }
  | { state: "ready"; status: AppStatus }
  | { state: "error"; message: string };

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/status");

        if (!response.ok) {
          throw new Error(`Status request failed: ${response.status}`);
        }

        const status = (await response.json()) as AppStatus;

        if (!cancelled) {
          setLoadState({ state: "ready", status });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            state: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Live demo workspace</p>
          <h1>Vibecoding Collective</h1>
          <p className="lede">
            A small event-ready base for building a fast ElevenLabs-powered
            prototype from a local machine, with a public tunnel when outside
            services need to call in.
          </p>
          <div className="demo-marker">
            Tunnel test placeholder
            <span>Open this page through ngrok to confirm the live demo path.</span>
          </div>
        </div>
        <StatusPanel loadState={loadState} />
      </section>
    </main>
  );
}

function StatusPanel({ loadState }: { loadState: LoadState }) {
  if (loadState.state === "loading") {
    return <aside className="status-panel">Checking local server...</aside>;
  }

  if (loadState.state === "error") {
    return (
      <aside className="status-panel status-panel--error">
        <span>Server check failed</span>
        <strong>{loadState.message}</strong>
      </aside>
    );
  }

  const { status } = loadState;

  return (
    <aside className="status-panel">
      <div>
        <span>Mode</span>
        <strong>{status.mode}</strong>
      </div>
      <div>
        <span>API server</span>
        <strong>:{status.environment.port}</strong>
      </div>
      <div>
        <span>ElevenLabs key</span>
        <strong>
          {status.environment.elevenLabsApiKeyConfigured ? "set" : "missing"}
        </strong>
      </div>
      <div>
        <span>MCP URL</span>
        <strong>
          {status.environment.elevenLabsMcpServerUrlConfigured
            ? "set"
            : "missing"}
        </strong>
      </div>
    </aside>
  );
}
