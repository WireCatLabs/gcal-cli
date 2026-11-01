# When something goes wrong

Start with the symptom, run the check, then retry the command. Keep the error code and the profile name for a
support request.

| Symptom | What to do |
| --- | --- |
| Not sure what is set up | Run `gcal doctor`. It reads no keyring and uses no network. |
| `gcal` is not found | Open a new terminal, and check that npm's global folder is on `PATH`. |
| "name a profile" | Put the profile first, as in `gcal personal config show`, or set `GCAL_PROFILE`. |
| The settings file does not read | `doctor` lists every problem in the file under `config.issues`. Run the `config unset` each one gives, or fix the file by hand. |
| `doctor` lists `files.problems` | Other users of the computer can read `config.json` or enter its folder. Run each `chmod` that `doctor` prints after "to make it private:". `doctor` never changes a file mode itself. |
| `profile.wrong-account` or `profile.same-account` | Each Google account has one profile. Use the profile that account already has, or a new profile name for a new account. |
| `oauth.not-saved` | The sign-in file (`credentials.json` in the state folder, used by `--credential-storage file` and whenever the keyring fails) exists but cannot be read as a sign-in file. Move it aside and sign in again. |
| "the WireCat Google client in this gcal package cannot be read" | The package is damaged. Install `gcal` again, or pass `--client-file` with your own client. |
| A write is refused | The profile's permissions or `GCAL_READ_ONLY` stop it; see [settings](configuration.md#permissions). |

## Sign-in problems

These come up while you [make your own Google app](installation.md#make-your-own-google-app) and sign in with it.
A row that says "in the browser" is Google's page; the other texts are what `gcal` prints.

| Symptom | Cause and fix |
| --- | --- |
| "no Google OAuth client is set up" | The package carries no WireCat app, and you gave no client. Pass `--client-file` with your Desktop app client file, or set `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`. |
| `doctor` shows `oauth_client.client: null` | No client is in the environment, and the package carries no WireCat app. A profile signed in with `--client-file` still works: its sign-in keeps the client. Only a new `session start` needs one. |
| "the client file can be read by other users of this computer" | Run the `chmod 600` the message gives, then `session start` again. |
| "could not read a Desktop app OAuth client JSON from the client file" | The file is not a Desktop app client. A **Web application** client's file has the wrong shape. In Google Cloud Console, make a client of type **Desktop app** ([step 6](installation.md#6-make-the-client-and-download-its-file)) and pass its file. |
| Google shows `redirect_uri_mismatch` in the browser | `GCAL_GOOGLE_CLIENT_ID` names a Web application client. `gcal` signs in through a local address on your computer, which only a Desktop app client allows. Make a Desktop app client and use its ID and secret. |
| Google shows `deleted_client` or `invalid_client` in the browser, or says the client was not found | The client was deleted, or the client ID is wrong. Google can restore a deleted client within 30 days; otherwise make a new client ([step 6](installation.md#6-make-the-client-and-download-its-file)). |
| "Google sign-in was refused (HTTP …)" right after you allow access | Google refused the client when `gcal` asked for the sign-in. Most often the client secret does not match the client ID, for example after you added a new secret. Download the file with the current secret, and pass it again. |
| Google blocks the sign-in because the app is not verified or you have no access, and `gcal` ends with "Google sign-in timed out" | The app is in **Testing**, and this Google account is not a test user. Add it under **Audience → Test users** ([step 4](installation.md#4-audience)), or publish the app, then run `session start` again. |
| "Google sign-in was declined" | You chose **Cancel** on Google's page. Run `session start` again and allow access. |
| Google shows an "unverified app" page | Google has not verified the app: your own app, or WireCat's until Google finishes its review. Use the link on the page that goes on to the app. |
| "Google did not grant read access to Calendar" (`sign-in.scope-missing`) | Google's consent page lets you untick Calendar. Run `session start` again and leave it ticked. With `--grant write`, "Google did not grant the write permission": leave the events access ticked too. |
| "the Google Calendar API is turned off for this OAuth project" | Sign-in worked, but the project's Calendar API is off. [Turn it on](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com) in the project of your client, wait a few minutes, and run the command again. |
| "Google sign-in was refused (HTTP 400); run gcal personal session start again" (`oauth.expired`) a week after sign-in | Your app is in **Testing**, where a sign-in ends 7 days after consent ([Google's note](https://developers.google.com/identity/protocols/oauth2#expiration)). Run `session start` again. To stop this, publish the app: see [step 4](installation.md#4-audience). |

Never paste a token, a password or private content into a support request.
