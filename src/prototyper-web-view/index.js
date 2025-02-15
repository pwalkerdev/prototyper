__webpack_nonce__ = [].filter.call(document.getElementsByTagName('script'), e => !!e.nonce)[0].nonce;

import * as html from './index.html';
document.body.setHTMLUnsafe(`${html.default}\r\n${document.body.innerHTML}`);

const vscode = acquireVsCodeApi();
onStateUpdated(vscode.getState());

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

document.getElementById('debug-button').addEventListener('click', (e) => {
    console.info('debug button clicked', e);
    vscode.postMessage({ type: 'debug' });
});

function onStateUpdated(state) {
    const supportedLanguage = ['csharp', 'javascript', 'typescript'].indexOf(state.activeDocument?.languageId) > -1;
    document.querySelector('body div.pt-result-container div')?.setAttribute('class', supportedLanguage ? '' : 'hidden');
    document.querySelector('body div.pt-result-container textarea')?.setAttribute('class', supportedLanguage ? '' : 'hidden');
    document.querySelector('body div.pt-result-container h1')?.setAttribute('class', supportedLanguage ? 'hidden' : '');
    document.querySelector('body div.pt-toolbar')?.setAttribute('class', supportedLanguage ? 'pt-toolbar' : 'hidden pt-toolbar');

    if (!supportedLanguage) {
        vscode.setState(state);
        return;
    }

    document.getElementById('evaluate-button').innerHTML = `Evaluate ${state.activeDocument.fileName}`;
    document.getElementById('debug-button').innerHTML = `Debug ${state.activeDocument.fileName}`;

    vscode.setState(state);
}