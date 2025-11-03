"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronExecutablePath = void 0;
const node_path_1 = __importDefault(require("node:path"));
function getElectronExecutablePath({ appName, basePath, platform, }) {
    if (['darwin', 'mas'].includes(platform)) {
        return node_path_1.default.join(basePath, 'MacOS', appName);
    }
    const suffix = platform === 'win32' ? '.exe' : '';
    return node_path_1.default.join(basePath, `${appName}${suffix}`);
}
exports.getElectronExecutablePath = getElectronExecutablePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0RWxlY3Ryb25FeGVjdXRhYmxlUGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2dldEVsZWN0cm9uRXhlY3V0YWJsZVBhdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBVTdCLFNBQWdCLHlCQUF5QixDQUFDLEVBQ3hDLE9BQU8sRUFDUCxRQUFRLEVBQ1IsUUFBUSxHQUN3QjtJQUNoQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ3pDLE9BQU8sbUJBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDbEQsT0FBTyxtQkFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBWEQsOERBV0MifQ==