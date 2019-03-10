# `@ocli`

_( Work in progress... )_  

CLI tools for most used operations and development workflows.

- `@ocli/core` is the only required (core) package that provides the basic functionality for everyday-use command line operations. 
- Install other sub-packages indicated below if you need the command/functionality. 
- Commands that support batch/task operations (with globs), are marked with (*).

### Commands

| Command                 | Description                            | Alias | Package        |
| ----------------------- | -------------------------------------- | ----- | -------------- |
| `o mkdir [path]`        | Ensure/create directory structure. (*) | `md`  | `@ocli/core`   |
| `o remove [path]`       | Remove path(s) recursively. (*)        | `rm`  | `@ocli/core`   |
| `o clean [path]`        | Clean/empty directories. (*)           | `cl`  | `@ocli/core`   |
| `o copy [src] [dest]`   | Copy files and directories. (*)        | `cp`  | `@ocli/core`   |
| `o json [src] [dest]`   | Uglify/beautify JSON file(s). (*)      |       | `@ocli/core`   |
| `o html [src] [dest]`   | Process, minify HTML file(s). (*)      |       | `@ocli/html`   |
| `o repack [src] [dest]` | Repack an npm package.json.            |       | `@ocli/repack` |

- Globs not allowed for `clean` command.