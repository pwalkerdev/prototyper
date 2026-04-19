import * as vscode from 'vscode';
import { setTimeout } from 'node:timers';
import { instance } from '../global';
import { uuid } from '../infrastructure/uuid';
import { headless } from '../infrastructure/headless';
import { prototerminal } from '../infrastructure/prototerminal';

export function debug(language: string): void {
    if (language?.toLowerCase() !== 'csharp') {
        throw new Error(`Debugging is not currently supported for requested language: ${language}`);
    }

    const document = vscode.window.activeTextEditor?.document;
    if (document) {
        const token = uuid.new(),
              delay = instance.determineTerminalInitialisationDelay(prototerminal.name), // HACK: This is pretty crappy but if we create a new terminal then we have to wait until it is ready. I couldn't find a 'proper' way to do this
              terminal = vscode.window.terminals.find(t => t.name === prototerminal.name) ?? vscode.window.createTerminal(prototerminal.options);

        let sourceFileUri = document.uri;
        if (document.uri.scheme === 'untitled') {
            sourceFileUri = sourceFileUri.with({ scheme: 'prototypewriter', path: `/${sourceFileUri.path}.cs` });
            vscode.workspace.fs.writeFile(sourceFileUri, Buffer.from(document.getText()));
        }

        vscode.window.showTextDocument(sourceFileUri, { preview: false }).then(editor => {
            terminal.sendText(`cmd.exe /c "${headless.location}" -l ${language} -m Debug -i stream -t "${token}" --cs-impl-scheme Method --cs-file-name "${editor.document.uri.toString(true)}"`);

            // this will create a breakpoint at the very top of the script, could be useful because the stop at entry property does not work when attaching to a running process...
            if (!vscode.debug.breakpoints.find(bp => bp instanceof vscode.SourceBreakpoint && bp.location.range.toString() === '[2:0, 2:0]')) {
                vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(new vscode.Location(editor.document.uri, new vscode.Position(0, 0)), true)]);
            }

            setTimeout(() => {
                vscode.debug.startDebugging(undefined, headless.debugConfiguration, undefined).then(_ => {
                    terminal.sendText(document.getText());
                    terminal.sendText(token); // Resending the token indicates to the script interpreter that there is no more to send
                });
            }, delay);

            terminal.show(true);
        });
    }
}
