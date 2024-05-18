import * as vscode from 'vscode';
import { headless, instance, uuid, prototerminal } from './global';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatecsharp', () => EvaluateEntryPoint(RunCSharpHeadless)));
}

function EvaluateEntryPoint(callback: (editor: vscode.TextEditor, terminal: vscode.Terminal | undefined) => void): void {
	if (vscode.window.activeTextEditor) {
		callback(vscode.window.activeTextEditor, vscode.window.terminals.find(t => t.name === prototerminal.name));
	}
}

function RunCSharpHeadless(editor: vscode.TextEditor, terminal: vscode.Terminal | undefined): void {
	const executionDelay = terminal ? 0 : instance.terminalInitialisationDelay, // HACK: This is pretty crappy but if we create a new terminal then we have to wait until it is ready. I couldn't find a 'proper' way to do this
		  token = uuid.new();
	
	(terminal ??= vscode.window.createTerminal(prototerminal.options)).sendText(`cmd.exe /c "${headless.Location}" -l CSharp -i stream -t "${token}"`);

	setTimeout(() => {
		terminal!.sendText(''); // the empty line here serves no purpose - i just think it looks prettier
		for (var i = 0; i < editor.document.lineCount; i++) {
			terminal!.sendText(editor.document.lineAt(i).text);
		}
		terminal!.sendText(token); // Resending the token indicates to the script interpreter that there is no more to send
	}, executionDelay);

	terminal.show(true);
}