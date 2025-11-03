"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerZIP = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const maker_base_1 = require("@electron-forge/maker-base");
const fs_extra_1 = __importDefault(require("fs-extra"));
const got_1 = __importDefault(require("got"));
class MakerZIP extends maker_base_1.MakerBase {
    constructor() {
        super(...arguments);
        this.name = 'zip';
        this.defaultPlatforms = ['darwin', 'mas', 'win32', 'linux'];
    }
    isSupportedOnCurrentPlatform() {
        return true;
    }
    async make({ dir, makeDir, appName, packageJSON, targetArch, targetPlatform, }) {
        const { zip } = require('cross-zip');
        const zipDir = ['darwin', 'mas'].includes(targetPlatform)
            ? node_path_1.default.resolve(dir, `${appName}.app`)
            : dir;
        const zipName = `${node_path_1.default.basename(dir)}-${packageJSON.version}.zip`;
        const zipPath = node_path_1.default.resolve(makeDir, 'zip', targetPlatform, targetArch, zipName);
        await this.ensureFile(zipPath);
        await (0, node_util_1.promisify)(zip)(zipDir, zipPath);
        // Only generate RELEASES.json for darwin builds (not MAS)
        if (targetPlatform === 'darwin' && this.config.macUpdateManifestBaseUrl) {
            const parsed = new URL(this.config.macUpdateManifestBaseUrl);
            parsed.pathname += '/RELEASES.json';
            const response = await got_1.default.get(parsed.toString(), {
                throwHttpErrors: false,
            });
            let currentValue = {
                currentRelease: '',
                releases: [],
            };
            if (response.statusCode === 200) {
                currentValue = JSON.parse(response.body);
            }
            const updateUrl = new URL(this.config.macUpdateManifestBaseUrl);
            updateUrl.pathname += `/${zipName}`;
            // Remove existing release if it is already in the manifest
            currentValue.releases = currentValue.releases || [];
            currentValue.releases = currentValue.releases.filter((release) => release.version !== packageJSON.version);
            // Add the current version as the current release
            currentValue.currentRelease = packageJSON.version;
            currentValue.releases.push({
                version: packageJSON.version,
                updateTo: {
                    name: `${appName} v${packageJSON.version}`,
                    version: packageJSON.version,
                    pub_date: new Date().toISOString(),
                    url: updateUrl.toString(),
                    notes: this.config.macUpdateReleaseNotes || '',
                },
            });
            const releasesPath = node_path_1.default.resolve(makeDir, 'zip', targetPlatform, targetArch, 'RELEASES.json');
            await this.ensureFile(releasesPath);
            await fs_extra_1.default.writeJson(releasesPath, currentValue);
            return [zipPath, releasesPath];
        }
        return [zipPath];
    }
}
exports.default = MakerZIP;
exports.MakerZIP = MakerZIP;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFrZXJaSVAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvTWFrZXJaSVAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLHlDQUFzQztBQUV0QywyREFBcUU7QUFFckUsd0RBQTBCO0FBQzFCLDhDQUFzQjtBQW9CdEIsTUFBcUIsUUFBUyxTQUFRLHNCQUF5QjtJQUEvRDs7UUFDRSxTQUFJLEdBQUcsS0FBSyxDQUFDO1FBRWIscUJBQWdCLEdBQW9CLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFpRjFFLENBQUM7SUEvRUMsNEJBQTRCO1FBQzFCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsRUFDVCxHQUFHLEVBQ0gsT0FBTyxFQUNQLE9BQU8sRUFDUCxXQUFXLEVBQ1gsVUFBVSxFQUNWLGNBQWMsR0FDRDtRQUNiLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFckMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUN2RCxDQUFDLENBQUMsbUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsT0FBTyxNQUFNLENBQUM7WUFDckMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUVSLE1BQU0sT0FBTyxHQUFHLEdBQUcsbUJBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFDLE9BQU8sTUFBTSxDQUFDO1FBQ25FLE1BQU0sT0FBTyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUMxQixPQUFPLEVBQ1AsS0FBSyxFQUNMLGNBQWMsRUFDZCxVQUFVLEVBQ1YsT0FBTyxDQUNSLENBQUM7UUFFRixNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7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