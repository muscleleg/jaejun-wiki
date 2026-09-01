import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const catalogPath = resolve(wikiRoot, "assets/data/content_catalog.json");
const allowedTypes = new Set(["article", "project"]);
const allowedPlacements = new Set(["home", "projects", "wiki", "blog"]);

function assert(condition, message) {
  if (!condition) throw new Error(`content_catalog.json: ${message}`);
}

export function validateContentCatalog(catalog) {
  assert(catalog.schemaVersion === 1, "schemaVersion must be 1");
  assert(catalog.documentDates && typeof catalog.documentDates === "object" && !Array.isArray(catalog.documentDates), "documentDates{} is required");
  assert(Array.isArray(catalog.tags), "tags[] is required");
  assert(Array.isArray(catalog.items), "items[] is required");

  for (const [href, publishedAt] of Object.entries(catalog.documentDates)) {
    assert(/^wiki\/.+\.html$/.test(href), `invalid documentDates href ${href}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(publishedAt), `invalid document date for ${href}`);
  }

  const tagIds = new Set();
  for (const tag of catalog.tags) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag.id), `invalid tag id ${tag.id}`);
    assert(typeof tag.label === "string" && tag.label.trim(), `tag label is required for ${tag.id}`);
    assert(!tagIds.has(tag.id), `duplicate tag id ${tag.id}`);
    tagIds.add(tag.id);
  }

  const itemIds = new Set();
  const hrefs = new Set();
  const usedTagIds = new Set();
  for (const item of catalog.items) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id), `invalid item id ${item.id}`);
    assert(!itemIds.has(item.id), `duplicate item id ${item.id}`);
    assert(allowedTypes.has(item.type), `invalid type for ${item.id}`);
    assert(typeof item.title === "string" && item.title.trim(), `title is required for ${item.id}`);
    assert(typeof item.summary === "string" && item.summary.trim(), `summary is required for ${item.id}`);
    assert(/^wiki\/.+\.html$/.test(item.href), `invalid href for ${item.id}`);
    assert(!hrefs.has(item.href), `duplicate href ${item.href}`);
    assert(typeof catalog.documentDates[item.href] === "string", `documentDates entry is required for ${item.id}`);
    assert(Array.isArray(item.tagIds) && item.tagIds.length >= 1 && item.tagIds.length <= 5, `tagIds must contain 1-5 items for ${item.id}`);
    assert(new Set(item.tagIds).size === item.tagIds.length, `duplicate tagIds for ${item.id}`);
    for (const tagId of item.tagIds) {
      assert(tagIds.has(tagId), `unknown tagId ${tagId} for ${item.id}`);
      usedTagIds.add(tagId);
    }
    assert(item.placements && Object.keys(item.placements).length, `placements are required for ${item.id}`);
    for (const [placement, options] of Object.entries(item.placements)) {
      assert(allowedPlacements.has(placement), `invalid placement ${placement} for ${item.id}`);
      assert(options && typeof options === "object" && !Array.isArray(options), `placement options must be an object for ${item.id}`);
      if (Object.hasOwn(options, "pinOrder")) assert(Number.isInteger(options.pinOrder) && options.pinOrder >= 1, `pinOrder must be a positive integer for ${item.id}`);
    }
    if (item.thumbnail) {
      assert(typeof item.thumbnail.src === "string" && item.thumbnail.src.trim(), `thumbnail src is required for ${item.id}`);
      assert(typeof item.thumbnail.alt === "string" && item.thumbnail.alt.trim(), `thumbnail alt is required for ${item.id}`);
    }
    if (item.type === "project") {
      assert(item.projectCard && typeof item.projectCard === "object", `projectCard is required for ${item.id}`);
      for (const field of ["eyebrow", "role", "evidence", "supportingEvidence"]) {
        assert(typeof item.projectCard[field] === "string" && item.projectCard[field].trim(), `projectCard.${field} is required for ${item.id}`);
      }
      assert(Array.isArray(item.projectCard.stack) && item.projectCard.stack.length, `projectCard.stack is required for ${item.id}`);
    }
    itemIds.add(item.id);
    hrefs.add(item.href);
  }
  for (const tagId of tagIds) assert(usedTagIds.has(tagId), `unused tag ${tagId}`);
  return catalog;
}

export async function loadContentCatalog() {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  return validateContentCatalog(catalog);
}

export function compareCatalogItems(left, right, placement) {
  const leftPin = left.placements[placement]?.pinOrder;
  const rightPin = right.placements[placement]?.pinOrder;
  if (leftPin !== undefined || rightPin !== undefined) {
    if (leftPin === undefined) return 1;
    if (rightPin === undefined) return -1;
    if (leftPin !== rightPin) return leftPin - rightPin;
  }
  const dateOrder = right.publishedAt.localeCompare(left.publishedAt);
  return dateOrder || left.id.localeCompare(right.id, "ko");
}

export function itemsForPlacement(catalog, placement) {
  return catalog.items
    .filter((item) => Object.hasOwn(item.placements, placement))
    .map((item) => ({ ...item, publishedAt: catalog.documentDates[item.href] }))
    .sort((left, right) => compareCatalogItems(left, right, placement));
}
