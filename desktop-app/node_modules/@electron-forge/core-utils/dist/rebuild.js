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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listrCompatibleRebuildHook = void 0;
const cp = __importStar(require("node:child_process"));
const path = __importStar(require("node:path"));
const listrCompatibleRebuildHook = async (buildPath, electronVersion, platform, arch, config = {}, task, taskTitlePrefix = '') => {
    task.title = `${taskTitlePrefix}Preparing native dependencies`;
    const options = {
        ...config,
        buildPath,
        electronVersion,
        arch,
    };
    const child = cp.fork(path.resolve(__dirname, 'remote-rebuild.js'), [JSON.stringify(options)], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    let pendingError;
    let found = 0;
    let done = 0;
    const redraw = () => {
        task.title = `${taskTitlePrefix}Preparing native dependencies: ${done} / ${found}`;
    };
    child.stdout?.on('data', (chunk) => {
        task.output = chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
        task.output = chunk.toString();
    });
    child.on('message', (message) => {
        switch (message.msg) {
            case 'module-found': {
                found += 1;
                redraw();
                break;
            }
            case 'module-done': {
                done += 1;
                redraw();
                break;
            }
            case 'rebuild-error': {
                pendingError = new Error(message.err.message);
                pendingError.stack = message.err.stack;
                break;
            }
            case 'rebuild-done': {
                if (task.task.rendererTaskOptions &&
                    'persistentOutput' in task.task.rendererTaskOptions) {
                    task.task.rendererTaskOptions.persistentOutput = false;
                }
                break;
            }
        }
    });
    await new Promise((resolve, reject) => {
        child.on('exit', (code) => {
            if (code === 0 && !pendingError) {
                resolve();
            }
            else {
                reject(pendingError || new Error(`Rebuilder failed with exit code: ${code}`));
            }
        });
    });
};
exports.listrCompatibleRebuildHook = listrCompatibleRebuildHook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVidWlsZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZWJ1aWxkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlDO0FBQ3pDLGdEQUFrQztBQVMzQixNQUFNLDBCQUEwQixHQUFHLEtBQUssRUFDN0MsU0FBaUIsRUFDakIsZUFBdUIsRUFDdkIsUUFBdUIsRUFDdkIsSUFBZSxFQUNmLFNBQWtDLEVBQUUsRUFDcEMsSUFBeUIsRUFDekIsZUFBZSxHQUFHLEVBQUUsRUFDTCxFQUFFO0lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxlQUFlLCtCQUErQixDQUFDO0lBRS9ELE1BQU0sT0FBTyxHQUFtQjtRQUM5QixHQUFHLE1BQU07UUFDVCxTQUFTO1FBQ1QsZUFBZTtRQUNmLElBQUk7S0FDTCxDQUFDO0lBRUYsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsRUFDNUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ3pCO1FBQ0UsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDO0tBQ3ZDLENBQ0YsQ0FBQztJQUVGLElBQUksWUFBbUIsQ0FBQztJQUN4QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7SUFFYixNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLGVBQWUsa0NBQWtDLElBQUksTUFBTSxLQUFLLEVBQUUsQ0FBQztJQUNyRixDQUFDLENBQUM7SUFFRixLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNqQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNILEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLEVBQUUsQ0FDTixTQUFTLEVBQ1QsQ0FBQyxPQUFpRSxFQUFFLEVBQUU7UUFDcEUsUUFBUSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDcEIsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixLQUFLLElBQUksQ0FBQyxDQUFDO2dCQUNYLE1BQU0sRUFBRSxDQUFDO2dCQUNULE1BQU07WUFDUixDQUFDO1lBQ0QsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUNWLE1BQU0sRUFBRSxDQUFDO2dCQUNULE1BQU07WUFDUixDQUFDO1lBQ0QsS0FBSyxlQUFlLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixZQUFZLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUMsWUFBWSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztnQkFDdkMsTUFBTTtZQUNSLENBQUM7WUFDRCxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLElBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUI7b0JBQzdCLGtCQUFrQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQ25ELENBQUM7b0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7Z0JBQ3pELENBQUM7Z0JBQ0QsTUFBTTtZQUNSLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQyxDQUNGLENBQUM7SUFFRixNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQzFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDeEIsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE1BQU0sQ0FDSixZQUFZLElBQUksSUFBSSxLQUFLLENBQUMsb0NBQW9DLElBQUksRUFBRSxDQUFDLENBQ3RFLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQXBGVyxRQUFBLDBCQUEwQiw4QkFvRnJDIn0=