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
exports.autoTrace = exports.delayTraceTillSignal = void 0;
const fs = __importStar(require("node:fs"));
const chrome_trace_event_1 = require("chrome-trace-event");
const store = global;
store._forgeTracer = store._forgeTracer || {
    tracer: new chrome_trace_event_1.Tracer(),
    traceIdCounter: 1,
};
const forgeTracer = store._forgeTracer;
if (process.env.ELECTRON_FORGE_TRACE_FILE) {
    store._forgeTracer.pipe(fs.createWriteStream(process.env.ELECTRON_FORGE_TRACE_FILE));
}
else {
    store._forgeTracer = null;
}
const nextRoot = () => `forge-auto-trace-root-${forgeTracer.traceIdCounter++}`;
function _autoTrace(tracer, autoTraceId, opts, fn) {
    return (async (...args) => {
        const traceArgs = {
            id: autoTraceId,
            name: opts.name,
            cat: [opts.category],
            args: opts.extraDetails,
            tid: autoTraceId.split('-')[autoTraceId.split('-').length - 1],
        };
        tracer?.begin(traceArgs);
        const childTrace = (opts, fn) => {
            return _autoTrace(tracer?.child(traceArgs) ?? null, opts.newRoot ? nextRoot() : autoTraceId, opts, fn);
        };
        childTrace._autoEnd = true;
        childTrace._end = () => tracer?.end(traceArgs);
        try {
            return await Promise.resolve(fn(childTrace, ...args));
        }
        finally {
            if (childTrace._autoEnd) {
                childTrace._end();
            }
        }
    });
}
function delayTraceTillSignal(trace, signaller, signal) {
    const original = signaller[signal];
    trace._autoEnd = false;
    signaller[signal] = function (...args) {
        const result = original.call(signaller, ...args);
        if (typeof result === 'object' && result.then && result.catch) {
            result
                .then(() => trace._end())
                .catch(() => trace._end());
        }
        else {
            trace._end();
        }
        return result;
    };
    return signaller;
}
exports.delayTraceTillSignal = delayTraceTillSignal;
function autoTrace(opts, fn) {
    return _autoTrace(forgeTracer.tracer, nextRoot(), opts, fn);
}
exports.autoTrace = autoTrace;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0Q0FBOEI7QUFFOUIsMkRBQW9EO0FBRXBELE1BQU0sS0FBSyxHQUFHLE1BQWEsQ0FBQztBQUM1QixLQUFLLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLElBQUk7SUFDekMsTUFBTSxFQUFFLElBQUksMkJBQU0sRUFBRTtJQUNwQixjQUFjLEVBQUUsQ0FBQztDQUNsQixDQUFDO0FBQ0YsTUFBTSxXQUFXLEdBR2IsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUV2QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsQ0FBQztJQUMxQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDckIsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FDNUQsQ0FBQztBQUNKLENBQUM7S0FBTSxDQUFDO0lBQ04sS0FBSyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDNUIsQ0FBQztBQUVELE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRSxDQUFDLHlCQUF5QixXQUFXLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQztBQVMvRSxTQUFTLFVBQVUsQ0FDakIsTUFBcUIsRUFDckIsV0FBbUIsRUFDbkIsSUFBa0IsRUFDbEIsRUFBc0Q7SUFFdEQsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLElBQVUsRUFBRSxFQUFFO1FBQzlCLE1BQU0sU0FBUyxHQUFXO1lBQ3hCLEVBQUUsRUFBRSxXQUFXO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNwQixJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDdkIsR0FBRyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBQy9ELENBQUM7UUFDRixNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBa0IsRUFBRSxFQUFPLEVBQUUsRUFBRTtZQUNqRCxPQUFPLFVBQVUsQ0FDZixNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksRUFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFDdkMsSUFBSSxFQUNKLEVBQUUsQ0FDSCxDQUFDO1FBQ0osQ0FBQyxDQUFDO1FBQ0QsVUFBa0IsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ25DLFVBQWtCLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDO1lBQ0gsT0FBTyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQWlCLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7Z0JBQVMsQ0FBQztZQUNULElBQUssVUFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsVUFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM3QixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUMsQ0FBUSxDQUFDO0FBQ1osQ0FBQztBQUVELFNBQWdCLG9CQUFvQixDQUNsQyxLQUF1QixFQUN2QixTQUFZLEVBQ1osTUFBUztJQUVULE1BQU0sUUFBUSxHQUFRLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxLQUFhLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNoQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxHQUFHLElBQVc7UUFDMUMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNqRCxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5RCxNQUFNO2lCQUNILElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBRSxLQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7aUJBQ2pDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBRSxLQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDO2FBQU0sQ0FBQztZQUNMLEtBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBUSxDQUFDO0lBQ1QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQW5CRCxvREFtQkM7QUFFRCxTQUFnQixTQUFTLENBQ3ZCLElBQWtCLEVBQ2xCLEVBQXNEO0lBRXRELE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQVMsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFMRCw4QkFLQyJ9