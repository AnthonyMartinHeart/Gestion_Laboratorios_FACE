"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_1 = require("@electron/get");
const core_1 = require("@electron-forge/core");
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
require("./util/terminate");
const package_json_1 = __importDefault(require("../package.json"));
const electron_forge_make_1 = require("./electron-forge-make");
const resolve_working_dir_1 = require("./util/resolve-working-dir");
commander_1.program
    .version(package_json_1.default.version, '-V, --version', 'Output the current version.')
    .helpOption('-h, --help', 'Output usage information.')
    .argument('[dir]', 'Directory to run the command in. (default: current directory)')
    .option('--target [target[,target...]]', 'A comma-separated list of deployment targets. (default: all publishers in your Forge config)')
    .option('--dry-run', `Run the ${chalk_1.default.green('make')} command and save publish metadata without uploading anything.`)
    .option('--from-dry-run', 'Publish artifacts from the last saved dry run.')
    .allowUnknownOption(true)
    .action(async (targetDir) => {
    const dir = (0, resolve_working_dir_1.resolveWorkingDir)(targetDir);
    const options = commander_1.program.opts();
    (0, get_1.initializeProxy)();
    const publishOpts = {
        dir,
        interactive: true,
        dryRun: options.dryRun,
        dryRunResume: options.fromDryRun,
    };
    if (options.target)
        publishOpts.publishTargets = options.target.split(',');
    publishOpts.makeOptions = await (0, electron_forge_make_1.getMakeOptions)();
    await core_1.api.publish(publishOpts);
})
    .parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24tZm9yZ2UtcHVibGlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbGVjdHJvbi1mb3JnZS1wdWJsaXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsdUNBQWdEO0FBQ2hELCtDQUEyRDtBQUMzRCxrREFBMEI7QUFDMUIseUNBQW9DO0FBRXBDLDRCQUEwQjtBQUMxQixtRUFBMEM7QUFFMUMsK0RBQXVEO0FBQ3ZELG9FQUErRDtBQUUvRCxtQkFBTztLQUNKLE9BQU8sQ0FBQyxzQkFBVyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsNkJBQTZCLENBQUM7S0FDNUUsVUFBVSxDQUFDLFlBQVksRUFBRSwyQkFBMkIsQ0FBQztLQUNyRCxRQUFRLENBQ1AsT0FBTyxFQUNQLCtEQUErRCxDQUNoRTtLQUNBLE1BQU0sQ0FDTCwrQkFBK0IsRUFDL0IsOEZBQThGLENBQy9GO0tBQ0EsTUFBTSxDQUNMLFdBQVcsRUFDWCxXQUFXLGVBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGdFQUFnRSxDQUMvRjtLQUNBLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxnREFBZ0QsQ0FBQztLQUMxRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7S0FDeEIsTUFBTSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtJQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFBLHVDQUFpQixFQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sT0FBTyxHQUFHLG1CQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFL0IsSUFBQSxxQkFBZSxHQUFFLENBQUM7SUFFbEIsTUFBTSxXQUFXLEdBQW1CO1FBQ2xDLEdBQUc7UUFDSCxXQUFXLEVBQUUsSUFBSTtRQUNqQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07UUFDdEIsWUFBWSxFQUFFLE9BQU8sQ0FBQyxVQUFVO0tBQ2pDLENBQUM7SUFDRixJQUFJLE9BQU8sQ0FBQyxNQUFNO1FBQUUsV0FBVyxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUUzRSxXQUFXLENBQUMsV0FBVyxHQUFHLE1BQU0sSUFBQSxvQ0FBYyxHQUFFLENBQUM7SUFFakQsTUFBTSxVQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQztLQUNELEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMifQ==