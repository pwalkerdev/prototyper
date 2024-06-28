import * as vscode from 'vscode';
import { headless, instance, uuid, prototerminal } from './global';
//import { TransientSourceCodeDebugAdapterFactory } from './transientSourceCodeDebugAdapter';
import { MemFS } from './fileSystemProvider';
//import { Breakpoint, BreakpointEvent, Source, LoggingDebugSession } from '@vscode/debugadapter';
//import { DebugProtocol } from '@vscode/debugprotocol';


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('prototypewriter', new MemFS(), { isCaseSensitive: true }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatecsharp', () => Evaluate("CSharp")));
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatejs', () => Evaluate("JavaScript")));
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.debugcsharp', () => Debug("CSharp")));

    // context.subscriptions.push(vscode.debug.onDidStartDebugSession(session => { 
    //     let loggingSession = session as unknown as LoggingDebugSession;
    //     if (!loggingSession) {
    //         return;
    //     }
    //     let bp = new Breakpoint(true, 1, 1, new Source(session.name, 'Untitled-1.cs')) as DebugProtocol.Breakpoint;
    //     loggingSession.sendEvent(new BreakpointEvent('new', bp));
    // }));

    //const transientSourceCodeDebuggerAdapterFactory = new TransientSourceCodeDebugAdapterFactory();
    //const factoryRef = vscode.debug.registerDebugAdapterDescriptorFactory('prototyper-csharp', transientSourceCodeDebuggerAdapterFactory)
    //context.subscriptions.push(factoryRef);

    // vscode.languages.registerDocumentLinkProvider(
    //     { language: "csharp" },
    //     {
    //         provideDocumentLinks(document, token) {
    //             return [new vscode.DocumentLink(
    //                 new vscode.Range(new vscode.Position(3, 4), new vscode.Position(3, 4)),
    //                 vscode.Uri.from({ scheme: 'untitled', path: 'Untitled-1' })
    //               )];
    //         },
    //     }
    //   );

    // vscode.debug.registerDebugAdapterTrackerFactory('coreclr', {
    //     createDebugAdapterTracker(session: vscode.DebugSession) {
    //         return {
    //             onWillReceiveMessage: m => {
    //                 if (m.command === 'source') {
    //                     console.log(`> ${JSON.stringify(m, undefined, 2)}`);
    //                 }
    //             },
    //             onDidSendMessage: m => {
    //                 if (m.command === 'source') {
    //                     console.log(`> ${JSON.stringify(m, undefined, 2)}`);
    //                 }
    //             },
    //         };
    //       }
    //   }
    // );
}

function Evaluate(languageOverride: string): void {
    if (vscode.window.activeTextEditor) {
        RunHeadless(languageOverride, vscode.window.activeTextEditor, vscode.window.terminals.find(t => t.name === prototerminal.name));
    }
}

function RunHeadless(languageOverride: string, editor: vscode.TextEditor, terminal: vscode.Terminal | undefined): void {
    const executionDelay = terminal ? 0 : instance.terminalInitialisationDelay, // HACK: This is pretty crappy but if we create a new terminal then we have to wait until it is ready. I couldn't find a 'proper' way to do this
          token = uuid.new();
    
    (terminal ??= vscode.window.createTerminal(prototerminal.options)).sendText(`cmd.exe /c "${headless.location}" -l ${languageOverride ?? editor.document.languageId} -i stream -t "${token}"`);

    setTimeout(() => {
        terminal!.sendText(''); // the empty line here serves no purpose - i just think it looks prettier
        for (var i = 0; i < editor.document.lineCount; i++) {
            terminal!.sendText(editor.document.lineAt(i).text);
        }
        terminal!.sendText(token); // Resending the token indicates to the script interpreter that there is no more to send
    }, executionDelay);

    terminal.show(true);
}

function Debug(language: string): void {
    if (language?.toLowerCase() !== 'csharp') {
        throw new Error(`Debugging is not currently supported for requested language: ${language}`);
    }

    const document = vscode.window.activeTextEditor?.document;
    if (document) {
        const token = uuid.new(), terminal = vscode.window.terminals.find(t => t.name === prototerminal.name) ?? vscode.window.createTerminal(prototerminal.options);

        let sourceFileUri = document.uri;
        if (document.uri.scheme === 'untitled') {
            sourceFileUri = sourceFileUri.with({ scheme: 'prototypewriter', path: `/${sourceFileUri.path}.cs` });
            vscode.workspace.fs.writeFile(sourceFileUri, Buffer.from(document.getText()));
        }

        vscode.window.showTextDocument(sourceFileUri, { preview: false }).then(editor => {
            terminal.sendText(`cmd.exe /c "${headless.location}" -l ${language} -m Debug -i stream -t "${token}" --cs-file-name "${editor.document.uri.toString(true).replace('prototypewriter:/', 'prototypewriter:///')}"`);

            setTimeout(() => {
                vscode.debug.startDebugging(undefined, headless.debugConfiguration, undefined);
                terminal.sendText(document.getText());
                terminal.sendText(token); // Resending the token indicates to the script interpreter that there is no more to send
            }, instance.terminalInitialisationDelay);
        
            terminal.show(true);
        });
    }
}