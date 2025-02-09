import * as vscode from 'vscode';
import { nonce } from './global';

export class ConsoleViewProvider implements vscode.WebviewViewProvider {
	public static readonly ViewType = 'prototyper.console';
	private readonly _nonce: nonce = nonce.new();
	private _view: vscode.WebviewView | undefined = undefined;
	private _viewContext: vscode.WebviewViewResolveContext | undefined = undefined;

	constructor(private readonly _extensionContext: vscode.ExtensionContext) {
		_extensionContext.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => {
			if (!!e && !!this._view) {
				this._view.webview.html = this._getHtmlForWebview();
			}
		}));
	}

	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
		this._view = webviewView;
		this._viewContext = context;

		this._view.webview.options = {
			enableScripts: true,
			localResourceRoots: [ this._extensionContext.extensionUri ],
		};

		this._view.webview.html = this._getHtmlForWebview();

		this._view.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'evaluate':
					break;
			}
		});
	}

	private _getHtmlForWebview() {
		const scriptUri = this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionContext.extensionUri, 'dist', 'console.js'));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._view?.webview.cspSource} 'nonce-${this._nonce}'; script-src 'nonce-${this._nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Prototyper: Console</title>
			</head>
			<body>

				<div class="pt-result-container">
					<textarea rows="10" readonly="readonly"></textarea>
				</div>

				<div class="pt-toolbar">
					<button class="pt-button pt-debug-button" id="debug-button">Debug ${vscode.window.activeTextEditor?.document.fileName}</button>
					<button class="pt-button pt-evaluate-button" id="evaluate-button">Evaluate ${vscode.window.activeTextEditor?.document.fileName}</button>
				</div>

				<script nonce="${this._nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}