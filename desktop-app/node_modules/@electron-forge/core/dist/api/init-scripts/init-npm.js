"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNPM = exports.exactDevDeps = exports.devDeps = exports.deps = exports.siblingDep = void 0;
const node_path_1 = __importDefault(require("node:path"));
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const install_dependencies_1 = __importStar(require("../../util/install-dependencies"));
const d = (0, debug_1.default)('electron-forge:init:npm');
const corePackage = fs_extra_1.default.readJsonSync(node_path_1.default.resolve(__dirname, '../../../package.json'));
function siblingDep(name) {
    return `@electron-forge/${name}@^${corePackage.version}`;
}
exports.siblingDep = siblingDep;
exports.deps = ['electron-squirrel-startup'];
exports.devDeps = [
    '@electron/fuses@^1.0.0',
    siblingDep('cli'),
    siblingDep('maker-squirrel'),
    siblingDep('maker-zip'),
    siblingDep('maker-deb'),
    siblingDep('maker-rpm'),
    siblingDep('plugin-auto-unpack-natives'),
    siblingDep('plugin-fuses'),
];
exports.exactDevDeps = ['electron'];
const initNPM = async (pm, dir, task) => {
    d('installing dependencies');
    task.output = `${pm.executable} ${pm.install} ${exports.deps.join(' ')}`;
    await (0, install_dependencies_1.default)(pm, dir, exports.deps);
    d('installing devDependencies');
    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${exports.deps.join(' ')}`;
    await (0, install_dependencies_1.default)(pm, dir, exports.devDeps, install_dependencies_1.DepType.DEV);
    d('installing exact devDependencies');
    for (const packageName of exports.exactDevDeps) {
        task.output = `${pm.executable} ${pm.install} ${pm.dev} ${pm.exact} ${packageName}`;
        await (0, install_dependencies_1.default)(pm, dir, [packageName], install_dependencies_1.DepType.DEV, install_dependencies_1.DepVersionRestriction.EXACT);
    }
};
exports.initNPM = initNPM;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC1ucG0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL2luaXQtc2NyaXB0cy9pbml0LW5wbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBEQUE2QjtBQUk3QixrREFBMEI7QUFDMUIsd0RBQTBCO0FBRTFCLHdGQUd5QztBQUV6QyxNQUFNLENBQUMsR0FBRyxJQUFBLGVBQUssRUFBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sV0FBVyxHQUFHLGtCQUFFLENBQUMsWUFBWSxDQUNqQyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsdUJBQXVCLENBQUMsQ0FDakQsQ0FBQztBQUVGLFNBQWdCLFVBQVUsQ0FBQyxJQUFZO0lBQ3JDLE9BQU8sbUJBQW1CLElBQUksS0FBSyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0QsQ0FBQztBQUZELGdDQUVDO0FBRVksUUFBQSxJQUFJLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQ3JDLFFBQUEsT0FBTyxHQUFHO0lBQ3JCLHdCQUF3QjtJQUN4QixVQUFVLENBQUMsS0FBSyxDQUFDO0lBQ2pCLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQztJQUM1QixVQUFVLENBQUMsV0FBVyxDQUFDO0lBQ3ZCLFVBQVUsQ0FBQyxXQUFXLENBQUM7SUFDdkIsVUFBVSxDQUFDLFdBQVcsQ0FBQztJQUN2QixVQUFVLENBQUMsNEJBQTRCLENBQUM7SUFDeEMsVUFBVSxDQUFDLGNBQWMsQ0FBQztDQUMzQixDQUFDO0FBQ1csUUFBQSxZQUFZLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVsQyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLEVBQWEsRUFDYixHQUFXLEVBQ1gsSUFBdUIsRUFDUixFQUFFO0lBQ2pCLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxPQUFPLElBQUksWUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ2pFLE1BQU0sSUFBQSw4QkFBYyxFQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsWUFBSSxDQUFDLENBQUM7SUFFcEMsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLFlBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztJQUMzRSxNQUFNLElBQUEsOEJBQWMsRUFBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLGVBQU8sRUFBRSw4QkFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXBELENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBQ3RDLEtBQUssTUFBTSxXQUFXLElBQUksb0JBQVksRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ3BGLE1BQU0sSUFBQSw4QkFBYyxFQUNsQixFQUFFLEVBQ0YsR0FBRyxFQUNILENBQUMsV0FBVyxDQUFDLEVBQ2IsOEJBQU8sQ0FBQyxHQUFHLEVBQ1gsNENBQXFCLENBQUMsS0FBSyxDQUM1QixDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQXhCVyxRQUFBLE9BQU8sV0F3QmxCIn0=