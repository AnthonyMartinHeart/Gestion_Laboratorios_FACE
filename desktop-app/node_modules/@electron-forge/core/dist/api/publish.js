"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const tracer_1 = require("@electron-forge/tracer");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const listr2_1 = require("listr2");
const forge_config_1 = __importDefault(require("../util/forge-config"));
const import_search_1 = __importDefault(require("../util/import-search"));
const out_dir_1 = __importDefault(require("../util/out-dir"));
const publish_state_1 = __importDefault(require("../util/publish-state"));
const resolve_dir_1 = __importDefault(require("../util/resolve-dir"));
const make_1 = require("./make");
const d = (0, debug_1.default)('electron-forge:publish');
exports.default = (0, tracer_1.autoTrace)({ name: 'publish()', category: '@electron-forge/core' }, async (childTrace, { dir: providedDir = process.cwd(), interactive = false, makeOptions = {}, publishTargets = undefined, dryRun = false, dryRunResume = false, outDir, }) => {
    if (dryRun && dryRunResume) {
        throw new Error("Can't dry run and resume a dry run at the same time");
    }
    const listrOptions = {
        concurrent: false,
        rendererOptions: {
            collapseErrors: false,
        },
        silentRendererCondition: !interactive,
        fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };
    const publishDistributablesTasks = (childTrace) => [
        {
            title: 'Publishing distributables',
            task: childTrace({ name: 'publish-distributables', category: '@electron-forge/core' }, async (childTrace, { dir, forgeConfig, makeResults, publishers }, task) => {
                if (publishers.length === 0) {
                    task.output = 'No publishers configured';
                    task.skip();
                    return;
                }
                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(publishers.map((publisher) => ({
                    title: `${chalk_1.default.cyan(`[publisher-${publisher.name}]`)} Running the ${chalk_1.default.yellow('publish')} command`,
                    task: childTrace({
                        name: `publish-${publisher.name}`,
                        category: '@electron-forge/core',
                    }, async (childTrace, _, task) => {
                        const setStatusLine = (s) => {
                            task.output = s;
                        };
                        await publisher.publish({
                            dir,
                            makeResults: makeResults,
                            forgeConfig,
                            setStatusLine,
                        });
                    }),
                    rendererOptions: {
                        persistentOutput: true,
                    },
                })), {
                    rendererOptions: {
                        collapseSubtasks: false,
                        collapseErrors: false,
                    },
                }), 'run');
            }),
            rendererOptions: {
                persistentOutput: true,
            },
        },
    ];
    const runner = new listr2_1.Listr([
        {
            title: 'Loading configuration',
            task: childTrace({ name: 'load-forge-config', category: '@electron-forge/core' }, async (childTrace, ctx) => {
                const resolvedDir = await (0, resolve_dir_1.default)(providedDir);
                if (!resolvedDir) {
                    throw new Error('Failed to locate publishable Electron application');
                }
                ctx.dir = resolvedDir;
                ctx.forgeConfig = await (0, forge_config_1.default)(resolvedDir);
            }),
        },
        {
            title: 'Resolving publish targets',
            task: childTrace({
                name: 'resolve-publish-targets',
                category: '@electron-forge/core',
            }, async (childTrace, ctx, task) => {
                const { dir, forgeConfig } = ctx;
                if (!publishTargets) {
                    publishTargets = forgeConfig.publishers || [];
                }
                publishTargets = publishTargets.map((target) => {
                    if (typeof target === 'string') {
                        return ((forgeConfig.publishers || []).find((p) => {
                            if (typeof p === 'string')
                                return false;
                            if (p.__isElectronForgePublisher)
                                return false;
                            return (p.name === target);
                        }) || { name: target });
                    }
                    return target;
                });
                ctx.publishers = [];
                for (const publishTarget of publishTargets) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let publisher;
                    if (publishTarget.__isElectronForgePublisher) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        publisher = publishTarget;
                    }
                    else {
                        const resolvablePublishTarget = publishTarget;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const PublisherClass = await (0, import_search_1.default)(dir, [
                            resolvablePublishTarget.name,
                        ]);
                        if (!PublisherClass) {
                            throw new Error(`Could not find a publish target with the name: ${resolvablePublishTarget.name}. Make sure it's listed in the devDependencies of your package.json`);
                        }
                        publisher = new PublisherClass(resolvablePublishTarget.config || {}, resolvablePublishTarget.platforms);
                    }
                    ctx.publishers.push(publisher);
                }
                if (ctx.publishers.length) {
                    task.output = `Publishing to the following targets: ${chalk_1.default.magenta(`${ctx.publishers.map((publisher) => publisher.name).join(', ')}`)}`;
                }
            }),
            rendererOptions: {
                persistentOutput: true,
            },
        },
        {
            title: dryRunResume
                ? 'Resuming from dry run...'
                : `Running ${chalk_1.default.yellow('make')} command`,
            task: childTrace({
                name: dryRunResume ? 'resume-dry-run' : 'make()',
                category: '@electron-forge/core',
            }, async (childTrace, ctx, task) => {
                const { dir, forgeConfig } = ctx;
                const calculatedOutDir = outDir || (0, out_dir_1.default)(dir, forgeConfig);
                const dryRunDir = node_path_1.default.resolve(calculatedOutDir, 'publish-dry-run');
                if (dryRunResume) {
                    d('attempting to resume from dry run');
                    const publishes = await publish_state_1.default.loadFromDirectory(dryRunDir, dir);
                    task.title = `Resuming ${publishes.length} found dry runs...`;
                    return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(publishes.map((publishStates, index) => {
                        return {
                            title: `Publishing dry-run ${chalk_1.default.blue(`#${index + 1}`)}`,
                            task: childTrace({
                                name: `publish-dry-run-${index + 1}`,
                                category: '@electron-forge/core',
                            }, async (childTrace, ctx, task) => {
                                const restoredMakeResults = publishStates.map(({ state }) => state);
                                d('restoring publish settings from dry run');
                                for (const makeResult of restoredMakeResults) {
                                    makeResult.artifacts = await Promise.all(makeResult.artifacts.map(async (makePath) => {
                                        // standardize the path to artifacts across platforms
                                        const normalizedPath = makePath
                                            .split(/\/|\\/)
                                            .join(node_path_1.default.sep);
                                        if (!(await fs_extra_1.default.pathExists(normalizedPath))) {
                                            throw new Error(`Attempted to resume a dry run, but an artifact (${normalizedPath}) could not be found`);
                                        }
                                        return normalizedPath;
                                    }));
                                }
                                d('publishing for given state set');
                                return (0, tracer_1.delayTraceTillSignal)(childTrace, task.newListr(publishDistributablesTasks(childTrace), {
                                    ctx: {
                                        ...ctx,
                                        makeResults: restoredMakeResults,
                                    },
                                    rendererOptions: {
                                        collapseSubtasks: false,
                                        collapseErrors: false,
                                    },
                                }), 'run');
                            }),
                        };
                    }), {
                        rendererOptions: {
                            collapseSubtasks: false,
                            collapseErrors: false,
                        },
                    }), 'run');
                }
                d('triggering make');
                return (0, tracer_1.delayTraceTillSignal)(childTrace, (0, make_1.listrMake)(childTrace, {
                    dir,
                    interactive,
                    ...makeOptions,
                }, (results) => {
                    ctx.makeResults = results;
                }), 'run');
            }),
        },
        ...(dryRunResume
            ? []
            : dryRun
                ? [
                    {
                        title: 'Saving dry-run state',
                        task: childTrace({ name: 'save-dry-run', category: '@electron-forge/core' }, async (childTrace, { dir, forgeConfig, makeResults }) => {
                            d('saving results of make in dry run state', makeResults);
                            const calculatedOutDir = outDir || (0, out_dir_1.default)(dir, forgeConfig);
                            const dryRunDir = node_path_1.default.resolve(calculatedOutDir, 'publish-dry-run');
                            await fs_extra_1.default.remove(dryRunDir);
                            await publish_state_1.default.saveToDirectory(dryRunDir, makeResults, dir);
                        }),
                    },
                ]
                : publishDistributablesTasks(childTrace)),
    ], listrOptions);
    await runner.run();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvcHVibGlzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE2QjtBQWM3QixtREFBeUU7QUFDekUsa0RBQTBCO0FBQzFCLGtEQUEwQjtBQUMxQix3REFBMEI7QUFDMUIsbUNBQStCO0FBRS9CLHdFQUFrRDtBQUNsRCwwRUFBaUQ7QUFDakQsOERBQStDO0FBQy9DLDBFQUFpRDtBQUNqRCxzRUFBNkM7QUFFN0MsaUNBQWdEO0FBRWhELE1BQU0sQ0FBQyxHQUFHLElBQUEsZUFBSyxFQUFDLHdCQUF3QixDQUFDLENBQUM7QUEyQzFDLGtCQUFlLElBQUEsa0JBQVMsRUFDdEIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsRUFBRSxFQUN2RCxLQUFLLEVBQ0gsVUFBVSxFQUNWLEVBQ0UsR0FBRyxFQUFFLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQ2hDLFdBQVcsR0FBRyxLQUFLLEVBQ25CLFdBQVcsR0FBRyxFQUFFLEVBQ2hCLGNBQWMsR0FBRyxTQUFTLEVBQzFCLE1BQU0sR0FBRyxLQUFLLEVBQ2QsWUFBWSxHQUFHLEtBQUssRUFDcEIsTUFBTSxHQUNTLEVBQ0YsRUFBRTtJQUNqQixJQUFJLE1BQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELE1BQU0sWUFBWSxHQUFzQztRQUN0RCxVQUFVLEVBQUUsS0FBSztRQUNqQixlQUFlLEVBQUU7WUFDZixjQUFjLEVBQUUsS0FBSztTQUN0QjtRQUNELHVCQUF1QixFQUFFLENBQUMsV0FBVztRQUNyQyx5QkFBeUIsRUFDdkIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFB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