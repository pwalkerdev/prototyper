import * as vscode from 'vscode';

export class prototerminal {
    static readonly name: string = 'Headless Dotnet Script';
    static readonly welcomeMessage: string = 'Prototyper: Initialising Terminal Instance...\r\n';

    static readonly options: vscode.TerminalOptions = {
        name: this.name,
        message: this.welcomeMessage,
        isTransient: true, // TODO: Make this configurable in case user wants to keep history
        cwd: vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.length > 0 ? vscode.workspace.workspaceFolders![0].uri : undefined,
    };
}
