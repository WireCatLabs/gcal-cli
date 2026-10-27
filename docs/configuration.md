# Settings

Settings live in one file, `config.json`, in the folder `gcal doctor` shows. Each profile has its own part,
and `defaults` apply to every profile. This page lists how to see and change them.

```sh
gcal personal config show
gcal personal config set limit 50
gcal personal config unset limit
```

`config show` lists each setting and where it came from: the file, a variable or the default.

## Your own Google client

`gcal` does not have its own Google app yet, so `session start` signs in through yours. Make it once in
[Google Cloud Console](https://console.cloud.google.com/):

1. Make a project, and turn on the Google Calendar API in it.
2. Set up the OAuth consent screen. While the app is in Testing, add your Google account as a test user.
3. Make an OAuth client ID of type **Desktop app**, and download its JSON file.

Then give `gcal` the file, readable by you only:

```sh
chmod 600 ~/client_secret.json
gcal personal session start --client-file ~/client_secret.json
```

`gcal` refuses a client file other users of the computer can read. Instead of the file, you can set
`GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`. The client is needed only at sign-in: `gcal` keeps it with
the sign-in in the system keyring, so later commands work without the file.

## Permissions

`permissions` decides what a command may do for this profile: `allow`, `ask`, `readonly` or `deny`, per permission
key. Over MCP there is no one to ask, so `ask` lets the command run. `GCAL_READ_ONLY=1` refuses every write, whatever
the permissions say; it also refuses each `api` method that changes Calendar. The `api` commands have no permission
key of their own yet.

## Run records

A command that fails is kept as a run, for `gcal runs list` and `runs show`. `record_input` decides whether a run
keeps the words you typed; it is `true` unless you set it to `false`. Secrets are masked either way; see
[Security](security.md).
