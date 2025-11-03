"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMutatingHook = exports.getHookListrTasks = exports.runHook = void 0;
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const d = (0, debug_1.default)('electron-forge:hook');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runHook = async (forgeConfig, hookName, ...hookArgs) => {
    const { hooks } = forgeConfig;
    if (hooks) {
        d(`hook triggered: ${hookName}`);
        if (typeof hooks[hookName] === 'function') {
            d('calling hook:', hookName, 'with args:', hookArgs);
            await hooks[hookName](forgeConfig, ...hookArgs);
        }
    }
    await forgeConfig.pluginInterface.triggerHook(hookName, hookArgs);
};
exports.runHook = runHook;
const getHookListrTasks = async (childTrace, forgeConfig, hookName, ...hookArgs) => {
    const { hooks } = forgeConfig;
    const tasks = [];
    if (hooks) {
        d(`hook triggered: ${hookName}`);
        if (typeof hooks[hookName] === 'function') {
            d('calling hook:', hookName, 'with args:', hookArgs);
            tasks.push({
                title: `Running ${chalk_1.default.yellow(hookName)} hook from forgeConfig`,
                task: childTrace({
                    name: 'forge-config-hook',
                    category: '@electron-forge/hooks',
                    extraDetails: { hook: hookName },
                }, async () => {
                    await hooks[hookName](forgeConfig, ...hookArgs);
                }),
            });
        }
    }
    tasks.push(...(await forgeConfig.pluginInterface.getHookListrTasks(childTrace, hookName, hookArgs)));
    return tasks;
};
exports.getHookListrTasks = getHookListrTasks;
async function runMutatingHook(forgeConfig, hookName, ...item) {
    const { hooks } = forgeConfig;
    if (hooks) {
        d(`hook triggered: ${hookName}`);
        if (typeof hooks[hookName] === 'function') {
            d('calling mutating hook:', hookName, 'with item:', item[0]);
            const hook = hooks[hookName];
            const result = await hook(forgeConfig, ...item);
            if (typeof result !== 'undefined') {
                item[0] = result;
            }
        }
    }
    return forgeConfig.pluginInterface.triggerMutatingHook(hookName, item[0]);
}
exports.runMutatingHook = runMutatingHook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2hvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBU0Esa0RBQTBCO0FBQzFCLGtEQUEwQjtBQUUxQixNQUFNLENBQUMsR0FBRyxJQUFBLGVBQUssRUFBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRXZDLDhEQUE4RDtBQUN2RCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLFdBQWdDLEVBQ2hDLFFBQWMsRUFDZCxHQUFHLFFBQXlDLEVBQzdCLEVBQUU7SUFDakIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLFdBQVcsQ0FBQztJQUM5QixJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1YsQ0FBQyxDQUFDLG1CQUFtQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDMUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELE1BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBNkIsQ0FDaEQsV0FBVyxFQUNYLEdBQUcsUUFBUSxDQUNaLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUNELE1BQU0sV0FBVyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3BFLENBQUMsQ0FBQztBQWpCVyxRQUFBLE9BQU8sV0FpQmxCO0FBRUssTUFBTSxpQkFBaUIsR0FBRyxLQUFLLEVBR3BDLFVBQTRCLEVBQzVCLFdBQWdDLEVBQ2hDLFFBQWMsRUFDZCxHQUFHLFFBQXlDLEVBQ1AsRUFBRTtJQUN2QyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsV0FBVyxDQUFDO0lBQzlCLE1BQU0sS0FBSyxHQUErQixFQUFFLENBQUM7SUFDN0MsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNWLENBQUMsQ0FBQyxtQkFBbUIsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyRCxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNULEtBQUssRUFBRSxXQUFXLGVBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHdCQUF3QjtnQkFDaEUsSUFBSSxFQUFFLFVBQVUsQ0FDZDtvQkFDRSxJQUFJLEVBQUUsbUJBQW1CO29CQUN6QixRQUFRLEVBQUUsdUJBQXVCO29CQUNqQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO2lCQUNqQyxFQUNELEtBQUssSUFBSSxFQUFFO29CQUNULE1BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBNkIsQ0FDaEQsV0FBVyxFQUNYLEdBQUcsUUFBUSxDQUNaLENBQUM7Z0JBQ0osQ0FBQyxDQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUM7SUFDRCxLQUFLLENBQUMsSUFBSSxDQUNSLEdBQUcsQ0FBQyxNQUFNLFdBQVcsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQ3JELFVBQVUsRUFDVixRQUFRLEVBQ1IsUUFBUSxDQUNULENBQUMsQ0FDSCxDQUFDO0lBQ0YsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDLENBQUM7QUF4Q1csUUFBQSxpQkFBaUIscUJBd0M1QjtBQUVLLEtBQUssVUFBVSxlQUFlLENBR25DLFdBQWdDLEVBQ2hDLFFBQWMsRUFDZCxHQUFHLElBQXVDO0lBRTFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxXQUFXLENBQUM7SUFDOUIsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNWLENBQUMsQ0FBQyxtQkFBbUIsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzFDLENBQUMsQ0FBQyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQThCLENBQUM7WUFDMUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDaEQsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztZQUNuQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLFdBQVcsQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFwQkQsMENBb0JDIn0=