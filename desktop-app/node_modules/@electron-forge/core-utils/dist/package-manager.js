"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnPackageManager = exports.resolvePackageManager = exports.PACKAGE_MANAGERS = void 0;
const node_path_1 = __importDefault(require("node:path"));
const cross_spawn_promise_1 = require("@malept/cross-spawn-promise");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const find_up_1 = __importDefault(require("find-up"));
const log_symbols_1 = __importDefault(require("log-symbols"));
const d = (0, debug_1.default)('electron-forge:package-manager');
let hasWarned = false;
/**
 * Supported package managers and the commands and flags they need to install dependencies.
 */
exports.PACKAGE_MANAGERS = {
    yarn: {
        executable: 'yarn',
        install: 'add',
        dev: '--dev',
        exact: '--exact',
    },
    npm: {
        executable: 'npm',
        install: 'install',
        dev: '--save-dev',
        exact: '--save-exact',
    },
    pnpm: {
        executable: 'pnpm',
        install: 'add',
        dev: '--save-dev',
        exact: '--save-exact',
    },
};
const PM_FROM_LOCKFILE = {
    'package-lock.json': 'npm',
    'yarn.lock': 'yarn',
    'pnpm-lock.yaml': 'pnpm',
};
/**
 * Parses the `npm_config_user_agent` environment variable and returns its name and version.
 *
 * Code taken from {@link https://github.com/zkochan/packages/tree/main/which-pm-runs/ | which-pm-runs}.
 */
function pmFromUserAgent() {
    const userAgent = process.env.npm_config_user_agent;
    if (!userAgent) {
        return undefined;
    }
    const pmSpec = userAgent.split(' ', 1)[0];
    const separatorPos = pmSpec.lastIndexOf('/');
    const name = pmSpec.substring(0, separatorPos);
    return {
        name: name === 'npminstall' ? 'cnpm' : name,
        version: pmSpec.substring(separatorPos + 1),
    };
}
/**
 * Resolves the package manager to use. In order, it checks the following:
 *
 * 1. The value of the `NODE_INSTALLER` environment variable.
 * 2. The `process.env.npm_config_user_agent` value set by the executing package manager.
 * 3. The presence of a lockfile in an ancestor directory.
 * 4. If an unknown package manager is used (or none of the above apply), then we fall back to `npm`.
 *
 * The version of the executing package manager is also returned if it is detected via user agent.
 *
 * Supported package managers are `yarn`, `pnpm`, and `npm`.
 *
 */
