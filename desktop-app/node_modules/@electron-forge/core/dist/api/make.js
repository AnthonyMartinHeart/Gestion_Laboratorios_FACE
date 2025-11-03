"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listrMake = void 0;
const node_path_1 = __importDefault(require("node:path"));
const get_1 = require("@electron/get");
const core_utils_1 = require("@electron-forge/core-utils");
const tracer_1 = require("@electron-forge/tracer");
const chalk_1 = __importDefault(require("chalk"));
const filenamify_1 = __importDefault(require("filenamify"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const listr2_1 = require("listr2");
const log_symbols_1 = __importDefault(require("log-symbols"));
const forge_config_1 = __importDefault(require("../util/forge-config"));
const hook_1 = require("../util/hook");
const import_search_1 = __importDefault(require("../util/import-search"));
const out_dir_1 = __importDefault(require("../util/out-dir"));
const parse_archs_1 = __importDefault(require("../util/parse-archs"));
const read_package_json_1 = require("../util/read-package-json");
const resolve_dir_1 = __importDefault(require("../util/resolve-dir"));
const package_1 = require("./package");
function generateTargets(forgeConfig, overrideTargets) {
    if (overrideTargets) {
        return overrideTargets.map((target) => {
            if (typeof target === 'string') {
                return (forgeConfig.makers.find((maker) => maker.name === target) || { name: target });
            }
            return target;
        });
    }
    return forgeConfig.makers;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isElectronForgeMaker(target) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return target.__isElectronForgeMaker;
}
const listrMake = (childTrace, { dir: providedDir = process.cwd(), interactive = false, skipPackage = false, arch = (0, get_1.getHostArch)(), platform = process.platform, overrideTargets, outDir, }, receiveMakeResults) => {
    const listrOptions = {
        concurrent: false,
        rendererOptions: {
            collapseSubtasks: false,
            collapseErrors: false,
        },
        silentRendererCondition: !interactive,
        fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };
    const runner = new listr2_1.Listr([
        {
            title: 'Loading configuration',
            task: childTrace({ name: 'load-forge-config', category: '@electron-forge/core' }, async (_, ctx) => {
                const resolvedDir = await (0, resolve_dir_1.default)(providedDir);
                if (!resolvedDir) {
                    throw new Error('Failed to locate startable Electron application');
                }
                ctx.dir = resolvedDir;
                ctx.forgeConfig = await (0, forge_config_1.default)(resolvedDir);
            }),
        },
        {
            title: 'Resolving make targets',
            task: childTrace({ name: 'resolve-make-targets', category: '@electron-forge/core' }, async (_, ctx, task) => {
                const { dir, forgeConfig } = ctx;
                ctx.actualOutDir = outDir || (0, out_dir_1.default)(dir, forgeConfig);
                if (!['darwin', 'win32', 'linux', 'mas'].includes(platform)) {
                    throw new Error(`'${platform}' is an invalid platform. Choices are 'darwin', 'mas', 'win32' or 'linux'.`);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const makers = [];
                const possibleMakers = generateTargets(forgeConfig, overrideTargets);
                for (const possibleMaker of possibleMakers) {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    let maker;
                    if (isElectronForgeMaker(possibleMaker)) {
                        maker = possibleMaker;
                        if (!maker.platforms.includes(platform))
                            continue;
                    }
                    else {
                        const resolvableTarget = possibleMaker;
                        // non-false falsy values should be 'true'
                        if (resolvableTarget.enabled === false)
                            continue;
                        if (!resolvableTarget.name) {
                            throw new Error(`The following maker config is missing a maker name: ${JSON.stringify(resolvableTarget)}`);
                        }
                        else if (typeof resolvableTarget.name !== 'string') {
                            throw new Error(`The following maker config has a maker name that is not a string: ${JSON.stringify(resolvableTarget)}`);
                        }
                        const MakerClass = await (0, import_search_1.default)(dir, [
                            resolvableTarget.name,
                        ]);
                        if (!MakerClass) {
                            throw new Error(`Could not find module with name '${resolvableTarget.name}'. If this is a package from NPM, make sure it's listed in the devDependencies of your package.json. If this is a local module, make sure you have the correct path to its entry point. Try using the DEBUG="electron-forge:require-search" environment variable for more information.`);
                        }
                        maker = new MakerClass(resolvableTarget.config, resolvableTarget.platforms || undefined);
                        if (!maker.platforms.includes(platform))
                            continue;
                    }
                    if (!maker.isSupportedOnCurrentPlatform) {
                        throw new Error([
                            `Maker for target ${maker.name} is incompatible with this version of `,
                            'Electron Forge, please upgrade or contact the maintainer ',
                            "(needs to implement 'isSupportedOnCurrentPlatform)')",
                        ].join(''));
                    }
                    if (!maker.isSupportedOnCurrentPlatform()) {
                        throw new Error(`Cannot make for ${platform} and target ${maker.name}: the maker declared that it cannot run on ${process.platform}.`);
                    }
                    maker.ensureExternalBinariesExist();
                    makers.push(() => maker.clone());
                }
                if (makers.length === 0) {
                    throw new Error(`Could not find any make targets configured for the "${platform}" platform.`);
                }
                ctx.makers = makers;
                task.output = `Making for the following targets: ${chalk_1.default.magenta(`${makers.map((maker) => maker.name).join(', ')}`)}`;
            }),
            rendererOptions: {
                persistentOutput: true,
            },
        },
        {
            title: `Running ${chalk_1.default.yellow('package')} command`,
            task: childTrace({ name: 'package()', category: '@electron-forge/core' }, async (childTrace, ctx, task) => {
                if (!skipPackage) {
                    return (0, tracer_1.delayTraceTillSignal)(childTrace, (0, package_1.listrPackage)(childTrace, {
                        dir: ctx.dir,
                        interactive,
                        arch,
                        outDir: ctx.actualOutDir,
                        platform,
                    }), 'run');
                }
                else {
                    task.output = chalk_1.default.yellow(`${log_symbols_1.default.warning} Skipping could result in an out of date build`);
                    task.skip();
                }
            }),
            rendererOptions: {
                persistentOutput: true,
            },
        },
        {
            title: `Running ${chalk_1.default.yellow('preMake')} hook`,
            task: childTrace({ name: 'run-preMake-hook', category: '@electron-forge/core' }, async (childTrace, ctx, task) => {
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(await (0, hook_1.getHookListrTasks)(childTrace, ctx.forgeConfig, 'preMake')), 'run');
            }),
        },
        {
            title: 'Making distributables',
            task: childTrace({ name: 'make-distributables', category: '@electron-forge/core' }, async (childTrace, ctx, task) => {
                const { actualOutDir, dir, forgeConfig, makers } = ctx;
                const packageJSON = await (0, read_package_json_1.readMutatedPackageJson)(dir, forgeConfig);
                const appName = (0, filenamify_1.default)(forgeConfig.packagerConfig.name ||
                    packageJSON.productName ||
                    packageJSON.name, { replacement: '-' });
                const outputs = [];
                ctx.outputs = outputs;
                const subRunner = task.newListr([], {
                    ...listrOptions,
                    concurrent: true,
                    rendererOptions: {
                        collapseSubtasks: false,
                        collapseErrors: false,
                    },
                });
                for (const targetArch of (0, parse_archs_1.default)(platform, arch, await (0, core_utils_1.getElectronVersion)(dir, packageJSON))) {
                    const packageDir = node_path_1.default.resolve(actualOutDir, `${appName}-${platform}-${targetArch}`);
                    if (!(await fs_extra_1.default.pathExists(packageDir))) {
                        throw new Error(`Couldn't find packaged app at: ${packageDir}`);
                    }
                    for (const maker of makers) {
                        const uniqMaker = maker();
                        subRunner.add({
                            title: `Making a ${chalk_1.default.magenta(uniqMaker.name)} distributable for ${chalk_1.default.cyan(`${platform}/${targetArch}`)}`,
                            task: childTrace({
                                name: `make-${maker.name}`,
                                category: '@electron-forge/core',
                                newRoot: true,
                            }, async () => {
                                try {
                                    await Promise.resolve(uniqMaker.prepareConfig(targetArch));
                                    const artifacts = await uniqMaker.make({
                                        appName,
                                        forgeConfig,
                                        packageJSON,
                                        targetArch,
                                        dir: packageDir,
                                        makeDir: node_path_1.default.resolve(actualOutDir, 'make'),
                                        targetPlatform: platform,
                                    });
                                    outputs.push({
                                        artifacts,
                                        packageJSON,
                                        platform,
                                        arch: targetArch,
                                    });
                                }
                                catch (err) {
                                    if (err instanceof Error) {
                                        throw err;
                                    }
                                    else if (typeof err === 'string') {
                                        throw new Error(err);
                                    }
                                    else {
                                        throw new Error(`An unknown error occurred while making for target: ${uniqMaker.name}`);
                                    }
                                }
                            }),
                            rendererOptions: {
                                timer: { ...listr2_1.PRESET_TIMER },
                            },
                        });
                    }
                }
                return (0, tracer_1.delayTraceTillSignal)(childTrace, subRunner, 'run');
            }),
        },
        {
            title: `Running ${chalk_1.default.yellow('postMake')} hook`,
            task: childTrace({ name: 'run-postMake-hook', category: '@electron-forge/core' }, async (_, ctx, task) => {
                // If the postMake hooks modifies the locations / names of the outputs it must return
                // the new locations so that the publish step knows where to look
                const originalOutputs = JSON.stringify(ctx.outputs);
                ctx.outputs = await (0, hook_1.runMutatingHook)(ctx.forgeConfig, 'postMake', ctx.outputs);
                let outputLocations = [node_path_1.default.resolve(ctx.actualOutDir, 'make')];
                if (originalOutputs !== JSON.stringify(ctx.outputs)) {
                    const newDirs = new Set();
                    const artifactPaths = [];
                    for (const result of ctx.outputs) {
                        for (const artifact of result.artifacts) {
                            newDirs.add(node_path_1.default.dirname(artifact));
                            artifactPaths.push(artifact);
                        }
                    }
                    if (newDirs.size <= ctx.outputs.length) {
                        outputLocations = [...newDirs];
                    }
                    else {
                        outputLocations = artifactPaths;
                    }
                }
                receiveMakeResults?.(ctx.outputs);
                task.output = `Artifacts available at: ${chalk_1.default.green(outputLocations.join(', '))}`;
            }),
            rendererOptions: {
                persistentOutput: true,
            },
        },
    ], {
        ...listrOptions,
        ctx: {},
    });
    return runner;
};
exports.listrMake = listrMake;
exports.default = (0, tracer_1.autoTrace)({ name: 'make()', category: '@electron-forge/core' }, async (childTrace, opts) => {
    const runner = (0, exports.listrMake)(childTrace, opts);
    await runner.run();
    return runner.ctx.outputs;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvbWFrZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwREFBNkI7QUFFN0IsdUNBQTRDO0FBQzVDLDJEQUFnRTtBQVloRSxtREFBeUU7QUFDekUsa0RBQTBCO0FBQzFCLDREQUFvQztBQUNwQyx3REFBMEI7QUFDMUIsbUNBQTZDO0FBQzdDLDhEQUFxQztBQUVyQyx3RUFBa0Q7QUFDbEQsdUNBQWtFO0FBQ2xFLDBFQUFpRDtBQUNqRCw4REFBK0M7QUFDL0Msc0VBQTZDO0FBQzdDLGlFQUFtRTtBQUNuRSxzRUFBNkM7QUFFN0MsdUNBQXlDO0FBU3pDLFNBQVMsZUFBZSxDQUN0QixXQUFnQyxFQUNoQyxlQUE2QjtJQUU3QixJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3BDLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sQ0FDTCxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDckIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFFLEtBQStCLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FDNUQsSUFBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQTRCLENBQ2pELENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDO0FBQzVCLENBQUM7QUFFRCw4REFBOEQ7QUFDOUQsU0FBUyxvQkFBb0IsQ0FDM0IsTUFBZ0M7SUFFaEMsOERBQThEO0lBQzlELE9BQVEsTUFBeUIsQ0FBQyxzQkFBc0IsQ0FBQztBQUMzRCxDQUFDO0FBeUNNLE1BQU0sU0FBUyxHQUFHLENBQ3ZCLFVBQTRCLEVBQzVCLEVBQ0UsR0FBRyxFQUFFLFdBQVcsR0FB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