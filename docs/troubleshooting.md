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
| "no Google OAuth client is set up" | Pass `--client-file` with your Desktop app client JSON, or set `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`. See [your own Google client](configuration.md#your-own-google-client). |
| `doctor` shows `oauth_client.client: null` | No client is in the environment. A profile signed in with `--client-file` still works: its sign-in keeps the client. Only a new `session start` needs one. |
| "the client file can be read by other users" | Run the `chmod 600` the message gives, then sign in again. |
| `sign-in.scope-missing` | Google's consent page lets you untick Calendar. Run `session start` again and leave it ticked. |
| `profile.wrong-account` or `profile.same-account` | Each Google account has one profile. Use the profile that account already has, or a new profile name for a new account. |
| `oauth.expired` a week after sign-in | A Google app in Testing mode gives sign-ins that end after 7 days ([Google's note](https://developers.google.com/identity/protocols/oauth2#expiration)). Run `session start` again, or publish the app in Google Cloud Console. |
| `oauth.not-saved` | `gcal` keeps the sign-in in the system keyring, and none is available. On Linux, start a keyring service such as GNOME Keyring, or sign in with `session start --credential-storage file`. |
| A write is refused | The profile's permissions or `GCAL_READ_ONLY` stop it; see [settings](configuration.md#permissions). |

Never paste a token, a password or private content into a support request.
