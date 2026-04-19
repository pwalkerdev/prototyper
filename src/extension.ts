import './global';
import * as vscode from 'vscode';
import { MemFS } from './providers/fileSystemProvider';
import { ConsoleViewProvider } from './providers/consoleViewProvider';
import { runHeadless, runMode } from './commands/runHeadless';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('prototypewriter', new MemFS(), { isCaseSensitive: true }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatecsharp', () => {
        if (!!vscode.window.activeTextEditor?.document && !!provider.headlessMessageProcessor) {
            runHeadless(vscode.window.activeTextEditor!.document, provider.headlessMessageProcessor, runMode.compileAndInvoke, 'CSharp');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.evaluatejs', () => {
        if (!!vscode.window.activeTextEditor?.document && !!provider.headlessMessageProcessor) {
            runHeadless(vscode.window.activeTextEditor!.document, provider.headlessMessageProcessor, runMode.compileAndInvoke, 'JavaScript');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extension.prototyper.debugcsharp', () => {
        if (!!vscode.window.activeTextEditor?.document && !!provider.headlessMessageProcessor) {
            runHeadless(vscode.window.activeTextEditor!.document, provider.headlessMessageProcessor, runMode.debug, 'CSharp');
        }
    }));

    context.subscriptions.push(
        vscode.window.registerTerminalLinkProvider({
            provideTerminalLinks: (context, token) => {
            const regex = /prototypewriter:((\/?\/?\/)|(\\?\\?\\))[-a-zA-Z0-9@:%._\+\\~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+\\.~#?&//]*)((=| )?[0-9]*)/;
            const matches = (context.line as string)?.match(regex);

            return !!matches?.index
                ? matches
                    .filter((m: any) => { return !!m?.startsWith('prototypewriter'); })
                    .map((m: any) => {
                        return {
                            startIndex: matches.index!,
                            length: m.length,
                            tooltip: 'Show in editor',
                            target: m
                        };
                    })
                : [];
            },
            handleTerminalLink: (link: any) => {
                // TODO: This currently only supports .cs files because that's all we need for now
                let segments = link.target.split(':');
                let line = segments.length === 3 ? parseInt(segments[2].split(' ').pop().split('=').pop()) - 1 : segments[2] ?? 0;
                vscode.window.showTextDocument(vscode.Uri.from({ scheme:  segments[0], path: segments[1]}), { preview: false, selection: new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0)) });
            }
        })
    );

    const provider = new ConsoleViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ConsoleViewProvider.ViewType, provider, { webviewOptions: { retainContextWhenHidden: true }}));
}
