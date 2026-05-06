---
last_updated: 2026-05-06
owner: Architect
---

# ElevenLabs MCP Integration

This project is prepared to register a remote MCP server with ElevenLabs Conversational AI.

## What ElevenLabs Supports

ElevenLabs MCP integrations connect Conversational AI agents to external MCP servers. The MCP server must be reachable by ElevenLabs and must use either SSE or streamable HTTP transport.

MCP servers are configured through the ElevenLabs dashboard or API. The CLI does not manage MCP servers yet.

## Security Baseline

- Keep the ElevenLabs API key in `.env`; never commit it.
- Use HTTPS for the MCP server URL.
- Treat MCP server URLs that include secret tokens as credentials.
- Start with `require_approval_all` while testing.
- Auto-approve only low-risk read-only tools after reviewing what the MCP server exposes.
- Avoid sending PII or sensitive conversation data to unvetted MCP tools.

## Setup

Create a local `.env` from `.env.example`:

```bash
cp .env.example .env
```

Fill in:

```bash
ELEVENLABS_API_KEY=
ELEVENLABS_MCP_SERVER_URL=
ELEVENLABS_MCP_SERVER_NAME=Vibecoding Collective MCP
ELEVENLABS_MCP_TRANSPORT=SSE
ELEVENLABS_MCP_APPROVAL_POLICY=require_approval_all
ELEVENLABS_MCP_REQUEST_HEADERS_JSON=
```

Then create the MCP server integration:

```bash
npm run elevenlabs:mcp:create
```

List configured MCP servers:

```bash
npm run elevenlabs:mcp:list
```

List tools for a created server:

```bash
npm run elevenlabs:mcp:tools -- <mcp_server_id>
```

## Attach to Agent

After the MCP server is created and tools are visible, attach it to the target ElevenLabs agent in the dashboard. Keep approval mode on `Always Ask` or fine-grained approval until the tool behavior is verified.

## References

- [ElevenLabs MCP tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp)
- [Create MCP server API](https://elevenlabs.io/docs/eleven-agents/api-reference/mcp/create)
- [List MCP server tools API](https://elevenlabs.io/docs/eleven-agents/api-reference/mcp/list-tools)
- [MCP integration security](https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp/security)
