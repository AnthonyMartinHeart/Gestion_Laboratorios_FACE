"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMutatedPackageJson = exports.readRawPackageJson = void 0;
const node_path_1 = __importDefault(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const hook_1 = require("./hook");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readRawPackageJson = async (dir) => fs_extra_1.default.readJson(node_path_1.default.resolve(dir, 'package.json'));
exports.readRawPackageJson = readRawPackageJson;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readMutatedPackageJson = async (dir, forgeConfig) => (0, hook_1.runMutatingHook)(forgeConfig, 'readPackageJson', await (0, exports.readRawPackageJson)(dir));
exports.readMutatedPackageJson = readMutatedPackageJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC1wYWNrYWdlLWpzb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbC9yZWFkLXBhY2thZ2UtanNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwREFBNkI7QUFHN0Isd0RBQTBCO0FBRTFCLGlDQUF5QztBQUV6Qyw4REFBOEQ7QUFDdkQsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLEVBQUUsR0FBVyxFQUFnQixFQUFFLENBQ3BFLGtCQUFFLENBQUMsUUFBUSxDQUFDLG1CQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBRHBDLFFBQUEsa0JBQWtCLHNCQUNrQjtBQUVqRCw4REFBOEQ7QUFDdkQsTUFBTSxzQkFBc0IsR0FBRyxLQUFLLEVBQ3pDLEdBQVcsRUFDWCxXQUFnQyxFQUNsQixFQUFFLENBQ2hCLElBQUEsc0JBQWUsRUFDYixXQUFXLEVBQ1gsaUJBQWlCLEVBQ2pCLE1BQU0sSUFBQSwwQkFBa0IsRUFBQyxHQUFHLENBQUMsQ0FDOUIsQ0FBQztBQVJTLFFBQUEsc0JBQXNCLDBCQVEvQiJ9