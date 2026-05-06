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
          <div className="hero-meta">
            <p className="eyebrow">Live demo workspace</p>
            <span>ElevenLabs-ready base</span>
          </div>
          <h1>Vibecoding Collective</h1>
          <p className="lede">
            A live stage for fast voice, audio, and conversational prototypes.
          </p>
          <div className="demo-marker">
            Tunnel test placeholder
            <span>Public path is active when this page loads through ngrok.</span>
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
        <span>Server signal</span>
        <strong>{loadState.message}</strong>
      </aside>
    );
  }

  const { status } = loadState;

  return (
    <aside className="status-panel">
      <header className="status-header">
        <span>Readiness board</span>
        <strong>{status.app}</strong>
      </header>
      <div className="status-row">
        <span>Mode</span>
        <strong>{status.mode}</strong>
      </div>
      <div className="status-row">
        <span>API server</span>
        <strong>:{status.environment.port}</strong>
      </div>
      <div className="status-row">
        <span>ElevenLabs key</span>
        <strong>
          {status.environment.elevenLabsApiKeyConfigured ? "set" : "missing"}
        </strong>
      </div>
      <div className="status-row">
        <span>MCP URL</span>
        <strong>
          {status.environment.elevenLabsMcpServerUrlConfigured
            ? "set"
            : "missing"}
        </strong>
      </div>
      <footer className="status-footer">
        Last server pulse <time>{formatTime(status.serverTime)}</time>
      </footer>
    </aside>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
