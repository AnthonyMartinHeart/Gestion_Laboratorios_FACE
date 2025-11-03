"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const template_base_1 = require("@electron-forge/template-base");
const fs_extra_1 = __importDefault(require("fs-extra"));
class ViteTemplate extends template_base_1.BaseTemplate {
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
                title: 'Setting up Vite configuration',
                task: async () => {
                    await this.copyTemplateFile(directory, 'vite.main.config.mjs');
                    await this.copyTemplateFile(directory, 'vite.preload.config.mjs');
                    await this.copyTemplateFile(directory, 'vite.renderer.config.mjs');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'renderer.js');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'preload.js');
                    await this.copyTemplateFile(node_path_1.default.join(directory, 'src'), 'index.js');
                    await this.updateFileByLine(node_path_1.default.resolve(directory, 'src', 'index.js'), (line) => {
                        if (line.includes('mainWindow.loadFile'))
                            return `  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, \`../renderer/\${MAIN_WINDOW_VITE_NAME}/index.html\`));
  }`;
                        return line;
                    }, node_path_1.default.resolve(directory, 'src', 'main.js'));
                    // TODO: Compatible with any path entry.
                    // Vite uses index.html under the root path as the entry point.
                    fs_extra_1.default.moveSync(node_path_1.default.join(directory, 'src', 'index.html'), node_path_1.default.join(directory, 'index.html'), { overwrite: options.force });
                    await this.updateFileByLine(node_path_1.default.join(directory, 'index.html'), (line) => {
                        if (line.includes('link rel="stylesheet"'))
                            return '';
                        if (line.includes('</body>'))
                            return '    <script type="module" src="/src/renderer.js"></script>\n  </body>';
                        return line;
                    });
                    // update package.json entry point
                    const pjPath = node_path_1.default.resolve(directory, 'package.json');
                    const currentPJ = await fs_extra_1.default.readJson(pjPath);
                    currentPJ.main = '.vite/build/main.js';
                    await fs_extra_1.default.writeJson(pjPath, currentPJ, {
                        spaces: 2,
                    });
                },
            },
        ];
    }
}
exports.default = new ViteTemplate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVml0ZVRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1ZpdGVUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE2QjtBQU03QixpRUFBNkQ7QUFDN0Qsd0RBQTBCO0FBRTFCLE1BQU0sWUFBYSxTQUFRLDRCQUFZO0lBQXZDOztRQUNTLGdCQUFXLEdBQUcsbUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQXlFN0QsQ0FBQztJQXZFUSxLQUFLLENBQUMsa0JBQWtCLENBQzdCLFNBQWlCLEVBQ2pCLE9BQTRCO1FBRTVCLE1BQU0sVUFBVSxHQUFHLE1BQU0sS0FBSyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0RSxPQUFPO1lBQ0wsR0FBRyxVQUFVO1lBQ2I7Z0JBQ0UsS0FBSyxFQUFFLGdDQUFnQztnQkFDdkMsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUNmLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM1RCxDQUFDO2FBQ0Y7WUFDRDtnQkFDRSxLQUFLLEVBQUUsK0JBQStCO2dCQUN0QyxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ2YsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLENBQUM7b0JBQy9ELE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO29CQUNsRSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztvQkFDbkUsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQ3pCLG1CQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFDM0IsYUFBYSxDQUNkLENBQUM7b0JBQ0YsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQ3pCLG1CQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFDM0IsWUFBWSxDQUNiLENBQUM7b0JBQ0YsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUVyRSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FDekIsbUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsRUFDMUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTt3QkFDUCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUM7NEJBQ3RDLE9BQU87Ozs7SUFJbkIsQ0FBQzt3QkFDUyxPQUFPLElBQUksQ0FBQztvQkFDZCxDQUFDLEVBQ0QsbUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FDMUMsQ0FBQztvQkFFRix3Q0FBd0M7b0JBQ3hDLCtEQUErRDtvQkFDL0Qsa0JBQUUsQ0FBQyxRQUFRLENBQ1QsbUJBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsRUFDekMsbUJBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUNsQyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQzdCLENBQUM7b0JBQ0YsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQ3pCLG1CQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFDbEMsQ0FBQyxJQUFJLEVBQUUsRUFBRTt3QkFDUCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUM7NEJBQUUsT0FBTyxFQUFFLENBQUM7d0JBQ3RELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7NEJBQzFCLE9BQU8sdUVBQXVFLENBQUM7d0JBQ2pGLE9BQU8sSUFBSSxDQUFDO29CQUNkLENBQUMsQ0FDRixDQUFDO29CQUVGLGtDQUFrQztvQkFDbEMsTUFBTSxNQUFNLEdBQUcsbUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUN2RCxNQUFNLFNBQVMsR0FBRyxNQUFNLGtCQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM1QyxTQUFTLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDO29CQUN2QyxNQUFNLGtCQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUU7d0JBQ3BDLE1BQU0sRUFBRSxDQUFDO3FCQUNWLENBQUMsQ0FBQztnQkFDTCxDQUFDO2FBQ0Y7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQsa0JBQWUsSUFBSSxZQUFZLEVBQUUsQ0FBQyJ9