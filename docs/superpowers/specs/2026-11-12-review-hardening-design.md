# Review hardening: findings and fix plan

Date: 2026-11-12 · Reviewed at `b7ad0e6` · Status: **awaiting confirmation**

A full read of `lib/`, `components/`, `app/`, `public/sw.js`, `scripts/` and CI, plus a throwaway
numeric sweep of the theory code (every root × quality × view × uniform tuning; triads in every preset and
two custom tunings; Pathfinder across all presets). Baseline before any change: lint, typecheck and
559 unit tests pass.

Severity is relative to this app: a client-only PWA with no backend, auth or user-generated content.
Nothing here is a data-loss or exploitable-security bug. The findings that matter are places where the app
shows a guitarist something musically wrong.

## Verified correct (do not re-audit)

- CAGED templates, major and minor: every root, every uniform tuning (−5…+4). No throw, nothing past fret
  15, shapes always come out in cyclic C-A-G-E-D order.
- Scale positions and pentatonic/blues boxes: all 12 keys × 6 views × uniform tunings. No throw, every
  position holds every degree, Box N always lands in letter N's region.
- Diatonic chords, Decoder degree triples, key signatures, relative minors, blue-note placement and
  spelling, minor re-numbering, the nine tuning presets, theory-note facts (pentatonic drops, half steps,
  V→I leading tone).
- Pathfinder sweep (`keysFor`, `keyDetails`, `chordsToTry`) across all presets: no throws.
- Security hygiene: no `dangerouslySetInnerHTML`/`eval`/third-party requests; every `localStorage` parser
  validates shape and range; the service worker only handles same-origin GETs; CI token is read-only.

## Findings

### Music theory and fretboard

**T1 · High · A locked chord is torn apart when the key moves.**
`lib/pathfinder/state.ts:75-89` (`onNeck`, `highlightFrets`) wraps each string an octave on its own.
Lock x32010 (C) in C, then view it in A: rings land on `x 0 11 9 10 9` — an 11-fret spread nobody can
play, though the legend still says "A". Same for B♭ (`x 1 0 10 11 10`) and B (`x 2 1 11 0 11`).
This is pinned by tests (`tests/unit/pathfinder-state.test.ts:101-103`), so it was deliberate, but it
defeats the feature: the rings are meant to be *your chord*.
Fix: move the voicing as one unit. Compute `fret − tuningDelta + shift` per string, then add the single
multiple of 12 (nearest to 0) that puts every string in 0…15. Only if none exists (a retune stretched the
voicing past 15 frets) fall back to today's per-string wrap. Rewrite the two pinned expectations.

