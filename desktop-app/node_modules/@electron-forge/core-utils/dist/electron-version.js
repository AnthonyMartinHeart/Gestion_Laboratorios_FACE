"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateElectronDependency = exports.getElectronVersion = exports.getElectronModulePath = exports.PackageNotFoundError = void 0;
const node_path_1 = __importDefault(require("node:path"));
const debug_1 = __importDefault(require("debug"));
const find_up_1 = __importDefault(require("find-up"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const d = (0, debug_1.default)('electron-forge:electron-version');
const electronPackageNames = ['electron-nightly', 'electron'];
function findElectronDep(dep) {
    return electronPackageNames.includes(dep);
}
async function findAncestorNodeModulesPath(dir, packageName) {
    d('Looking for a lock file to indicate the root of the repo');
    const lockPath = await (0, find_up_1.default)(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'], { cwd: dir, type: 'file' });
    if (lockPath) {
        d(`Found lock file: ${lockPath}`);
        const nodeModulesPath = node_path_1.default.join(node_path_1.default.dirname(lockPath), 'node_modules', packageName);
        if (await fs_extra_1.default.pathExists(nodeModulesPath)) {
            return nodeModulesPath;
        }
    }
    return Promise.resolve(undefined);
}
async function determineNodeModulesPath(dir, packageName) {
    const nodeModulesPath = node_path_1.default.join(dir, 'node_modules', packageName);
    if (await fs_extra_1.default.pathExists(nodeModulesPath)) {
        return nodeModulesPath;
    }
    return findAncestorNodeModulesPath(dir, packageName);
}
class PackageNotFoundError extends Error {
    constructor(packageName, dir) {
        super(`Cannot find the package "${packageName}". Perhaps you need to run install it in "${dir}"?`);
    }
}
exports.PackageNotFoundError = PackageNotFoundError;
function getElectronModuleName(packageJSON) {
    if (!packageJSON.devDependencies) {
        throw new Error('package.json for app does not have any devDependencies');
    }
    // Why: checked above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const packageName = electronPackageNames.find((pkg) => packageJSON.devDependencies[pkg]);
    if (packageName === undefined) {
        throw new Error('Could not find any Electron packages in devDependencies');
    }
    return packageName;
}
async function getElectronPackageJSONPath(dir, packageName) {
    const nodeModulesPath = await determineNodeModulesPath(dir, packageName);
    if (!nodeModulesPath) {
        throw new PackageNotFoundError(packageName, dir);
    }
    const electronPackageJSONPath = node_path_1.default.join(nodeModulesPath, 'package.json');
    if (await fs_extra_1.default.pathExists(electronPackageJSONPath)) {
        return electronPackageJSONPath;
    }
    return undefined;
}
async function getElectronModulePath(dir, packageJSON) {
    const moduleName = getElectronModuleName(packageJSON);
    const packageJSONPath = await getElectronPackageJSONPath(dir, moduleName);
    if (packageJSONPath) {
        return node_path_1.default.dirname(packageJSONPath);
    }
    return undefined;
}
exports.getElectronModulePath = getElectronModulePath;
async function getElectronVersion(dir, packageJSON) {
    const packageName = getElectronModuleName(packageJSON);
    // Why: checked in getElectronModuleName
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let version = packageJSON.devDependencies[packageName];
    if (!semver_1.default.valid(version)) {
        // It's not an exact version, find it in the actual module
        const electronPackageJSONPath = await getElectronPackageJSONPath(dir, packageName);
        if (electronPackageJSONPath) {
            const electronPackageJSON = await fs_extra_1.default.readJson(electronPackageJSONPath);
            version = electronPackageJSON.version;
        }
        else {
            throw new PackageNotFoundError(packageName, dir);
        }
    }
    return version;
}
exports.getElectronVersion = getElectronVersion;
function updateElectronDependency(packageJSON, dev, exact) {
    const alteredDev = [].concat(dev);
    let alteredExact = [].concat(exact);
    // Why: checked in getElectronModuleName
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (Object.keys(packageJSON.devDependencies).find(findElectronDep)) {
        alteredExact = alteredExact.filter((dep) => dep !== 'electron');
    }
    else if (packageJSON.dependencies) {
        const electronKey = Object.keys(packageJSON.dependencies).find(findElectronDep);
        if (electronKey) {
            alteredExact = alteredExact.filter((dep) => dep !== 'electron');
            d(`Moving ${electronKey} from dependencies to devDependencies`);
            alteredDev.push(`${electronKey}@${packageJSON.dependencies[electronKey]}`);
            delete packageJSON.dependencies[electronKey];
        }
    }
    return [alteredDev, alteredExact];
}
exports.updateElectronDependency = updateElectronDependency;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24tdmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbGVjdHJvbi12ZXJzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDBEQUE2QjtBQUU3QixrREFBMEI7QUFDMUIsc0RBQTZCO0FBQzdCLHdEQUEwQjtBQUMxQixvREFBNEI7QUFFNUIsTUFBTSxDQUFDLEdBQUcsSUFBQSxlQUFLLEVBQUMsaUNBQWlDLENBQUMsQ0FBQztBQUVuRCxNQUFNLG9CQUFvQixHQUFHLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFPOUQsU0FBUyxlQUFlLENBQUMsR0FBVztJQUNsQyxPQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsS0FBSyxVQUFVLDJCQUEyQixDQUN4QyxHQUFXLEVBQ1gsV0FBbUI7SUFFbkIsQ0FBQyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7SUFDOUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLGlCQUFNLEVBQzNCLENBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLEVBQ3BELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQzNCLENBQUM7SUFDRixJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLG9CQUFvQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sZUFBZSxHQUFHLG1CQUFJLENBQUMsSUFBSSxDQUMvQixtQkFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFDdEIsY0FBYyxFQUNkLFdBQVcsQ0FDWixDQUFDO1FBQ0YsSUFBSSxNQUFNLGtCQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDekMsT0FBTyxlQUFlLENBQUM7UUFDekIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVELEtBQUssVUFBVSx3QkFBd0IsQ0FDckMsR0FBVyxFQUNYLFdBQW1CO0lBRW5CLE1BQU0sZUFBZSxHQUF1QixtQkFBSSxDQUFDLElBQUksQ0FDbkQsR0FBRyxFQUNILGNBQWMsRUFDZCxXQUFXLENBQ1osQ0FBQztJQUNGLElBQUksTUFBTSxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBQ3pDLE9BQU8sZUFBZSxDQUFDO0lBQ3pCLENBQUM7SUFDRCxPQUFPLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQzdDLFlBQVksV0FBbUIsRUFBRSxHQUFXO1FBQzFDLEtBQUssQ0FDSCw0QkFBNEIsV0FBVyw2Q0FBNkMsR0FBRyxJQUFJLENBQzVGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFORCxvREFNQztBQUVELFNBQVMscUJBQXFCLENBQUMsV0FBZ0M7SUFDN0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVELHFCQUFxQjtJQUNyQixvRUFBb0U7SUFDcEUsTUFBTSxXQUFXLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUMzQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLGVBQWdCLENBQUMsR0FBRyxDQUFDLENBQzNDLENBQUM7SUFDRixJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxLQUFLLFVBQVUsMEJBQTBCLENBQ3ZDLEdBQVcsRUFDWCxXQUFtQjtJQUVuQixNQUFNLGVBQWUsR0FBRyxNQUFNLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUN6RSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDckIsTUFBTSxJQUFJLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsTUFBTSx1QkFBdUIsR0FBRyxtQkFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDM0UsSUFBSSxNQUFNLGtCQUFFLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztRQUNqRCxPQUFPLHVCQUF1QixDQUFDO0lBQ2pDLENBQUM7SUFFRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRU0sS0FBSyxVQUFVLHFCQUFxQixDQUN6QyxHQUFXLEVBQ1gsV0FBZ0M7SUFFaEMsTUFBTSxVQUFVLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdEQsTUFBTSxlQUFlLEdBQUcsTUFBTSwwQkFBMEIsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDMUUsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUNwQixPQUFPLG1CQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBWEQsc0RBV0M7QUFFTSxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLEdBQVcsRUFDWCxXQUFnQztJQUVoQyxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV2RCx3Q0FBd0M7SUFDeEMsb0VBQW9FO0lBQ3BFLElBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQyxlQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3hELElBQUksQ0FBQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQzNCLDBEQUEwRDtRQUMxRCxNQUFNLHVCQUF1QixHQUFHLE1BQU0sMEJBQTBCLENBQzlELEdBQUcsRUFDSCxXQUFXLENBQ1osQ0FBQztRQUNGLElBQUksdUJBQXVCLEVBQUUsQ0FBQztZQUM1QixNQUFNLG1CQUFtQixHQUFHLE1BQU0sa0JBQUUsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUN2RSxPQUFPLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxDQUFDO1FBQ3hDLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxJQUFJLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUF4QkQsZ0RBd0JDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQ3RDLFdBQWdDLEVBQ2hDLEdBQWEsRUFDYixLQUFlO0lBRWYsTUFBTSxVQUFVLEdBQUksRUFBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoRCxJQUFJLFlBQVksR0FBSSxFQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xELHdDQUF3QztJQUN4QyxvRUFBb0U7SUFDcEUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7UUFDcEUsWUFBWSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxVQUFVLENBQUMsQ0FBQztJQUNsRSxDQUFDO1NBQU0sSUFBSSxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUM1RCxlQUFlLENBQ2hCLENBQUM7UUFDRixJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2hCLFlBQVksR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssVUFBVSxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLFVBQVUsV0FBVyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ2hFLFVBQVUsQ0FBQyxJQUFJLENBQ2IsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUMxRCxDQUFDO1lBQ0YsT0FBTyxXQUFXLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9DLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBMUJELDREQTBCQyJ9