import * as vscode from 'vscode';
import { ChildProcess, exec, spawn } from 'node:child_process';
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

        this._view.webview.options = {
            enableScripts: true,
            localResourceRoots: [ this._extensionContext.extensionUri ]
        };

        this._view.webview.html = this.getHtmlForWebview();

        this._view.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'evaluate':
                    this.runHeadless(vscode.window.activeTextEditor!.document, null);
                    break;
                case 'debug':
                    break;
            }
        });

        const state = {
            activeDocument: vscode.window.activeTextEditor?.document
        };
        this._view.webview.postMessage({ type: 'invalidateState', data: state });
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

    private runHeadless(document: vscode.TextDocument, language: string | null) {
        if (!document) {
            return 'Invalid document specified';
        }

        const mode = 'Debug';
        language = language ?? document.languageId.toString();
        const input = 'stream';
        const token = uuid.new();
        const implementationScheme = 'Method';

        // const script: string = 'public int Main() { return 69; }';
        // const command: string = `"${headless.location}" -m ${mode} -l ${language} -i commandLine -s "${script}" --cs-impl-scheme ${implementationScheme}`;

        // let runner = exec(command, (error, stdout, stderr) => {
        //     console.log(`stdout: ${stdout}`);
        //     console.error(`stderr: ${stderr}`);
        // });

        const command = `./${headless.fileName}`;
        const args = [
            '-m', `${mode}`,
            '-l', `${language}`,
            '-i', `${input}`,
            '-t', `${token}`,
            '--cs-impl-scheme', `${implementationScheme}`
        ];
        const directory = `${headless.directory}`;

        let runner = spawn(command, args, {
            cwd: directory
        }).on('spawn', (proc: any) => {
            console.log('yipee');

            runner.stdin?.setDefaultEncoding('utf8');
            runner.stdout.pipe(process.stdout);
            runner.stderr.pipe(process.stderr);

            runner.stdin.write(`${document.getText()}\n`);
            runner.stdin.write(`${token}\n`);
            runner.stdin.end();
        }).on('error', (err) => {
            console.error('fuck');
        });
    }
}