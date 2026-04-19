import * as path from 'path';
import * as vscode from 'vscode';
import { instance } from '../global';

export class headless {
    private static readonly _searchPath: string[] = instance.isDebug ? ['.modules', 'Headless', 'Headless', 'bin', 'Debug', 'net8.0'] : ['dist', 'bin'];

    static readonly directory: string = vscode.Uri.file(path.join(instance.installationFolder, ...this._searchPath)).fsPath;
    static readonly fileName: string = /^win/.test(process.platform) ? 'Headless.exe' : 'Headless';
    static readonly location: string = vscode.Uri.file(path.join(this.directory, this.fileName)).fsPath;

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