**T2 · Medium · Triad inversions are named by string, not by pitch.**
`lib/theory/triads.ts:21-27` assumes the lowest string sounds the lowest note. True in standard and all
nine presets (0 mislabels). False in custom tunings the Tuning page allows: with 6th up 4 and 5th down 5
(strings cross) 82 of 336 triads are mislabelled (C major, frets 4-3-2 on strings 6-5-4 is called "root
position" but G is the lowest note); with only the B string dropped to G, 24 of 316.
Root cause: `openPitches` (`lib/theory/tuning.ts:42`) reduces to pitch classes, so octave is lost.
Fix: `openPitches` returns absolute pitches (`[40,45,50,55,59,64]` + offsets; every consumer already
takes `% 12`, so nothing else changes), and `triadsOn` enumerates all six orders and labels the
inversion from the lowest *sounding* tone. `TriadControls`' "R in the bass" text then stays true.

**T3 · Medium · Pathfinder's Roman numeral ignores the chord's quality.**
`lib/pathfinder/paths.ts:51-57` takes the numeral from the root's scale degree alone. Cm(maj7) is shown
as "**I** in C major"; Cm7 (no 5th) as "**vii°**" in D♭; Csus4 as "ii" in B♭.
Fix: keep `degree` (the pairings still use it) but only set `role` when the chord's third and fifth match
the diatonic triad on that degree; otherwise `role: null`, which every caller already handles.

**T4 · Medium · Chord roots are spelled without regard to quality.**
`spellRoot` (`lib/theory/chord-names.ts:71-74`) falls back to one fixed name per pitch class. 466444 is
named "A♭m" with notes "A♭ B E♭", then listed as vi of B major (where it is G♯m). x43121 is "C♯" with
notes "C♯ F G♯" and listed as I of "D♭ major".
Fix: quality-aware fallback — chords with a minor third use C♯ E♭ F♯ G♯ B♭, others D♭ E♭ F♯ A♭ B♭.
`tests/unit/chord-names.test.ts:47` pins "A♭m7" and becomes "G♯m7".

**T5 · Low · Decision · F♯ major is displayed with two Fs.**
`formatNote` (`lib/theory/spelling.ts:25-31`) shows E♯ as F on purpose, so F♯ major reads
"F♯ G♯ A♯ B C♯ D♯ **F**" and its vii° reads "F°", while the signature note two taps away says "E♯".
Recommended: leave neck dots as players read them, but print E♯ in scale lists, chord names and theory
notes (pass a flag; one call site family).

**T6 · Low · Decision · Sixth chords outrank seventh chords in slash names.**
002010 comes out "C6/E" first, "Am7/E" second (table order in `QUALITIES`). Most players say Am7/E.
Recommended: when the root is not the bass, rank m7/7/maj7 ahead of 6/m6.

**T7 · Low · Naming gaps.**
Unnamed: every dyad except a fifth (C–E shows "no common chord name"), maj7♯11 (xx3200), add11, m6/9,
maj13, 7♭13, sus2sus4, 7(no 3). With the root in the bass, 30 of 55 three-note and 98 of 165 four-note
sets have no name; most are clusters. Recommended scope: third/sixth dyads named as the implied triad
("C (no 5)", "Am (no 5)" style), maj7♯11, add11, m6/9, maj13. Nothing else.

**T8 · Low · Copy.**
- `lib/theory/chords.ts:61`: ii–V–I is labelled "Jazz turnaround"; a turnaround is I–vi–ii–V. Rename to
  "Jazz ii–V–I".
- `lib/notes/circle-notes.ts:19`: "every step clockwise adds one sharp, counter-clockwise adds one flat"
  is wrong on the flat side. Say "adds a sharp or drops a flat" and the reverse.
- `components/chords/chord-compass.tsx:180` says "within four frets" but `MAX_SPAN = 4` allows frets 0–4
  (five). Say "a four-fret stretch".

**T9 · Low · Note for T2.** In open tunings 50–150 triads per preset span more than an octave (Open C,
frets 0-0-4 on 6-5-4 is C–G–E). They are correctly labelled and worth keeping; no change.

### Robustness and reliability

**R1 · Medium (preventive) · No way out of a crash loop.**
`toneAt` and `makePosition` throw on bad input, all state is persisted, and `app/error.tsx` offers only
"Try again", which re-renders the same stored state. The sweep found no reachable throw, so this is
insurance: add a "Reset saved settings" button that removes every `nomad:*` key and reloads.

**R2 · Low · `persisted-store` listens once per subscriber.**
`lib/storage/persisted-store.ts:39-51` adds a `storage` listener per subscriber; each re-parses and
replaces `state` with a new object, causing extra renders, and `event.key === null` (storage cleared in
another tab) is ignored. Fix: one listener per store, attached on first subscribe; treat a null key as
"re-read".

**R3 · Low · Other tabs go stale after an update.**
Tapping the pill reloads only that tab (`lib/sw/register.ts:12-17`); `activate` then deletes the old
cache (`public/sw.js:12-21`), so other open tabs keep old JS and fetch old chunk hashes from the network,
which 404 after a deploy. Fix: reload on `controllerchange` whenever the page already had a controller
(still user-initiated: someone tapped refresh). Also call `registration.update()` on `visibilitychange`
so an installed PWA left open for days notices new versions.

**R4 · Low · Stale progression step.** `nomad:chords:step:v1` is an index; removing an earlier chord in the
Circle silently moves the Chord Compass to a different chord. Fix: reset the step to `null` whenever the
progression's degrees change (in `useProgression` actions).

### Scale (performance)

**P1 · Low · Keys screen recomputes everything per card per render.**
`components/pathfinder/keys-screen.tsx:68` calls `keyDetails` for every fitting key (up to 7) on every
render, each walking all positions and all triads on four string sets, though a card shows only the solo
region and missing notes. Fix: `useMemo` on `[frets, tuning]`. Nothing else in the app scales with data.

### Security

**S1 · Medium (cheap) · Dependency advisories.**
`pnpm audit --prod`: `next@15.5.27` has one critical (image-optimization RCE) and one high (Server
Actions DoS), fixed in 15.5.28; `postcss@8.4.31` under Next has four. None is reachable here (static
export, `images.unoptimized`, no server, PostCSS only processes our own CSS at build time), but bump
`next` and re-audit. Including dev dependencies the audit reports 4 critical / 8 high / 15 moderate / 2 low;
triage and bump what has a patch.

**S2 · Low · No security headers.** There is no `vercel.json`. Add one with
`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a CSP of
`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
(`'unsafe-inline'` is required by Next's inline bootstrap in a static export). Update CLAUDE.md, which says
there is no `vercel.json`.

**S3 · Low · CI supply chain.** Actions are pinned to tags, not SHAs, and nothing watches dependencies. Pin
to SHAs, add `.github/dependabot.yml` (npm + actions, weekly), add `pnpm audit --prod --audit-level high`
to the first CI job.

## Work packages

File ownership is disjoint so the packages can run in parallel, except WP4 which follows WP3 (its test
expectations contain chord names WP3 changes). Each agent: branch from `claude/serene-babbage-wekdba`,
write the failing test first, keep the diff minimal, and finish with `pnpm lint && pnpm typecheck &&
pnpm test:unit` green. No new dependencies. No refactors beyond the finding.

| WP | Findings | Owns | Extra checks |
|----|----------|------|--------------|
| 1 Locked-chord rings | T1 | `lib/pathfinder/state.ts`, `tests/unit/pathfinder-state.test.ts` | `tests/e2e/pathfinder.spec.ts` |
| 2 Triads by pitch | T2, T8 (span copy) | `lib/theory/tuning.ts`, `lib/theory/triads.ts`, `components/chords/chord-compass.tsx` (copy line only), `tests/unit/{triads,tuning,tuned-theory}.test.ts` | new test: both custom tunings above give 0 mislabels, checked against absolute pitch |
| 3 Chord names | T4, T6, T7, T5 (if approved) | `lib/theory/chord-names.ts`, `lib/theory/spelling.ts`, `tests/unit/chord-names*.test.ts`, `tests/unit/theory-spelling.test.ts` | — |
| 4 Pathfinder keys | T3, P1 | `lib/pathfinder/paths.ts`, `components/pathfinder/keys-screen.tsx`, `tests/unit/pathfinder-{paths,keys,coverage}.test.*` | after WP3 |
| 5 Copy | T8 (rest) | `lib/theory/chords.ts`, `lib/notes/circle-notes.ts`, `tests/unit/notes-circle.test.ts`, any test naming the preset | — |
| 6 Storage and recovery | R1, R2, R4 | `lib/storage/persisted-store.ts`, `app/error.tsx`, `lib/circle/use-progression.ts`, matching tests | cross-tab test with a `StorageEvent` whose key is null |
| 7 Service worker | R3 | `public/sw.js`, `lib/sw/register.ts`, `tests/unit/sw-register.test.ts`, `tests/e2e/update.spec.ts` | `pnpm test:e2e` for `update` and `offline` specs, both projects |
| 8 Security and CI | S1, S2, S3 | `package.json`, `pnpm-lock.yaml`, `vercel.json`, `.github/**`, `CLAUDE.md` | full `pnpm test:e2e` (CSP must not break hydration or the SW in WebKit) |
| 9 Integrate | — | merges 1–8, resolves conflicts | lint, typecheck, unit, full e2e; one PR |

## Decisions needed (recommended default in bold)

1. T1: move the locked voicing as one unit, changing tested behaviour — **yes**.
2. T5: print E♯ in scale lists/chord names for F♯ major — **yes, text only; neck dots unchanged**.
3. T6: prefer Am7/E over C6/E — **yes**.
4. T7: naming additions — **the short list above only**.
5. S2: ship a CSP with `'unsafe-inline'` — **yes**.
