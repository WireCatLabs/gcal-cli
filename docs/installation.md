# Install

Install `gcal` once on each computer where you or an agent use it. You need Node.js 22.16 or a later 22.x, or 24 or later; Node 23 is not supported.

```sh
npm install -g @wirecat/gcal-cli
gcal --version
```

Check the installation, then pick a profile name for your account, such as `personal`:

```sh
gcal doctor
```

`doctor` needs no network and opens no keyring. It shows the version, where settings live, the profiles that
exist, and whether other users of the computer can read the settings.

## Connect your Google account

`gcal` signs in through a Google app, called an OAuth client. There are two ways to get one.

**WireCat's app.** A `gcal` package can carry WireCat's own Google app. Check with `gcal doctor --json`: if
`oauth_client.client` is `wirecat`, you need no Google Cloud project. Sign in and choose your account:

```sh
gcal personal session start
```

Until Google finishes its review of WireCat's app, Google may show an "unverified app" page first. To go on, use the
link on that page that goes on to the app, then allow read access to Calendar. Google limits an unverified app to 100
new users in total; when WireCat's app reaches that limit, use your own app below. See
[Google's page on unverified apps](https://support.google.com/cloud/answer/7454865).

**Your own app.** If `oauth_client.client` is `null`, this package has no WireCat app, so `session start` needs one of
yours. Make it once in Google Cloud Console and pass its file:

```sh
gcal personal session start --client-file ~/client_secret.json
```

[Your own Google client](configuration.md#your-own-google-client) lists the steps. Your own app also wins when the
package has WireCat's: pass `--client-file`, or set `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`.

Next: [use it](usage.md).
