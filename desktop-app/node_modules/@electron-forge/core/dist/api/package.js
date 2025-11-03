"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listrPackage = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const get_1 = require("@electron/get");
const packager_1 = require("@electron/packager");
const core_utils_1 = require("@electron-forge/core-utils");
const tracer_1 = require("@electron-forge/tracer");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const listr2_1 = require("listr2");
const forge_config_1 = __importDefault(require("../util/forge-config"));
const hook_1 = require("../util/hook");
const import_search_1 = __importDefault(require("../util/import-search"));
const messages_1 = require("../util/messages");
const out_dir_1 = __importDefault(require("../util/out-dir"));
const read_package_json_1 = require("../util/read-package-json");
const resolve_dir_1 = __importDefault(require("../util/resolve-dir"));
const d = (0, debug_1.default)('electron-forge:packager');
/**
 * Resolves hooks if they are a path to a file (instead of a `Function`).
 */
async function resolveHooks(hooks, dir) {
    if (hooks) {
        return await Promise.all(hooks.map(async (hook) => typeof hook === 'string'
            ? (await (0, import_search_1.default)(dir, [hook]))
            : hook));
    }
    return [];
}
/**
 * @deprecated Only use until \@electron/packager publishes a new major version with promise based hooks
 */
function hidePromiseFromPromisify(fn) {
    return (...args) => {
        void fn(...args);
    };
}
/**
 * Runs given hooks sequentially by mapping them to promises and iterating
 * through while awaiting
 */
