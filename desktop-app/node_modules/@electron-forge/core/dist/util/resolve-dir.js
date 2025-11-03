"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const core_utils_1 = require("@electron-forge/core-utils");
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const forge_config_1 = require("./forge-config");
const read_package_json_1 = require("./read-package-json");
const d = (0, debug_1.default)('electron-forge:project-resolver');
// FIXME: If we want getElectronVersion to be overridable by plugins
//        and / or forge config then we need to be able to resolve
//        the dir without calling getElectronVersion
exports.default = async (dir) => {
    let mDir = node_path_1.default.resolve(dir);
    let bestGuessDir = null;
    let lastError = null;
    let prevDir;
    while (prevDir !== mDir) {
        prevDir = mDir;
        d('searching for project in:', mDir);
        if (forge_config_1.registeredForgeConfigs.has(mDir)) {
            d('virtual config found in:', mDir);
            return mDir;
        }
        const testPath = node_path_1.default.resolve(mDir, 'package.json');
        if (await fs_extra_1.default.pathExists(testPath)) {
            const packageJSON = await (0, read_package_json_1.readRawPackageJson)(mDir);
            // TODO: Move this check to inside the forge config resolver and use
            //       mutatedPackageJson reader
            try {
                await (0, core_utils_1.getElectronVersion)(mDir, packageJSON);
            }
            catch (err) {
                if (err instanceof Error) {
                    lastError = err.message;
                }
            }
            if (packageJSON.config && packageJSON.config.forge) {
                d('electron-forge compatible package.json found in', testPath);
                return mDir;
            }
            if (packageJSON.devDependencies?.['@electron-forge/cli'] ||
                packageJSON.devDependencies?.['@electron-forge/core']) {
                d('package.json with forge dependency found in', testPath);
                return mDir;
            }
            bestGuessDir = mDir;
        }
        mDir = node_path_1.default.dirname(mDir);
    }
    if (bestGuessDir) {
        d('guessing on the best electron-forge package.json found in', bestGuessDir);
        return bestGuessDir;
    }
    if (lastError) {
        throw new Error(lastError);
    }
    return null;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1kaXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbC9yZXNvbHZlLWRpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE2QjtBQUU3QiwyREFBZ0U7QUFDaEUsa0RBQTBCO0FBQzFCLHdEQUEwQjtBQUUxQixpREFBd0Q7QUFDeEQsMkRBQXlEO0FBRXpELE1BQU0sQ0FBQyxHQUFHLElBQUEsZUFBSyxFQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFFbkQsb0VBQW9FO0FBQ3BFLGtFQUFrRTtBQUNsRSxvREFBb0Q7QUFDcEQsa0JBQWUsS0FBSyxFQUFFLEdBQVcsRUFBMEIsRUFBRTtJQUMzRCxJQUFJLElBQUksR0FBRyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixJQUFJLFlBQVksR0FBa0IsSUFBSSxDQUFDO0lBQ3ZDLElBQUksU0FBUyxHQUFrQixJQUFJLENBQUM7SUFFcEMsSUFBSSxPQUFPLENBQUM7SUFDWixPQUFPLE9BQU8sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUN4QixPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JDLElBQUkscUNBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDckMsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNwRCxJQUFJLE1BQU0sa0JBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsc0NBQWtCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFFbkQsb0VBQW9FO1lBQ3BFLGtDQUFrQztZQUNsQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxJQUFBLCtCQUFrQixFQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixJQUFJLEdBQUcsWUFBWSxLQUFLLEVBQUUsQ0FBQztvQkFDekIsU0FBUyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7Z0JBQzFCLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxXQUFXLENBQUMsTUFBTSxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25ELENBQUMsQ0FBQyxpREFBaUQsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDL0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFDRSxXQUFXLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUM7Z0JBQ3BELFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUNyRCxDQUFDO2dCQUNELENBQUMsQ0FBQyw2Q0FBNkMsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDM0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDO1lBRUQsWUFBWSxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO1FBQ0QsSUFBSSxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFDRCxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FDQywyREFBMkQsRUFDM0QsWUFBWSxDQUNiLENBQUM7UUFDRixPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBQ0QsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyxDQUFDIn0=