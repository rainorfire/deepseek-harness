# @dazi/dsh-dazi-bot

dazi-bot bundle: registers the connectors installed for WorkDazi as MCP servers through the host's `mcp-manager`.

## Usage

List this bundle after `@deepseek-ai/dsh-web-app` in a profile, because the plugin injects `mcpManager`, which the `web-app` bundle mounts. Every configured connector runs as a stdio server started with the host's Node executable; its tools surface as `mcp__<serverName>__<tool>`.

```yaml
- insert:
    - id: dazi-bot-connectors
      name: '@dazi/dsh-dazi-bot'
      config:
        connectors:
          - serverName: workdazi-core
            entry: workdazi-core-mcp/index.mjs
```

| Field | Default | Meaning |
|---|---|---|
| `nodePath` | host `process.execPath` | Node executable that runs each connector. |
| `appResourcesDir` | `/Applications/WorkDazi.app/Contents/Resources` | Root of the installed connector directories. |
| `connectors[].serverName` | — | Tool namespace; `[A-Za-z0-9_-]{1,32}`, unique across the manager. |
| `connectors[].entry` | — | Entry module relative to `root`. |
| `connectors[].root` | `appResourcesDir` | Overrides the root for one connector. |

A connector whose entry is missing is skipped with a warning, so a partially installed WorkDazi does not fail the host. The default list covers `workdazi-core`, `workdazi-growth`, `workdazi-ledger`, `workdazi-scheduler`, `workdazi-canvas`, `workdazi-human-gate`, `workdazi-skills`, and `workdazi-connectors`.