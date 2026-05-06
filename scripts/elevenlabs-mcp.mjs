#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const API_BASE_URL = "https://api.elevenlabs.io/v1";

loadDotEnv();

const command = process.argv[2];

if (!command || !["create", "list", "tools"].includes(command)) {
  usage();
  process.exit(1);
}

try {
  if (command === "create") {
    await createMcpServer();
  } else if (command === "list") {
    await listMcpServers();
  } else {
    await listMcpServerTools();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function createMcpServer() {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const url = requireEnv("ELEVENLABS_MCP_SERVER_URL");
  const name = process.env.ELEVENLABS_MCP_SERVER_NAME || "Vibecoding Collective MCP";
  const description = process.env.ELEVENLABS_MCP_SERVER_DESCRIPTION || "";
  const transport = process.env.ELEVENLABS_MCP_TRANSPORT || "SSE";
  const approvalPolicy =
    process.env.ELEVENLABS_MCP_APPROVAL_POLICY || "require_approval_all";
  const secretToken = process.env.ELEVENLABS_MCP_SECRET_TOKEN;
  const requestHeaders = parseOptionalJsonObject(
    "ELEVENLABS_MCP_REQUEST_HEADERS_JSON",
  );

  const config = {
    url,
    name,
    description,
    transport,
    approval_policy: approvalPolicy,
  };

  if (secretToken) {
    config.secret_token = secretToken;
  }

  if (requestHeaders) {
    config.request_headers = requestHeaders;
  }

  const response = await elevenLabsRequest(apiKey, "/convai/mcp-servers", {
    method: "POST",
    body: JSON.stringify({ config }),
  });

  console.log(JSON.stringify(response, null, 2));
}

async function listMcpServers() {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const response = await elevenLabsRequest(apiKey, "/convai/mcp-servers");

  console.log(JSON.stringify(response, null, 2));
}

async function listMcpServerTools() {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const serverId = process.argv[3] || process.env.ELEVENLABS_MCP_SERVER_ID;

  if (!serverId) {
    throw new Error(
      "Missing MCP server id. Pass it as an argument or set ELEVENLABS_MCP_SERVER_ID.",
    );
  }

  const response = await elevenLabsRequest(
    apiKey,
    `/convai/mcp-servers/${encodeURIComponent(serverId)}/tools`,
  );

  console.log(JSON.stringify(response, null, 2));
}

async function elevenLabsRequest(apiKey, path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      ...options.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `ElevenLabs API request failed: ${response.status} ${response.statusText}\n${JSON.stringify(
        body,
        null,
        2,
      )}`,
    );
  }

  return body;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseOptionalJsonObject(name) {
  const value = process.env[name];

  if (!value) {
    return null;
  }

  const parsed = JSON.parse(value);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${name} must be a JSON object.`);
  }

  return parsed;
}

function usage() {
  console.log(`Usage:
  npm run elevenlabs:mcp:create
  npm run elevenlabs:mcp:list
  npm run elevenlabs:mcp:tools -- <mcp_server_id>

Required for create:
  ELEVENLABS_API_KEY
  ELEVENLABS_MCP_SERVER_URL

Optional:
  ELEVENLABS_MCP_SERVER_NAME
  ELEVENLABS_MCP_SERVER_DESCRIPTION
  ELEVENLABS_MCP_TRANSPORT
  ELEVENLABS_MCP_APPROVAL_POLICY
  ELEVENLABS_MCP_SECRET_TOKEN
  ELEVENLABS_MCP_REQUEST_HEADERS_JSON`);
}
