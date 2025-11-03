"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
function redConsoleError(msg) {
    console.error(chalk_1.default.red(msg));
}
process.on('unhandledRejection', (reason, promise) => {
    redConsoleError('\nAn unhandled rejection has occurred inside Forge:');
    redConsoleError(reason.toString().trim());
    promise.catch((err) => {
        if ('stack' in err) {
            const usefulStack = err.stack;
            if (usefulStack?.startsWith(reason.toString().trim())) {
                redConsoleError(usefulStack.substring(reason.toString().trim().length + 1).trim());
            }
        }
        process.exit(1);
    });
});
process.on('uncaughtException', (err) => {
    if (err && err.message && err.stack) {
        redConsoleError('\nAn unhandled exception has occurred inside Forge:');
        redConsoleError(err.message);
        redConsoleError(err.stack);
    }
    else {
        redConsoleError('\nElectron Forge was terminated:');
        redConsoleError(typeof err === 'string' ? err : JSON.stringify(err));
    }
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvdGVybWluYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsa0RBQTBCO0FBRTFCLFNBQVMsZUFBZSxDQUFDLEdBQVc7SUFDbEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUVELE9BQU8sQ0FBQyxFQUFFLENBQ1Isb0JBQW9CLEVBQ3BCLENBQUMsTUFBYyxFQUFFLE9BQXlCLEVBQUUsRUFBRTtJQUM1QyxlQUFlLENBQUMscURBQXFELENBQUMsQ0FBQztJQUN2RSxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDMUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFO1FBQzNCLElBQUksT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ25CLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDOUIsSUFBSSxXQUFXLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RELGVBQWUsQ0FDYixXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQ2xFLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQ0YsQ0FBQztBQUVGLE9BQU8sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUN0QyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQyxlQUFlLENBQUMscURBQXFELENBQUMsQ0FBQztRQUN2RSxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdCLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztTQUFNLENBQUM7UUFDTixlQUFlLENBQUMsa0NBQWtDLENBQUMsQ0FBQztRQUNwRCxlQUFlLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyJ9