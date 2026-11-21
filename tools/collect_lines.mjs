// Collect every line the games can say, from each game's voiceLines(), so the voice can be recorded.
//
//   node tools/collect_lines.mjs            -> JSON array of lines on stdout (all games with voiceLines)
//   node tools/collect_lines.mjs <id> ...   -> just those games, with a summary on stderr (handy for checking a new game)
//
// Game files are plain browser scripts. They are loaded here in order, in one sandbox with the small set of
// pure helpers from js/core.js they may use at load time (no DOM). voiceLines() must not touch the DOM.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const order = [...readFileSync(join(root, "index.html"), "utf8").matchAll(/src="js\/games\/([\w-]+)\.js"/g)].map((m) => m[1]);
const onDisk = readdirSync(join(root, "js/games")).filter((f) => f.endsWith(".js")).map((f) => f.replace(/\.js$/, ""));
const files = [...order, ...onDisk.filter((f) => !order.includes(f)).sort()];

const prelude = `
  const GAMES = {};
  function addGame(game) { GAMES[game.id] = game; }
  const COLORS = [{ base: "#ff4d6d", dark: "#a8123a" }];
  const reduced = false;
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many);
  const wait = () => Promise.resolve();
  const S = { score: 0, sound: true, mode: "up", prog: {} };
  const prog = (id) => (S.prog[id] ||= { level: 0, rounds: 0 });
  const level = (game) => game.levels[prog(game.id).level];
  const TICK = "";
`;
const ctx = vm.createContext({ console, Math, JSON });
vm.runInContext(prelude, ctx);
for (const f of files) {
  try { vm.runInContext(readFileSync(join(root, "js/games", f + ".js"), "utf8"), ctx, { filename: f + ".js" }); }
  catch (e) { console.error(`! ${f}.js failed to load: ${e.message}`); process.exitCode = 1; }
}

const wanted = process.argv.slice(2);
const games = vm.runInContext("GAMES", ctx);
const lines = new Set();
for (const [id, g] of Object.entries(games)) {
  if (wanted.length && !wanted.includes(id)) continue;
  if (typeof g.voiceLines !== "function") {
    if (wanted.length) { console.error(`! ${id} has no voiceLines()`); process.exitCode = 1; }
    continue;
  }
  let got;
  try { got = g.voiceLines(); } catch (e) { console.error(`! ${id}.voiceLines() threw: ${e.message}`); process.exitCode = 1; continue; }
  const bad = got.filter((x) => typeof x !== "string" || !x.trim());
  if (bad.length) { console.error(`! ${id}.voiceLines() returned ${bad.length} non-string or empty entries`); process.exitCode = 1; }
  const level = got.filter((x) => typeof x === "string" && x.trim());
  level.forEach((x) => lines.add(x.trim()));
  if (wanted.length) console.error(`${id}: ${level.length} lines, e.g. ${JSON.stringify(level.slice(0, 3))}`);
}
// Level labels are spoken on level-up ("Level up! Count in 5s.") — include them for every game.
for (const [id, g] of Object.entries(games)) {
  if (wanted.length && !wanted.includes(id)) continue;
  for (const L of g.levels || []) lines.add(L.label.replace(/[.!?]?$/, "."));
}
process.stdout.write(JSON.stringify([...lines], null, 0) + "\n");
