"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkingDir = void 0;
const node_path_1 = __importDefault(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Resolves the directory in which to use a CLI command.
 * @param dir - The directory specified by the user (can be relative or absolute)
 * @param checkExisting - Checks if the directory exists. If true and directory is non-existent, it will fall back to the current working directory
 * @returns
 */
function resolveWorkingDir(dir, checkExisting = true) {
    if (!dir) {
        return process.cwd();
    }
    const resolved = node_path_1.default.isAbsolute(dir)
        ? dir
        : node_path_1.default.resolve(process.cwd(), dir);
    if (checkExisting && !fs_extra_1.default.existsSync(resolved)) {
        return process.cwd();
    }
    else {
        return resolved;
    }
}
exports.resolveWorkingDir = resolveWorkingDir;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS13b3JraW5nLWRpci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Jlc29sdmUtd29ya2luZy1kaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBRTdCLHdEQUEwQjtBQUUxQjs7Ozs7R0FLRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLEdBQVcsRUFBRSxhQUFhLEdBQUcsSUFBSTtJQUNqRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDVCxPQUFPLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsbUJBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxHQUFHO1FBQ0wsQ0FBQyxDQUFDLG1CQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUVyQyxJQUFJLGFBQWEsSUFBSSxDQUFDLGtCQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDOUMsT0FBTyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDdkIsQ0FBQztTQUFNLENBQUM7UUFDTixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0FBQ0gsQ0FBQztBQWRELDhDQWNDIn0=