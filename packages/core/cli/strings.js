/* eslint quotes:0, quote-props:0, prefer-destructuring:0 */

// style/color hack
// https://github.com/yargs/yargs/issues/251#issuecomment-416974381

/* istanbul ignore file */

module.exports = styles => {

    return {
        "Commands:": styles.subtitle("Commands:"),
        "Options:": styles.subtitle("Options:"),
        "Positionals:": styles.subtitle("Positionals:"),
        "Examples:": styles.subtitle("Examples:"),
        "command": styles.white("command"),
        "boolean": styles.faded("boolean"),
        "count": styles.white("count"),
        "string": styles.white("string"),
        "number": styles.white("number"),
        "array": styles.white("array"),
        "required": styles.warn("required"),
        "default:": styles.success("default:"),
        "choices:": styles.blue("choices:"),
        "aliases:": styles.blue("aliases:"),
        "generated-value": styles.white("generated-value"),
        "Not enough non-option arguments: got %s, need at least %s": styles.warn("Not enough non-option arguments: got %s, need at least %s"),
        "Too many non-option arguments: got %s, maximum of %s": styles.warn("Too many non-option arguments: got %s, maximum of %s"),
        "Missing argument value: %s": {
            "one": styles.warn("Missing argument value: %s"),
            "other": styles.warn("Missing argument values: %s")
        },
        "Missing required argument: %s": {
            "one": styles.warn("Missing required argument: %s"),
            "other": styles.warn("Missing required arguments: %s")
        },
        "Unknown argument: %s": {
            "one": styles.warn("Unknown argument: %s"),
            "other": styles.warn("Unknown arguments: %s")
        },
        "Invalid values:": styles.warn("Invalid values:"),
        "Argument: %s, Given: %s, Choices: %s": "Argument: %s, Given: %s, Choices: %s",
        "Argument check failed: %s": styles.danger("Argument check failed: %s"),
        "Implications failed:": styles.danger("Implications failed:"),
        "Not enough arguments following: %s": styles.warn("Not enough arguments following: %s"),
        "Invalid JSON config file: %s": "Invalid JSON config file: %s",
        "Path to JSON config file": "Path to JSON config file",
        "Show help": styles.warn("Show help"),
        "Show version number": "Show version number",
        "Did you mean %s?": styles.warn("Did you mean %s?"),
        "Arguments %s and %s are mutually exclusive": styles.warn("Arguments %s and %s are mutually exclusive")
    };

};
