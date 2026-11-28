### Added

- **WireCat Desktop can run this tool's MCP server.** The manifest names the server's port, 8754, so Desktop starts
  and stops the server from the tool page, like the other WireCat tools. Before, Desktop had no port for it and offered
  no server. It needs a Desktop that reads the port from the manifest.
- **The manifest says how Desktop signs in.** One method, `Browser`: `{profile} session start --json`, with
  `--client-file` for the person's own Google client file. Desktop reads it from the tool and keeps its own list only
  as a fallback.
- **Built on cli-base 1.2.0** (was 1.0.0), which writes the port and the sign-in methods into the manifest.
