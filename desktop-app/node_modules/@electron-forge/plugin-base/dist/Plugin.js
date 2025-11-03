"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginBase = exports.namedHookWithTaskFn = void 0;
class Plugin {
    constructor(config) {
        this.config = config;
        /** @internal */
        this._resolvedHooks = {};
        Object.defineProperty(this, '__isElectronForgePlugin', {
            value: true,
            enumerable: false,
            configurable: false,
        });
    }
    init(_dir, _config) {
        // This logic ensures that we only call getHooks once regardless of how many
        // times we trip hook logic in the PluginInterface.
        this._resolvedHooks = this.getHooks();
        this.getHooks = () => this._resolvedHooks;
    }
    getHooks() {
        return {};
    }
    async startLogic(_startOpts) {
        return false;
    }
}
exports.default = Plugin;
exports.PluginBase = Plugin;
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 *
 * This is a filthy hack around TypeScript to allow internal hooks in our
 * internal plugins to have some level of access to the "Task" that Listr2 runs.
 * Specifically the ability to set a custom task name and receive the task
 *
 * This method is not type-safe internally, but is type-safe for consumers.
 *
 * @internal
 */
const namedHookWithTaskFn = (hookFn, name) => {
    function namedHookWithTaskInner(...args) {
        return hookFn(this, ...args);
    }
    const fn = namedHookWithTaskInner;
    fn.__hookName = name;
    return fn;
};
exports.namedHookWithTaskFn = namedHookWithTaskFn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1BsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFhQSxNQUE4QixNQUFNO0lBUWxDLFlBQW1CLE1BQVM7UUFBVCxXQUFNLEdBQU4sTUFBTSxDQUFHO1FBSDVCLGdCQUFnQjtRQUNoQixtQkFBYyxHQUFzQixFQUFFLENBQUM7UUFHckMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDckQsS0FBSyxFQUFFLElBQUk7WUFDWCxVQUFVLEVBQUUsS0FBSztZQUNqQixZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVksRUFBRSxPQUE0QjtRQUM3Qyw0RUFBNEU7UUFDNUUsbURBQW1EO1FBQ25ELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBd0I7UUFDdkMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUE5QkQseUJBOEJDO0FBZ0NrQiw0QkFBVTtBQTlCN0IsdURBQXVEO0FBQ3ZEOzs7Ozs7Ozs7R0FTRztBQUNJLE1BQU0sbUJBQW1CLEdBQUcsQ0FDakMsTUFHa0MsRUFDbEMsSUFBWSxFQUNPLEVBQUU7SUFDckIsU0FBUyxzQkFBc0IsQ0FFN0IsR0FBRyxJQUFXO1FBRWQsT0FBUSxNQUFjLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUNELE1BQU0sRUFBRSxHQUFHLHNCQUE2QixDQUFDO0lBQ3pDLEVBQUUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLE9BQU8sRUFBRSxDQUFDO0FBQ1osQ0FBQyxDQUFDO0FBaEJXLFFBQUEsbUJBQW1CLHVCQWdCOUIifQ==