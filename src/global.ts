import * as vscode from 'vscode';
import * as path from 'path';

export class instance {
    static readonly isDebug: boolean = process.env.IsDebugInstance === 'true';
    static readonly installationFolder: string = vscode.extensions.getExtension('pwalkerdev.prototyper')?.extensionPath ?? '';
    static readonly terminalInitialisationDelay: number = 1500; // TODO: Since this is such a yucky hack that will (i assume) be different for each machine, it should be configurable to increase or decrease according to host specs
}

export class headless {
    private static readonly _searchPath: string[] = instance.isDebug ? ['.modules', 'Headless', 'Headless', 'bin', 'Debug', 'net8.0'] : ['dist', 'bin'];

    static readonly Location: string = vscode.Uri.file(path.join(instance.installationFolder, ...this._searchPath, 'Headless.exe')).fsPath;
}

export class uuid {
    static new(): string { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | (c === 'x' ? 0 : 0 & 0x3 | 0x8)).toString(16)); }
}

export class prototerminal {
    static readonly name: string = 'Headless Dotnet Script';
    static readonly welcomeMessage: string = 'Prototyper: Initialising Terminal Instance...\r\n';
    
    static readonly options: vscode.TerminalOptions = {
        name: this.name,
        message: this.welcomeMessage,
        isTransient: true, // TODO: Make this configurable in case user wants to keep history
        cwd: vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.length > 0 ? vscode.workspace.workspaceFolders![0].uri : undefined
    };
}