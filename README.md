# Angry Birds — Stage 2

A playable Angry Birds clone in the browser. Drag the slingshot, launch the birds,
knock the pigs out of their towers. 99 levels, no build step, no dependencies to
install.

**Live demo:** <https://darsheelsahu-2008.github.io/angrybird-stage-2/>
**Repository:** <https://github.com/Darsheelsahu-2008/angrybird-stage-2>

---

## Play it right now

No install, no build. Any static file server works — the game is plain
`index.html` plus two vendored libraries.

```bash
git clone https://github.com/Darsheelsahu-2008/angrybird-stage-2.git
cd angrybird-stage-2
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

> Opening `index.html` by double-clicking it (`file://`) will **not** work. The
> browser blocks the canvas and the sprite loads for the same-origin policy.
> It has to be served over HTTP.

Other servers, if you prefer:

```bash
npx serve .            # node
php -S localhost:8000  # php
ruby -run -e httpd . -p 8000
```

Any of them: open the printed URL, done. There is nothing to compile, no `npm
install`, and no `package.json`.

## How to play

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Aim | Press and drag back from the slingshot | — |
| Fire | Release the pointer | — |
| Speed boost (once per bird) | — | `SPACE` |
| Retry the level | — | `R` |
| Level select | The `99 LEVELS` button | `ESC` |

Drag the bird away from the slingshot to pull the bands back — the further and
higher you pull, the further it flies. The white dots are the predicted path.
On touch screens, drag from the sling and lift your finger to fire.

**Win** by popping every pig. **Lose** when you run out of birds. Score:

| Action | Points |
| --- | --- |
| Pig popped | 5,000 |
| Block destroyed | 1,000 |
| Plank destroyed | 500 |
| Bird you did not need | 10,000 |

Three stars means you cleared the level without wasting anything. Progress is
saved in `localStorage` under `angrybird.v1`, so it survives a refresh. Clear
the site data to start over.

## The rules it follows

Tuned against the original game's published rules rather than by feel:

- **Three materials, weakest first:** glass (shatters from a nudge, barely any
  mass), wood, stone. A higher-tier block shrugs off what would break a lower one.
- **Pig health scales with size.** The big pigs need a real hit.
- **Pigs are circles.** They roll, bounce, and get knocked off ledges. Anything
  that leaves the play area is gone — including the pigs, which is how a level
  gets finished.
- **Structures collapse.** Knock the supports out and whatever was resting on
  them comes down. Falling kills count.
- **The bands are elastic, not tethered.** They pinch the bird while it is
  loaded or held, then let go and snap back the moment it is in the air.
- **Every level is deterministic.** Level *n* is always the same layout, so a
  level you can beat stays beatable.

The physics numbers are measured from the engine rather than guessed: gravity
is `0.5528 px/step²` at a fixed `1000/60` step, and the sling power (`0.20`) was
picked by sweeping real launches until a full pull reached the furthest thing any
level places — `x=1116` against a `x=1070` limit. The self-test fails if that
ever drifts apart.

## Run the tests

There is a test page. It runs in the browser and prints a summary; there is no
test runner to install.

```bash
python3 -m http.server 8000
# then open http://localhost:8000/selftest.html
```

58 checks covering level generation across all 99 levels, determinism, the
damage model, the launch, the bands, the scoring, and the win / lose / next-level
flow. Green means `58/58 passed` in the page and `SELFTEST PASS` in the console.

## Project layout

```
index.html          the game
selftest.html       the test page — open it in a browser
style.css           the shell around the canvas
js/
  Game.js           state and rules: the sling, the step loop, damage, scoring
  Render.js         every draw call
  Input.js          mouse, touch and keyboard
  UI.js             HUD, title, level select, end-of-level panels
  levels.js         the seeded 99-level generator
  sketch.js         p5 bootstrap: load art, make the canvas, run the loop
  BaseClass.js      shared entity behaviour (position, angle, HP, destroy)
  Ground.js Box.js Pig.js Log.js Bird.js
  selftest.js       the checks
sprites/            PNGs, drawn at exactly the size the game draws them
tools/make_sprites.py  regenerates every sprite
vendor/             p5.js 0.7.2, matter-js 0.12.0
```

`Game.js` holds state and rules, `Render.js` holds drawing, `Input.js` holds
input. Nothing in `Render.js` changes anything.

## Regenerating the art

Every sprite is drawn by a script, so the art is reproducible and editable as
code rather than as pixels:

```bash
pip install pillow
python3 tools/make_sprites.py
```

Sprites are authored at the exact size the game draws them, so nothing is
resampled. It needs Pillow and nothing else.

## Deploying your own copy

The live demo is GitHub Pages serving `main` from the root. To host your own:

1. Fork or push this repository to your own GitHub account.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder
   `/ (root)`.
3. Wait a minute or two. Your copy will be at
   `https://<your-user>.github.io/<your-repo>/`.

Any static host works the same way — the game is only static files, so upload
the directory as-is. There is no server-side code and nothing to configure.

## Notes

Third-party libraries are vendored in `vendor/` so the game runs offline. p5.js
is used for the canvas and the drawing calls; matter-js does all the rigid-body
physics. Both keep their own licences.

This is a fan project built for fun and for practice. Angry Birds is a trademark
of Rovio Entertainment. This repository is not affiliated with or endorsed by
Rovio, and it ships none of Rovio's assets — every sprite here is drawn by
`tools/make_sprites.py`.
