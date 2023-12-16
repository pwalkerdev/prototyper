import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatecsharp', onEvaluateCSharp));
}

function onEvaluateCSharp() {
	const editor = vscode.window.activeTextEditor;
	const terminal = vscode.window.terminals.find(t => t.name === 'Headless Dotnet Script') ?? vscode.window.createTerminal({ name: 'Headless Dotnet Script', isTransient: true });
	if (!editor || !terminal) { return; }

	const extensionFolder = vscode.extensions.getExtension('pwalkerdev.prototyper')?.extensionPath ?? '';
	const myAppPath = process.env.IsDebugInstance === 'true'
		? vscode.Uri.file(path.join(extensionFolder, '.modules', 'Headless', 'HeadlessNetCore', 'bin', 'Debug', 'net8.0', 'HeadlessNetCore.dll'))
		: vscode.Uri.file(path.join(extensionFolder, 'dist', 'HeadlessNetCore', 'HeadlessNetCore.dll'));
	const token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | (c === 'x' ? 0 : 0 & 0x3 | 0x8)).toString(16));
	const execCommand = `dotnet "${myAppPath.fsPath}" stream "${token}"`;

	terminal.sendText(execCommand);
	terminal.show(true);
	
	// The sendText() method does not block execution until the operation completes - so when we run `dotnet xx xxx`, we have to wait until the process is ready to receive stdin. Otherwise only a part of the script will be sent, or the terminal will just hang...
	// I'll look into a better way to solve this problem in future but it isnt as easy as it sounds because it is impossible to get the status of the current operation, and it is also impossible to get the value of any text in the terminal
	setTimeout(() => {
		terminal.sendText(''); // the empty line here serves no purpose - i just think it looks prettier
		for (var i = 0; i < editor.document.lineCount; i++) {
			terminal.sendText(editor.document.lineAt(i).text);
		}
		terminal.sendText(token); // Resending the token indicates to the script interpreter that there is no more to send
	}, 750); // TODO: Since this is such a yucky hack that will (i assume) be different for each machine, it should be configurable to increase or decrease according to host specs
}

// TEST CODE
// public int Main()
// {
//     Console.WriteLine("ooga booga");
//     return 69;
// }