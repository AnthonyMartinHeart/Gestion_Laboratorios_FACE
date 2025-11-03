"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@electron-forge/core");
const commander_1 = require("commander");
require("./util/terminate");
const package_json_1 = __importDefault(require("../package.json"));
const resolve_working_dir_1 = require("./util/resolve-working-dir");
(async () => {
    let commandArgs = process.argv;
    let appArgs;
    const doubleDashIndex = process.argv.indexOf('--');
    if (doubleDashIndex !== -1) {
        commandArgs = process.argv.slice(0, doubleDashIndex);
        appArgs = process.argv.slice(doubleDashIndex + 1);
    }
    let dir;
    commander_1.program
        .version(package_json_1.default.version, '-V, --version', 'Output the current version.')
        .helpOption('-h, --help', 'Output usage information.')
        .argument('[dir]', 'Directory to run the command in. (default: current directory)')
        .option('-p, --app-path <path>', 'Path to the Electron app to launch. (default: current directory)')
        .option('-l, --enable-logging', 'Enable internal Electron logging.')
        .option('-n, --run-as-node', 'Run the Electron app as a Node.JS script.')
        .addOption(new commander_1.Option('--vscode').hideHelp()) // Used to enable arg transformation for debugging Electron through VSCode. Hidden from users.
        .option('-i, --inspect-electron', 'Run Electron in inspect mode to allow debugging the main process.')
        .option('--inspect-brk-electron', 'Run Electron in inspect-brk mode to allow debugging the main process.')
        .addHelpText('after', `
      Any arguments found after "--" will be passed to the Electron app. For example...
      
          $ npx electron-forge start /path/to/project --enable-logging -- -d -f foo.txt
                                    
      ...will pass the arguments "-d -f foo.txt" to the Electron app.`)
        .action((targetDir) => {
        dir = (0, resolve_working_dir_1.resolveWorkingDir)(targetDir);
    })
        .parse(commandArgs);
    const options = commander_1.program.opts();
    const opts = {
        dir,
        interactive: true,
        enableLogging: !!options.enableLogging,
        runAsNode: !!options.runAsNode,
        inspect: !!options.inspectElectron,
        inspectBrk: !!options.inspectBrkElectron,
    };
    if (options.vscode && appArgs) {
        // Args are in the format ~arg~ so we need to strip the "~"
        appArgs = appArgs
            .map((arg) => arg.substr(1, arg.length - 2))
            .filter((arg) => arg.length > 0);
    }
    if (options.appPath)
        opts.appPath = options.appPath;
    if (appArgs)
        opts.args = appArgs;
    const spawned = await core_1.api.start(opts);
    await new Promise((resolve) => {
        const listenForExit = (child) => {
            // Why: changing to const causes TypeScript compilation to fail.
            /* eslint-disable prefer-const */
            let onExit;
            let onRestart;
            /* eslint-enable prefer-const */
            const removeListeners = () => {
                child.removeListener('exit', onExit);
                child.removeListener('restarted', onRestart);
            };
            onExit = (code) => {
                removeListeners();
                if (spawned.restarted)
                    return;
                if (code !== 0) {
                    process.exit(code);
                }
                resolve();
            };
            onRestart = (newChild) => {
                removeListeners();
                listenForExit(newChild);
            };
            child.on('exit', onExit);
            child.on('restarted', onRestart);
        };
        listenForExit(spawned);
    });
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24tZm9yZ2Utc3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZWxlY3Ryb24tZm9yZ2Utc3RhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQ0FBeUQ7QUFFekQseUNBQTRDO0FBRTVDLDRCQUEwQjtBQUMxQixtRUFBMEM7QUFFMUMsb0VBQStEO0FBRS9ELENBQUMsS0FBSyxJQUFJLEVBQUU7SUFDVixJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBQy9CLElBQUksT0FBTyxDQUFDO0lBRVosTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkQsSUFBSSxlQUFlLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUMzQixXQUFXLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3JELE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELElBQUksR0FBRyxDQUFDO0lBQ1IsbUJBQU87U0FDSixPQUFPLENBQ04sc0JBQVcsQ0FBQyxPQUFPLEVBQ25CLGVBQWUsRUFDZiw2QkFBNkIsQ0FDOUI7U0FDQSxVQUFVLENBQUMsWUFBWSxFQUFFLDJCQUEyQixDQUFDO1NBQ3JELFFBQVEsQ0FDUCxPQUFPLEVBQ1AsK0RBQStELENBQ2hFO1NBQ0EsTUFBTSxDQUNMLHVCQUF1QixFQUN2QixrRUFBa0UsQ0FDbkU7U0FDQSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsbUNBQW1DLENBQUM7U0FDbkUsTUFBTSxDQUFDLG1CQUFtQixFQUFFLDJDQUEyQyxDQUFDO1NBQ3hFLFNBQVMsQ0FBQyxJQUFJLGtCQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyw4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