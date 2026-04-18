import * as vscode from 'vscode';
import { spawn } from 'node:child_process';
import { nonce, headless, uuid } from './global';

export class ConsoleViewProvider implements vscode.WebviewViewProvider {
    public static readonly ViewType = 'prototyper.console';
    private readonly _nonce: nonce = nonce.new();
    private _view: vscode.WebviewView | undefined = undefined;
    private _viewContext: vscode.WebviewViewResolveContext | undefined = undefined;

    constructor(private readonly _extensionContext: vscode.ExtensionContext) {
        _extensionContext.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => {
            if (!!e && !!this._view) {
                this._view.webview.postMessage({ type: 'activeDocumentChanged', data: e.document });
            }
        }));
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._view = webviewView;
        this._viewContext = context;

        this._view.webview.options = { enableScripts: true, localResourceRoots: [ this._extensionContext.extensionUri ] };

        this._view.webview.html = this.getHtmlForWebview();

        this._view.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'compileAndInvoke':
                case 'debug':
                    this.runHeadless(vscode.window.activeTextEditor!.document, data.type);
                    break;
            }
        });

        this._view.webview.postMessage({ type: 'activeDocumentChanged', data: vscode.window.activeTextEditor?.document });
    }

    private getHtmlForWebview() {
        const scriptUri = this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionContext.extensionUri, 'dist', 'prototyper-web-view.js'));
        return `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._view?.webview.cspSource} 'nonce-${this._nonce}'; script-src 'nonce-${this._nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">

                    <title>Prototyper: Console</title>
                </head>
                <body id="prototyper-web-view-${this._nonce}">
                    <script nonce="${this._nonce}" src="${scriptUri}"></script>
                </body>
            </html>`;
    }

    private runHeadless(document: vscode.TextDocument, mode: string, language: string | null = null) {
        if (!document) {
            return 'Invalid document specified';
        }

        const input = 'stream';
        const token = uuid.new();
        const implementationScheme = 'Method';

        const command = `./${headless.fileName}`;
        const args = [
            '-m', `${mode}`,
            '-l', `${language ?? document.languageId.toString()}`,
            '-i', `${input}`,
            '-t', `${token}`,
            '--cs-impl-scheme', `${implementationScheme}`
        ];
        const directory = `${headless.directory}`;

        let runner = spawn(command, args, { cwd: directory })
            .on('spawn', () => {
                this._view?.webview.postMessage({ type: 'headlessSpawned', data: { token, fileName: document.fileName, mode: mode.toFriendlyName() } });

                runner.stdout.on('data', (chunk) => this._view?.webview.postMessage({ type: 'headlessOutput', data: { type: 'stdout', token, buffer: Buffer.from(chunk).toString('utf8') } }));
                runner.stderr.on('data', (chunk) => this._view?.webview.postMessage({ type: 'headlessOutput', data: { type: 'stderr', token, buffer: Buffer.from(chunk).toString('utf8') } }));

                runner.stdin?.setDefaultEncoding('utf8');
                runner.stdin.write(`${document.getText()}\n${token}\n`);
                runner.stdin.end();
            })
            .on('close', async (exitCode: number, exitSignal: string) => {
                this._view?.webview.postMessage({ type: 'headlessExited', data: { token, exitCode, exitSignal } });
            })
            .on('error', (err) => {
                console.error('fuck', err);
            });
    }
}
