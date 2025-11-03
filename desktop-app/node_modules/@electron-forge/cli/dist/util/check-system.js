"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSystem = exports.checkPackageManager = void 0;
const node_child_process_1 = require("node:child_process");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const core_utils_1 = require("@electron-forge/core-utils");
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const d = (0, debug_1.default)('electron-forge:check-system');
async function getGitVersion() {
    return new Promise((resolve) => {
        (0, node_child_process_1.exec)('git --version', (err, output) => err
            ? resolve(null)
            : resolve(output.toString().trim().split(' ').reverse()[0]));
    });
}
/**
 * Packaging an app with Electron Forge requires `node_modules` to be on disk.
 * With `pnpm`, this can be done in a few different ways.
 *
 * `node-linker=hoisted` replicates the behaviour of npm and Yarn Classic, while
 * users may choose to set `public-hoist-pattern` or `hoist-pattern` for advanced
 * configuration purposes.
 */
async function checkPnpmConfig() {
    const { pnpm } = core_utils_1.PACKAGE_MANAGERS;
    const hoistPattern = await (0, core_utils_1.spawnPackageManager)(pnpm, [
        'config',
        'get',
        'hoist-pattern',
    ]);
    const publicHoistPattern = await (0, core_utils_1.spawnPackageManager)(pnpm, [
        'config',
        'get',
        'public-hoist-pattern',
    ]);
    if (hoistPattern !== 'undefined' || publicHoistPattern !== 'undefined') {
        d(`Custom hoist pattern detected ${JSON.stringify({
            hoistPattern,
            publicHoistPattern,
        })}, assuming that the user has configured pnpm to package dependencies.`);
        return;
    }
    const nodeLinker = await (0, core_utils_1.spawnPackageManager)(pnpm, [
        'config',
        'get',
        'node-linker',
    ]);
    if (nodeLinker !== 'hoisted') {
        throw new Error('When using pnpm, `node-linker` must be set to "hoisted" (or a custom `hoist-pattern` or `public-hoist-pattern` must be defined). Run `pnpm config set node-linker hoisted` to set this config value, or add it to your project\'s `.npmrc` file.');
    }
}
async function checkYarnConfig() {
    const { yarn } = core_utils_1.PACKAGE_MANAGERS;
    const yarnVersion = await (0, core_utils_1.spawnPackageManager)(yarn, ['--version']);
    const nodeLinker = await (0, core_utils_1.spawnPackageManager)(yarn, [
        'config',
        'get',
        'nodeLinker',
    ]);
    if (yarnVersion &&
        semver_1.default.gte(yarnVersion, '2.0.0') &&
        nodeLinker !== 'node-modules') {
        throw new Error('When using Yarn 2+, `nodeLinker` must be set to "node-modules". Run `yarn config set nodeLinker node-modules` to set this config value, or add it to your project\'s `.yarnrc.yml` file.');
    }
}
// TODO(erickzhao): Drop antiquated versions of npm for Forge v8
const ALLOWLISTED_VERSIONS = {
    npm: {
        all: '^3.0.0 || ^4.0.0 || ~5.1.0 || ~5.2.0 || >= 5.4.2',
        darwin: '>= 5.4.0',
        linux: '>= 5.4.0',
    },
    yarn: {
        all: '>= 1.0.0',
    },
    pnpm: {
        all: '>= 8.0.0',
    },
};
async function checkPackageManager() {
    const pm = await (0, core_utils_1.resolvePackageManager)();
    const version = pm.version ?? (await (0, core_utils_1.spawnPackageManager)(pm, ['--version']));
    const versionString = version.toString().trim();
    const range = ALLOWLISTED_VERSIONS[pm.executable][process.platform] ??
        ALLOWLISTED_VERSIONS[pm.executable].all;
    if (!semver_1.default.valid(version)) {
        d(`Invalid semver-string while checking version: ${version}`);
        throw new Error(`Could not check ${pm.executable} version "${version}", assuming incompatible`);
    }
    if (!semver_1.default.satisfies(version, range)) {
        throw new Error(`Incompatible version of ${pm.executable} detected: "${version}" must be in range ${range}`);
    }
    if (pm.executable === 'pnpm') {
        await checkPnpmConfig();
    }
    else if (pm.executable === 'yarn') {
        await checkYarnConfig();
    }
    return `${pm.executable}@${versionString}`;
}
exports.checkPackageManager = checkPackageManager;
/**
 * Some people know their system is OK and don't appreciate the 800ms lag in
 * start up that these checks (in particular the package manager check) costs.
 *
 * Simply creating this flag file in your home directory will skip these checks
 * and shave ~800ms off your forge start time.
 *
 * This is specifically not documented or everyone would make it.
 */
const SKIP_SYSTEM_CHECK = node_path_1.default.resolve(node_os_1.default.homedir(), '.skip-forge-system-check');
async function checkSystem(callerTask) {
    if (!(await fs_extra_1.default.pathExists(SKIP_SYSTEM_CHECK))) {
        d('checking system, create ~/.skip-forge-system-check to stop doing this');
        return callerTask.newListr([
            {
                title: 'Checking git exists',
                // We only call the `initGit` helper in the `init` and `import` commands
                enabled: (ctx) => (ctx.command === 'init' || ctx.command === 'import') && ctx.git,
                task: async (_, task) => {
                    const gitVersion = await getGitVersion();
                    if (gitVersion) {
                        task.title = `Found git@${gitVersion}`;
                    }
                    else {
                        throw new Error('Could not find git in environment');
                    }
                },
            },
            {
                title: 'Checking package manager version',
                task: async (_, task) => {
                    const packageManager = await checkPackageManager();
                    task.title = `Found ${packageManager}`;
                },
            },
        ], {
            concurrent: true,
            exitOnError: true,
            rendererOptions: {
                collapseSubtasks: true,
            },
        });
    }
    d('skipping system check');
    return true;
}
exports.checkSystem = checkSystem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stc3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvY2hlY2stc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJEQUEwQztBQUMxQyxzREFBeUI7QUFDekIsMERBQTZCO0FBRTdCLDJEQUtvQztBQUVwQyxrREFBMEI7QUFDMUIsd0RBQTBCO0FBQzFCLG9EQUE0QjtBQUU1QixNQUFNLENBQUMsR0FBRyxJQUFBLGVBQUssRUFBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRS9DLEtBQUssVUFBVSxhQUFhO0lBQzFCLE9BQU8sSUFBSSxPQUFPLENBQWdCLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDNUMsSUFBQSx5QkFBSSxFQUFDLGVBQWUsRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUNwQyxHQUFHO1lBQ0QsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDZixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDOUQsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxLQUFLLFVBQVUsZUFBZTtJQUM1QixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsNkJBQWdCLENBQUM7SUFDbEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLGdDQUFtQixFQUFDLElBQUksRUFBRTtRQUNuRCxRQUFRO1FBQ1IsS0FBSztRQUNMLGVBQWU7S0FDaEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxFQUFFO1FBQ3pELFFBQVE7UUFDUixLQUFLO1FBQ0wsc0JBQXNCO0tBQ3ZCLENBQUMsQ0FBQztJQUVILElBQUks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