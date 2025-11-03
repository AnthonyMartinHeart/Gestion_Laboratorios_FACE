"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTemplate = void 0;
const node_path_1 = __importDefault(require("node:path"));
const core_utils_1 = require("@electron-forge/core-utils");
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const determine_author_1 = __importDefault(require("./determine-author"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const currentForgeVersion = require('../package.json').version;
const d = (0, debug_1.default)('electron-forge:template:base');
const tmplDir = node_path_1.default.resolve(__dirname, '../tmpl');
class BaseTemplate {
    constructor() {
        this.templateDir = tmplDir;
        this.requiredForgeVersion = currentForgeVersion;
    }
    get dependencies() {
        const packageJSONPath = node_path_1.default.join(this.templateDir, 'package.json');
        if (fs_extra_1.default.pathExistsSync(packageJSONPath)) {
            const deps = fs_extra_1.default.readJsonSync(packageJSONPath).dependencies;
            if (deps) {
                return Object.entries(deps).map(([packageName, version]) => {
                    if (version === 'ELECTRON_FORGE/VERSION') {
                        version = `^${currentForgeVersion}`;
                    }
                    return `${packageName}@${version}`;
                });
            }
        }
        return [];
    }
    get devDependencies() {
        const packageJSONPath = node_path_1.default.join(this.templateDir, 'package.json');
        if (fs_extra_1.default.pathExistsSync(packageJSONPath)) {
            const packageDevDeps = fs_extra_1.default.readJsonSync(packageJSONPath).devDependencies;
            if (packageDevDeps) {
                return Object.entries(packageDevDeps).map(([packageName, version]) => {
                    if (version === 'ELECTRON_FORGE/VERSION') {
                        version = `^${currentForgeVersion}`;
                    }
                    return `${packageName}@${version}`;
                });
            }
        }
        return [];
    }
    async initializeTemplate(directory, { copyCIFiles }) {
        return [
            {
                title: 'Copying starter files',
                task: async () => {
                    const pm = await (0, core_utils_1.resolvePackageManager)();
                    d('creating directory:', node_path_1.default.resolve(directory, 'src'));
                    await fs_extra_1.default.mkdirs(node_path_1.default.resolve(directory, 'src'));
                    const rootFiles = ['_gitignore', 'forge.config.js'];
                    if (pm.executable === 'pnpm') {
                        rootFiles.push('_npmrc');
                    }
                    else if (
                    // Support Yarn 2+ by default by initializing with nodeLinker: node-modules
                    pm.executable === 'yarn' &&
                        pm.version &&
                        semver_1.default.gte(pm.version, '2.0.0')) {
                        rootFiles.push('_yarnrc.yml');
                    }
                    if (copyCIFiles) {
                        d(`Copying CI files is currently not supported - this will be updated in a later version of Forge`);
                    }
                    const srcFiles = [
                        'index.css',
                        'index.js',
                        'index.html',
                        'preload.js',
                    ];
                    for (const file of rootFiles) {
                        await this.copy(node_path_1.default.resolve(tmplDir, file), node_path_1.default.resolve(directory, file.replace(/^_/, '.')));
                    }
                    for (const file of srcFiles) {
                        await this.copy(node_path_1.default.resolve(tmplDir, file), node_path_1.default.resolve(directory, 'src', file));
                    }
                },
            },
            {
                title: 'Initializing package.json',
                task: async () => {
                    await this.initializePackageJSON(directory);
                },
            },
        ];
    }
    async copy(source, target) {
        d(`copying "${source}" --> "${target}"`);
        await fs_extra_1.default.copy(source, target);
    }
    async copyTemplateFile(destDir, basename) {
        await this.copy(node_path_1.default.join(this.templateDir, basename), node_path_1.default.resolve(destDir, basename));
    }
    async initializePackageJSON(directory) {
        const packageJSON = await fs_extra_1.default.readJson(node_path_1.default.resolve(__dirname, '../tmpl/package.json'));
        packageJSON.productName = packageJSON.name = node_path_1.default
            .basename(directory)
            .toLowerCase();
        packageJSON.author = await (0, determine_author_1.default)(directory);
        const pm = await (0, core_utils_1.resolvePackageManager)();
        // As of pnpm v10, no postinstall scripts will run unless allowlisted through `onlyBuiltDependencies`
        if (pm.executable === 'pnpm') {
            packageJSON.pnpm = {
                onlyBuiltDependencies: ['electron', 'electron-winstaller'],
            };
        }
        packageJSON.scripts.lint = 'echo "No linting configured"';
        d('writing package.json to:', directory);
        await fs_extra_1.default.writeJson(node_path_1.default.resolve(directory, 'package.json'), packageJSON, {
            spaces: 2,
        });
    }
    async updateFileByLine(inputPath, lineHandler, outputPath) {
        const fileContents = (await fs_extra_1.default.readFile(inputPath, 'utf8'))
            .split('\n')
            .map(lineHandler)
            .join('\n');
        await fs_extra_1.default.writeFile(outputPath || inputPath, fileContents);
        if (outputPath !== undefined) {
            await fs_extra_1.default.remove(inputPath);
        }
    }
}
exports.BaseTemplate = BaseTemplate;
exports.default = new BaseTemplate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzZVRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0Jhc2VUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwREFBNkI7QUFFN0IsMkRBQW1FO0FBTW5FLGtEQUEwQjtBQUMxQix3REFBMEI7QUFDMUIsb0RBQTRCO0FBRTVCLDBFQUFpRDtBQUVqRCxpRUFBaUU7QUFDakUsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFFL0QsTUFBTSxDQUFDLEdBQUcsSUFBQSxlQUFLLEVBQUMsOEJBQThCLENBQUMsQ0FBQztBQUNoRCxNQUFNLE9BQU8sR0FBRyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFFbkQsTUFBYSxZQUFZO0lBQXpCO1FBQ1MsZ0JBQVcsR0FBRyxPQUFPLENBQUM7UUFFdEIseUJBQW9CLEdBQUcsbUJBQW1CLENBQUM7SUFvSnBELENBQUM7SUFsSkMsSUFBSSxZQUFZO1FBQ2QsTUFBTSxlQUFlLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNwRSxJQUFJLGtCQUFFLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDdkMsTUFBTSxJQUFJLEdBQUcsa0JBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQzNELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUU7b0JBQ3pELElBQUksT0FBTyxLQUFLLHdCQUF3QixFQUFFLENBQUM7d0JBQ3pDLE9BQU8sR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7b0JBQ3RDLENB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