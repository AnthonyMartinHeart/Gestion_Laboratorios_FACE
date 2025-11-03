"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packager_1 = require("@electron/packager");
function parseArchs(platform, declaredArch, electronVersion) {
    if (declaredArch === 'all') {
        return ((0, packager_1.allOfficialArchsForPlatformAndVersion)(platform, electronVersion) || ['x64']);
    }
    return declaredArch.split(',');
}
exports.default = parseArchs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtYXJjaHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbC9wYXJzZS1hcmNocy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUc0QjtBQUc1QixTQUF3QixVQUFVLENBQ2hDLFFBQWdDLEVBQ2hDLFlBQXdDLEVBQ3hDLGVBQXVCO0lBRXZCLElBQUksWUFBWSxLQUFLLEtBQUssRUFBRSxDQUFDO1FBQzNCLE9BQU8sQ0FDTCxJQUFBLGdEQUFxQyxFQUNuQyxRQUE2QixFQUM3QixlQUFlLENBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FDYixDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU8sWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQWdCLENBQUM7QUFDaEQsQ0FBQztBQWZELDZCQWVDIn0=