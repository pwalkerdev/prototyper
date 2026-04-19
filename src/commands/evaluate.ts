import * as vscode from 'vscode';
import { setTimeout } from 'node:timers';
import { instance } from '../global';
import { uuid } from '../infrastructure/uuid';
import { headless } from '../infrastructure/headless';
import { prototerminal } from '../infrastructure/prototerminal';

export function evaluate(languageOverride: string): void {
    const document = vscode.window.activeTextEditor?.document;
    if (document) {
        const token = uuid.new(),
              delay = instance.determineTerminalInitialisationDelay(prototerminal.name), // HACK: This is pretty crappy but if we create a new terminal then we have to wait until it is ready. I couldn't find a 'proper' way to do this
              terminal = vscode.window.terminals.find(t => t.name === prototerminal.name) ?? vscode.window.createTerminal(prototerminal.options);

        // TODO: the addition of the --cs-impl-scheme param is a hack because I plan to improve the C# compiler and remove this later. The JS compiler will ignore this param
        terminal.sendText(`cmd.exe /c "${headless.location}" -l ${languageOverride ?? document.languageId} -i stream -t "${token}" --cs-impl-scheme Method`);

        setTimeout(() => {
            terminal.sendText(''); // the empty line here serves no purpose - i just think it looks prettier
            terminal.sendText(document.getText());
            terminal.sendText(token); // Resending the token indicates to the script interpreter that there is no more to send
        }, delay);

        terminal.show(true);
    }
}
