"use strict";
/**
 * Validation Reporter for Forge CLI
 *
 * Provides formatted output for validation results
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationReporter = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ValidationReporter {
    /**
     * Report agent validation results
     */
    static reportAgentValidation(result) {
        if (result.valid) {
            console.log(chalk_1.default.green('\n✓ Agent definition is valid'));
            console.log(chalk_1.default.dim(`  Name: ${result.name}`));
            console.log(chalk_1.default.dim(`  Version: ${result.version}`));
            console.log('');
        }
        else {
            console.log(chalk_1.default.red('\n✗ Agent definition is invalid'));
            console.log('');
            if (result.errors && result.errors.length > 0) {
                console.log(chalk_1.default.red(`Found ${result.errors.length} error(s):`));
                for (const error of result.errors) {
                    console.log(chalk_1.default.red(`  • ${error.message || error}`));
                    if (error.path) {
                        console.log(chalk_1.default.dim(`    Path: ${error.path}`));
                    }
                }
            }
            console.log('');
        }
    }
    /**
     * Report tool validation results
     */
    static reportToolValidation(result) {
        if (result.valid) {
            console.log(chalk_1.default.green('\n✓ Tool definition is valid'));
            console.log(chalk_1.default.dim(`  Name: ${result.name}`));
            console.log(chalk_1.default.dim(`  Version: ${result.version}`));
            console.log('');
        }
        else {
            console.log(chalk_1.default.red('\n✗ Tool definition is invalid'));
            console.log('');
            if (result.errors && result.errors.length > 0) {
                console.log(chalk_1.default.red(`Found ${result.errors.length} error(s):`));
                for (const error of result.errors) {
                    console.log(chalk_1.default.red(`  • ${error.message || error}`));
                    if (error.path) {
                        console.log(chalk_1.default.dim(`    Path: ${error.path}`));
                    }
                }
            }
            console.log('');
        }
    }
}
exports.ValidationReporter = ValidationReporter;
//# sourceMappingURL=validation-reporter.js.map