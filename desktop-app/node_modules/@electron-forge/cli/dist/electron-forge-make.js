"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMakeOptions = void 0;
const get_1 = require("@electron/get");
const core_1 = require("@electron-forge/core");
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
require("./util/terminate");
const package_json_1 = __importDefault(require("../package.json"));
const resolve_working_dir_1 = require("./util/resolve-working-dir");
async function getMakeOptions() {
    let workingDir;
    commander_1.program
        .version(package_json_1.default.version, '-V, --version', 'Output the current version.')
        .helpOption('-h, --help', 'Output usage information.')
        .argument('[dir]', 'Directory to run the command in. (default: current directory)')
        .option('--skip-package', `Skip packaging the Electron application, and use the output from a previous ${chalk_1.default.green('package')} run instead.`)
        .option('-a, --arch [arch]', 'Target build architecture.', process.arch)
        .option('-p, --platform [platform]', 'Target build platform.', process.platform)
        .option('--targets [targets]', `Override your ${chalk_1.default.green('make')} targets for this run.`)
        .allowUnknownOption(true)
        .action((dir) => {
        workingDir = (0, resolve_working_dir_1.resolveWorkingDir)(dir, false);
    })
        .parse(process.argv);
    const options = commander_1.program.opts();
    const makeOpts = {
        dir: workingDir,
        interactive: true,
        skipPackage: options.skipPackage,
    };
    if (options.targets)
        makeOpts.overrideTargets = options.targets.split(',');
    if (options.arch)
        makeOpts.arch = options.arch;
    if (options.platform)
        makeOpts.platform = options.platform;
    return makeOpts;
}
exports.getMakeOptions = getMakeOptions;
if (require.main === module) {
    (async () => {
        const makeOpts = await getMakeOptions();
        (0, get_1.initializeProxy)();
        await core_1.api.make(makeOpts);
    })();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24tZm9yZ2UtbWFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbGVjdHJvbi1mb3JnZS1tYWtlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHVDQUFnRDtBQUNoRCwrQ0FBd0Q7QUFDeEQsa0RBQTBCO0FBQzFCLHlDQUFvQztBQUVwQyw0QkFBMEI7QUFDMUIsbUVBQTBDO0FBRTFDLG9FQUErRDtBQUV4RCxLQUFLLFVBQVUsY0FBYztJQUNsQyxJQUFJLFVBQWtCLENBQUM7SUFDdkIsbUJBQU87U0FDSixPQUFPLENBQ04sc0JBQVcsQ0FBQyxPQUFPLEVBQ25CLGVBQWUsRUFDZiw2QkFBNkIsQ0FDOUI7U0FDQSxVQUFVLENBQUMsWUFBWSxFQUFFLDJCQUEyQixDQUFDO1NBQ3JELFFBQVEsQ0FDUCxPQUFPLEVBQ1AsK0RBQStELENBQ2hFO1NBQ0EsTUFBTSxDQUNMLGdCQUFnQixFQUNoQiwrRUFBK0UsZUFBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUNySDtTQUNBLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSw0QkFBNEIsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDO1NBQ3ZFLE1BQU0sQ0FDTCwyQkFBMkIsRUFDM0Isd0JBQXdCLEVBQ3hCLE9BQU8sQ0FBQyxRQUFRLENBQ2pCO1NBQ0EsTUFBTSxDQUNMLHFCQUFxQixFQUNyQixpQkFBaUIsZUFBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQzdEO1NBQ0Esa0JBQWtCLENBQUMsSUFBSSxDQUFDO1NBQ3hCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ2QsVUFBVSxHQUFHLElBQUEsdUNBQWlCLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQztTQUNELEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFdkIsTUFBTSxPQUFPLEdBQUcsbUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUUvQixNQUFNLFFBQVEsR0FBZ0I7UUFDNUIsR0FBRyxFQUFFLFVBQVc7UUFDaEIsV0FBVyxFQUFFLElBQUk7UUFDakIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO0tBQ2pDLENBQUM7SUFDRixJQUFJLE9BQU8sQ0FBQyxPQUFPO1FBQUUsUUFBUSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzRSxJQUFJLE9BQU8sQ0FBQyxJQUFJO1FBQUUsUUFBUSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBQy9DLElBQUksT0FBTyxDQUFDLFFBQVE7UUFBRSxRQUFRLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFM0QsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQTdDRCx3Q0E2Q0M7QUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNWLE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBYyxFQUFFLENBQUM7UUFFeEMsSUFBQSxxQkFBZSxHQUFFLENBQUM7UUFFbEIsTUFBTSxVQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDUCxDQUFDIn0=