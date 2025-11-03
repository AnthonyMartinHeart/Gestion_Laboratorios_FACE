"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const template_base_1 = require("@electron-forge/template-base");
const fs_extra_1 = __importDefault(require("fs-extra"));
class WebpackTemplate extends template_base_1.BaseTemplate {
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
                    await this.copyTemplateFile(directory, 'forge.config.js');
                },
            },
            {
                title: 'Setting up webpack configuration',
                task: async () => {
                    await this.copyTemplateFile(directory, 'webpack.main.config.js');
                    await this.copyTemplateFile(directory, 'webpack.renderer.config.js');
                    await this.copyTemplateFile(directory, 'webpack.rules.js');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'renderer.js');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'preload.js');
                    await this.updateFileByLine(node_path_1.default.resolve(directory, 'src', 'index.js'), (line) => {
                        if (line.includes('mainWindow.loadFile'))
                            return '  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);';
                        if (line.includes('preload: '))
                            return '      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,';
                        return line;
                    }, node_path_1.default.resolve(directory, 'src', 'main.js'));
                    await this.updateFileByLine(node_path_1.default.resolve(directory, 'src', 'index.html'), (line) => {
                        if (line.includes('link rel="stylesheet"'))
                            return '';
                        return line;
                    });
                    // update package.json entry point
                    const pjPath = node_path_1.default.resolve(directory, 'package.json');
                    const currentPJ = await fs_extra_1.default.readJson(pjPath);
                    currentPJ.main = '.webpack/main';
                    await fs_extra_1.default.writeJson(pjPath, currentPJ, {
                        spaces: 2,
                    });
                },
            },
        ];
    }
}
exports.default = new WebpackTemplate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2VicGFja1RlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1dlYnBhY2tUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE2QjtBQU03QixpRUFBNkQ7QUFDN0Qsd0RBQTBCO0FBRTFCLE1BQU0sZUFBZ0IsU0FBUSw0QkFBWTtJQUExQzs7UUFDUyxnQkFBVyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUE2RDdELENBQUM7SUEzRFEsS0FBSyxDQUFDLGtCQUFrQixDQUM3QixTQUFpQixFQUNqQixPQUE0QjtRQUU1QixNQUFNLFVBQVUsR0FBRyxNQUFNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEUsT0FBTztZQUNMLEdBQUcsVUFBVTtZQUNiO2dCQUNFLEtBQUssRUFBRSxnQ0FBZ0M7Z0JBQ3ZDLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDZixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFDNUQsQ0FBQzthQUNGO1lBQ0Q7Z0JBQ0UsS0FBSyxFQUFFLGtDQUFrQztnQkFDekMsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUNmLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUNqRSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztvQkFDckUsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDLENBQUM7b0JBQzNELE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUN6QixtQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQzNCLGFBQWEsQ0FDZCxDQUFDO29CQUNGLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUN6QixtQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQzNCLFlBQVksQ0FDYixDQUFDO29CQUVGLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUN6QixtQkFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxFQUMxQyxDQUFDLElBQUksRUFBRSxFQUFFO3dCQUNQLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQzs0QkFDdEMsT0FBTyxrREFBa0QsQ0FBQzt3QkFDNUQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQzs0QkFDNUIsT0FBTyxtREFBbUQsQ0FBQzt3QkFDN0QsT0FBTyxJQUFJLENBQUM7b0JBQ2QsQ0FBQyxFQUNELG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQzFDLENBQUM7b0JBRUYsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQ3pCLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEVBQzVDLENBQUMsSUFBSSxFQUFFLEVBQUU7d0JBQ1AsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDOzRCQUFFLE9BQU8sRUFBRSxDQUFDO3dCQUN0RCxPQUFPLElBQUksQ0FBQztvQkFDZCxDQUFDLENBQ0YsQ0FBQztvQkFFRixrQ0FBa0M7b0JBQ2xDLE1BQU0sTUFBTSxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDdkQsTUFBTSxTQUFTLEdBQUcsTUFBTSxrQkFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDNUMsU0FBUyxDQUFDLElBQUksR0FBRyxlQUFlLENBQUM7b0JBQ2pDLE1BQU0sa0JBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRTt3QkFDcEMsTUFBTSxFQUFFLENBQUM7cUJBQ1YsQ0FBQyxDQUFDO2dCQUNMLENBQUM7YUFDRjtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFFRCxrQkFBZSxJQUFJLGVBQWUsRUFBRSxDQUFDIn0=