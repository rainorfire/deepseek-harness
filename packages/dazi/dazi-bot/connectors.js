import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
//#region connectors.ts
/**
* Connector model and the sources it is discovered from.
*
* WorkDazi's app explores a connector catalog, lets the user install items, and
* starts the installed ones as MCP servers. This package performs the same
* exploration from the state WorkDazi leaves on disk, so dazi-bot and WorkDazi
* share one catalog and one set of installed connectors instead of each
* provisioning its own.
*
* - Catalog: the WorkDazi application's `connectors/catalog/index.json` plus the
*   user's custom entries in its settings.
* - Instances: the user's installs in WorkDazi's settings (electron-store).
* - Remote credentials: decrypted by the WorkDazi app on its localhost control
*   endpoint; this process never reads the encrypted values itself.
*
* @module @dazi/dsh-dazi-bot/connectors
*/
/** WorkDazi's shared state directory. */
const DAZI_HOME = join(homedir(), ".dazi");
/** Control endpoint descriptor written by the WorkDazi app. */
const GATEWAY_PATH = join(DAZI_HOME, "connectors", "gateway.json");
/** WorkDazi's electron-store file, which holds settings and connector instances. */
const DAZI_STORE_PATH = join(homedir(), "Library", "Application Support", "work-dazi", "workdazi.json");
/** Connector catalog shipped inside the WorkDazi application. */
const DEFAULT_CATALOG_PATH = "/Applications/WorkDazi.app/Contents/Resources/connectors/catalog/index.json";
function isObject(value) {
	return typeof value === "object" && value !== null;
}
function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch {
		return;
	}
}
function stringRecord(value) {
	if (!isObject(value)) return void 0;
	const entries = Object.entries(value).filter((pair) => typeof pair[1] === "string");
	return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
/** Settings object from WorkDazi's store. */
function readSettings(path = DAZI_STORE_PATH) {
	const store = readJson(path);
	return isObject(store) && isObject(store.settings) ? store.settings : void 0;
}
/** The `connectors` section of WorkDazi's settings. */
function readConnectorSettings(path = DAZI_STORE_PATH) {
	const connectors = readSettings(path)?.connectors;
	return isObject(connectors) ? connectors : void 0;
}
/** Read the control endpoint recorded by the WorkDazi app. */
function readGateway(path = GATEWAY_PATH) {
	const raw = readJson(path);
	if (!isObject(raw) || typeof raw.controlUrl !== "string") return void 0;
	return {
		controlUrl: raw.controlUrl,
		...typeof raw.controlToken === "string" ? { controlToken: raw.controlToken } : {},
		...typeof raw.nodeDir === "string" ? { nodeDir: raw.nodeDir } : {}
	};
}
/**
* Ask the WorkDazi control endpoint for the remote instances it enables. This
* is the only path to remote credentials: the WorkDazi app decrypts them.
* @param gateway - descriptor from {@link readGateway}.
* @param timeoutMs - budget for the request.
* @returns enabled remote instances with their headers.
* @throws when the endpoint is unreachable or refuses the token.
*/
async function fetchEnabledRemoteInstances(gateway, timeoutMs = 5e3) {
	const res = await fetch(`${gateway.controlUrl.replace(/\/$/, "")}/config`, {
		headers: gateway.controlToken ? { Authorization: `Bearer ${gateway.controlToken}` } : {},
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!res.ok) throw new Error(`WorkDazi 连接器控制口返回 ${res.status}`);
	const data = await res.json();
	if (!isObject(data) || !Array.isArray(data.instances)) return [];
	return data.instances.filter(isObject).flatMap((entry) => {
		const transport = entry.transport;
		if (!isObject(transport) || transport.kind !== "remote-mcp" || typeof transport.url !== "string") return [];
		if (typeof entry.id !== "string" || typeof entry.slug !== "string") return [];
		const headers = stringRecord(entry.headers);
		return [{
			id: entry.id,
			slug: entry.slug,
			url: transport.url,
			...typeof transport.timeout === "number" ? { timeoutMs: transport.timeout } : {},
			...headers === void 0 ? {} : { headers }
		}];
	});
}
function isTransport(value) {
	if (!isObject(value)) return false;
	if (value.kind === "remote-mcp") return typeof value.url === "string";
	if (value.kind === "cli-bridge") return true;
	return value.kind === "local-mcp" && typeof value.command === "string";
}
function toAuth(value) {
	if (!isObject(value)) return void 0;
	const type = value.type;
	if (type !== "oauth" && type !== "api-key" && type !== "none") return void 0;
	return {
		type,
		...typeof value.note === "string" ? { note: value.note } : {}
	};
}
function toCatalogItem(value) {
	if (!isObject(value) || typeof value.slug !== "string" || typeof value.name !== "string") return void 0;
	if (!isTransport(value.transport)) return void 0;
	const auth = toAuth(value.auth);
	return {
		...auth === void 0 ? {} : { auth },
		slug: value.slug,
		name: value.name,
		...typeof value.name_en === "string" ? { name_en: value.name_en } : {},
		...typeof value.description === "string" ? { description: value.description } : {},
		...typeof value.category === "string" ? { category: value.category } : {},
		...typeof value.source === "string" ? { source: value.source } : {},
		...typeof value.icon === "string" || value.icon === null ? { icon: value.icon } : {},
		...Array.isArray(value.examples) ? { examples: value.examples.filter((example) => typeof example === "string") } : {},
		...typeof value.applyUrl === "string" ? { applyUrl: value.applyUrl } : {},
		...typeof value.applyHint === "string" ? { applyHint: value.applyHint } : {},
		...isObject(value.codexDirect) ? { codexDirect: {
			...typeof value.codexDirect.startupTimeoutSec === "number" ? { startupTimeoutSec: value.codexDirect.startupTimeoutSec } : {},
			...Array.isArray(value.codexDirect.enabledTools) ? { enabledTools: value.codexDirect.enabledTools.filter((tool) => typeof tool === "string") } : {}
		} } : {},
		transport: value.transport
	};
}
/** Read the connector catalog WorkDazi explores: the bundled index plus custom entries. */
function readCatalog(path = DEFAULT_CATALOG_PATH, storePath = DAZI_STORE_PATH) {
	const raw = readJson(path);
	const items = [];
	if (isObject(raw) && Array.isArray(raw.categories)) {
		for (const group of raw.categories) if (isObject(group) && Array.isArray(group.items)) items.push(...group.items);
	}
	const custom = readConnectorSettings(storePath)?.customCatalog;
	if (Array.isArray(custom)) items.push(...custom);
	const seen = /* @__PURE__ */ new Set();
	return items.flatMap((value) => {
		const item = toCatalogItem(value);
		if (item === void 0 || seen.has(item.slug)) return [];
		seen.add(item.slug);
		return [item];
	});
}
/** Read the connectors the user installed through WorkDazi, in install order. */
function readInstances(storePath = DAZI_STORE_PATH) {
	const instances = readConnectorSettings(storePath)?.instances;
	if (!Array.isArray(instances)) return [];
	const seen = /* @__PURE__ */ new Set();
	return instances.flatMap((value) => {
		if (!isObject(value) || typeof value.id !== "string" || typeof value.slug !== "string") return [];
		if (seen.has(value.slug)) return [];
		seen.add(value.slug);
		return [{
			id: value.id,
			slug: value.slug,
			...typeof value.displayName === "string" ? { displayName: value.displayName } : {},
			...typeof value.state === "string" ? { state: value.state } : {},
			...typeof value.defaultEnabled === "boolean" ? { defaultEnabled: value.defaultEnabled } : {},
			...typeof value.lastError === "string" ? { lastError: value.lastError } : {}
		}];
	});
}
/** Whether an installed instance is enabled: ready, and either default-enabled or named by a session set. */
function isEnabled(instance, sessionIds) {
	return instance.state === "ready" && (instance.defaultEnabled === true || sessionIds.has(instance.id));
}
/** Session-level enable sets from WorkDazi's settings, flattened to instance ids. */
function readSessionEnabledIds(storePath = DAZI_STORE_PATH) {
	const sets = readConnectorSettings(storePath)?.sessionSets;
	const ids = /* @__PURE__ */ new Set();
	if (isObject(sets)) {
		for (const value of Object.values(sets)) if (Array.isArray(value)) {
			for (const id of value) if (typeof id === "string") ids.add(id);
		}
	}
	return ids;
}
/** Pair the catalog with WorkDazi's install state. */
function listCatalog(instances, catalog) {
	const bySlug = new Map(instances.map((instance) => [instance.slug, instance]));
	return catalog.map((item) => {
		const instance = bySlug.get(item.slug);
		if (instance === void 0) return {
			item,
			installed: false
		};
		return {
			item,
			installed: true,
			...instance.state !== void 0 ? { state: instance.state } : {},
			...instance.lastError !== void 0 ? { lastError: instance.lastError } : {}
		};
	});
}
/** Expand a leading `~` to the home directory. */
function expandHome(command) {
	return command.replace(/^~(?=\/|$)/, homedir());
}
//#endregion
export { DAZI_HOME, DAZI_STORE_PATH, DEFAULT_CATALOG_PATH, GATEWAY_PATH, expandHome, fetchEnabledRemoteInstances, isEnabled, listCatalog, readCatalog, readGateway, readInstances, readSessionEnabledIds };
