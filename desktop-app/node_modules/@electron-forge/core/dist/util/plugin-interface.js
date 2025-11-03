"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_base_1 = require("@electron-forge/plugin-base");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const import_search_1 = __importDefault(require("./import-search"));
const d = (0, debug_1.default)('electron-forge:plugins');
function isForgePlugin(plugin) {
    return plugin.__isElectronForgePlugin;
}
class PluginInterface {
    static async create(dir, forgeConfig) {
        const int = new PluginInterface(dir, forgeConfig);
        await int._pluginPromise;
        return int;
    }
    constructor(dir, forgeConfig) {
        this.plugins = [];
        this._pluginPromise = Promise.resolve();
        this._pluginPromise = Promise.all(forgeConfig.plugins.map(async (plugin) => {
            if (isForgePlugin(plugin)) {
                return plugin;
            }
            if (typeof plugin === 'object' &&
                'name' in plugin &&
                'config' in plugin) {
                const { name: pluginName, config: opts } = plugin;
                if (typeof pluginName !== 'string') {
                    throw new Error(`Expected plugin[0] to be a string but found ${pluginName}`);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const Plugin = await (0, import_search_1.default)(dir, [pluginName]);
                if (!Plugin) {
                    throw new Error(`Could not find module with name: ${pluginName}. Make sure it's listed in the devDependencies of your package.json`);
                }
                return new Plugin(opts);
            }
            throw new Error(`Expected plugin to either be a plugin instance or a { name, config } object but found ${JSON.stringify(plugin)}`);
        })).then((plugins) => {
            this.plugins = plugins;
            for (const plugin of this.plugins) {
                plugin.init(dir, forgeConfig);
            }
            return;
        });
        // TODO: fix hack
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.config = null;
        Object.defineProperty(this, 'config', {
            value: forgeConfig,
            enumerable: false,
            configurable: false,
            writable: false,
        });
        this.triggerHook = this.triggerHook.bind(this);
        this.overrideStartLogic = this.overrideStartLogic.bind(this);
    }
    async triggerHook(hookName, hookArgs) {
        for (const plugin of this.plugins) {
            if (typeof plugin.getHooks === 'function') {
                let hooks = plugin.getHooks()[hookName];
                if (hooks) {
                    if (typeof hooks === 'function')
                        hooks = [hooks];
                    for (const hook of hooks) {
                        await hook(this.config, ...hookArgs);
                    }
                }
            }
        }
    }
    async getHookListrTasks(childTrace, hookName, hookArgs) {
        const tasks = [];
        for (const plugin of this.plugins) {
            if (typeof plugin.getHooks === 'function') {
                let hooks = plugin.getHooks()[hookName];
                if (hooks) {
                    if (typeof hooks === 'function')
                        hooks = [hooks];
                    for (const hook of hooks) {
                        tasks.push({
                            title: `${chalk_1.default.cyan(`[plugin-${plugin.name}]`)} ${hook.__hookName || `Running ${chalk_1.default.yellow(hookName)} hook`}`,
                            task: childTrace({
                                name: 'forge-plugin-hook',
                                category: '@electron-forge/hooks',
                                extraDetails: { plugin: plugin.name, hook: hookName },
                            }, async (_, __, task) => {
                                if (hook.__hookName) {
                                    // Also give it the task
                                    return await hook.call(task, this.config, ...hookArgs);
                                }
                                else {
                                    await hook(this.config, ...hookArgs);
                                }
                            }),
                            rendererOptions: {},
                        });
                    }
                }
            }
        }
        return tasks;
    }
    async triggerMutatingHook(hookName, ...item) {
        let result = item[0];
        for (const plugin of this.plugins) {
            if (typeof plugin.getHooks === 'function') {
                let hooks = plugin.getHooks()[hookName];
                if (hooks) {
                    if (typeof hooks === 'function')
                        hooks = [hooks];
                    for (const hook of hooks) {
                        result = (await hook(this.config, ...item)) || result;
                    }
                }
            }
        }
        return result;
    }
    async overrideStartLogic(opts) {
        let newStartFn;
        const claimed = [];
        for (const plugin of this.plugins) {
            if (typeof plugin.startLogic === 'function' &&
                plugin.startLogic !== plugin_base_1.PluginBase.prototype.startLogic) {
                claimed.push(plugin.name);
                newStartFn = plugin.startLogic.bind(plugin);
            }
        }
        if (claimed.length > 1) {
            throw new Error(`Multiple plugins tried to take control of the start command, please remove one of them\n --> ${claimed.join(', ')}`);
        }
        if (claimed.length === 1 && newStartFn) {
            d(`plugin: "${claimed[0]}" has taken control of the start command`);
            const result = await newStartFn(opts);
            if (typeof result === 'object' && 'tasks' in result) {
                result.tasks = result.tasks.map((task) => ({
                    ...task,
                    title: `${chalk_1.default.cyan(`[plugin-${claimed[0]}]`)} ${task.title}`,
                }));
            }
            return result;
        }
        return false;
    }
}
exports.default = PluginInterface;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLWludGVyZmFjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3BsdWdpbi1pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw2REFBeUQ7QUFhekQsa0RBQTBCO0FBQzFCLGtEQUEwQjtBQUsxQixvRUFBMkM7QUFFM0MsTUFBTSxDQUFDLEdBQUcsSUFBQSxlQUFLLEVBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUUxQyxTQUFTLGFBQWEsQ0FBQyxNQUE4QjtJQUNuRCxPQUFRLE1BQXVCLENBQUMsdUJBQXVCLENBQUM7QUFDMUQsQ0FBQztBQUVELE1BQXFCLGVBQWU7SUFNbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQ2pCLEdBQVcsRUFDWCxXQUFnQztRQUVoQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGVBQWUsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbEQsTUFBTSxHQUFHLENBQUMsY0FBYyxDQUFDO1FBQ3pCLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELFlBQW9CLEdBQVcsRUFBRSxXQUFnQztRQWR6RCxZQUFPLEdBQW1CLEVBQUUsQ0FBQztRQUM3QixtQkFBYyxHQUFrQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFjeEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUMvQixXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUF5QixFQUFFO1lBQzlELElBQUksYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sTUFBTSxDQUFDO1lBQ2hCLENBQUM7WUFFRCxJQUNFLE9BQU8sTUFBTSxLQUFLLFFBQVE7Z0JBQzFCLE1BQU0sSUFBSSxNQUFNO2dCQUNoQixRQUFRLElBQUksTUFBTSxFQUNsQixDQUFDO2dCQUNELE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE1B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