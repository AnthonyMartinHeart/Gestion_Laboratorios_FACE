"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const template_base_1 = require("@electron-forge/template-base");
const fs_extra_1 = __importDefault(require("fs-extra"));
class WebpackTypeScriptTemplate extends template_base_1.BaseTemplate {
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
                    await this.copyTemplateFile(directory, 'forge.config.ts');
                    await fs_extra_1.default.remove(node_path_1.default.resolve(directory, 'forge.config.js'));
                },
            },
            {
                title: 'Preparing TypeScript files and configuration',
                task: async () => {
                    const filePath = (fileName) => node_path_1.default.join(directory, 'src', fileName);
                    // Copy Webpack files
                    await this.copyTemplateFile(directory, 'webpack.main.config.ts');
                    await this.copyTemplateFile(directory, 'webpack.renderer.config.ts');
                    await this.copyTemplateFile(directory, 'webpack.rules.ts');
                    await this.copyTemplateFile(directory, 'webpack.plugins.ts');
                    await this.updateFileByLine(node_path_1.default.resolve(directory, 'src', 'index.html'), (line) => {
                        if (line.includes('link rel="stylesheet"'))
                            return '';
                        return line;
                    });
                    // Copy tsconfig with a small set of presets
                    await this.copyTemplateFile(directory, 'tsconfig.json');
                    // Copy eslint config with recommended settings
                    await this.copyTemplateFile(directory, '.eslintrc.json');
                    // Remove index.js and replace with index.ts
                    await fs_extra_1.default.remove(filePath('index.js'));
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'index.ts');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'renderer.ts');
                    // Remove preload.js and replace with preload.ts
                    await fs_extra_1.default.remove(filePath('preload.js'));
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'preload.ts');
                    // update package.json
                    const packageJSONPath = node_path_1.default.resolve(directory, 'package.json');
                    const packageJSON = await fs_extra_1.default.readJson(packageJSONPath);
                    packageJSON.main = '.webpack/main';
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
exports.default = new WebpackTypeScriptTemplate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2VicGFja1R5cGVTY3JpcHRUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9XZWJwYWNrVHlwZVNjcmlwdFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTZCO0FBTTdCLGlFQUE2RDtBQUM3RCx3REFBMEI7QUFFMUIsTUFBTSx5QkFBMEIsU0FBUSw0QkFBWTtJQUFwRDs7UUFDUyxnQkFBVyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUF1RTdELENBQUM7SUFyRUMsS0FBSyxDQUFDLGtCQUFrQixDQUN0QixTQUFpQixFQUNqQixPQUE0QjtRQUU1QixNQUFNLFVBQVUsR0FBRyxNQUFNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEUsT0FBTztZQUNMLEdBQUcsVUFBVTtZQUNiO2dCQUNFLEtBQUssRUFBRSxnQ0FBZ0M7Z0JBQ3ZDLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDZixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztvQkFDMUQsTUFBTSxrQkFBRSxDQUFDLE1BQU0sQ0FBQyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO2FBQ0Y7WUFDRDtnQkFDRSxLQUFLLEVBQUUsOENBQThDO2dCQUNyRCxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ2YsTUFBTSxRQUFRLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FDcEMsbUJBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFFeEMscUJBQXFCO29CQUNyQixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztvQkFDakUsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLENBQUM7b0JBQ3JFLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUMzRCxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztvQkFFN0QsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQ3pCLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEVBQzVDLENBQUMsSUFBSSxFQUFFLEVBQUU7d0JBQ1AsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDOzRCQUFFLE9BQU8sRUFBRSxDQUFDO3dCQUN0RCxPQUFPLElBQUksQ0FBQztvQkFDZCxDQUFDLENBQ0YsQ0FBQztvQkFFRiw0Q0FBNEM7b0JBQzVDLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFFeEQsK0NBQStDO29CQUMvQyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFFekQsNENBQTRDO29CQUM1QyxNQUFNLGtCQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBRXJFLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUN6QixtQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQzNCLGFBQWEsQ0FDZCxDQUFDO29CQUVGLGdEQUFnRDtvQkFDaEQsTUFBTSxrQkFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDeEMsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQ3pCLG1CQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFDM0IsWUFBWSxDQUNiLENBQUM7b0JBRUYsc0JBQXNCO29CQUN0QixNQUFNLGVBQWUsR0FBRyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQ2hFLE1BQU0sV0FBVyxHQUFHLE1BQU0sa0JBQUUsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3ZELFdBQVcsQ0FBQyxJQUFJLEdBQUcsZUFBZSxDQUFDO29CQUNuQyxvQ0FBb0M7b0JBQ3BDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO29CQUNyRCxNQUFNLGtCQUFFLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUU7d0JBQy9DLE1BQU0sRUFBRSxDQUFDO3FCQUNWLENBQUMsQ0FBQztnQkFDTCxDQUFDO2FBQ0Y7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQsa0JBQWUsSUFBSSx5QkFBeUIsRUFBRSxDQUFDIn0=