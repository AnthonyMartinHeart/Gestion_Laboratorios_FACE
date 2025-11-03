"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherBase = void 0;
class Publisher {
    /**
     * @param config - A configuration object for this publisher
     * @param platformsToPublishOn - If you want this maker to run on platforms different from `defaultPlatforms` you can provide those platforms here
     */
    constructor(config, platformsToPublishOn) {
        this.config = config;
        this.platformsToPublishOn = platformsToPublishOn;
        this.config = config;
        Object.defineProperty(this, '__isElectronForgePublisher', {
            value: true,
            enumerable: false,
            configurable: false,
        });
    }
    get platforms() {
        if (this.platformsToPublishOn)
            return this.platformsToPublishOn;
        if (this.defaultPlatforms)
            return this.defaultPlatforms;
        return ['win32', 'linux', 'darwin', 'mas'];
    }
    /**
     * Publishers must implement this method to publish the artifacts returned from
     * make calls.  If any errors occur you must throw them, failing silently or simply
     * logging will not propagate issues up to forge.
     *
     * Please note for a given version publish will be called multiple times, once
     * for each set of "platform" and "arch".  This means if you are publishing
     * darwin and win32 artifacts to somewhere like GitHub on the first publish call
     * you will have to create the version on GitHub and the second call will just
     * be appending files to the existing version.
     */
    async publish(_opts) {
        throw new Error(`Publisher ${this.name} did not implement the publish method`);
    }
}
exports.default = Publisher;
exports.PublisherBase = Publisher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHVibGlzaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1B1Ymxpc2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUErQkEsTUFBOEIsU0FBUztJQVFyQzs7O09BR0c7SUFDSCxZQUNTLE1BQVMsRUFDTixvQkFBc0M7UUFEekMsV0FBTSxHQUFOLE1BQU0sQ0FBRztRQUNOLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBa0I7UUFFaEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDeEQsS0FBSyxFQUFFLElBQUk7WUFDWCxVQUFVLEVBQUUsS0FBSztZQUNqQixZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxTQUFTO1FBQ1gsSUFBSSxJQUFJLENBQUMsb0JBQW9CO1lBQUUsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDaEUsSUFBSSxJQUFJLENBQUMsZ0JBQWdCO1lBQUUsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDeEQsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FDWCxLQUF1QjtRQUV2QixNQUFNLElBQUksS0FBSyxDQUNiLGFBQWEsSUFBSSxDQUFDLElBQUksdUNBQXVDLENBQzlELENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFoREQsNEJBZ0RDO0FBRXFCLGtDQUFhIn0=