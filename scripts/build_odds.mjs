// Downloads football-data.co.uk fixtures.csv (upcoming matches with bookmaker odds) and writes data/odds.json
import { writeFileSync } from "node:fs";

const LEAGUES = { E0: "England · Premier League", E1: "England · Championship", E2: "England · League One", E3: "England · League Two", EC: "England · Conference",
  SC0: "Scotland · Premiership", SC1: "Scotland · Championship", SC2: "Scotland · League One", SC3: "Scotland · League Two",
  D1: "Germany · Bundesliga", D2: "Germany · 2. Bundesliga", SP1: "Spain · La Liga", SP2: "Spain · Segunda", I1: "Italy · Serie A", I2: "Italy · Serie B",
  F1: "France · Ligue 1", F2: "France · Ligue 2", N1: "Netherlands · Eredivisie", B1: "Belgium · Pro League", P1: "Portugal · Primeira Liga",
  T1: "Turkey · Super Lig", G1: "Greece · Super League" };

const res = await fetch("https://www.football-data.co.uk/fixtures.csv", { headers: { "User-Agent": "Mozilla/5.0" } });
if (!res.ok) throw new Error("fixtures.csv " + res.status);
const lines = (await res.text()).replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
const head = lines[0].split(",");
const num = (v) => { const n = parseFloat(v); return n > 1 ? n : null; };
const fixtures = [];
for (const line of lines.slice(1)) {
  const c = line.split(",");
  const r = Object.fromEntries(head.map((h, i) => [h, c[i]]));
  const [d, m, y] = (r.Date || "").split("/");
  if (!y || !r.HomeTeam) continue;
  const trio = (p) => [num(r[p + "H"]), num(r[p + "D"]), num(r[p + "A"])];
  const avg = trio("Avg"), max = trio("Max");
  if (avg.some((x) => !x)) continue;
  fixtures.push({
    div: r.Div, league: LEAGUES[r.Div] || r.Div, date: `${y}-${m}-${d}`, time: r.Time || "", home: r.HomeTeam, away: r.AwayTeam,
    avg, max, books: { Bet365: trio("B365"), Pinnacle: trio("PP"), "Betway": trio("BW") },
    ou: { over: num(r["Avg>2.5"]), under: num(r["Avg<2.5"]), maxOver: num(r["Max>2.5"]), maxUnder: num(r["Max<2.5"]) },
  });
}
fixtures.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
writeFileSync("data/odds.json", JSON.stringify({ updated: new Date().toISOString(), count: fixtures.length, fixtures }));
console.log("fixtures:", fixtures.length);
