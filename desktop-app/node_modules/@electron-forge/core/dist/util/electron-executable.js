"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const core_utils_1 = require("@electron-forge/core-utils");
const log_symbols_1 = __importDefault(require("log-symbols"));
async function locateElectronExecutable(dir, packageJSON) {
    const electronModulePath = await (0, core_utils_1.getElectronModulePath)(dir, packageJSON);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let electronExecPath = require(electronModulePath || node_path_1.default.resolve(dir, 'node_modules/electron'));
    if (typeof electronExecPath !== 'string') {
        console.warn(log_symbols_1.default.warning, 'Returned Electron executable path is not a string, defaulting to a hardcoded location. Value:', electronExecPath);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        electronExecPath = require(node_path_1.default.resolve(dir, 'node_modules/electron'));
    }
    return electronExecPath;
}
exports.default = locateElectronExecutable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24tZXhlY3V0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2VsZWN0cm9uLWV4ZWN1dGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNkI7QUFFN0IsMkRBQW1FO0FBQ25FLDhEQUFxQztBQUl0QixLQUFLLFVBQVUsd0JBQXdCLENBQ3BELEdBQVcsRUFDWCxXQUF3QjtJQUV4QixNQUFNLGtCQUFrQixHQUF1QixNQUFNLElBQUEsa0NBQXFCLEVBQ3hFLEdBQUcsRUFDSCxXQUFXLENBQ1osQ0FBQztJQUVGLGlFQUFpRTtJQUNqRSxJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FDNUIsa0JBQWtCLElBQUksbUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLHVCQUF1QixDQUFDLENBQ2pFLENBQUM7SUFFRixJQUFJLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDekMsT0FBTyxDQUFDLElBQUksQ0FDVixxQkFBVSxDQUFDLE9BQU8sRUFDbEIsK0ZBQStGLEVBQy9GLGdCQUFnQixDQUNqQixDQUFDO1FBQ0YsaUVBQWlFO1FBQ2pFLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxPQUFPLGdCQUFnQixDQUFDO0FBQzFCLENBQUM7QUF6QkQsMkNBeUJDIn0=