function sequentialHooks(hooks) {
    return [
        hidePromiseFromPromisify(async (buildPath, electronVersion, platform, arch, done) => {
            for (const hook of hooks) {
                try {
                    await (0, node_util_1.promisify)(hook)(buildPath, electronVersion, platform, arch);
                }
                catch (err) {
                    d('hook failed:', hook.toString(), err);
                    return done(err);
                }
            }
            done();
        }),
    ];
}
function sequentialFinalizePackageTargetsHooks(hooks) {
    return [
        hidePromiseFromPromisify(async (targets, done) => {
            for (const hook of hooks) {
                try {
                    await (0, node_util_1.promisify)(hook)(targets);
                }
                catch (err) {
                    return done(err);
                }
            }
            done();
        }),
    ];
}
const listrPackage = (childTrace, { dir: providedDir = process.cwd(), interactive = false, arch = (0, get_1.getHostArch)(), platform = process.platform, outDir, }) => {
    const runner = new listr2_1.Listr([
        {
            title: 'Preparing to package application',
            task: childTrace({ name: 'package-prepare', category: '@electron-forge/core' }, async (_, ctx) => {
                const resolvedDir = await (0, resolve_dir_1.default)(providedDir);
                if (!resolvedDir) {
                    throw new Error('Failed to locate compilable Electron application');
                }
                ctx.dir = resolvedDir;
                ctx.forgeConfig = await (0, forge_config_1.default)(resolvedDir);
                ctx.packageJSON = await (0, read_package_json_1.readMutatedPackageJson)(resolvedDir, ctx.forgeConfig);
                if (!ctx.packageJSON.main) {
                    throw new Error('packageJSON.main must be set to a valid entry point for your Electron app');
                }
                ctx.calculatedOutDir =
                    outDir || (0, out_dir_1.default)(resolvedDir, ctx.forgeConfig);
            }),
        },
        {
            title: 'Running packaging hooks',
            task: childTrace({ name: 'run-packaging-hooks', category: '@electron-forge/core' }, async (childTrace, { forgeConfig }, task) => {
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr([
                    {
                        title: `Running ${chalk_1.default.yellow('generateAssets')} hook`,
                        task: childTrace({
                            name: 'run-generateAssets-hook',
                            category: '@electron-forge/core',
                        }, async (childTrace, _, task) => {
                            return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(await (0, hook_1.getHookListrTasks)(childTrace, forgeConfig, 'generateAssets', platform, arch)), 'run');
                        }),
                    },
                    {
                        title: `Running ${chalk_1.default.yellow('prePackage')} hook`,
                        task: childTrace({
                            name: 'run-prePackage-hook',
                            category: '@electron-forge/core',
                        }, async (childTrace, _, task) => {
                            return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(await (0, hook_1.getHookListrTasks)(childTrace, forgeConfig, 'prePackage', platform, arch)), 'run');
                        }),
                    },
                ]), 'run');
            }),
        },
        {
            title: 'Packaging application',
            task: childTrace({ name: 'packaging-application', category: '@electron-forge/core' }, async (childTrace, ctx, task) => {
                const { calculatedOutDir, forgeConfig, packageJSON } = ctx;
                const getTargetKey = (target) => `${target.platform}/${target.arch}`;
                task.output = 'Determining targets...';
                const signalCopyDone = new Map();
                const signalRebuildDone = new Map();
                const signalPackageDone = new Map();
                const rejects = [];
                const signalDone = (map, target) => {
                    map.get(getTargetKey(target))?.pop()?.();
                };
                const addSignalAndWait = async (map, target) => {
                    const targetKey = getTargetKey(target);
                    await new Promise((resolve, reject) => {
                        rejects.push(reject);
                        map.set(targetKey, (map.get(targetKey) || []).concat([resolve]));
                    });
                };
                let provideTargets;
                const targetsPromise = new Promise((resolve, reject) => {
                    provideTargets = resolve;
                    rejects.push(reject);
                });
                const rebuildTasks = new Map();
                const signalRebuildStart = new Map();
                const afterFinalizePackageTargetsHooks = [
                    (targets, done) => {
                        provideTargets(targets);
                        done();
                    },
                    ...(await resolveHooks(forgeConfig.packagerConfig.afterFinalizePackageTargets, ctx.dir)),
                ];
                const pruneEnabled = !('prune' in forgeConfig.packagerConfig) ||
                    forgeConfig.packagerConfig.prune;
                const afterCopyHooks = [
                    hidePromiseFromPromisify(async (buildPath, electronVersion, platform, arch, done) => {
                        signalDone(signalCopyDone, { platform, arch });
                        done();
                    }),
                    hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                        const bins = await (0, fast_glob_1.default)(node_path_1.default.join(buildPath, '**/.bin/**/*'));
                        for (const bin of bins) {
                            await fs_extra_1.default.remove(bin);
                        }
                        done();
                    }),
                    hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                        await (0, hook_1.runHook)(forgeConfig, 'packageAfterCopy', buildPath, electronVersion, pPlatform, pArch);
                        done();
                    }),
                    hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                        const targetKey = getTargetKey({
                            platform: pPlatform,
                            arch: pArch,
                        });
                        await (0, core_utils_1.listrCompatibleRebuildHook)(buildPath, electronVersion, pPlatform, pArch, forgeConfig.rebuildConfig, 
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        await rebuildTasks.get(targetKey).pop());
                        signalRebuildDone.get(targetKey)?.pop()?.();
                        done();
                    }),
                    hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                        const copiedPackageJSON = await (0, read_package_json_1.readMutatedPackageJson)(buildPath, forgeConfig);
                        if (copiedPackageJSON.config &&
                            copiedPackageJSON.config.forge) {
                            delete copiedPackageJSON.config.forge;
                        }
                        await fs_extra_1.default.writeJson(node_path_1.default.resolve(buildPath, 'package.json'), copiedPackageJSON, { spaces: 2 });
                        done();
                    }),
                    ...(await resolveHooks(forgeConfig.packagerConfig.afterCopy, ctx.dir)),
                ];
                const afterCompleteHooks = [
                    hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                        signalPackageDone
                            .get(getTargetKey({ platform: pPlatform, arch: pArch }))
                            ?.pop()?.();
                        done();
                    }),
                    ...(await resolveHooks(forgeConfig.packagerConfig.afterComplete, ctx.dir)),
                ];
                const afterPruneHooks = [];
                if (pruneEnabled) {
                    afterPruneHooks.push(...(await resolveHooks(forgeConfig.packagerConfig.afterPrune, ctx.dir)));
                }
                afterPruneHooks.push(hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                    await (0, hook_1.runHook)(forgeConfig, 'packageAfterPrune', buildPath, electronVersion, pPlatform, pArch);
                    done();
                }));
                const afterExtractHooks = [
                    hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                        await (0, hook_1.runHook)(forgeConfig, 'packageAfterExtract', buildPath, electronVersion, pPlatform, pArch);
                        done();
                    }),
                ];
                afterExtractHooks.push(...(await resolveHooks(forgeConfig.packagerConfig.afterExtract, ctx.dir)));
                const packageOpts = {
                    asar: false,
                    overwrite: true,
                    ignore: [/^\/out\//g],
                    quiet: true,
                    ...forgeConfig.packagerConfig,
                    dir: ctx.dir,
                    arch: arch,
                    platform,
                    afterFinalizePackageTargets: sequentialFinalizePackageTargetsHooks(afterFinalizePackageTargetsHooks),
                    afterComplete: sequentialHooks(afterCompleteHooks),
                    afterCopy: sequentialHooks(afterCopyHooks),
                    afterExtract: sequentialHooks(afterExtractHooks),
                    afterPrune: sequentialHooks(afterPruneHooks),
                    out: calculatedOutDir,
                    electronVersion: await (0, core_utils_1.getElectronVersion)(ctx.dir, packageJSON),
                };
                if (packageOpts.all) {
                    throw new Error('config.forge.packagerConfig.all is not supported by Electron Forge');
                }
                if (!packageJSON.version && !packageOpts.appVersion) {
                    (0, messages_1.warn)(interactive, chalk_1.default.yellow('Please set "version" or "config.forge.packagerConfig.appVersion" in your application\'s package.json so auto-updates work properly'));
                }
                if (packageOpts.prebuiltAsar) {
                    throw new Error('config.forge.packagerConfig.prebuiltAsar is not supported by Electron Forge');
                }
                d('packaging with options', packageOpts);
                ctx.packagerPromise = (0, packager_1.packager)(packageOpts);
                // Handle error by failing this task
                // rejects is populated by the reject handlers for every
                // signal based promise in every subtask
                ctx.packagerPromise.catch((err) => {
                    for (const reject of rejects) {
                        reject(err);
                    }
                });
                const targets = await targetsPromise;
                // Copy the resolved targets into the context for later
                ctx.targets = [...targets];
                // If we are targetting a universal build we need to add the "fake"
                // x64 and arm64 builds into the list of targets so that we can
                // show progress for those
                for (const target of targets) {
                    if (target.arch === 'universal') {
                        targets.push({
                            platform: target.platform,
                            arch: 'x64',
                            forUniversal: true,
                        }, {
                            platform: target.platform,
                            arch: 'arm64',
                            forUniversal: true,
                        });
                    }
                }
                // Populate rebuildTasks with promises that resolve with the rebuild tasks
                // that will eventually run
                for (const target of targets) {
                    // Skip universal tasks as they do not have rebuild sub-tasks
                    if (target.arch === 'universal')
                        continue;
                    const targetKey = getTargetKey(target);
                    rebuildTasks.set(targetKey, (rebuildTasks.get(targetKey) || []).concat([
                        new Promise((resolve) => {
                            signalRebuildStart.set(targetKey, (signalRebuildStart.get(targetKey) || []).concat([
                                resolve,
                            ]));
                        }),
                    ]));
                }
                d('targets:', targets);
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(targets.map((target) => target.arch === 'universal'
                    ? {
                        title: `Stitching ${chalk_1.default.cyan(`${target.platform}/x64`)} and ${chalk_1.default.cyan(`${target.platform}/arm64`)} into a ${chalk_1.default.green(`${target.platform}/universal`)} package`,
                        task: async () => {
                            await addSignalAndWait(signalPackageDone, target);
                        },
                        rendererOptions: {
                            timer: { ...listr2_1.PRESET_TIMER },
                        },
                    }
                    : {
                        title: `Packaging for ${chalk_1.default.cyan(target.arch)} on ${chalk_1.default.cyan(target.platform)}${target.forUniversal
                            ? chalk_1.default.italic(' (for universal package)')
                            : ''}`,
                        task: childTrace({
                            name: `package-app-${target.platform}-${target.arch}${target.forUniversal ? '-universal-tmp' : ''}`,
                            category: '@electron-forge/core',
                            extraDetails: {
                                arch: target.arch,
                                platform: target.platform,
                            },
                            newRoot: true,
                        }, async (childTrace, _, task) => {
                            return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr([
                                {
                                    title: 'Copying files',
                                    task: childTrace({
                                        name: 'copy-files',
                                        category: '@electron-forge/core',
                                    }, async () => {
                                        await addSignalAndWait(signalCopyDone, target);
                                    }),
                                },
                                {
                                    title: 'Preparing native dependencies',
                                    task: childTrace({
                                        name: 'prepare-native-dependencies',
                                        category: '@electron-forge/core',
                                    }, async (_, __, task) => {
                                        signalRebuildStart
                                            .get(getTargetKey(target))
                                            ?.pop()?.(task);
                                        await addSignalAndWait(signalRebuildDone, target);
                                    }),
                                    rendererOptions: {
                                        persistentOutput: true,
                                        bottomBar: Infinity,
                                        timer: { ...listr2_1.PRESET_TIMER },
                                    },
                                },
                                {
                                    title: 'Finalizing package',
                                    task: childTrace({
                                        name: 'finalize-package',
                                        category: '@electron-forge/core',
                                    }, async () => {
                                        await addSignalAndWait(signalPackageDone, target);
                                    }),
                                },
                            ], {
                                rendererOptions: {
                                    collapseSubtasks: true,
                                    collapseErrors: false,
                                },
                            }), 'run');
                        }),
                        rendererOptions: {
                            timer: { ...listr2_1.PRESET_TIMER },
                        },
                    }), {
                    concurrent: true,
                    rendererOptions: {
                        collapseSubtasks: false,
                        collapseErrors: false,
                    },
                }), 'run');
            }),
        },
        {
            title: `Running ${chalk_1.default.yellow('postPackage')} hook`,
            task: childTrace({ name: 'run-postPackage-hook', category: '@electron-forge/core' }, async (childTrace, { packagerPromise, forgeConfig }, task) => {
                const outputPaths = await packagerPromise;
                d('outputPaths:', outputPaths);
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(await (0, hook_1.getHookListrTasks)(childTrace, forgeConfig, 'postPackage', {
                    arch,
                    outputPaths,
                    platform,
                })), 'run');
            }),
        },
    ], {
        concurrent: false,
        silentRendererCondition: !interactive,
        fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
        rendererOptions: {
            collapseSubtasks: false,
            collapseErrors: false,
        },
        ctx: {},
    });
    return runner;
};
exports.listrPackage = listrPackage;
exports.default = (0, tracer_1.autoTrace)({ name: 'package()', category: '@electron-forge/core' }, async (childTrace, opts) => {
    const runner = (0, exports.listrPackage)(childTrace, opts);
    await runner.run();
    const outputPaths = await runner.ctx.packagerPromise;
    return runner.ctx.targets.map((target, index) => ({
        platform: target.platform,
        arch: target.arch,
        packagedPath: outputPaths[index],
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvcGFja2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwREFBNkI7QUFDN0IseUNBQXNDO0FBRXRDLHVDQUE0QztBQUM1QyxpREFNNEI7QUFDNUIsMkRBR29DO0FBU3BDLG1EQUF5RTtBQUN6RSxrREFBMEI7QUFDMUIsa0RBQTBCO0FBQzFCLDBEQUE2QjtBQUM3Qix3REFBMEI7QUFDMUIsbUNBQTZDO0FBRTdDLHdFQUFrRDtBQUNsRCx1Q0FBMEQ7QUFDMUQsMEVBQWlEO0FBQ2pELCtDQUF3QztBQUN4Qyw4REFBK0M7QUFDL0MsaUVBQW1FO0FBQ25FLHNFQUE2QztBQUU3QyxNQUFNLENBQUMsR0FBRyxJQUFBLGVBQUssRUFBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBRTNDOztHQUVHO0FBQ0gsS0FBSyxVQUFVLFlBQVksQ0FDekIsS0FBaUMsRUFDakMsR0FBVztJQUVYLElBQUksS0FBSyxFQUFFLENBQUM7UUFDVixPQUFPLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FDdkIsT0FBTyxJQUFJLEtBQUssUUFBUTtZQUN0QixDQUFDLENBQUUsQ0FBQyxNQUFNLElBQUEsdUJBQVksRUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFPO1lBQzdDLENBQUMsQ0FBQyxJQUFJLENBQ1QsQ0FDRixDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU8sRUFBRSxDQUFDO0FBQ1osQ0FBQztBQWFEOztHQUVHO0FBQ0gsU0FBUyx3QkFBd0IsQ0FDL0IsRUFBaUM7SUFFakMsT0FBTyxDQUFDLEdBQUcsSUFBTyxFQUFFLEVBQUU7UUFDcEIsS0FBSyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNuQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FB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