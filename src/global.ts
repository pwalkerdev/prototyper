import './helpers/toFriendlyName';
import * as vscode from 'vscode';

export class instance {
    static readonly isDebug: boolean = process.env.IsDebugInstance === 'true';
    static readonly installationFolder: string = vscode.extensions.getExtension('pwalkerdev.prototyper')?.extensionPath ?? '';
    static readonly terminalInitialisationDelay: number = 1500; // TODO: Since this is such a yucky hack that will (i assume) be different for each machine, it should be configurable to increase or decrease according to host specs
    static determineTerminalInitialisationDelay(terminalName: string): number { return vscode.window.terminals.find(t => t.name === terminalName) ? 0 : this.terminalInitialisationDelay; };
}
