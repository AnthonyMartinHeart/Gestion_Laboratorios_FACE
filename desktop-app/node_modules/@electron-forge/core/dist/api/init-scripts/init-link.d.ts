import { PMDetails } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
/**
 * Link local forge dependencies
 *
 * This allows developers working on forge itself to easily init
 * a local template and have it use their local plugins / core / cli packages.
 *
 * Uses yarn link to create portal: resolutions that point to local workspace paths.
 */
export declare function initLink<T>(pm: PMDetails, dir: string, task?: ForgeListrTask<T>): Promise<void>;
//# sourceMappingURL=init-link.d.ts.map