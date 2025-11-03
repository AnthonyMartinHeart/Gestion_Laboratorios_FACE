"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rebuild_1 = require("@electron/rebuild");
if (!process.send) {
    console.error('The remote rebuilder expects to be spawned with an IPC channel');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
}
const options = JSON.parse(process.argv[2]);
const rebuilder = (0, rebuild_1.rebuild)(options);
rebuilder.lifecycle.on('module-found', () => process.send?.({ msg: 'module-found' }));
rebuilder.lifecycle.on('module-done', () => process.send?.({ msg: 'module-done' }));
rebuilder
    .then(() => {
    process.send?.({ msg: 'rebuild-done' });
    // eslint-disable-next-line no-process-exit
    return process.exit(0);
})
    .catch((err) => {
    process.send?.({
        msg: 'rebuild-error',
        err: {
            message: err.message,
            stack: err.stack,
        },
    });
    // eslint-disable-next-line no-process-exit
    process.exit(0);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlLXJlYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVtb3RlLXJlYnVpbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQ0FBNEQ7QUFFNUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsQixPQUFPLENBQUMsS0FBSyxDQUNYLGdFQUFnRSxDQUNqRSxDQUFDO0lBQ0YsMkNBQTJDO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQztBQUVELE1BQU0sT0FBTyxHQUFtQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUU1RCxNQUFNLFNBQVMsR0FBRyxJQUFBLGlCQUFPLEVBQUMsT0FBTyxDQUFDLENBQUM7QUFFbkMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRSxDQUMxQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FDeEMsQ0FBQztBQUNGLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FDekMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQ3ZDLENBQUM7QUFFRixTQUFTO0tBQ04sSUFBSSxDQUFDLEdBQUcsRUFBRTtJQUNULE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLDJDQUEyQztJQUMzQyxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDO0tBQ0QsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDYixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDYixHQUFHLEVBQUUsZUFBZTtRQUNwQixHQUFHLEVBQUU7WUFDSCxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU87WUFDcEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1NBQ2pCO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsMkNBQTJDO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMifQ==