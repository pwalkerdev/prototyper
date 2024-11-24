import * as vscode from 'vscode';
import { nonce } from './global';

export class ConsoleViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'prototyper.console';
	private readonly _nonce: nonce = nonce.new();

	constructor(private readonly _extensionUri: vscode.Uri) { }

	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [ this._extensionUri ]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'evaluate':
					break;
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'console.js'));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${this._nonce}'; script-src 'nonce-${this._nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Prototyper: Console</title>
			</head>
			<body>
				<h1>HELLO WORLD!</h1>

				<div>
					<button>TEST</button>
				</div>

				<script nonce="${this._nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}