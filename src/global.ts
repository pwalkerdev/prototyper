import * as vscode from 'vscode';
import * as path from 'path';

export class instance {
    static readonly isDebug: boolean = process.env.IsDebugInstance === 'true';
    static readonly installationFolder: string = vscode.extensions.getExtension('pwalkerdev.prototyper')?.extensionPath ?? '';
    static readonly terminalInitialisationDelay: number = 1500; // TODO: Since this is such a yucky hack that will (i assume) be different for each machine, it should be configurable to increase or decrease according to host specs
    static determineTerminalInitialisationDelay(terminalName: string): number { return vscode.window.terminals.find(t => t.name === terminalName) ? 0 : this.terminalInitialisationDelay; };
}

export class headless {
    private static readonly _searchPath: string[] = instance.isDebug ? ['.modules', 'Headless', 'Headless', 'bin', 'Debug', 'net8.0'] : ['dist', 'bin'];

    static readonly location: string = vscode.Uri.file(path.join(instance.installationFolder, ...this._searchPath, 'Headless.exe')).fsPath;

    static readonly debugConfiguration: vscode.DebugConfiguration = {
        name: '.NET Core Attach',
        request: 'attach',
        type: 'coreclr',
        requireExactSource: false,
        justMyCode: true,
        processName: "Headless.exe",
        //stopAtEntry: true,
        // symbolOptions: {
        //     searchMicrosoftSymbolServer: true, // TODO: Maybe parameterise this?
        //     moduleFilter: {
        //         mode: "loadOnlyIncluded",
        //         includedModules: [ "*" ],
        //         includeSymbolsNextToModules: true
        //     }
        // }
        
    };
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