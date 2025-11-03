"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const template_base_1 = require("@electron-forge/template-base");
const fs_extra_1 = __importDefault(require("fs-extra"));
class ViteTypeScriptTemplate extends template_base_1.BaseTemplate {
    constructor() {
        super(...arguments);
        this.templateDir = node_path_1.default.resolve(__dirname, '..', 'tmpl');
    }
    async initializeTemplate(directory, options) {
        const superTasks = await super.initializeTemplate(directory, options);
        return [
            ...superTasks,
            {
                title: 'Setting up Forge configuration',
                task: async () => {
                    await this.copyTemplateFile(directory, 'forge.env.d.ts');
                    await this.copyTemplateFile(directory, 'forge.config.ts');
                    await fs_extra_1.default.remove(node_path_1.default.resolve(directory, 'forge.config.js'));
                },
            },
            {
                title: 'Preparing TypeScript files and configuration',
                task: async () => {
                    const filePath = (fileName) => node_path_1.default.join(directory, 'src', fileName);
                    // Copy Vite files
                    await this.copyTemplateFile(directory, 'vite.main.config.ts');
                    await this.copyTemplateFile(directory, 'vite.preload.config.ts');
                    await this.copyTemplateFile(directory, 'vite.renderer.config.ts');
                    // Copy tsconfig with a small set of presets
                    await this.copyTemplateFile(directory, 'tsconfig.json');
                    // Copy eslint config with recommended settings
                    await this.copyTemplateFile(directory, '.eslintrc.json');
                    // Remove index.js and replace with main.ts
                    await fs_extra_1.default.remove(filePath('index.js'));
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'main.ts');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'renderer.ts');
                    // Remove preload.js and replace with preload.ts
                    await fs_extra_1.default.remove(filePath('preload.js'));
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'preload.ts');
                    // TODO: Compatible with any path entry.
                    // Vite uses index.html under the root path as the entry point.
                    await fs_extra_1.default.move(filePath('index.html'), node_path_1.default.join(directory, 'index.html'), { overwrite: options.force });
                    await this.updateFileByLine(node_path_1.default.join(directory, 'index.html'), (line) => {
                        if (line.includes('link rel="stylesheet"'))
                            return '';
                        if (line.includes('</body>'))
                            return '    <script type="module" src="/src/renderer.ts"></script>\n  </body>';
                        return line;
                    });
                    // update package.json
                    const packageJSONPath = node_path_1.default.resolve(directory, 'package.json');
                    const packageJSON = await fs_extra_1.default.readJson(packageJSONPath);
                    packageJSON.main = '.vite/build/main.js';
                    // Configure scripts for TS template
                    packageJSON.scripts.lint = 'eslint --ext .ts,.tsx .';
                    await fs_extra_1.default.writeJson(packageJSONPath, packageJSON, {
                        spaces: 2,
                    });
                },
            },
        ];
    }
}
exports.default = new ViteTypeScriptTemplate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVml0ZVR5cGVTY3JpcHRUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WaXRlVHlwZVNjcmlwdFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTZCO0FBTTdCLGlFQUE2RDtBQUM3RCx3REFBMEI7QUFFMUIsTUFBTSxzQkFBdUIsU0FBUSw0QkFBWTtJQUFqRDs7UUFDUyxnQkFBVyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFnRjdELENBQUM7SUE5RVEsS0FBSyxDQUFDLGtCQUFrQixDQUM3QixTQUFpQixFQUNqQixPQUE0QjtRQUU1QixNQUFNLFVBQVUsR0FBRyxNQUFNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEUsT0FBTztZQUNMLEdBQUcsVUFBVTtZQUNiO2dCQUNFLEtBQUssRUFBRSxnQ0FBZ0M7Z0JBQ3ZDLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDZixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDekQsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUM7b0JBQzFELE1BQU0sa0JBQUUsQ0FBQyxNQUFNLENBQUMsbUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDOUQsQ0FBQzthQUNGO1lBQ0Q7Z0JBQ0UsS0FBSyxFQUFFLDhDQUE4QztnQkFDckQsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUNmLE1BQU0sUUFBUSxHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQ3BDLG1CQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBRXhDLGtC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