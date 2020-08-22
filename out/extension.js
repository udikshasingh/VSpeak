"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const vscode_1 = require("vscode");
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const commands_1 = __importDefault(require("./commands"));
var MAP = new Map();
// var HashMap = require("hashmap");
// var map: {
//   set: (arg0: any, arg1: any) => void;
//   has: (arg0: string) => any;
//   get: (arg0: string) => string;
// };
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension "extension" is now active!');
    new SpeechListener(context);
    // Temporary blank command used to activate the extension through the command palette
    let disposable = vscode_1.commands.registerCommand("extension.activateVSpeak", () => {
        vscode_1.commands.executeCommand("start_listen");
        vscode.window.showInformationMessage("VSpeak is activated");
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand("extension.deactivateVSpeak", () => {
        vscode_1.commands.executeCommand("stop_listen");
        vscode.window.showInformationMessage("VSpeak is deactivated");
    }));
    for (var i = 0; i < commands_1.default.length; i++) {
        var item = commands_1.default[i];
        MAP.set(commands_1.default[i].command, commands_1.default[i].exec);
    }
}
exports.activate = activate;
class SpeechListener {
    constructor(context) {
        this.execFile = child_process_1.spawn;
        this.sttbar = new SttBarItem();
        const d1 = vscode_1.commands.registerCommand("toggle", () => {
            if (this.sttbar.getSttText() === "on") {
                this.sttbar.off();
                this.killed();
            }
            else {
                this.sttbar.on();
                this.run();
            }
        });
        const d2 = vscode_1.commands.registerCommand("stop_listen", () => {
            this.sttbar.off();
            this.killed();
        });
        const d3 = vscode_1.commands.registerCommand("start_listen", () => {
            this.sttbar.on();
            this.run();
        });
        context.subscriptions.concat([d1, d2, d3]);
        this.sttbar.setSttCmd("toggle");
    }
    run() {
        print("Trying to run speech detection");
        this.child = this.execFile("python3", [
            path_1.join(__dirname, "tts.py"),
        ]).on("error", (error) => print(error));
        this.child.stdout.on("data", (data) => {
            //print(data);
            let commandRunner = new CommandRunner();
            commandRunner.runCommand(data.toString().trim());
        });
        this.child.stderr.on("data", (data) => print(data));
    }
    killed() {
        this.child.kill();
    }
}
class SttBarItem {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        this.statusText = "off";
        this.off();
    }
    on() {
        this.statusBarItem.text = "VSpeak listening!";
        this.statusBarItem.show();
        this.statusText = "on";
    }
    off() {
        this.statusBarItem.text = "VSpeak off 🤐";
        this.statusBarItem.show();
        this.statusText = "off";
    }
    getSttText() {
        return this.statusText;
    }
    setSttCmd(cmd) {
        this.statusBarItem.command = cmd;
    }
}
class CommandRunner {
    runCommand(receivedString) {
        print("Command received: " + receivedString);
        let activeTextEditor;
        let lineNumber;
        const words = receivedString.split(" ");
        const status = words[0] === "success";
        // var result = receivedString.substr(receivedString.indexOf(" ") + 1);
        // print(result.trim());
        // added vscode.window.state.focused because commands should only run when vs code window is in the foreground
        if (status && vscode.window.state.focused) {
            vscode.window.setStatusBarMessage("Success!", 3000);
            const commandWords = words.slice(1);
            if (MAP.has(commandWords[0])) {
                vscode_1.commands.executeCommand(MAP.get(commandWords[0]));
            }
            else {
                switch (commandWords[0]) {
                    case "continue":
                        if (vscode.debug.activeDebugSession) {
                            print("Context aware continue while in debug");
                            vscode_1.commands.executeCommand("workbench.action.debug.continue");
                        }
                        else {
                            print('Falling back as no context found for "continue"');
                        }
                        break;
                    case "stop":
                        if (vscode.debug.activeDebugSession) {
                            print('Context aware "stop" while in debug');
                            vscode_1.commands.executeCommand("workbench.action.debug.stop");
                        }
                        else {
                            print('Falling back as no context found for "stop"');
                        }
                        break;
                    case "continue":
                        if (vscode.debug.activeDebugSession) {
                            vscode_1.commands.executeCommand("workbench.action.debug.continue");
                        }
                        break;
                    case "search_google":
                        activeTextEditor = vscode.window.activeTextEditor;
                        if (activeTextEditor) {
                            const text = activeTextEditor.document.getText(activeTextEditor.selection);
                            vscode.env.openExternal(vscode.Uri.parse("https://www.google.com/search?q=" + text));
                        }
                        break;
                    case "navigate_line":
                        vscode_1.commands.executeCommand("workbench.action.focusActiveEditorGroup");
                        lineNumber = parseInt(commandWords[1]);
                        activeTextEditor = vscode.window.activeTextEditor;
                        if (activeTextEditor) {
                            const range = activeTextEditor.document.lineAt(lineNumber - 1)
                                .range;
                            activeTextEditor.selection = new vscode.Selection(range.start, range.start);
                            activeTextEditor.revealRange(range);
                        }
                        break;
                    case "breakpoint_add":
                        vscode_1.commands.executeCommand("workbench.action.focusActiveEditorGroup");
                        lineNumber = parseInt(commandWords[1]);
                        activeTextEditor = vscode.window.activeTextEditor;
                        if (activeTextEditor) {
                            let position = new vscode.Position(lineNumber - 1, 0);
                            let location = new vscode.Location(activeTextEditor.document.uri, position);
                            let breakpointToAdd = [
                                new vscode.SourceBreakpoint(location, true),
                            ];
                            vscode.debug.addBreakpoints(breakpointToAdd);
                        }
                        break;
                    case "breakpoint_remove":
                        vscode_1.commands.executeCommand("workbench.action.focusActiveEditorGroup");
                        lineNumber = parseInt(commandWords[1]);
                        activeTextEditor = vscode.window.activeTextEditor;
                        if (activeTextEditor) {
                            let existingBreakPoints = vscode.debug.breakpoints;
                            for (let breakpoint of existingBreakPoints) {
                                if (breakpoint instanceof vscode.SourceBreakpoint &&
                                    breakpoint.location.uri.path ===
                                        activeTextEditor.document.uri.path &&
                                    breakpoint.location.range.start.line === lineNumber - 1) {
                                    vscode.debug.removeBreakpoints([breakpoint]);
                                }
                            }
                        }
                        break;
                    // case "navigate_file":
                    //   vscode.commands.executeCommand("workbench.action.quickOpen");
                    //   vscode.window.showQuickPick();
                    // console.debug(vscode.workspace.);
                    // console.debug(vscode.workspace.asRelativePath("."));
                    // vscode.workspace.fs
                    //   .readDirectory(
                    //     vscode.Uri.file(vscode.workspace.asRelativePath("."))
                    //   )
                    //   .then(files => {
                    //     let filenames: string[] = files.map(
                    //       (filename, filetype) => filename[0]
                    //     );
                    //     vscode.window.showQuickPick(filenames);
                    //   });
                    // break;
                    case "copy":
                        activeTextEditor = vscode.window.activeTextEditor;
                        if (activeTextEditor) {
                            const text = activeTextEditor.document.getText(activeTextEditor.selection);
                            vscode.env.clipboard.writeText(text);
                        }
                        break;
                    case "navigate_class":
                        let className = commandWords[1];
                        // TODO: implement functionality
                        break;
                    case "run_file":
                        activeTextEditor = vscode.window.activeTextEditor;
                        if (activeTextEditor) {
                            activeTextEditor.document.save(); //should probably save all files
                            const currentFileName = activeTextEditor.document.fileName;
                            const activeTerminal = vscode.window.activeTerminal;
                            if (activeTerminal) {
                                if (activeTextEditor.document.languageId === "python") {
                                    // TODO: implement functionality for other languages
                                    activeTerminal.sendText("python " + currentFileName);
                                }
                                else {
                                    vscode.window.showErrorMessage("Oops! Unsupported language for run commapnd");
                                }
                            }
                        }
                        break;
                    case "copy_file":
                        // TODO: implement functionality
                        break;
                    case "git_status":
                        const activeTerminal = vscode.window.activeTerminal;
                        if (activeTerminal &&
                            vscode.extensions.getExtension("vscode.git")) {
                            activeTerminal.sendText("git status");
                        }
                        break;
                }
            }
        }
        else {
            vscode.window.setStatusBarMessage("Recognition Failure (" +
                receivedString.substr(receivedString.indexOf(" ") + 1) +
                ")", 3000);
        }
    }
}
// helper method for printing to console
function print(data) {
    console.log("Vspeak Debug: " + data.toString());
}
// this method is called when your extension is deactivated
function deactivate() {
    vscode.window.setStatusBarMessage("");
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map