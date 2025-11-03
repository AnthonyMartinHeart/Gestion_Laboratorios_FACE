"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_readline_1 = __importDefault(require("node:readline"));
const core_utils_1 = require("@electron-forge/core-utils");
const tracer_1 = require("@electron-forge/tracer");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const listr2_1 = require("listr2");
const electron_executable_1 = __importDefault(require("../util/electron-executable"));
const forge_config_1 = __importDefault(require("../util/forge-config"));
const hook_1 = require("../util/hook");
const read_package_json_1 = require("../util/read-package-json");
const resolve_dir_1 = __importDefault(require("../util/resolve-dir"));
const d = (0, debug_1.default)('electron-forge:start');
exports.default = (0, tracer_1.autoTrace)({ name: 'start()', category: '@electron-forge/core' }, async (childTrace, { dir: providedDir = process.cwd(), appPath = '.', interactive = false, enableLogging = false, args = [], runAsNode = false, inspect = false, inspectBrk = false, }) => {
    const platform = process.env.npm_config_platform || process.platform;
    const arch = process.env.npm_config_arch || process.arch;
    const listrOptions = {
        concurrent: false,
        registerSignalListeners: false, // Don't re-render on SIGINT
        rendererOptions: {
            collapseErrors: false,
            collapseSubtasks: false,
        },
        silentRendererCondition: !interactive,
        fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };
    const runner = new listr2_1.Listr([
        {
            title: 'Locating application',
            task: childTrace({ name: 'locate-application', category: '@electron-forge/core' }, async (_, ctx) => {
                const resolvedDir = await (0, resolve_dir_1.default)(providedDir);
                if (!resolvedDir) {
                    throw new Error('Failed to locate startable Electron application');
                }
                ctx.dir = resolvedDir;
            }),
        },
        {
            title: 'Loading configuration',
            task: childTrace({ name: 'load-forge-config', category: '@electron-forge/core' }, async (_, ctx) => {
                const { dir } = ctx;
                ctx.forgeConfig = await (0, forge_config_1.default)(dir);
                ctx.packageJSON = await (0, read_package_json_1.readMutatedPackageJson)(dir, ctx.forgeConfig);
                if (!ctx.packageJSON.version) {
                    throw new Error(`Please set your application's 'version' in '${dir}/package.json'.`);
                }
            }),
        },
        {
            title: 'Preparing native dependencies',
            task: childTrace({
                name: 'prepare-native-dependencies',
                category: '@electron-forge/core',
            }, async (_, { dir, forgeConfig, packageJSON }, task) => {
                await (0, core_utils_1.listrCompatibleRebuildHook)(dir, await (0, core_utils_1.getElectronVersion)(dir, packageJSON), platform, arch, forgeConfig.rebuildConfig, task);
            }),
            rendererOptions: {
                persistentOutput: true,
                bottomBar: Infinity,
                timer: { ...listr2_1.PRESET_TIMER },
            },
        },
        {
            title: `Running ${chalk_1.default.yellow('generateAssets')} hook`,
            task: childTrace({
                name: 'run-generateAssets-hook',
                category: '@electron-forge/core',
            }, async (childTrace, { forgeConfig }, task) => {
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(await (0, hook_1.getHookListrTasks)(childTrace, forgeConfig, 'generateAssets', platform, arch)), 'run');
            }),
        },
        {
            title: `Running ${chalk_1.default.yellow('preStart')} hook`,
            task: childTrace({ name: 'run-preStart-hook', category: '@electron-forge/core' }, async (childTrace, { forgeConfig }, task) => {
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(await (0, hook_1.getHookListrTasks)(childTrace, forgeConfig, 'preStart')), 'run');
            }),
        },
        {
            task: (_ctx, task) => {
                task.title = `${chalk_1.default.dim(`Launched Electron app. Type`)} ${chalk_1.default.bold('rs')} ${chalk_1.default.dim(`in terminal to restart main process.`)}`;
            },
        },
    ], listrOptions);
    await runner.run();
    const { dir, forgeConfig, packageJSON } = runner.ctx;
    let lastSpawned = null;
    const forgeSpawn = async () => {
        let electronExecPath = null;
        // If a plugin has taken over the start command let's stop here
        let spawnedPluginChild = await forgeConfig.pluginInterface.overrideStartLogic({
            dir,
            appPath,
            interactive,
            enableLogging,
            args,
            runAsNode,
            inspect,
            inspectBrk,
        });
        if (typeof spawnedPluginChild === 'object' &&
            'tasks' in spawnedPluginChild) {
            const innerRunner = new listr2_1.Listr([], listrOptions);
            for (const task of spawnedPluginChild.tasks) {
                innerRunner.add(task);
            }
            await innerRunner.run();
            spawnedPluginChild = spawnedPluginChild.result;
        }
        let prefixArgs = [];
        if (typeof spawnedPluginChild === 'string') {
            electronExecPath = spawnedPluginChild;
        }
        else if (Array.isArray(spawnedPluginChild)) {
            [electronExecPath, ...prefixArgs] = spawnedPluginChild;
        }
        else if (spawnedPluginChild) {
            await (0, hook_1.runHook)(forgeConfig, 'postStart', spawnedPluginChild);
            return spawnedPluginChild;
        }
        if (!electronExecPath) {
            electronExecPath = await (0, electron_executable_1.default)(dir, packageJSON);
        }
        d('Electron binary path:', electronExecPath);
        const spawnOpts = {
            cwd: dir,
            stdio: 'inherit',
            env: {
                ...process.env,
                ...(enableLogging
                    ? {
                        ELECTRON_ENABLE_LOGGING: 'true',
                        ELECTRON_ENABLE_STACK_DUMPING: 'true',
                    }
                    : {}),
            },
        };
        if (runAsNode) {
            spawnOpts.env.ELECTRON_RUN_AS_NODE = 'true';
        }
        else {
            delete spawnOpts.env.ELECTRON_RUN_AS_NODE;
        }
        if (inspect) {
            args = ['--inspect'].concat(args);
        }
        if (inspectBrk) {
            args = ['--inspect-brk'].concat(args);
        }
        const spawned = (0, node_child_process_1.spawn)(electronExecPath, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        prefixArgs.concat([appPath]).concat(args), spawnOpts);
        await (0, hook_1.runHook)(forgeConfig, 'postStart', spawned);
        return spawned;
    };
    const forgeSpawnWrapper = async () => {
        const spawned = await forgeSpawn();
        // When the child app is closed we should stop listening for stdin
        if (spawned) {
            if (interactive && process.stdin.isPaused()) {
                process.stdin.resume();
            }
            spawned.on('exit', () => {
                if (spawned.restarted) {
                    return;
                }
                if (interactive && !process.stdin.isPaused()) {
                    process.stdin.pause();
                }
            });
        }
        else if (interactive && !process.stdin.isPaused()) {
            process.stdin.pause();
        }
        lastSpawned = spawned;
        return lastSpawned;
    };
    if (interactive) {
        process.stdin.on('data', (data) => {
            if (data.toString().trim() === 'rs' && lastSpawned) {
                node_readline_1.default.moveCursor(process.stdout, 0, -1);
                node_readline_1.default.clearLine(process.stdout, 0);
                node_readline_1.default.cursorTo(process.stdout, 0);
                console.info(`${chalk_1.default.green('✔ ')}${chalk_1.default.dim('Restarting Electron app')}`);
                lastSpawned.restarted = true;
                lastSpawned.on('exit', async () => {
                    lastSpawned.emit('restarted', await forgeSpawnWrapper());
                });
                lastSpawned.kill('SIGTERM');
            }
        });
        process.stdin.resume();
    }
    const spawned = await forgeSpawnWrapper();
    if (interactive)
        console.log('');
    return spawned;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXBpL3N0YXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQXlEO0FBQ3pELGtFQUFxQztBQUVyQywyREFHb0M7QUFVcEMsbURBQXlFO0FBQ3pFLGtEQUEwQjtBQUMxQixrREFBMEI7QUFDMUIsbUNBQTZDO0FBRTdDLHNGQUFtRTtBQUNuRSx3RUFBa0Q7QUFDbEQsdUNBQTBEO0FBQzFELGlFQUFtRTtBQUNuRSxzRUFBNkM7QUFFN0MsTUFBTSxDQUFDLEdBQUcsSUFBQSxlQUFLLEVBQUMsc0JBQXNCLENBQUMsQ0FBQztBQVd4QyxrQkFBZSxJQUFBLGtCQUFTLEVBQ3RCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUUsRUFDckQsS0FBSyxFQUNILFVBQVUsRUFDVixFQUNFLEdBQUcsRUFBRSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUNoQyxPQUFPLEdBQUcsR0FBRyxFQUNiLFdBQVcsR0FBRyxLQUFLLEVBQ25CLGFBQWEsR0FBRyxLQUFLLEVBQ3JCLElBQUksR0FBRyxFQUFFLEVBQ1QsU0FBUyxHQUFHLEtBQUssRUFDakIsT0FBTyxHQUFHLEtBQUssRUFDZixVQUFVLEdBQUcsS0FBSyxHQUNMLEVBQ1csRUFBRTtJQUM1QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDckUsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQztJQUN6RCxNQUFNLFlBQVksR0FBb0M7UUFDcEQsVUFBVSxFQUFFLEtBQUs7UUFDakIsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLDRCQUE0QjtRQUM1RCxlQUFlLEVBQUU7WUFDZixjQUFjLEVBQUUsS0FBSztZQUNyQixnQkFBZ0IsRUFB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