const resolvePackageManager = async () => {
    const executingPM = pmFromUserAgent();
    let lockfilePM;
    const lockfile = await (0, find_up_1.default)(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { type: 'file' });
    if (lockfile) {
        const lockfileName = node_path_1.default.basename(lockfile);
        lockfilePM = PM_FROM_LOCKFILE[lockfileName];
    }
    let installer;
    let installerVersion;
    if (typeof process.env.NODE_INSTALLER === 'string') {
        if (Object.keys(exports.PACKAGE_MANAGERS).includes(process.env.NODE_INSTALLER)) {
            installer = process.env.NODE_INSTALLER;
            installerVersion = await (0, exports.spawnPackageManager)(exports.PACKAGE_MANAGERS[installer], ['--version']);
            if (!hasWarned) {
                console.warn(log_symbols_1.default.warning, chalk_1.default.yellow(`The NODE_INSTALLER environment variable is deprecated and will be removed in Electron Forge v8`));
                hasWarned = true;
            }
        }
        else {
            console.warn(log_symbols_1.default.warning, chalk_1.default.yellow(`Package manager ${chalk_1.default.red(process.env.NODE_INSTALLER)} is unsupported. Falling back to ${chalk_1.default.green('npm')} instead.`));
        }
    }
    else if (executingPM) {
        installer = executingPM.name;
        installerVersion = executingPM.version;
    }
    else if (lockfilePM) {
        installer = lockfilePM;
        installerVersion = await (0, exports.spawnPackageManager)(exports.PACKAGE_MANAGERS[installer], ['--version']);
    }
    switch (installer) {
        case 'yarn':
        case 'npm':
        case 'pnpm':
            d(`Resolved package manager to ${installer}. (Derived from NODE_INSTALLER: ${process.env.NODE_INSTALLER}, npm_config_user_agent: ${process.env.npm_config_user_agent}, lockfile: ${lockfilePM})`);
            return {
                ...exports.PACKAGE_MANAGERS[installer],
                version: installerVersion,
            };
        default:
            d(`No valid package manager detected. Falling back to npm.`);
            return {
                ...exports.PACKAGE_MANAGERS['npm'],
                version: await (0, exports.spawnPackageManager)(exports.PACKAGE_MANAGERS['npm'], [
                    '--version',
                ]),
            };
    }
};
exports.resolvePackageManager = resolvePackageManager;
const spawnPackageManager = async (pm, args, opts) => {
    return (await (0, cross_spawn_promise_1.spawn)(pm.executable, args, opts)).trim();
};
exports.spawnPackageManager = spawnPackageManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhY2thZ2UtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwREFBNkI7QUFFN0IscUVBSXFDO0FBQ3JDLGtEQUEwQjtBQUMxQixrREFBMEI7QUFDMUIsc0RBQTZCO0FBQzdCLDhEQUFxQztBQUVyQyxNQUFNLENBQUMsR0FBRyxJQUFBLGVBQUssRUFBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBV2xELElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztBQUV0Qjs7R0FFRztBQUNVLFFBQUEsZ0JBQWdCLEdBQStDO0lBQzFFLElBQUksRUFBRTtRQUNKLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsR0FBRyxFQUFFLE9BQU87UUFDWixLQUFLLEVBQUUsU0FBUztLQUNqQjtJQUNELEdBQUcsRUFBRTtRQUNILFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE9BQU8sRUFBRSxTQUFTO1FBQ2xCLEdBQUcsRUFBRSxZQUFZO1FBQ2pCLEtBQUssRUFBRSxjQUFjO0tBQ3RCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEtBQUs7UUFDZCxHQUFHLEVBQUUsWUFBWTtRQUNqQixLQUFLLEVBQUUsY0FBYztLQUN0QjtDQUNGLENBQUM7QUFFRixNQUFNLGdCQUFnQixHQUE0QztJQUNoRSxtQkFBbUIsRUFBRSxLQUFLO0lBQzFCLFdBQVcsRUFBRSxNQUFNO0lBQ25CLGdCQUFnQixFQUFFLE1BQU07Q0FDekIsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxTQUFTLGVBQWU7SUFDdEIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQztJQUNwRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDZixPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBQ0QsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMvQyxPQUFPO1FBQ0wsSUFBSSxFQUFFLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSTtRQUMzQyxPQUFPLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0tBQzVDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0ksTUFBTSxxQkFBcUIsR0FBNkIsS0FBSyxJQUFJLEVBQUU7SUFDeEUsTUFBTSxXQUFXLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFDdEMsSUFBSSxVQUFVLENBQUM7SUFDZixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsaUJBQU0sRUFDM0IsQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLENBQUMsRUFDM0UsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQ2pCLENBQUM7SUFDRixJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ2IsTUFBTSxZQUFZLEdBQUcsbUJBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0MsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxJQUFJLFNBQVMsQ0FBQztJQUNkLElBQUksZ0JBQWdCLENBQUM7SUFFckIsSUFBSSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ25ELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBZ0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7WUFDdkUsU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO1lBQ3ZDLGdCQUFnQixHQUFHLE1BQU0sSUFBQSwyQkFBbUIsRUFDMUMsd0JBQWdCLENBQUMsU0FBb0MsQ0FBQyxFQUN0RCxDQUFDLFdBQVcsQ0FBQyxDQUNkLENBQUM7WUFDRixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLElBQUksQ0FDVixxQkFBVSxDQUFDLE9BQU8sRUFDbEIsZUFBSyxDQUFDLE1BQU0sQ0FDVixnR0FBZ0csQ0FDakcsQ0FDRixDQUFDO2dCQUNGLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDbkIsQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxDQUFDLElBQUksQ0FDVixxQkFBVSxDQUFDLE9BQU8sRUFDbEIsZUFBSyxDQUFDLE1BQU0sQ0FDVixtQkFBbUIsZUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxvQ0FBb0MsZUFBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUMxSCxDQUNGLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztTQUFNLElBQUksV0FBVyxFQUFFLENBQUM7UUFDdkIsU0FBUyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUM7UUFDN0IsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztJQUN6QyxDQUFDO1NBQU0sSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUN0QixTQUFTLEdBQUcsVUFBVSxDQUFDO1FBQ3ZCLGdCQUFnQixHQUFHLE1BQU0sSUFBQSwyQkFBbUIsRUFDMUMsd0JBQWdCLENBQUMsU0FBb0MsQ0FBQyxFQUN0RCxDQUFDLFdBQVcsQ0FBQyxDQUNkLENBQUM7SUFDSixDQUFDO0lBRUQsUUFBUSxTQUFTLEVBQUUsQ0FBQztRQUNsQixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxNQUFNO1lBQ1QsQ0FBQyxDQUNDLCtCQUErQixTQUFTLG1DQUFtQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsNEJBQTRCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLGVBQWUsVUFBVSxHQUFHLENBQy9MLENBQUM7WUFDRixPQUFPO2dCQUNMLEdBQUcsd0JBQWdCLENBQUMsU0FBUyxDQUFDO2dCQUM5QixPQUFPLEVBQUUsZ0JBQWdCO2FBQzFCLENBQUM7UUFDSjtZQUNFLENBQUMsQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO1lBQzdELE9BQU87Z0JBQ0wsR0FBRyx3QkFBZ0IsQ0FBQyxLQUFLLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxNQUFNLElBQUEsMkJBQW1CLEVBQUMsd0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQzFELFdBQVc7aUJBQ1osQ0FBQzthQUNILENBQUM7SUFDTixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBdEVXLFFBQUEscUJBQXFCLHlCQXNFaEM7QUFFSyxNQUFNLG1CQUFtQixHQUFHLEtBQUssRUFDdEMsRUFBYSxFQUNiLElBQXFCLEVBQ3JCLElBQXdCLEVBQ1AsRUFBRTtJQUNuQixPQUFPLENBQUMsTUFBTSxJQUFBLDJCQUFLLEVBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN6RCxDQUFDLENBQUM7QUFOVyxRQUFBLG1CQUFtQix1QkFNOUIifQ==