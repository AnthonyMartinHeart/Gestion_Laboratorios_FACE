"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNameFromAuthor = void 0;
const parse_author_1 = __importDefault(require("parse-author"));
/**
 * Extracts the name from a package.json author field.
 *
 * @param author - The author object to extract the name from.
 * @returns The name of the author.
 *
 * @see https://docs.npmjs.com/cli/configuring-npm/package-json#people-fields-author-contributors
 */
function getNameFromAuthor(author) {
    let publisher = author || '';
    if (typeof publisher === 'string') {
        publisher = (0, parse_author_1.default)(publisher);
    }
    if (typeof publisher !== 'string' &&
        publisher &&
        typeof publisher.name === 'string') {
        publisher = publisher.name;
    }
    if (typeof publisher !== 'string') {
        publisher = '';
    }
    return publisher;
}
exports.getNameFromAuthor = getNameFromAuthor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aG9yLW5hbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYXV0aG9yLW5hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsZ0VBQXVDO0FBRXZDOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxNQUFxQjtJQUNyRCxJQUFJLFNBQVMsR0FBa0IsTUFBTSxJQUFJLEVBQUUsQ0FBQztJQUU1QyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ2xDLFNBQVMsR0FBRyxJQUFBLHNCQUFXLEVBQUMsU0FBUyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELElBQ0UsT0FBTyxTQUFTLEtBQUssUUFBUTtRQUM3QixTQUFTO1FBQ1QsT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFDbEMsQ0FBQztRQUNELFNBQVMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQzdCLENBQUM7SUFFRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ2xDLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFwQkQsOENBb0JDIn0=