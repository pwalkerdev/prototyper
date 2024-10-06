import * as vscode from 'vscode';
import { headless, instance, uuid, prototerminal } from './global';
//import { TransientSourceCodeDebugAdapterFactory } from './transientSourceCodeDebugAdapter';
import { MemFS } from './fileSystemProvider';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('prototypewriter', new MemFS(), { isCaseSensitive: true }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatecsharp', () => Evaluate("CSharp")));
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatejs', () => Evaluate("JavaScript")));
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.debugcsharp', () => Debug("CSharp")));

    //const transientSourceCodeDebuggerAdapterFactory = new TransientSourceCodeDebugAdapterFactory();
    //const factoryRef = vscode.debug.registerDebugAdapterDescriptorFactory('prototyper-csharp', transientSourceCodeDebuggerAdapterFactory)
    //context.subscriptions.push(factoryRef);

    // vscode.languages.registerDocumentLinkProvider(
    //     { language: "csharp" },
    //     {
    //         provideDocumentLinks(document, token) {
    //             if (!token.isCancellationRequested && document.uri.scheme === 'prototypewriter') {
    //                 return [new vscode.DocumentLink(
    //                     new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
    //                     vscode.Uri.from({ scheme: 'prototypewriter', path: '/Untitled-1.cs' })
    //                   )];
    //             }
    //             return null;
    //         },
    //         resolveDocumentLink(link, token) {
    //             if (link.target?.scheme === 'prototypewriter') {
    //                 console.log('sssa');
    //             }
    //             return null;
    //         }
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

function Debug(language: string): void {
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