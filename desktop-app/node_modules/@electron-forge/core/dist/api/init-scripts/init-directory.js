"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDirectory = void 0;
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const log_symbols_1 = __importDefault(require("log-symbols"));
const d = (0, debug_1.default)('electron-forge:init:directory');
const initDirectory = async (dir, task, force = false) => {
    d('creating directory:', dir);
    await fs_extra_1.default.mkdirs(dir);
    const files = await fs_extra_1.default.readdir(dir);
    if (files.length !== 0) {
        d(`found ${files.length} files in the directory.  warning the user`);
        if (force) {
            task.output = `${log_symbols_1.default.warning} The specified path "${dir}" is not empty. "force" was set to true, so proceeding to initialize. Files may be overwritten`;
        }
        else {
            throw new Error(`The specified path: "${dir}" is not empty.  Please ensure it is empty before initializing a new project`);
        }
    }
};
exports.initDirectory = initDirectory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC1kaXJlY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL2luaXQtc2NyaXB0cy9pbml0LWRpcmVjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxrREFBMEI7QUFDMUIsd0RBQTBCO0FBQzFCLDhEQUFxQztBQUVyQyxNQUFNLENBQUMsR0FBRyxJQUFBLGVBQUssRUFBQywrQkFBK0IsQ0FBQyxDQUFDO0FBRTFDLE1BQU0sYUFBYSxHQUFHLEtBQUssRUFDaEMsR0FBVyxFQUNYLElBQXlCLEVBQ3pCLEtBQUssR0FBRyxLQUFLLEVBQ0UsRUFBRTtJQUNqQixDQUFDLENBQUMscUJBQXFCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUIsTUFBTSxrQkFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVyQixNQUFNLEtBQUssR0FBRyxNQUFNLGtCQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsTUFBTSw0Q0FBNEMsQ0FBQyxDQUFDO1FBRXJFLElBQUksS0FBSyxFQUFFLENBQUM7WUFDVixJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcscUJBQVUsQ0FBQyxPQUFPLHdCQUF3QixHQUFHLGdHQUFnRyxDQUFDO1FBQ2pLLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxJQUFJLEtBQUssQ0FDYix3QkFBd0IsR0FBRyw4RUFBOEUsQ0FDMUcsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBcEJXLFFBQUEsYUFBYSxpQkFvQnhCIn0=