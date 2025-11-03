import { ForgeHookFn, ForgeListrTask, ForgeMultiHookMap, IForgePlugin, ResolvedForgeConfig, StartOptions, StartResult } from '@electron-forge/shared-types';
export { StartOptions };
export default abstract class Plugin<C> implements IForgePlugin {
    config: C;
    abstract name: string;
    /** @internal */
    __isElectronForgePlugin: true;
    /** @internal */
    _resolvedHooks: ForgeMultiHookMap;
    constructor(config: C);
    init(_dir: string, _config: ResolvedForgeConfig): void;
    getHooks(): ForgeMultiHookMap;
    startLogic(_startOpts: StartOptions): Promise<StartResult>;
}
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
export declare const namedHookWithTaskFn: <Hook extends keyof import("@electron-forge/shared-types").ForgeSimpleHookSignatures | keyof import("@electron-forge/shared-types").ForgeMutatingHookSignatures>(hookFn: <Ctx = never>(task: ForgeListrTask<Ctx> | null, ...args: Parameters<ForgeHookFn<Hook>>) => ReturnType<ForgeHookFn<Hook>>, name: string) => ForgeHookFn<Hook>;
export { Plugin as PluginBase };
//# sourceMappingURL=Plugin.d.ts.map