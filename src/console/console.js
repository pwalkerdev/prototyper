import './nonce.js';
import './styles/main.css';
import './styles/reset.css';
import './styles/vscode.css';

// This script will be run within a webview container. It cannot access the VS Code API.
(function () {
    const vscode = acquireVsCodeApi();
    const state = vscode.getState() || { };

    window.addEventListener('message', (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'activeDocumentChanged':
                console.log('activeDocumentChanged');
                break;
        }
    });

    document.getElementById('evaluate-button').addEventListener('click', (e) => {
        console.log("evaluate button clicked");
        vscode.postMessage({ type: 'evaluate' });
    });
}());