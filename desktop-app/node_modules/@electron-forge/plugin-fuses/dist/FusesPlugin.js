"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FusesPlugin = void 0;
const node_path_1 = __importDefault(require("node:path"));
const fuses_1 = require("@electron/fuses");
const plugin_base_1 = require("@electron-forge/plugin-base");
const getElectronExecutablePath_1 = require("./util/getElectronExecutablePath");
class FusesPlugin extends plugin_base_1.PluginBase {
    constructor(fusesConfig) {
        super(fusesConfig);
        this.name = 'fuses';
        this.fusesConfig = {};
        this.fusesConfig = fusesConfig;
    }
    getHooks() {
        return {
            packageAfterCopy: (0, plugin_base_1.namedHookWithTaskFn)(async (listrTask, resolvedForgeConfig, resourcesPath, electronVersion, platform, arch) => {
                const { fusesConfig } = this;
                const applePlatforms = ['darwin', 'mas'];
                if (Object.keys(fusesConfig).length) {
                    const pathToElectronExecutable = (0, getElectronExecutablePath_1.getElectronExecutablePath)({
                        appName: applePlatforms.includes(platform)
                            ? 'Electron'
                            : 'electron',
                        basePath: node_path_1.default.resolve(resourcesPath, '../..'),
                        platform,
                    });
                    const osxSignConfig = resolvedForgeConfig.packagerConfig.osxSign;
                    const hasOSXSignConfig = (typeof osxSignConfig === 'object' &&
                        Boolean(Object.keys(osxSignConfig).length)) ||
                        Boolean(osxSignConfig);
                    await (0, fuses_1.flipFuses)(pathToElectronExecutable, {
                        resetAdHocDarwinSignature: !hasOSXSignConfig &&
                            applePlatforms.includes(platform) &&
                            arch === 'arm64',
                        ...this.fusesConfig,
                    });
                }
            }, 'Flipping Fuses'),
        };
    }
}
exports.default = FusesPlugin;
exports.FusesPlugin = FusesPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVzZXNQbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvRnVzZXNQbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBRTdCLDJDQUF3RDtBQUN4RCw2REFBOEU7QUFHOUUsZ0ZBQTZFO0FBRTdFLE1BQXFCLFdBQVksU0FBUSx3QkFBc0I7SUFLN0QsWUFBWSxXQUF1QjtRQUNqQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFMckIsU0FBSSxHQUFHLE9BQU8sQ0FBQztRQUVmLGdCQUFXLEdBQUcsRUFBZ0IsQ0FBQztRQUs3QixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUNqQyxDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU87WUFDTCxnQkFBZ0IsRUFBRSxJQUFBLGlDQUFtQixFQUNuQyxLQUFLLEVBQ0gsU0FBUyxFQUNULG1CQUFtQixFQUNuQixhQUFhLEVBQ2IsZUFBZSxFQUNmLFFBQVEsRUFDUixJQUFJLEVBQ0osRUFBRTtnQkFDRixNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUU3QixNQUFNLGNBQWMsR0FBb0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTFELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDcEMsTUFBTSx3QkFBd0IsR0FBRyxJQUFBLHFEQUF5QixFQUFDO3dCQUN6RCxPQUFPLEVBQUUsY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7NEJBQ3hDLENBQUMsQ0FBQyxVQUFVOzRCQUNaLENBQUMsQ0FBQyxVQUFVO3dCQUNkLFFBQVEsRUFBRSxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO3dCQUM5QyxRQUFRO3FCQUNULENBQUMsQ0FBQztvQkFFSCxNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO29CQUNqRSxNQUFNLGdCQUFnQixHQUNwQixDQUFDLE9BQU8sYUFBYSxLQUFLLFFBQVE7d0JBQ2hDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUM3QyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBRXpCLE1BQU0sSUFBQSxpQkFBUyxFQUFDLHdCQUF3QixFQUFFO3dCQUN4Qyx5QkFBeUIsRUFDdkIsQ0FBQyxnQkFBZ0I7NEJBQ2pCLGNBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDOzRCQUNqQyxJQUFJLEtBQUssT0FBTzt3QkFDbEIsR0FBRyxJQUFJLENBQUMsV0FBVztxQkFDcEIsQ0FBQyxDQUFDO2dCQUNMLENBQUM7WUFDSCxDQUFDLEVBQ0QsZ0JBQWdCLENBQ2pCO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXRERCw4QkFzREM7QUFFUSxrQ0FBVyJ9