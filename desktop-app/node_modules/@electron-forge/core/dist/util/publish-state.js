"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_path_1 = __importDefault(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const EXTENSION = '.forge.publish';
class PublishState {
    static async loadFromDirectory(directory, rootDir) {
        if (!(await fs_extra_1.default.pathExists(directory))) {
            throw new Error(`Attempted to load publish state from a missing directory: ${directory}`);
        }
        const publishes = [];
        for (const dirName of await fs_extra_1.default.readdir(directory)) {
            const subDir = node_path_1.default.resolve(directory, dirName);
            const states = [];
            if ((await fs_extra_1.default.stat(subDir)).isDirectory()) {
                const filePaths = (await fs_extra_1.default.readdir(subDir))
                    .filter((fileName) => fileName.endsWith(EXTENSION))
                    .map((fileName) => node_path_1.default.resolve(subDir, fileName));
                for (const filePath of filePaths) {
                    const state = new PublishState(filePath);
                    await state.load();
                    state.state.artifacts = state.state.artifacts.map((artifactPath) => node_path_1.default.resolve(rootDir, artifactPath));
                    states.push(state);
                }
            }
            publishes.push(states);
        }
        return publishes;
    }
    static async saveToDirectory(directory, artifacts, rootDir) {
        const id = node_crypto_1.default
            .createHash('SHA256')
            .update(JSON.stringify(artifacts))
            .digest('hex');
        for (const artifact of artifacts) {
            artifact.artifacts = artifact.artifacts.map((artifactPath) => node_path_1.default.relative(rootDir, artifactPath));
            const publishState = new PublishState(node_path_1.default.resolve(directory, id, 'null'), false);
            publishState.state = artifact;
            await publishState.saveToDisk();
        }
    }
    constructor(filePath, hasHash = true) {
        this.state = {};
        this.dir = node_path_1.default.dirname(filePath);
        this.path = filePath;
        this.hasHash = hasHash;
    }
    generateHash() {
        const content = JSON.stringify(this.state || {});
        return node_crypto_1.default.createHash('SHA256').update(content).digest('hex');
    }
    async load() {
        this.state = await fs_extra_1.default.readJson(this.path);
    }
    async saveToDisk() {
        if (!this.hasHash) {
            this.path = node_path_1.default.resolve(this.dir, `${this.generateHash()}${EXTENSION}`);
            this.hasHash = true;
        }
        await fs_extra_1.default.mkdirs(node_path_1.default.dirname(this.path));
        await fs_extra_1.default.writeJson(this.path, this.state);
    }
}
exports.default = PublishState;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC1zdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3B1Ymxpc2gtc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw4REFBaUM7QUFDakMsMERBQTZCO0FBRzdCLHdEQUEwQjtBQUUxQixNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztBQUVuQyxNQUFxQixZQUFZO0lBQy9CLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQzVCLFNBQWlCLEVBQ2pCLE9BQWU7UUFFZixJQUFJLENBQUMsQ0FBQyxNQUFNLGtCQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUN0QyxNQUFNLElBQUksS0FBSyxDQUNiLDZEQUE2RCxTQUFTLEVBQUUsQ0FDekUsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBcUIsRUFBRSxDQUFDO1FBQ3ZDLEtBQUssTUFBTSxPQUFPLElBQUksTUFBTSxrQkFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ2xELE1BQU0sTUFBTSxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoRCxNQUFNLE1BQU0sR0FBbUIsRUFBRSxDQUFDO1lBRWxDLElBQUksQ0FBQyxNQUFNLGtCQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFNLGtCQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUN6QyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7cUJBQ2xELEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsbUJBQUksQ0FBQyxPQUFPLENBQUMs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