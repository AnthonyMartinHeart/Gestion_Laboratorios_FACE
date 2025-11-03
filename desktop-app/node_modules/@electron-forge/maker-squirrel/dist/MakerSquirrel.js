"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerSquirrel = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const maker_base_1 = require("@electron-forge/maker-base");
const electron_winstaller_1 = require("electron-winstaller");
const fs_extra_1 = __importDefault(require("fs-extra"));
class MakerSquirrel extends maker_base_1.MakerBase {
    constructor() {
        super(...arguments);
        this.name = 'squirrel';
        this.defaultPlatforms = ['win32'];
    }
    isSupportedOnCurrentPlatform() {
        return (this.isInstalled('electron-winstaller') &&
            !process.env.DISABLE_SQUIRREL_TEST);
    }
    async make({ dir, makeDir, targetArch, packageJSON, appName, forgeConfig, }) {
        const outPath = node_path_1.default.resolve(makeDir, `squirrel.windows/${targetArch}`);
        await this.ensureDirectory(outPath);
        const tmpFolder = await fs_extra_1.default.mkdtemp(node_path_1.default.resolve(node_os_1.default.tmpdir(), 'squirrel-maker-'));
        await fs_extra_1.default.copy(dir, tmpFolder);
        try {
            const winstallerConfig = {
                name: typeof packageJSON.name === 'string'
                    ? packageJSON.name.replace(/-/g, '_')
                    : undefined, // squirrel hates hyphens
                title: appName,
                noMsi: true,
                exe: `${forgeConfig.packagerConfig.executableName || appName}.exe`,
                setupExe: `${appName}-${packageJSON.version} Setup.exe`,
                ...this.config,
                appDirectory: tmpFolder,
                outputDirectory: outPath,
            };
            await (0, electron_winstaller_1.createWindowsInstaller)(winstallerConfig);
            const nupkgVersion = (0, electron_winstaller_1.convertVersion)(packageJSON.version);
            const artifacts = [
                node_path_1.default.resolve(outPath, 'RELEASES'),
                node_path_1.default.resolve(outPath, winstallerConfig.setupExe || `${appName}Setup.exe`),
                node_path_1.default.resolve(outPath, `${winstallerConfig.name}-${nupkgVersion}-full.nupkg`),
            ];
            const deltaPath = node_path_1.default.resolve(outPath, `${winstallerConfig.name}-${nupkgVersion}-delta.nupkg`);
            if (winstallerConfig.remoteReleases &&
                !winstallerConfig.noDelta &&
                (await fs_extra_1.default.pathExists(deltaPath))) {
                artifacts.push(deltaPath);
            }
            const msiPath = node_path_1.default.resolve(outPath, winstallerConfig.setupMsi || `${appName}Setup.msi`);
            if (!winstallerConfig.noMsi && (await fs_extra_1.default.pathExists(msiPath))) {
                artifacts.push(msiPath);
            }
            return artifacts;
        }
        finally {
            await fs_extra_1.default.remove(tmpFolder);
        }
    }
}
exports.default = MakerSquirrel;
exports.MakerSquirrel = MakerSquirrel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFrZXJTcXVpcnJlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9NYWtlclNxdWlycmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNEQUF5QjtBQUN6QiwwREFBNkI7QUFFN0IsMkRBQXFFO0FBRXJFLDZEQUk2QjtBQUM3Qix3REFBMEI7QUFPMUIsTUFBcUIsYUFBYyxTQUFRLHNCQUE4QjtJQUF6RTs7UUFDRSxTQUFJLEdBQUcsVUFBVSxDQUFDO1FBRWxCLHFCQUFnQixHQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBK0VoRCxDQUFDO0lBN0VDLDRCQUE0QjtRQUMxQixPQUFPLENBQ0wsSUFBSSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQztZQUN2QyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQ25DLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUNULEdBQUcsRUFDSCxPQUFPLEVBQ1AsVUFBVSxFQUNWLFdBQVcsRUFDWCxPQUFPLEVBQ1AsV0FBVyxHQUNFO1FBQ2IsTUFBTSxPQUFPLEdBQUcsbUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLG9CQUFvQixVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwQyxNQUFNLFNBQVMsR0FBRyxNQUFNLGtCQUFFLENBQUMsT0FBTyxDQUNoQyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQzdDLENBQUM7UUFFRixNQUFNLGtCQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUU5QixJQUFJLENBQUM7WUFDSCxNQUFNLGdCQUFnQixHQUE4QjtnQkFDbEQsSUFBSSxFQUNGLE9BQU8sV0FBVyxDQUFDLElBQUksS0FBSyxRQUFRO29CQUNsQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztvQkFDckMsQ0FBQyxDQUFDLFNBQVMsRUFBRSx5QkFBeUI7Z0JBQzFDLEtBQUssRUFBRSxPQUFPO2dCQUNkLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxHQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUMsY0FBYyxJQUFJLE9BQU8sTUFBTTtnQkFDbEUsUUFBUSxFQUFFLEdBQUcsT0FBTyxJQUFJLFdBQVcsQ0FBQyxPQUFPLFlBQVk7Z0JBQ3ZELEdBQUcsSUFBSSxDQUFDLE1BQU07Z0JBQ2QsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLGVBQWUsRUFBRSxPQUFPO2FBQ3pCLENBQUM7WUFFRixNQUFNLElBQUEsNENBQXNCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUvQyxNQUFNLFlBQVksR0FBRyxJQUFBLG9DQUFjLEVBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXpELE1BQU0sU0FBUyxHQUFHO2dCQUNoQixtQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDO2dCQUNqQyxtQkFBSSxDQUFDLE9BQU8sQ0FDVixPQUFPLEVBQ1AsZ0JBQWdCLENBQUMsUUFBUSxJQUFJLEdBQUcsT0FBTyxXQUFXLENBQ25EO2dCQUNELG1CQUFJLENBQUMsT0FBTyxDQUNWLE9BQU8sRUFDUCxHQUFHLGdCQUFnQixDQUFDLElBQUksSUFBSSxZQUFZLGFBQWEsQ0FDdEQ7YUFDRixDQUFDO1lBQ0YsTUFBTSxTQUFTLEdBQUcsbUJBQUksQ0FBQyxPQUFPLENBQzVCLE9BQU8sRUFDUCxHQUFHLGdCQUFnQixDQUFDLElBQUksSUFBSSxZQUFZLGNBQWMsQ0FDdkQsQ0FBQztZQUNGLElBQ0UsZ0JBQWdCLENBQUMsY0FBYztnQkFDL0IsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPO2dCQUN6QixDQUFDLE1BQU0sa0JBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDaEMsQ0FBQztnQkFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxtQkFBSSxDQUFDLE9BQU8sQ0FDMUIsT0FBTyxFQUNQLGdCQUFnQixDQUFDLFFBQVEsSUFBSSxHQUFHLE9BQU8sV0FBVyxDQUNuRCxDQUFDO1lBQ0YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sa0JBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM5RCxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO2dCQUFTLENBQUM7WUFDVCxNQUFNLGtCQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFsRkQsZ0NBa0ZDO0FBRVEsc0NBQWEifQ==