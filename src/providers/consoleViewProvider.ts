import * as vscode from 'vscode';
import { nonce } from '../infrastructure/nonce';
import { headlessMessageProcessor, runHeadless } from '../commands/runHeadless';

export class ConsoleViewProvider implements vscode.WebviewViewProvider {
    public static readonly ViewType = 'prototyper.console';
    private readonly _nonce: nonce = nonce.new();
    private _view: vscode.WebviewView | undefined = undefined;

    constructor(private readonly _extensionContext: vscode.ExtensionContext) {
        _extensionContext.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => {
            if (!!e && !!this._view) {
                this._view.webview.postMessage({ type: 'activeDocumentChanged', data: e.document });
            }
        }));
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        (this as any).headlessMessageProcessor = (msg: any) => { webviewView.webview.postMessage(msg); };
        this._view = webviewView;
        this._view.webview.options = {
            enableScripts: true,
            localResourceRoots: [ this._extensionContext.extensionUri ],
        };

        this._view.webview.html = this.getHtmlForWebview();

        this._view.webview.onDidReceiveMessage(data => {
            if (!vscode.window.activeTextEditor?.document || !this._view || !this.headlessMessageProcessor) {
                return;
            }

            switch (data.type) {
                case 'compileAndInvoke':
                case 'debug':
                    runHeadless(vscode.window.activeTextEditor.document, this.headlessMessageProcessor, data.type);
                    break;
            }
        });

        this._view.webview.postMessage({ type: 'activeDocumentChanged', data: vscode.window.activeTextEditor?.document });
    }

    public readonly headlessMessageProcessor: headlessMessageProcessor | undefined;

    private getHtmlForWebview() {
        const scriptUri = this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionContext.extensionUri, 'dist', 'prototyper-web-view.js'));
        return `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta
                        http-equiv="Content-Security-Policy"
                        content="default-src 'self';
                                 connect-src ${this._view?.webview.cspSource} 'nonce-${this._nonce}';
                                 style-src ${this._view?.webview.cspSource} 'nonce-${this._nonce}';
                                 script-src 'nonce-${this._nonce}';"
                    >

                    <title>Prototyper: Console</title>
                </head>
                <body id="prototyper-web-view-${this._nonce}">
                    <script nonce="${this._nonce}" src="${scriptUri}"></script>
                </body>
            </html>`;
    }
}
