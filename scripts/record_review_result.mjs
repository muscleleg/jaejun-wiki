import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const statePath = process.env.REVIEW_STATE_PATH
  ? resolve(process.env.REVIEW_STATE_PATH)
  : resolve(wikiRoot, "assets/data/review_state.json");
const [itemId, outcome, reviewedAt, evidence] = process.argv.slice(2);

if (!itemId || !outcome || !reviewedAt || !evidence) {
  throw new Error('Usage: node scripts/record_review_result.mjs <item-id> <outcome> <YYYY-MM-DD> "public-safe evidence"');
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt)) throw new Error(`Invalid review date: ${reviewedAt}`);
if (evidence.includes("\n") || evidence.length > 240) throw new Error("Evidence must be one public-safe line of 240 characters or fewer");

const state = JSON.parse(await readFile(statePath, "utf8"));
const item = state.items.find((candidate) => candidate.id === itemId);
if (!item) throw new Error(`Review item not found: ${itemId}`);
if (!state.policy.resultTypes.some((type) => type.id === outcome)) throw new Error(`Unknown review outcome: ${outcome}`);

function dateValue(value) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function dateString(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(value, days) {
  return dateString(dateValue(value) + days * 24 * 60 * 60 * 1000);
}

const previousDate = item.lastReviewed || item.acquiredDate;
const delayDays = Math.floor((dateValue(reviewedAt) - dateValue(previousDate)) / (24 * 60 * 60 * 1000));
if (delayDays < 0) throw new Error(`Review date ${reviewedAt} is before previous evidence date ${previousDate}`);

const maximumStage = state.policy.intervalsDays.length - 1;
let nextStage = item.stageIndex;
let nextIntervalDays;

if (outcome === "failed") {
  nextStage = Math.max(0, item.stageIndex - 1);
  nextIntervalDays = 1;
} else if (outcome === "hinted") {
  nextIntervalDays = 2;
} else if (outcome === "recalled") {
  nextStage = Math.min(maximumStage, item.stageIndex + 1);
  nextIntervalDays = state.policy.intervalsDays[nextStage];
} else if (outcome === "transferred") {
  nextStage = Math.min(maximumStage, item.stageIndex + 2);
  nextIntervalDays = state.policy.intervalsDays[nextStage];
}

item.results.push({ reviewedAt, delayDays, outcome, evidence });
item.lastReviewed = reviewedAt;
item.stageIndex = nextStage;
item.nextDue = addDays(reviewedAt, nextIntervalDays);
if (state.updated < reviewedAt) state.updated = reviewedAt;

await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
console.log(`REVIEW_RESULT_RECORDED id=${item.id} outcome=${outcome} reviewedAt=${reviewedAt} nextDue=${item.nextDue} stage=${item.stageIndex}`);
