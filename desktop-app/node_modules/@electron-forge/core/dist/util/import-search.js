"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSearchRaw = void 0;
const node_path_1 = __importDefault(require("node:path"));
const debug_1 = __importDefault(require("debug"));
// eslint-disable-next-line n/no-missing-import
const dynamic_import_js_1 = require("../../helper/dynamic-import.js");
const d = (0, debug_1.default)('electron-forge:import-search');
async function importSearchRaw(relativeTo, paths) {
    // Attempt to locally short-circuit if we're running from a checkout of forge
    if (__dirname.includes('forge/packages/api/core/') &&
        paths.length === 1 &&
        paths[0].startsWith('@electron-forge/')) {
        const [moduleType, moduleName] = paths[0].split('/')[1].split('-');
        try {
            const localPath = node_path_1.default.resolve(__dirname, '..', '..', '..', '..', moduleType, moduleName);
            d('testing local forge build', { moduleType, moduleName, localPath });
            return await (0, dynamic_import_js_1.dynamicImportMaybe)(localPath);
        }
        catch {
            // Ignore
        }
    }
    // Load via normal search paths
    const testPaths = paths
        .concat(paths.map((mapPath) => node_path_1.default.resolve(relativeTo, mapPath)))
        .concat(paths.map((mapPath) => node_path_1.default.resolve(relativeTo, 'node_modules', mapPath)));
    d('searching', testPaths, 'relative to', relativeTo);
    for (const testPath of testPaths) {
        try {
            d('testing', testPath);
            return await (0, dynamic_import_js_1.dynamicImportMaybe)(testPath);
        }
        catch (err) {
            if (err instanceof Error) {
                const requireErr = err;
                // Ignore require-related errors
                if (requireErr.code !== 'MODULE_NOT_FOUND' ||
                    ![undefined, testPath].includes(requireErr.requestPath)) {
                    throw err;
                }
            }
        }
    }
    d('failed to find a module in', testPaths);
    return null;
}
exports.importSearchRaw = importSearchRaw;
exports.default = async (relativeTo, paths) => {
    const result = await importSearchRaw(relativeTo, paths);
    return typeof result === 'object' && result && result.default
        ? result.default
        : result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2ltcG9ydC1zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBRTdCLGtEQUEwQjtBQUUxQiwrQ0FBK0M7QUFDL0Msc0VBQW9FO0FBRXBFLE1BQU0sQ0FBQyxHQUFHLElBQUEsZUFBSyxFQUFDLDhCQUE4QixDQUFDLENBQUM7QUFTekMsS0FBSyxVQUFVLGVBQWUsQ0FDbkMsVUFBa0IsRUFDbEIsS0FBZTtJQUVmLDZFQUE2RTtJQUM3RSxJQUNFLFNBQVMsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUM7UUFDOUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBQ2xCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsRUFDdkMsQ0FBQztRQUNELE1BQU0sQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDO1lBQ0gsTUFBTSxTQUFTLEdBQUcsbUJBQUksQ0FBQyxPQUFPLENBQzVCLFNBQVMsRUFDVCxJQUFJLEVBQ0osSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLEVBQ0osVUFBVSxFQUNWLFVBQVUsQ0FDWCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLDJCQUEyQixFQUFFLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE9BQU8sTUFBTSxJQUFBLHNDQUFrQixFQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxTQUFTO1FBQ1gsQ0FBQztJQUNILENBQUM7SUFFRCwrQkFBK0I7SUFDL0IsTUFBTSxTQUFTLEdBQUcsS0FBSztTQUNwQixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsbUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDakUsTUFBTSxDQUNMLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLG1CQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FDMUUsQ0FBQztJQUNKLENBQUMsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNyRCxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQztZQUNILENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkIsT0FBTyxNQUFNLElBQUEsc0NBQWtCLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLEdBQUcsWUFBWSxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxVQUFVLEdBQUcsR0FBbUIsQ0FBQztnQkFDdkMsZ0NBQWdDO2dCQUNoQyxJQUNFLFVBQVUsQ0FBQyxJQUFJLEtBQUssa0JBQWtCO29CQUN0QyxDQUFDLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQ3ZELENBQUM7b0JBQ0QsTUFBTSxHQUFHLENBQUM7Z0JBQ1osQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUNELENBQUMsQ0FBQyw0QkFBNEIsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUMzQyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUF0REQsMENBc0RDO0FBTUQsa0JBQWUsS0FBSyxFQUNsQixVQUFrQixFQUNsQixLQUFlLEVBQ0ksRUFBRTtJQUNyQixNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQWUsQ0FBb0IsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNFLE9BQU8sT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTztRQUMzRCxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU87UUFDaEIsQ0FBQyxDQUFFLE1BQW1CLENBQUM7QUFDM0IsQ0FBQyxDQUFDIn0=