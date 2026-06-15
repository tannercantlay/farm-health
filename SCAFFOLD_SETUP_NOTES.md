# Scaffold Setup Notes — What Got Installed & Created

A review log of everything done to spin up the Day 1 (.NET) and Day 2 (Angular) project scaffolds in this repo, why each choice was made, and how to verify it yourself. Read top-to-bottom and you'll know exactly what state your machine and repo are in.

> Date: 2026-06-15 · Platform: macOS (Apple Silicon) · Shell: zsh

---

## 1. Starting point

Before anything, I checked what was already on the machine:

| Tool | Status before | Notes |
|------|---------------|-------|
| Node.js | ✅ v25.8.2 | Already installed. Odd-numbered → **not** an LTS release (see caveat at the end). |
| npm | ✅ 11.11.1 | Fine. |
| .NET SDK | ❌ not found | Had to install. |
| Angular CLI (`ng`) | ❌ not found | Had to install. |
| Homebrew | ✅ `/opt/homebrew/bin/brew` | Used briefly, then abandoned (see §2). |

The repo already contained the three markdown guides and nothing else (no code).

---

## 2. Installing the .NET 10 SDK (the part with a detour)

**First attempt — Homebrew cask (failed):**
```bash
brew install --cask dotnet-sdk     # downloads 10.0.301, then FAILS
```
The download succeeded, but the final install step runs a macOS `.pkg` installer that requires `sudo`. In this automated/non-interactive shell there's no terminal to type a password into, so it errored out with `sudo: a password is required`. Nothing was installed and the cask purged itself.

**Second attempt — official install script (succeeded):**
```bash
curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
chmod +x /tmp/dotnet-install.sh
/tmp/dotnet-install.sh --channel 10.0 --install-dir "$HOME/.dotnet"
```
This installs the SDK **into your home folder** (`~/.dotnet`) instead of system-wide — so **no root/password is needed**. Result: **.NET SDK 10.0.301**.

> **Trade-off to know:** a home-folder install isn't on your shell's `PATH` automatically (a system install would be). I fixed that in §4. If you'd rather have a "normal" system install later, you can run the Homebrew cask yourself in a real terminal where you can type your password — then delete `~/.dotnet`.

**EF Core command-line tool:**
```bash
dotnet tool install --global dotnet-ef     # → dotnet-ef 10.0.9
```
This is what runs `dotnet ef migrations add ...` / `dotnet ef database update` from the Day 1 guide. Global tools live in `~/.dotnet/tools`.

---

## 3. Installing the Angular CLI

```bash
npm install -g @angular/cli                # → Angular CLI 21.2.15
```
Straightforward, no issues. Installed globally so `ng` works from anywhere.

---

## 4. Making `dotnet` available in your terminal

Because the SDK went into `~/.dotnet` (§2), I appended this block to your **`~/.zshrc`**:

```bash
# .NET SDK (installed via dotnet-install.sh to ~/.dotnet)
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
```

- `DOTNET_ROOT` — tells the runtime where the SDK lives.
- The `PATH` additions — make `dotnet` and global tools like `dotnet-ef` runnable by name.
- `DOTNET_CLI_TELEMETRY_OPTOUT=1` — turns off Microsoft's usage telemetry. Optional; remove the line if you don't care.

> ⚠️ **This only takes effect in new terminals.** In an already-open tab, run `source ~/.zshrc` first, or the `dotnet` command won't be found.

Nothing else in your `.zshrc` was touched.

---

## 5. The backend project — `FarmHealth.Api/`

**Created with:**
```bash
dotnet new webapi --use-controllers -n FarmHealth.Api
```
- `--use-controllers` is **required** on .NET 10 because the template now defaults to Minimal APIs. This flag opts back into controller classes — the style the guides (and most enterprise codebases) use.

**Packages added** (for Entity Framework Core with a SQLite database):
```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
```
- *Sqlite* = the database provider. SQLite means zero setup — the DB is just a local file.
- *Design* = needed for the `dotnet ef` migration commands.

**Config edits I made:**
1. **[FarmHealth.Api/appsettings.json](FarmHealth.Api/appsettings.json)** — added a connection string the Day 1 guide references:
   ```json
   "ConnectionStrings": {
     "Default": "Data Source=farmhealth.db"
   }
   ```
   This points EF at a file called `farmhealth.db` that gets created when you run migrations.

2. **[FarmHealth.Api/Properties/launchSettings.json](FarmHealth.Api/Properties/launchSettings.json)** — changed the `http` dev port from the random default (`5009`) to **`5080`**, so it matches what the Angular proxy expects (§6).

**What I did NOT write:** the actual entities (`Farm`, `Animal`, `HealthRecord`), the `DbContext`, services, DTOs, and controllers. That's the Day 1 exercise — the guide walks you through it. The project is the stock template otherwise (it still has the sample `WeatherForecast` endpoint, which you'll replace).

