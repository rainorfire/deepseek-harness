import { homedir } from "node:os";
import { dirname, join } from "node:path";
import Schema from "@deepseek-ai/schemastery";
import { readFileSync } from "node:fs";
/** Control endpoint descriptor written by the WorkDazi app. */
const GATEWAY_PATH = join(join(homedir(), ".dazi"), "connectors", "gateway.json");
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
/** Expand a leading `~` to the home directory. */
function expandHome(command) {
	return command.replace(/^~(?=\/|$)/, homedir());
}
//#endregion
//#region index.ts
/**
* dazi-bot connector plugin, host half.
*
* Registers WorkDazi's bundled connectors as MCP servers, and mirrors the
* connectors the user installed through WorkDazi's app (catalog exploration,
* install state, remote credentials) so dazi-bot and WorkDazi stay on one set
* of connectors.
*
* - Installed connectors that need no credential (CLI bridges, local stdio
*   servers) start directly from this plugin and follow the user's WorkDazi
*   enable choice.
* - Installed remote connectors start with the credentials the WorkDazi app
*   decrypts on its localhost control endpoint. Without that endpoint they stay
*   listed here with the reason they are not running.
*
* The plugin reads WorkDazi's own state and does not write it: installs and
* enable switches belong to the WorkDazi app.
*
* @module @dazi/dsh-dazi-bot
*/
const name = "dazi-bot-connectors";
const inject = ["mcpManager"];
const Config = Schema.object({
	catalogPath: Schema.string().default(DEFAULT_CATALOG_PATH),
	storePath: Schema.string().default(DAZI_STORE_PATH),
	gatewayPath: Schema.string().default(GATEWAY_PATH),
	nodePath: Schema.string().default(process.execPath),
	ignoreEnableState: Schema.boolean().default(false)
});
/** Screen and computer connectors legitimately run longer than a default tool call. */
const CONNECTOR_TOOL_CALL_TIMEOUT_MS = 10 * 6e4;
/**
* Start each catalog connector as an MCP server and publish the connector view.
* @param ctx - plugin context; `mcpManager` is ready when this runs.
* @param config - validated plugin configuration.
*/
function apply(ctx, config) {
	const logger = ctx.logger("dazi-bot");
	const catalog = readCatalog(config.catalogPath, config.storePath);
	if (catalog.length === 0) logger.warn("连接器目录为空或无法读取：%s", config.catalogPath);
	const ignoreEnableState = config.ignoreEnableState ?? false;
	const baseEnv = {
		PATH: `${dirname(config.nodePath ?? process.execPath)}:${process.env.PATH ?? ""}`,
		WORKDAZI_KERNEL_KIND: "dazi"
	};
	const disposers = /* @__PURE__ */ new Map();
	let remoteInstances = [];
	/** Instance ids named by any session enable set in WorkDazi. */
	function sessionEnabledIds() {
		return ignoreEnableState ? new Set(readInstances(config.storePath).map((instance) => instance.id)) : readSessionEnabledIds(config.storePath);
	}
	function enabled(instance, ids) {
		return ignoreEnableState || isEnabled(instance, ids);
	}
	function registration(item, instance) {
		switch (item.transport.kind) {
			case "cli-bridge": {
				const bridge = item.transport.bridge?.trim();
				if (!bridge) return void 0;
				return {
					transport: "stdio",
					command: "/bin/sh",
					args: ["-c", expandHome(bridge)],
					env: baseEnv,
					cwd: homedir(),
					toolCallTimeoutMs: CONNECTOR_TOOL_CALL_TIMEOUT_MS
				};
			}
			case "local-mcp": return {
				transport: "stdio",
				command: expandHome(item.transport.command),
				args: item.transport.args ?? [],
				env: {
					...baseEnv,
					...item.transport.env
				},
				cwd: homedir(),
				toolCallTimeoutMs: CONNECTOR_TOOL_CALL_TIMEOUT_MS
			};
			case "remote-mcp": {
				const remote = remoteInstances.find((candidate) => candidate.slug === instance.slug);
				if (remote === void 0) return void 0;
				return {
					transport: "streamable-http",
					url: remote.url,
					headers: remote.headers ?? {},
					...remote.timeoutMs === void 0 ? {} : { toolCallTimeoutMs: remote.timeoutMs }
				};
			}
			default: return;
		}
	}
	/** Register, unregister, and rebuild servers so they match WorkDazi's installs and switches. */
	function reconcile() {
		const instances = readInstances(config.storePath);
		const ids = sessionEnabledIds();
		const bySlug = new Map(instances.map((instance) => [instance.slug, instance]));
		for (const [slug, dispose] of disposers) {
			const instance = bySlug.get(slug);
			const item = catalog.find((candidate) => candidate.slug === slug);
			if (instance === void 0 || item === void 0 || !enabled(instance, ids)) {
				dispose();
				disposers.delete(slug);
			} else if (item.transport.kind === "remote-mcp") {
				dispose();
				disposers.delete(slug);
				const entry = registration(item, instance);
				if (entry === void 0) continue;
				try {
					disposers.set(slug, ctx.mcpManager.register(slug, entry));
				} catch (error) {
					logger.warn("连接器 %s 重新注册失败：%s", slug, error instanceof Error ? error.message : String(error));
				}
			}
		}
		for (const instance of instances) {
			if (!enabled(instance, ids) || disposers.has(instance.slug)) continue;
			const item = catalog.find((candidate) => candidate.slug === instance.slug);
			if (item === void 0) continue;
			const entry = registration(item, instance);
			if (entry === void 0) continue;
			try {
				disposers.set(item.slug, ctx.mcpManager.register(item.slug, entry));
			} catch (error) {
				logger.warn("连接器 %s 注册失败：%s", item.slug, error instanceof Error ? error.message : String(error));
			}
		}
	}
	/** Re-read the control endpoint, then reconcile. */
	async function refreshRemote() {
		remoteInstances = [];
		const gateway = readGateway(config.gatewayPath);
		if (gateway === void 0);
		else try {
			remoteInstances = await fetchEnabledRemoteInstances(gateway);
		} catch (error) {
			`${error instanceof Error ? error.message : String(error)}`;
		}
		reconcile();
	}
	ctx.effect(() => {
		refreshRemote();
		const off = ctx.on("mcp-manager/status", (serverName, status) => {
			if (!disposers.has(serverName) || status.state !== "failed") return;
			logger.warn("连接器 %s 启动失败：%s", serverName, "lastError" in status ? status.lastError : status.reason);
			ctx.emit("dazi-bot/connectors-changed");
		});
		return () => {
			off();
			for (const dispose of disposers.values()) dispose();
			disposers.clear();
		};
	}, "dazi-bot: connectors");
}
//#endregion
export { Config, apply, inject, name };
