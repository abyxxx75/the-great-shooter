# Local preview

Open http://127.0.0.1:5173/ in any browser on this laptop.

The site uses static HTML, CSS, and browser JavaScript. It needs a running HTTP
server for its module scripts. Opening the HTML through `file://` is not the
supported preview path.

## Start or restore

Double-click `Start Preview.cmd` in the project folder. It checks the existing
server, starts a background process if needed, and waits for a successful HTTP
readiness check. The launcher window can close after it reports ready.

`scripts/serve.ps1` is a compatibility launcher for the same server. Both entry
points use `scripts/preview.py`, which needs Python 3.9 or newer. The launchers
prefer the installed Codex Python runtime, with `python` as a fallback.

If port 5173 belongs to a different server, startup reports the conflict and
does not terminate that process. Runtime logs are in `.preview/preview.log`.
The server uses concurrent request handling and binds only to `127.0.0.1`.

## Automatic startup on this laptop

A shortcut named `The Great Shooter Preview.lnk` is installed in this user's
Windows Startup folder. It starts the background preview at sign-in. No
administrator account or public hosting is required. Windows restarts end
the running server; the sign-in shortcut restores it afterwards.

To disable automatic startup, press Win+R, enter `shell:startup`, and remove
`The Great Shooter Preview.lnk`. The manual launcher remains available.

Moving the project or removing the Python runtime requires updating the
shortcut's target or arguments. This configuration applies only to this
laptop and does not deploy the website to Vercel.
