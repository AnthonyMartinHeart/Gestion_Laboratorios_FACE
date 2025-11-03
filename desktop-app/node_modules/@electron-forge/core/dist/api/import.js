"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const core_utils_1 = require("@electron-forge/core-utils");
const template_base_1 = __importDefault(require("@electron-forge/template-base"));
const tracer_1 = require("@electron-forge/tracer");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const listr2_1 = require("listr2");
const lodash_1 = require("lodash");
const install_dependencies_1 = __importStar(require("../util/install-dependencies"));
const read_package_json_1 = require("../util/read-package-json");
const upgrade_forge_config_1 = __importStar(require("../util/upgrade-forge-config"));
const init_git_1 = require("./init-scripts/init-git");
const init_npm_1 = require("./init-scripts/init-npm");
const d = (0, debug_1.default)('electron-forge:import');
exports.default = (0, tracer_1.autoTrace)({ name: 'import()', category: '@electron-forge/core' }, async (childTrace, { dir = process.cwd(), interactive = false, confirmImport, shouldContinueOnExisting, shouldRemoveDependency, shouldUpdateScript, outDir, skipGit = false, }) => {
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
            title: 'Locating importable project',
            task: childTrace({ name: 'locate-project', category: '@electron-forge/core' }, async () => {
                d(`Attempting to import project in: ${dir}`);
                if (!(await fs_extra_1.default.pathExists(dir)) ||
                    !(await fs_extra_1.default.pathExists(node_path_1.default.resolve(dir, 'package.json')))) {
                    throw new Error(`We couldn't find a project with a package.json file in: ${dir}`);
                }
                if (typeof confirmImport === 'function') {
                    if (!(await confirmImport())) {
                        // TODO: figure out if we can just return early here
                        // eslint-disable-next-line no-process-exit
                        process.exit(0);
                    }
                }
                if (!skipGit) {
                    await (0, init_git_1.initGit)(dir);
                }
            }),
        },
        {
            title: 'Processing configuration and dependencies',
            rendererOptions: {
                persistentOutput: true,
                bottomBar: Infinity,
            },
            task: childTrace({ name: 'string', category: 'foo' }, async (_, ctx, task) => {
                const calculatedOutDir = outDir || 'out';
                const importDeps = [].concat(init_npm_1.deps);
                let importDevDeps = [].concat(init_npm_1.devDeps);
                let importExactDevDeps = [].concat(init_npm_1.exactDevDeps);
                let packageJSON = await (0, read_package_json_1.readRawPackageJson)(dir);
                if (!packageJSON.version) {
                    task.output = chalk_1.default.yellow(`Please set the ${chalk_1.default.green('"version"')} in your application's package.json`);
                }
                if (packageJSON.config && packageJSON.config.forge) {
                    if (packageJSON.config.forge.makers) {
                        task.output = chalk_1.default.green('Existing Electron Forge configuration detected');
                        if (typeof shouldContinueOnExisting === 'function') {
                            if (!(await shouldContinueOnExisting())) {
                                // TODO: figure out if we can just return early here
                                // eslint-disable-next-line no-process-exit
                                process.exit(0);
                            }
                        }
                    }
                    else if (!(typeof packageJSON.config.forge === 'object')) {
                        task.output = chalk_1.default.yellow("We can't tell if the Electron Forge config is compatible because it's in an external JavaScript file, not trying to convert it and continuing anyway");
                    }
                    else {
                        d('Upgrading an Electron Forge < 6 project');
                        packageJSON.config.forge = (0, upgrade_forge_config_1.default)(packageJSON.config.forge);
                        importDevDeps = (0, upgrade_forge_config_1.updateUpgradedForgeDevDeps)(packageJSON, importDevDeps);
                    }
                }
                packageJSON.dependencies = packageJSON.dependencies || {};
                packageJSON.devDependencies = packageJSON.devDependencies || {};
                [importDevDeps, importExactDevDeps] = (0, core_utils_1.updateElectronDependency)(packageJSON, importDevDeps, importExactDevDeps);
                const keys = Object.keys(packageJSON.dependencies).concat(Object.keys(packageJSON.devDependencies));
                const buildToolPackages = {
                    '@electron/get': 'already uses this module as a transitive dependency',
                    '@electron/osx-sign': 'already uses this module as a transitive dependency',
                    '@electron/packager': 'already uses this module as a transitive dependency',
                    'electron-builder': 'provides mostly equivalent functionality',
                    'electron-download': 'already uses this module as a transitive dependency',
                    'electron-forge': 'replaced with @electron-forge/cli',
                    'electron-installer-debian': 'already uses this module as a transitive dependency',
                    'electron-installer-dmg': 'already uses this module as a transitive dependency',
                    'electron-installer-flatpak': 'already uses this module as a transitive dependency',
                    'electron-installer-redhat': 'already uses this module as a transitive dependency',
                    'electron-winstaller': 'already uses this module as a transitive dependency',
                };
                for (const key of keys) {
                    if (buildToolPackages[key]) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const explanation = buildToolPackages[key];
                        let remove = true;
                        if (typeof shouldRemoveDependency === 'function') {
                            remove = await shouldRemoveDependency(key, explanation);
                        }
                        if (remove) {
                            delete packageJSON.dependencies[key];
                            delete packageJSON.devDependencies[key];
                        }
                    }
                }
                packageJSON.scripts = packageJSON.scripts || {};
                d('reading current scripts object:', packageJSON.scripts);
                const updatePackageScript = async (scriptName, newValue) => {
                    if (packageJSON.scripts[scriptName] !== newValue) {
                        let update = true;
                        if (typeof shouldUpdateScript === 'function') {
                            update = await shouldUpdateScript(scriptName, newValue);
                        }
                        if (update) {
                            packageJSON.scripts[scriptName] = newValue;
                        }
                    }
                };
                await updatePackageScript('start', 'electron-forge start');
                await updatePackageScript('package', 'electron-forge package');
                await updatePackageScript('make', 'electron-forge make');
                d('forgified scripts object:', packageJSON.scripts);
                const writeChanges = async () => {
                    await fs_extra_1.default.writeJson(node_path_1.default.resolve(dir, 'package.json'), packageJSON, { spaces: 2 });
                };
                return task.newListr([
                    {
                        title: `Resolving package manager`,
                        task: async (ctx, task) => {
                            ctx.pm = await (0, core_utils_1.resolvePackageManager)();
                            task.title = `Resolving package manager: ${chalk_1.default.cyan(ctx.pm.executable)}`;
                        },
                    },
                    {
                        title: 'Configuring Yarn (if applicable)',
                        task: async ({ pm }) => {
                            // Yarn v4 defaults to PnP which doesn't work well with CommonJS requires in our forge config
                            // lets ensure that nodeLinker is set to node-modules
                            if (pm.executable === 'yarn') {
                                const yarnrcPath = node_path_1.default.resolve(dir, '.yarnrc.yml');
                                if (!(await fs_extra_1.default.pathExists(yarnrcPath))) {
                                    d('creating .yarnrc.yml with nodeLinker: node-modules');
                                    await fs_extra_1.default.writeFile(yarnrcPath, 'nodeLinker: node-modules\n');
                                }
                            }
                        },
                    },
                    {
                        title: 'Installing dependencies',
                        task: async ({ pm }, task) => {
                            await writeChanges();
                            d('deleting old dependencies forcefully');
                            await fs_extra_1.default.remove(node_path_1.default.resolve(dir, 'node_modules/.bin/electron'));
                            await fs_extra_1.default.remove(node_path_1.default.resolve(dir, 'node_modules/.bin/electron.cmd'));
                            d('installing dependencies');
                            task.output = `${pm.executable} ${pm.install} ${importDeps.join(' ')}`;
                            await (0, install_dependencies_1.default)(pm, dir, importDeps);
                            d('installing devDependencies');
                            task.output = `${pm.executable} ${pm.install} ${pm.dev} ${importDevDeps.join(' ')}`;
                            await (0, install_dependencies_1.default)(pm, dir, importDevDeps, install_dependencies_1.DepType.DEV);
                            d('installing devDependencies with exact versions');
                            task.output = `${pm.executable} ${pm.install} ${pm.dev} ${pm.exact} ${importExactDevDeps.join(' ')}`;
                            await (0, install_dependencies_1.default)(pm, dir, importExactDevDeps, install_dependencies_1.DepType.DEV, install_dependencies_1.DepVersionRestriction.EXACT);
                        },
                    },
                    {
                        title: 'Copying base template Forge configuration',
                        task: async () => {
                            const pathToTemplateConfig = node_path_1.default.resolve(template_base_1.default.templateDir, 'forge.config.js');
                            // if there's an existing config.forge object in package.json
                            if (packageJSON?.config?.forge &&
                                typeof packageJSON.config.forge === 'object') {
                                d('detected existing Forge config in package.json, merging with base template Forge config');
                                // eslint-disable-next-line @typescript-eslint/no-require-imports
                                const templateConfig = require(node_path_1.default.resolve(template_base_1.default.templateDir, 'forge.config.js'));
                                packageJSON = await (0, read_package_json_1.readRawPackageJson)(dir);
                                (0, lodash_1.merge)(templateConfig, packageJSON.config.forge); // mutates the templateConfig object
                                await writeChanges();
                                // otherwise, write to forge.config.js
                            }
                            else {
                                d('writing new forge.config.js');
                                await fs_extra_1.default.copyFile(pathToTemplateConfig, node_path_1.default.resolve(dir, 'forge.config.js'));
                            }
                        },
                    },
                    {
                        title: 'Fixing .gitignore',
                        task: async () => {
                            if (await fs_extra_1.default.pathExists(node_path_1.default.resolve(dir, '.gitignore'))) {
                                const gitignore = await fs_extra_1.default.readFile(node_path_1.default.resolve(dir, '.gitignore'));
                                if (!gitignore.includes(calculatedOutDir)) {
                                    await fs_extra_1.default.writeFile(node_path_1.default.resolve(dir, '.gitignore'), `${gitignore}\n${calculatedOutDir}/`);
                                }
                            }
                        },
                    },
                ], listrOptions);
            }),
        },
        {
            title: 'Finalizing import',
            rendererOptions: {
                persistentOutput: true,
                bottomBar: Infinity,
            },
            task: childTrace({ name: 'finalize-import', category: '@electron-forge/core' }, (_, __, task) => {
                task.output = `We have attempted to convert your app to be in a format that Electron Forge understands.
          
          Thanks for using ${chalk_1.default.green('Electron Forge')}!`;
            }),
        },
    ], listrOptions);
    await runner.run();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FwaS9pbXBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBEQUE2QjtBQUU3QiwyREFJb0M7QUFLcEMsa0ZBQXlEO0FBQ3pELG1EQUFtRDtBQUNuRCxrREFBMEI7QUFDMUIsa0RBQTBCO0FBQzFCLHdEQUEwQjtBQUMxQixtQ0FBK0I7QUFDL0IsbUNBQStCO0FBRS9CLHFGQUdzQztBQUN0QyxpRUFBK0Q7QUFDL0QscUZBRXNDO0FBRXRDLHNEQUFrRDtBQUNsRCxzREFBc0U7QUFFdEUsTUFBTSxDQUFDLEdBQUcsSUFBQSxlQUFLLEVBQUMsdUJBQXVCLENBQUMsQ0FBQztBQTZDekMsa0JBQWUsSUFBQSxrQkFBUyxFQUN0QixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFFLEVBQ3RELEtBQUssRUFDSCxVQUFVLEVBQ1YsRUFDRSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUNuQixXQUFXLEdBQUcsS0FBSyxFQUNuQixhQUFhLEVBQ2Isd0JBQXdCLEVBQ3hCLHNCQUFzQixFQUN0QixrQkFBa0IsRUFDbEIsTUFBTSxFQUNOLE9BQU8sR0FBRyxLQUFLLEdBQ0QsRUFDRCxFQUFFO0lBQ2pCLE1BQU0sWUFBWSxHQUF5QztRQUN6RCxVQUFVLEVBQUUsS0FBSztRQUNqQixlQUFlLEVBQUU7WUFDZixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGNBQWMsRUFBRSxLQUFLO1NBQ3RCO1FBQ0QsdUJBQXVCLEVBQUUsQ0FBQyxXQUFXO1FBQ3JDLHlCQUF5QixFQUN2QixPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7S0FDeEQsQ0FBQztJQUVGLE1BQU0sTUFBTSxHQUFHLElBQUks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