**Verified:** `dotnet build` succeeded with 0 warnings/errors, the app booted on `http://localhost:5080`, and a real HTTP request to `/weatherforecast` returned JSON. Then I stopped it.

---

## 6. The frontend project — `farm-health-web/`

**Created with:**
```bash
ng new farm-health-web --standalone --routing --style=css --skip-git --defaults
```
- `--standalone` — modern Angular with no `NgModule` (the current default; flag is belt-and-suspenders).
- `--routing` — generates the router setup.
- `--style=css` — plain CSS (no Sass/Less).
- `--skip-git` — don't make a nested git repo (this folder lives inside your existing repo).
- `npm install` ran automatically as part of this.

**Config I added:**
1. **[farm-health-web/proxy.conf.json](farm-health-web/proxy.conf.json)** — a dev-server proxy so the frontend can call the backend without CORS headaches:
   ```json
   { "/api": { "target": "http://localhost:5080", "secure": false, "changeOrigin": true } }
   ```
   Any request the Angular app makes to `/api/...` gets forwarded to the .NET API on port 5080. Keeps your HTTP URLs relative and avoids configuring CORS during development.

2. **`farm-health-web/angular.json`** — wired that proxy file into the `serve` target's options (`proxyConfig: "proxy.conf.json"`). Because it's in the config, plain `ng serve` picks it up automatically — you don't need to pass `--proxy-config` every time.

**What I did NOT write:** the `models/`, `services/`, and component folders (list/detail/form). That's the Day 2 exercise.

**Verified:** `npm run build` produced a successful production bundle.

---

## 7. Repo hygiene — `.gitignore`

Generated a standard .NET `.gitignore` at the repo root and added entries so build junk and the database file never get committed:
```
node_modules/      (was already in the .NET template's ignore list)
dist/
*.db  *.db-shm  *.db-wal
```
(The Angular project also has its own internal `.gitignore`.)

> Minor thing worth knowing for review: my first attempt to detect whether `*.db` was already ignored gave a false positive because the .NET template contains `*.dbmdl`, which *contains* the substring `*.db`. I caught it and added the exact `*.db` patterns explicitly — so they really are there now (verified by exact-match grep).

---

## 8. Final state — what you have now

```
farm-health/
├── speria_refresh_study_guide.md      # updated earlier to .NET 10
├── day1_dotnet_design_guide.md        # backend build walkthrough
├── day2_angular_design_guide.md       # frontend build walkthrough
├── SCAFFOLD_SETUP_NOTES.md            # ← this file
├── .gitignore                         # new
├── FarmHealth.Api/                    # ← backend scaffold (builds + runs)
│   ├── appsettings.json               #   (connection string added)
│   ├── Properties/launchSettings.json #   (port set to 5080)
│   └── ...stock webapi template...
└── farm-health-web/                   # ← frontend scaffold (builds)
    ├── proxy.conf.json                #   new
    ├── angular.json                   #   (proxy wired in)
    └── ...stock Angular template...
```

| Component | Version | Builds? | Runs? |
|-----------|---------|---------|-------|
| .NET SDK | 10.0.301 | — | — |
| dotnet-ef | 10.0.9 | — | — |
| Angular CLI | 21.2.15 | — | — |
| FarmHealth.Api | net10.0 | ✅ | ✅ (port 5080) |
| farm-health-web | Angular 21 | ✅ | not yet started |

---

## 9. How to run it yourself (to confirm)

```bash
# Terminal 1 — backend. Use a NEW terminal so dotnet is on PATH (see §4).
cd FarmHealth.Api
dotnet run
# → visit http://localhost:5080/weatherforecast , should return JSON

# Terminal 2 — frontend
cd farm-health-web
ng serve
# → visit http://localhost:4200 , the default Angular welcome page
```

To start building, open the Day 1 guide and go step by step. Once you add the `DbContext` and entities, your first migration is:
```bash
cd FarmHealth.Api
dotnet ef migrations add InitialCreate
dotnet ef database update      # creates farmhealth.db
```

---

## 10. One caveat to keep in mind

You're on **Node.js v25**, which is an odd-numbered release and therefore **not** long-term-support. Everything works today, but Angular prints a warning and it's not what you'd run in production. If you ever hit weird tooling errors, install Node 22 LTS (e.g. via `nvm install 22 && nvm use 22`) and you'll be on supported ground. Not urgent for a study project.

---

## 11. Things I intentionally left for you

- All backend domain code: entities, `DbContext`, DTOs, services, controllers.
- All frontend feature code: models, services, list/detail/form components, routes.

These are the actual learning exercises — the two day-guides exist to walk you through them. The scaffolds just remove the boilerplate setup friction so you can start on the interesting parts.
