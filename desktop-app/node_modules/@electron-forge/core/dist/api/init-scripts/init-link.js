"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLink = void 0;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_utils_1 = require("@electron-forge/core-utils");
const debug_1 = __importDefault(require("debug"));
const read_package_json_1 = require("../../util/read-package-json");
const d = (0, debug_1.default)('electron-forge:init:link');
/**
 * Link local forge dependencies
 *
 * This allows developers working on forge itself to easily init
 * a local template and have it use their local plugins / core / cli packages.
 *
 * Uses yarn link to create portal: resolutions that point to local workspace paths.
 */
async function initLink(pm, dir, task) {
    const shouldLink = process.env.LINK_FORGE_DEPENDENCIES_ON_INIT;
    if (shouldLink) {
        d('Linking forge dependencies');
        const packageJson = await (0, read_package_json_1.readRawPackageJson)(dir);
        const forgeRoot = node_path_1.default.resolve(__dirname, '..', '..', '..', '..', '..', '..');
        const getWorkspacePath = (packageName) => {
            const result = (0, node_child_process_1.spawnSync)('yarn', ['workspace', packageName, 'exec', 'pwd'], {
                cwd: forgeRoot,
                encoding: 'utf-8',
                shell: process.platform === 'win32',
            });
            if (result.status !== 0) {
                d(`Failed to get workspace path for ${packageName}: ${result.stderr}`);
                throw new Error(`Unable to determine workspace path for ${packageName}`);
            }
            const workspacePath = result.stdout.trim();
            return workspacePath;
        };
        // Collect all @electron-forge packages and their workspace paths
        const packagesToLink = {};
        for (const packageName of Object.keys(packageJson.devDependencies)) {
            if (packageName.startsWith('@electron-forge/')) {
                const workspacePath = getWorkspacePath(packageName);
                packagesToLink[packageName] = workspacePath;
                d(`Found ${packageName}, will link to ${workspacePath}`);
            }
        }
        // Use yarn link to create portal: resolutions for local packages
        if (Object.keys(packagesToLink).length > 0) {
            // Copy the root .yarnrc.yml to the target directory before linking
            // This ensures settings like npmMinimalAgeGate are preserved
            if (pm.executable === 'yarn') {
                const rootYarnrc = node_path_1.default.join(forgeRoot, '.yarnrc.yml');
                const targetYarnrc = node_path_1.default.join(dir, '.yarnrc.yml');
                if (node_fs_1.default.existsSync(rootYarnrc)) {
                    const yarnrcContent = await node_fs_1.default.promises.readFile(rootYarnrc, 'utf-8');
                    // we create a new yarnrc.yml (without yarnPath and enableScripts) and yarn.lock to mark as separate project
                    // this avoids issues with yarnPath and enableScripts in CI
                    const filteredContent = yarnrcContent
                        .split('\n')
                        .filter((line) => !line.trim().startsWith('yarnPath:') &&
                        !line.trim().startsWith('enableScripts:'))
                        .join('\n');
                    await node_fs_1.default.promises.writeFile(targetYarnrc, filteredContent);
                    d('Copied .yarnrc.yml (without yarnPath/enableScripts)');
                    const targetYarnLock = node_path_1.default.join(dir, 'yarn.lock');
                    if (!node_fs_1.default.existsSync(targetYarnLock)) {
                        await node_fs_1.default.promises.writeFile(targetYarnLock, '');
                        d('Created empty yarn.lock to mark as separate project');
                    }
                }
            }
            const paths = Object.values(packagesToLink);
            if (task)
                task.output = `${pm.executable} link ${paths.length} packages`;
            d(`Linking ${paths.length} packages`);
            await (0, core_utils_1.spawnPackageManager)(pm, ['link', ...paths], {
                cwd: dir,
            });
            d('Linking completed successfully');
            // an additional install is needed to resolve any remaining dependencies
            if (task)
                task.output = `${pm.executable} install`;
            d(`Running: ${pm.executable} install (cwd: ${dir})`);
            await (0, core_utils_1.spawnPackageManager)(pm, ['install'], {
                cwd: dir,
            });
            d('Install completed successfully');
        }
        await node_fs_1.default.promises.chmod(node_path_1.default.resolve(dir, 'node_modules', '.bin', 'electron-forge'), 0o755);
    }
    else {
        d('LINK_FORGE_DEPENDENCIES_ON_INIT is falsy. Skipping.');
    }
}
exports.initLink = initLink;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC1saW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9pbml0LXNjcmlwdHMvaW5pdC1saW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJEQUErQztBQUMvQyxzREFBeUI7QUFDekIsMERBQTZCO0FBRTdCLDJEQUE0RTtBQUU1RSxrREFBMEI7QUFFMUIsb0VBQWtFO0FBRWxFLE1BQU0sQ0FBQyxHQUFHLElBQUEsZUFBSyxFQUFDLDBCQUEwQixDQUFDLENBQUM7QUFFNUM7Ozs7Ozs7R0FPRztBQUNJLEtBQUssVUFBVSxRQUFRLENBQzVCLEVBQWEsRUFDYixHQUFXLEVBQ1gsSUFBd0I7SUFFeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQztJQUMvRCxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDaEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHNDQUFrQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sU0FBUyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUM1QixTQUFTLEVBQ1QsSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLENBQ0wsQ0FBQztRQUVGLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxXQUFtQixFQUFVLEVBQUU7WUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBQSw4QkFBUyxFQUN0QixNQUFNLEVBQ04sQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFDekM7Z0JBQ0UsR0FBRyxFQUFFLFNBQVM7Z0JBQ2QsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU87YUFDcEMsQ0FDRixDQUFDO1lBRUYsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMs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