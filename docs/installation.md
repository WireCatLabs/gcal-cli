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

`gcal` signs in through a Google app, called an OAuth client. Google uses the app to ask you which access to give
`gcal`. There are two ways to get one.

**WireCat's app.** A `gcal` package can carry WireCat's own Google app. The current releases do not carry it yet,
so for now every user makes an app of their own. Check with `gcal doctor --json`: if `oauth_client.client` is
`wirecat`, the package has the app, and you sign in with no Google Cloud project of your own:

```sh
gcal personal session start
```

Until Google finishes its review of WireCat's app, Google may show an "unverified app" page first. To go on, use the
link on that page that goes on to the app, then allow read access to Calendar. Google limits an unverified app to 100
new users in total; when WireCat's app reaches that limit, use your own app below. See
[Google's page on unverified apps](https://support.google.com/cloud/answer/7454865).

**Your own app.** If `oauth_client.client` is `null`, the package has no WireCat app, so `session start` needs one of
yours. [Make your own Google app](#make-your-own-google-app) once, in about ten minutes, then pass its file:

```sh
gcal personal session start --client-file ~/client_secret.json
```

Your own app also wins when the package has WireCat's: pass `--client-file`, or set `GCAL_GOOGLE_CLIENT_ID` and
`GCAL_GOOGLE_CLIENT_SECRET`.

## Make your own Google app

You do this once, in [Google Cloud Console](https://console.cloud.google.com/), with the Google account you will use
with `gcal`. It is free. The app is yours alone: no one else signs in through it. If a step goes wrong, see
[sign-in problems](troubleshooting.md#sign-in-problems).

### 1. Choose a project

Open the [project picker](https://console.cloud.google.com/projectselector2/home/dashboard). Choose a project you
already have, or choose **New project**, give it a name such as `gcal`, and choose **Create**. Keep this project
selected in the top bar for all the steps below.

### 2. Turn on the Google Calendar API

Open the [Google Calendar API page](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com) and
choose **Enable**. If you skip this step, sign-in still works, but the first command that reads Calendar fails with
"the Google Calendar API is turned off for this OAuth project".

### 3. Branding

Open **Google Auth platform → [Branding](https://console.cloud.google.com/auth/branding)**. If the page offers
**Get started**, choose it. For your own use, fill in only these:

- **App name**: any name you will recognise, such as `My gcal`. Google shows it when you sign in.
- **User support email**: your own address.
- **Audience**: **External**. **Internal** works only for an account in a Google Workspace organisation, and only for
  that organisation's users.
- **Contact information**: your own address again.

Agree to Google's user data policy and choose **Create**. You can leave the logo, the home page and the privacy
policy links empty. Google's
[consent screen guide](https://developers.google.com/workspace/guides/configure-oauth-consent) describes every
field.

### 4. Audience

Open **Google Auth platform → [Audience](https://console.cloud.google.com/auth/audience)**. The user type is
**External**, and the publishing status starts as **Testing**.

Under **Test users**, choose **Add users**, enter the Google account you will sign in with, and save. While the app
is in Testing, Google lets only test users sign in.

Then choose how long a sign-in lasts:

| Publishing status | What happens |
| --- | --- |
| **Testing** | A sign-in ends 7 days after you give consent. Then commands fail and you run `session start` again. Only test users can sign in, at most 100. |
| **In production** | No 7-day limit. Google may show an "unverified app" page at each sign-in, and you go on through it. An unverified app can have at most 100 users, and you are one. |

We recommend **In production** for an app only you use. Choose **Publish app**, confirm, and sign in after that. You
do not need Google's verification: Google does not require it for an app for your personal use with fewer than 100
users, and lets those users click through the warning. Stay in **Testing** if you do not want to see the warning, and
accept signing in again each week.

Google's own pages on this:

- [Refresh token expiration](https://developers.google.com/identity/protocols/oauth2#expiration): the 7 days for an
  External app in Testing that asks for more than name, email and profile, which Calendar access is.
- [Manage app audience](https://support.google.com/cloud/answer/15549945): Testing, test users, In production.
- [Unverified apps](https://support.google.com/cloud/answer/7454865): the warning page and the limit of 100 users.
- [When verification is not needed](https://support.google.com/cloud/answer/13464323): personal use.

### 5. Data Access

Open **Google Auth platform → [Data Access](https://console.cloud.google.com/auth/scopes)**. This step is optional
for your own app: `gcal` asks Google for its scopes at sign-in either way. Google says a scope you did not add here
makes it show the unverified app page
([manage app data access](https://support.google.com/cloud/answer/15549135)), and your own app shows that page
anyway. Adding the scopes lists them on the consent page, so you see what you allow.

To add them, choose **Add or remove scopes**, paste the scopes into **Manually add scopes**, choose **Add to table**,
**Update**, then **Save**:

| Scope | When `gcal` asks for it |
| --- | --- |
| `openid`, `email` | Always: `gcal` learns which account signed in. |
| `https://www.googleapis.com/auth/calendar.readonly` | Always: read your calendars and events. |
| `https://www.googleapis.com/auth/calendar.events` | With `--grant write`: create, change and delete events, and answer invitations. |
| `https://www.googleapis.com/auth/calendar.acls` | With `--grant sharing`: see and change who can see a calendar. |

`--grant` adds to the read scope; it never replaces it.

### 6. Make the client and download its file

Open **Google Auth platform → [Clients](https://console.cloud.google.com/auth/clients)** and choose
**Create client**. Set **Application type** to **Desktop app**, give it any name, and choose **Create**.

In the dialog that follows, choose **Download JSON**. Do it now: Google shows the full client secret only once, when
you make the client ([manage OAuth clients](https://support.google.com/cloud/answer/15549257)). If you closed the
dialog, open the client, add a new secret, and download the file again.

The file's name starts with `client_secret_`. Move it to your home folder as `client_secret.json`, and make it
readable by you only. `gcal` refuses a client file other users of the computer can read.

```sh
mv ~/Downloads/client_secret_*.json ~/client_secret.json
chmod 600 ~/client_secret.json
```

Do not make a **Web application** client: `gcal` signs in through a local address on your computer, which only a
Desktop app client allows. See Google's
[guide to Desktop app credentials](https://developers.google.com/workspace/guides/create-credentials#desktop-app).

### 7. Sign in

Pick a profile name for this Google account, such as `personal`, and sign in:

```sh
gcal personal session start --client-file ~/client_secret.json
```

This gives `gcal` read access. To let it create, change and delete events too, ask for it at sign-in:

```sh
gcal personal session start --client-file ~/client_secret.json --grant write
```

Instead of the file, you can set `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET` to the `client_id` and
`client_secret` in it. `--client-file` wins over them.

`gcal` keeps the client with the sign-in, in the system keyring. Later commands, and each refresh of the sign-in,
do not read the file again, so you can move it somewhere safe. Only a new `session start` needs it.

### 8. What Google shows in the browser

`session start` opens your browser on Google's sign-in page. Then:

1. Choose the Google account you will use with this profile.
2. Google may say it has not verified the app. It is your own app, so use the link on that page that goes on to it.
3. Google lists what `gcal` asks for, each with a checkbox. Leave **Calendar** ticked. With `--grant write`, also
   leave the events access ticked. If you untick one, `gcal` refuses the sign-in and tells you to run
   `session start` again.
4. Choose **Continue**. The browser says "Sign-in received; you can close this tab", and `gcal` prints the
   signed-in account.

`gcal` waits 5 minutes for you to finish in the browser. Check the result with `gcal personal session status`.

Next: [use it](usage.md).
