"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.api = exports.ForgeUtils = exports.ForgeAPI = void 0;
// eslint-disable-next-line n/no-missing-import
const util_1 = __importDefault(require("../util"));
exports.ForgeUtils = util_1.default;
const import_1 = __importDefault(require("./import"));
const init_1 = __importDefault(require("./init"));
const make_1 = __importDefault(require("./make"));
const package_1 = __importDefault(require("./package"));
const publish_1 = __importDefault(require("./publish"));
const start_1 = __importDefault(require("./start"));
class ForgeAPI {
    /**
     * Attempt to import a given module directory to the Electron Forge standard.
     *
     * * Sets up `git` and the correct NPM dependencies
     * * Adds a template forge config to `package.json`
     */
    import(opts) {
        return (0, import_1.default)(opts);
    }
    /**
     * Initialize a new Electron Forge template project in the given directory.
     */
    init(opts) {
        return (0, init_1.default)(opts);
    }
    /**
     * Make distributables for an Electron application
     */
    make(opts) {
        return (0, make_1.default)(opts);
    }
    /**
     * Resolves hooks if they are a path to a file (instead of a `Function`)
     */
    async package(opts) {
        await (0, package_1.default)(opts);
    }
    /**
     * Publish an Electron application into the given target service
     */
    publish(opts) {
        return (0, publish_1.default)(opts);
    }
    /**
     * Start an Electron application.
     *
     * Handles things like native module rebuilding for you on the fly
     */
    start(opts) {
        return (0, start_1.default)(opts);
    }
}
exports.ForgeAPI = ForgeAPI;
const api = new ForgeAPI();
exports.api = api;
const utils = new util_1.default();
exports.utils = utils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXBpL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLCtDQUErQztBQUMvQyxtREFBaUM7QUFnRS9CLHFCQWhFSyxjQUFVLENBZ0VMO0FBOURaLHNEQUFrRDtBQUNsRCxrREFBMkM7QUFDM0Msa0RBQTJDO0FBQzNDLHdEQUFxRDtBQUNyRCx3REFBb0Q7QUFDcEQsb0RBQThDO0FBRTlDLE1BQWEsUUFBUTtJQUNuQjs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxJQUFtQjtRQUN4QixPQUFPLElBQUEsZ0JBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLENBQUMsSUFBaUI7UUFDcEIsT0FBTyxJQUFBLGNBQUksRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLENBQUMsSUFBaUI7UUFDcEIsT0FBTyxJQUFBLGNBQUksRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQW9CO1FBQ2hDLE1BQU0sSUFBQSxpQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU8sQ0FBQyxJQUFvQjtRQUMxQixPQUFPLElBQUEsaUJBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFrQjtRQUN0QixPQUFPLElBQUEsZUFBSyxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQS9DRCw0QkErQ0M7QUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO0FBYXpCLGtCQUFHO0FBWkwsTUFBTSxLQUFLLEdBQUcsSUFBSSxjQUFVLEVBQUUsQ0FBQztBQWE3QixzQkFBSyJ9