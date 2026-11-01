# WireCat's Google app for gcal: the owner's steps

Only the owner of WireCat's Google Cloud project can do these steps. Agents did the rest: `gcal` reads WireCat's client
from `google-client.json` in the package, the release workflow writes that file from the repository secret
`GCAL_GOOGLE_CLIENT_JSON`, and wirecat.dev's privacy policy has a gcal section.

The owner chose one shared Google app for drive and gcal (NEED-1689, answer A). So these steps add Calendar to the
project that already holds drive's Desktop client, whose branding Google has approved.

## 1. Turn on the Calendar API

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select WireCat's project, the one with drive's
   Desktop client.
2. Open **APIs & Services → Library**, find **Google Calendar API**, and select **Enable**. Without it every call
   fails with `api.disabled`.

## 2. Check branding and audience

Open [Google Auth Platform](https://console.cloud.google.com/auth/overview).

1. **Branding:** keep the approved name and logo. Check that these are set, and change nothing else:
   - Application home page: `https://wirecat.dev/`. It describes gcal and links the privacy policy.
   - Privacy policy: `https://wirecat.dev/en/privacy`. Its "Google Calendar access (gcal)" section is
     `https://wirecat.dev/en/privacy#calendar-access`.
   - Terms of service: `https://wirecat.dev/en/terms`.
   - Authorized domain: `wirecat.dev`, verified in [Search Console](https://search.google.com/search-console) by an
     owner or editor of the project.
2. **Audience:** user type **External**, publishing status **In production**. In Testing, Google issues refresh tokens
   that expire in 7 days, so every user would have to sign in again each week
   ([refresh token expiration](https://developers.google.com/identity/protocols/oauth2#expiration)).

In production and not yet verified, Google shows its "unverified app" page, and the project may get only 100 new users
in total, for its whole life ([Manage App Audience](https://support.google.com/cloud/answer/15549945)). drive and gcal
share this one project, so they share those 100 users too.

## 3. Declare the Calendar scopes

Open **Data Access → Add or remove scopes**, add these three, and save. The Console shows the class of each scope in
that list; Google gives "reading events stored in Google Calendar" as an example of a sensitive scope
([sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)).

| Scope | When gcal asks for it |
| --- | --- |
| `https://www.googleapis.com/auth/calendar.readonly` | Every sign-in: sync, search, free/busy, calendar list |
| `https://www.googleapis.com/auth/calendar.events` | `session start --grant write`: create, change, delete events, answer invitations |
| `https://www.googleapis.com/auth/calendar.acls` | `session start --grant sharing`: see and change who can see a calendar |

`openid` and `email` are asked for too; they are not sensitive. Keep drive's four scopes as they are.

## 4. Make gcal's Desktop client and store it

1. Open **Clients → Create client**, choose **Desktop app**, and name it `WireCat gcal CLI`. A client of its own lets
   gcal's secret change without signing out drive's users.
2. Download its JSON file. Keep it outside every repository.
3. From a gcal checkout, store it as the repository secret. The script checks the file's shape, prints none of its
   values, and runs `gh secret set GCAL_GOOGLE_CLIENT_JSON --repo WireCatLabs/gcal-cli`:

   ```sh
   bin/set-google-client ~/Downloads/client_secret_XXXX.json
   ```

4. Delete the downloaded file. The next `bin/release` carries the client; until then, packages carry none.

Changing this client's secret later signs out every gcal user who signed in with the old one: each sign-in keeps the
secret it was made with, and Google refuses the old one when the sign-in is refreshed.

## 5. Submit the data-access review

Open **Verification Center**, and add the Calendar scopes to the data-access review. Google takes up to 10 days for
sensitive scopes, and asks for no security assessment: that is for restricted scopes only
([verification requirements](https://support.google.com/cloud/answer/13464321)).

For each scope, a justification. Text to adapt:

> gcal is a command-line tool that runs on the user's own computer. It keeps a local, searchable copy of the user's
> calendars and answers questions about free and busy time. `calendar.readonly` reads the calendar list and events
> for sync, search and free/busy; the narrower `calendar.events.readonly` cannot list calendars.
> `calendar.events` is asked for only when the user runs `session start --grant write`, to create, change and delete
> events and to answer invitations. `calendar.acls` is asked for only with `--grant sharing`, to see and change who can
> see a calendar the user owns. No data goes to a WireCat server.

A demonstration video, unlisted on YouTube, in English. Google asks that it show the whole flow, including the OAuth
grant, the app's name and branding, and the full consent screen with the exact scopes; the language selector on the
consent screen set to English. Record:

1. `gcal personal session start --grant write,sharing` in a terminal, and the browser that opens.
2. The full consent screen, with the three Calendar permissions listed.
3. `gcal personal sync`, then `gcal personal search events <a word>`: each scope in use.
4. `gcal personal events create ...` and the new event in Google Calendar, for `calendar.events`.
5. `gcal personal api call calendar.acl.list` on one calendar, for `calendar.acls`.
6. `gcal personal session end`.

## 6. After Google approves

1. Sign in with a Google account that was never a test user and check that no "unverified app" page shows.
2. Tell the agents: the docs' "unverified app" notes in `docs/installation.md` and `docs/troubleshooting.md` can go.
