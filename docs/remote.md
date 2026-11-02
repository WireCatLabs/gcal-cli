# ChatGPT or Claude in the browser

Use this page when you want an AI app that runs in the browser or on your phone, for example ChatGPT or Claude, to
read your Google Calendar through `gcal`. Such an app cannot start `gcal` on your computer, so you give it an internet
address instead. At the end, the app is connected to `gcal` through a private HTTPS address, it can do only what your
profile permits, and you know how to stop it or take its access back.

Terms used on this page:

- **MCP** (Model Context Protocol) is the standard way an AI app calls outside tools. `gcal personal mcp serve` is
  the MCP server that comes with `gcal`; for an app on your own computer, see [agents](usage.md#agents).
- **Remote connection** means the app connects from its own servers, over the internet, to the address you give it.
  `gcal personal mcp serve --http` serves the same tools over HTTP on `127.0.0.1` for this.
- **HTTPS tunnel** is a program that gives a port on your computer a public HTTPS address. This page uses
  [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel); Cloudflare Tunnel also works. You do not
  need to buy a domain for Funnel.
- **Public URL** is that address, for example `https://laptop.tail1234.ts.net`. You pass it to `gcal` as
  `--public-url`, and the app gets it with `/mcp` at the end.
- **Login code** is a one-time code that `gcal` prints in your terminal. The app's login page asks for it, so only a
  person who sees that terminal can connect an app.

```text
ChatGPT / Claude ──internet──▶ Tailscale Funnel ──▶ gcal personal mcp serve --http (login) ──▶ Google Calendar
```

If your Tailscale connection already works, keep it; you do not need a second tunnel. The local stdin/stdout
connection keeps working as before.

## Before you start

- **Whoever logs in reads your calendar.** Events, their descriptions, attendees and the people you meet. The login
  needs the login code from your terminal.
- **Profile permissions decide what the app may change.** Over MCP there is no one to ask, so a permission set to
  `ask` lets the command run. By default that includes creating, changing and deleting events, and sharing a calendar
  with anyone ([permissions](configuration.md#permissions)). The app's own approval is separate and depends on its
  settings. A change also needs the Google write grant: a profile signed in without `--grant write` only reads
  ([sign in](usage.md#sign-in-to-google)).
- **The computer that runs `gcal` must stay on.** To use it from a phone, run all of this on a small server that is
  always on, and sign in to Google there.
- **Check that your app or workspace allows custom MCP connections.** Availability and administrator controls depend
  on the app. Follow the current
  [OpenAI connection guide](https://developers.openai.com/api/docs/guides/custom-mcp-server) or
  [Claude connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

The setup steps for each operating system have not all been tried on that system. If a step does not work,
[open an issue](https://github.com/WireCatLabs/gcal-cli/issues).

## Start the tunnel and server

Install `gcal` and sign in to Google first ([installation](installation.md)). Use the same operating system user and
profile for setup and for the MCP server.

Install [Tailscale](https://tailscale.com/download), sign in, and enable
[Funnel](https://tailscale.com/docs/features/tailscale-funnel): MagicDNS, HTTPS certificates and Funnel permission must
be enabled in your tailnet (your Tailscale network). The first Funnel command can print an approval link.

Keep two terminal windows open. The first runs the tunnel. Copy the HTTPS address it prints into the second window,
without `/mcp`. Keep an explicit public port such as `:8443` in it.

The server listens on `127.0.0.1:8765` (`--port` changes it) and prints a login code. It never needs administrator
rights; only the tunnel may need them.

On Linux, first window:

```sh
sudo tailscale funnel 8765
```

On macOS, when `tailscale` is not on PATH
([Tailscale CLI guide](https://tailscale.com/docs/reference/tailscale-cli?tab=macos)):

```sh
TAILSCALE_BE_CLI=1 /Applications/Tailscale.app/Contents/MacOS/Tailscale funnel 8765
```

On Windows, in PowerShell run as Administrator:

```powershell
& "$env:ProgramFiles\Tailscale\tailscale.exe" funnel 8765
```

Second window, as your normal user, without `sudo`. Every command below uses `https://laptop.example-tailnet.ts.net`
as an example address that works for no one: put the HTTPS address your tunnel printed in its place.

```sh
gcal personal mcp serve --http --port 8765 --public-url https://laptop.example-tailnet.ts.net
```

It answers with the local address it serves on, the connector address for the app, and the login code.

To run `gcal` beside `tg`, `drive` or another WireCat tool, give each server its own local port. Then either give
each its own public HTTPS port, for example a second Funnel with `--https=8443 8766` and
`gcal personal mcp serve --http --port 8766 --public-url https://laptop.example-tailnet.ts.net:8443` (Funnel supports
public ports `443`, `8443` and `10000`), or share one address under a path per tool:
`--public-url https://laptop.example-tailnet.ts.net/gcal`, with Funnel's `--set-path /gcal` pointing at that port. The
connector address is then `…/gcal/mcp`. See the
[Funnel command reference](https://tailscale.com/docs/reference/tailscale-cli/funnel).

### Alternative: Cloudflare Tunnel

A [named Cloudflare tunnel](https://developers.cloudflare.com/tunnel/get-started/) with a public hostname such as
`mcp.example.com` and local service `http://127.0.0.1:8765` works the same way:

```sh
gcal personal mcp serve --http --port 8765 --public-url https://mcp.example.com
```

A temporary Quick Tunnel (`cloudflared tunnel --url …`) does not work:
[Quick Tunnels do not support SSE](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), the way the
HTTP MCP server streams answers.

### Keep it running in the background

To keep the server running after its window closes, start it in the background instead. It answers once it listens,
with the connector address and the login code:

```sh
gcal personal mcp server start --port 8765 --public-url https://laptop.example-tailnet.ts.net
gcal personal mcp server status   # running, port, connector address, the current login code, apps logged in
gcal personal mcp server stop     # stops only a server that `mcp server start` started
```

A server started this way does not write the code to its log: `mcp server status` shows it. The code is kept in
`gcal`'s state folder, `mcp-http/<profile>.lock`, which only your user can read (mode 600).

One server can serve several profiles: `gcal mcp serve --http --profiles work,personal`, or `--profiles all` for every
profile on this computer. Each tool call then names its profile. A set of profiles has its own login, apart from each
profile's; `mcp server start | stop | status` and `mcp revoke` take the same `--profiles`. With neither a profile nor
`--profiles`, `gcal` refuses and lists the profiles.

## Connect the app

The address for the app is your public URL with `/mcp` at the end, for example
`https://laptop.example-tailnet.ts.net/mcp`. Add it as a remote MCP connector:

- **ChatGPT:** open **Plugins**, choose **+ Add custom MCP server**, and create a plugin with the `/mcp` address and
  OAuth, as the [OpenAI connection guide](https://developers.openai.com/api/docs/guides/custom-mcp-server) describes.
  Choose dynamic client registration (DCR) when offered, then install the plugin before using it in a conversation.
- **Claude:** add a custom connector with this address, as described in
  [Claude custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

The app opens the `gcal` login page. Check the line that says where the login goes: it must be the app you are
connecting, such as `chatgpt.com` or `claude.ai`. Then type the login code from your terminal. A code works for one
login and for ten minutes; then `gcal` prints a new one. After five wrong codes the page refuses for thirty seconds,
then takes the newest code. The app stays logged in as long as it uses the connection at least once every 30 days.

The server offers the same three tools as over stdin and stdout: `gcal_tools_search`, `gcal_read` and `gcal_write`.
`api call`, emptying a calendar, `session` and `mcp` are never offered. Event titles, descriptions and attendee names
are other people's words: the app should treat them as data, never as instructions.

## Permissions for this server process

The server cannot see whether the app asked you before a call. Repeat `--permission key=level` to tighten permissions
only for this server process:

```sh
gcal personal mcp serve --http --public-url https://laptop.example-tailnet.ts.net --permission api=readonly
gcal personal mcp serve --http --public-url https://laptop.example-tailnet.ts.net --permission api.calendar.acl=deny
```

`api=readonly` refuses every change, events included; `api.calendar.acl=deny` keeps the app from sharing a calendar.
An override only tightens: it never loosens the profile's level. To allow more, change the profile's permissions
([settings](configuration.md#permissions)). `GCAL_READ_ONLY=1` in the server's environment also refuses every change.

## Stop or revoke access

Press Ctrl-C in both windows to stop the server and the tunnel. App logins survive a restart.

If you started Funnel with `--bg`, Ctrl-C does not stop that background route: check `tailscale funnel status` and
turn off only its port, for example `tailscale funnel --https=443 off`.

To log out every app of a profile, or of the server of several profiles:

```sh
gcal personal mcp revoke
gcal mcp revoke --profiles all
```

Those apps must log in again with a new code. This does not sign `gcal` out of Google; `session end` does that.

## If it does not work

- **The app says it cannot connect:** open `https://laptop.example-tailnet.ts.net/.well-known/oauth-protected-resource/mcp`
  in a browser (under a path: `…/.well-known/oauth-protected-resource/gcal/mcp`). It must show a short JSON. If it
  does not, Funnel is not running, is not enabled in your Tailscale network, or points at another port.
- **The login page says "Too many wrong codes":** wait thirty seconds and type the newest code. If you did not type
  them, someone found your address: run `gcal personal mcp revoke` and think about a new device name in Tailscale.
- **"already serves MCP over HTTP for this profile":** a server for this profile runs already, maybe in the
  background. `gcal personal mcp server status` says where; `mcp server stop` stops one that `server start` started.
- **"port 8765 is in use":** another program holds it; pass another `--port` and point the tunnel at it.
- **"too many logged-in apps":** ten apps hold a login. Run `gcal personal mcp revoke`, then connect again.
- **Reading works, writing fails:** check the profile's permissions, any `--permission` overrides, `GCAL_READ_ONLY`,
  and the Google write grant (`gcal personal session status` lists `grants`).
