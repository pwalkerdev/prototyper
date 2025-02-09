__webpack_nonce__ = [].filter.call(document.getElementsByTagName('script'), e => !!e.nonce)[0].nonce;

import * as html from './index.html';
document.body.setHTMLUnsafe(`${html.default}\r\n${document.body.innerHTML}`);

const vscode = acquireVsCodeApi();

window.addEventListener('message', ({ data: message }) => {
    console.info(`message: ${message.type} recevied`, message.data);

    let state = vscode.getState() || { activeDocument: undefined };
    switch (message.type) {
        case 'activeDocumentChanged':
            state.activeDocument = message.data;
            break;
        case 'invalidateState':
            state = message.data;
            break;
    }

    onStateUpdated(state);
});

document.getElementById('evaluate-button').addEventListener('click', (e) => {
    console.info('evaluate button clicked', e);
    vscode.postMessage({ type: 'evaluate' });
});

function onStateUpdated(state) {
    document.getElementById('evaluate-button').innerHTML = `Evaluate ${state.activeDocument.fileName}`;
    document.getElementById('debug-button').innerHTML = `Debug ${state.activeDocument.fileName}`;

    vscode.setState(state);
}