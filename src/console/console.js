import './nonce.js';
import * as mainStyles from './styles/main.css';
import * as resetStyles from './styles/reset.css';
import * as vscodeStyles from './styles/vscode.css';

// This script will be run within a webview container. It cannot access the VS Code API.
(function () {
    const vscode = acquireVsCodeApi();
    const state = vscode.getState() || { };

    console.log('hello from the inside');
}());