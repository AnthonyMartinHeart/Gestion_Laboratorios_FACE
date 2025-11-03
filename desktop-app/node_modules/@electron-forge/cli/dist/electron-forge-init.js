"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const core_1 = require("@electron-forge/core");
const prompts_1 = require("@inquirer/prompts");
const prompt_adapter_inquirer_1 = require("@listr2/prompt-adapter-inquirer");
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const listr2_1 = require("listr2");
require("./util/terminate");
const package_json_1 = __importDefault(require("../package.json"));
const resolve_working_dir_1 = require("./util/resolve-working-dir");
commander_1.program
    .version(package_json_1.default.version, '-V, --version', 'Output the current version.')
    .helpOption('-h, --help', 'Output usage information.')
    .argument('[dir]', 'Directory to initialize the project in. Defaults to the current directory.')
    .option('-t, --template [name]', 'Name of the Forge template to use.')
    .option('-c, --copy-ci-files', 'Whether to copy the templated CI files.')
    .option('-f, --force', 'Whether to overwrite an existing directory.')
    .option('--skip-git', 'Skip initializing a git repository in the initialized project.')
    .action(async (dir) => {
    const options = commander_1.program.opts();
    const tasks = new listr2_1.Listr([
        {
            task: async (initOpts) => {
                initOpts.interactive = true;
                initOpts.template = options.template ?? 'base';
                initOpts.copyCIFiles = Boolean(options.copyCiFiles);
                initOpts.force = Boolean(options.force);
                initOpts.skipGit = Boolean(options.skipGit);
                initOpts.dir = (0, resolve_working_dir_1.resolveWorkingDir)(dir, false);
            },
        },
        {
            task: async (initOpts, task) => {
                // only run interactive prompts if no args passed and not in CI environment
                if (Object.keys(options).length > 0 ||
                    process.env.CI ||
                    !process.stdout.isTTY) {
                    return;
                }
                const prompt = task.prompt(prompt_adapter_inquirer_1.ListrInquirerPromptAdapter);
                if (typeof initOpts.dir === 'string' &&
                    node_fs_1.default.existsSync(initOpts.dir) &&
                    (await node_fs_1.default.promises.readdir(initOpts.dir)).length > 0) {
                    const confirmResult = await prompt.run(prompts_1.confirm, {
                        message: `${chalk_1.default.cyan(initOpts.dir)} is not empty. Would you like to continue and overwrite existing files?`,
                        default: false,
                    });
                    if (confirmResult) {
                        initOpts.force = true;
                    }
                    else {
                        task.output = 'Directory is not empty. Exiting.';
                        process.exit(0);
                    }
                }
                const bundler = await prompt.run(prompts_1.select, {
                    message: 'Select a bundler',
                    choices: [
                        {
                            name: 'None',
                            value: 'base',
                        },
                        {
                            name: 'Vite',
                            value: 'vite',
                        },
                        {
                            name: 'webpack',
                            value: 'webpack',
                        },
                    ],
                });
                let language;
                if (bundler !== 'base') {
                    language = await prompt.run(prompts_1.select, {
                        message: 'Select a programming language',
                        choices: [
                            {
                                name: 'JavaScript',
                                value: undefined,
                            },
                            {
                                name: 'TypeScript',
                                value: 'typescript',
                            },
                        ],
                    });
                }
                initOpts.template = `${bundler}${language ? `-${language}` : ''}`;
                initOpts.skipGit = !(await prompt.run(prompts_1.confirm, {
                    message: `Would you like to initialize Git in your new project?`,
                    default: true,
                }));
            },
        },
    ], { concurrent: false });
    const initOpts = await tasks.run();
    await core_1.api.init(initOpts);
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24tZm9yZ2UtaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbGVjdHJvbi1mb3JnZS1pbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsc0RBQXlCO0FBRXpCLCtDQUF3RDtBQUN4RCwrQ0FBb0Q7QUFDcEQsNkVBQTZFO0FBQzdFLGtEQUEwQjtBQUMxQix5Q0FBb0M7QUFDcEMsbUNBQStCO0FBRS9CLDRCQUEwQjtBQUMxQixtRUFBMEM7QUFFMUMsb0VBQStEO0FBSy9ELG1CQUFPO0tBQ0osT0FBTyxDQUFDLHNCQUFXLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSw2QkFBNkIsQ0FBQztLQUM1RSxVQUFVLENBQUMsWUFBWSxFQUFFLDJCQUEyQixDQUFDO0tBQ3JELFFBQVEsQ0FDUCxPQUFPLEVBQ1AsNEVBQTRFLENBQzdFO0tBQ0EsTUFBTSxDQUFDLHVCQUF1QixFQUFFLG9DQUFvQyxDQUFDO0tBQ3JFLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSx5Q0FBeUMsQ0FBQztLQUN4RSxNQUFNLENBQUMsYUFBYSxFQUFFLDZDQUE2QyxDQUFDO0tBQ3BFLE1BQU0sQ0FDTCxZQUFZLEVBQ1osZ0VBQWdFLENBQ2pFO0tBQ0EsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUNwQixNQUFNLE9BQU8sR0FBRyxtQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQy9CLE1BQU0sS0FBSyxHQUFHLElBQUksY0FBSyxDQUNyQjtRQUNFO1lBQ0UsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQWlCLEVBQUU7Z0JBQ3RDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO2dCQUM1QixRQUFRLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDO2dCQUMvQyxRQUFRLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3BELFFB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