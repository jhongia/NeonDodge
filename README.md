# Neon Dodge

**One ship. An endless sky. How long can you last?**

A responsive survival arcade made with HTML, CSS, and vanilla JavaScript. Pilot a glowing ship through falling orange debris, earn ten points per second, and chase a personal best as the sky gets busier.

**Live demo:** [Play Neon Dodge](https://jhongia.github.io/NeonDodge/).

**Gameplay screenshot:** TODO — add `docs/gameplay.png` and replace this line with `![Neon Dodge gameplay](./docs/gameplay.png)`.

## Play

Select **Let’s play**, then dodge the orange squares. Any collision ends the run.

| Action | Control |
| --- | --- |
| Move | WASD or arrow keys |
| Touch / mouse | Press and drag on the game field; the ship follows your pointer |
| Pause / resume | P, Escape, or the Pause / Resume button |
| Restart | Play again on the result screen |
| Sound | Sound toggle; off by default |

The game pauses when its tab becomes hidden or its window loses focus. Resume manually when ready. Touch movement has the same speed cap in every direction; the ship stays inside the field.

## Visual design

A full-width arcade layout pairs a graphite playfield with lime controls and coral obstacles. A custom SVG ship illustration fills the start screen, while a sidebar brings the personal best, controls, and creator links together. The layout fills tall and wide desktop viewports and stacks on phones. Reduced-motion preferences disable the idle ship animation. System fonts and locally drawn graphics avoid external requests.

The creator card links to Jhon’s GitHub, LinkedIn, and email through labeled buttons. Gmail uses a `mailto:` link to open the visitor’s configured email app.

## Features

- Gradually increasing obstacle speed and spawn frequency, with upper limits.
- Survival score and locally saved personal best. If browser storage is blocked, the best remains available for the current page session.
- Rotating obstacles with collision detection in their local coordinates.
- Substepped, elapsed-time movement for consistent controls across frame rates.
- Responsive, high-DPI Canvas with touch, mouse, and keyboard input.
- Synthesized optional sound: no audio downloads or third-party services.
- Restrained collision particles, disabled for reduced-motion preferences.
- Semantic buttons, visible keyboard focus, and announcements for run state. The spatial gameplay itself is visual and does not provide a nonvisual play mode.

## Run locally

No dependencies or build step. Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Stop the server with Ctrl+C.

## Deploy to GitHub Pages

1. Create a repository and place **the contents of this folder** at its root, including the hidden `.github` folder. `index.html` must be at the repository root.
2. Commit and push to the `main` branch. If your default branch has a different name, update `.github/workflows/deploy.yml` accordingly.
3. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
4. In **Actions**, run **Deploy Neon Dodge to GitHub Pages**, or push a new commit to `main`.
5. Open the deployment URL shown in the successful workflow. Update the demo placeholder above and add a gameplay screenshot.

The workflow deploys only `index.html`, `style.css`, and `game.js`. All asset paths are relative, so repository subpaths work. No API keys or manually configured secrets are needed; deployment uses GitHub's built-in workflow identity. The included workflow publishes the game whenever changes land on `main`.

## Project structure and choices

- `index.html`: page structure, accessible controls, and overlay screens.
- `style.css`: responsive full-width arcade layout and reduced-motion styling.
- `game.js`: Canvas rendering, game state, input, physics, storage, and Web Audio.
- `.github/workflows/deploy.yml`: static GitHub Pages deployment.

Canvas keeps the playfield lightweight; ordinary HTML keeps the controls keyboard accessible. A fixed logical width with an adaptive height accommodates portrait phones. Drawing and physics use elapsed time with small collision steps; unusually long frame gaps are capped to avoid unfair jumps. Assets are drawn or synthesized locally, so the game makes no external requests.

## Potential improvements

Seeded daily challenges, configurable difficulty, remappable controls, and a nonvisual game mode. A shared leaderboard would require an external service and is deliberately outside this static project.

## Validation

Automated logic checks passed for launch, survival scoring, pause/resume, blur and visibility pausing, keyboard movement, collision/game over, best-score persistence, restart reset, movement at 30/60/120 Hz, portrait pointer movement and cancellation, blocked-storage fallback, reduced motion, and relative asset paths. JavaScript syntax also passed. These checks used simulated browser APIs; they do not replace real browser tests.

GitHub Actions successfully deployed the game to GitHub Pages. Live browser checks confirmed the desktop start screen, launch, increasing score, and pause behavior. Physical mobile touch input and audio playback remain unverified.

Workflow configuration reference: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Local files and secrets

`.gitignore` excludes local environment files, common credential files, private keys, editor files, dependencies, logs, and generated output. It keeps example environment templates trackable; include placeholder values only. This browser game needs no API keys. Never place secrets in HTML, CSS, or JavaScript: anything shipped to the browser is public. Ignore rules do not remove files already committed.
