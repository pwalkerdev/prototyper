__webpack_nonce__ = [].filter.call(document.getElementsByTagName('script'), e => !!e.nonce)[0].nonce;

import * as html from './index.html';
document.body.setHTMLUnsafe(`${html.default}\r\n${document.body.innerHTML}`);

const vscode = acquireVsCodeApi();

window.addEventListener('message', ({ data: message }) => {
    console.info(`message: ${message.type} recevied`, message.data);

    switch (message.type) {
        case 'activeDocumentChanged':
            onActiveDocumentChanged(message.data);
            break;
        case 'headlessSpawned':
            onHeadlessSpawned(message.data);
            break;
        case 'headlessExited':
            // todo
            break;
        case 'headlessOutput':
            onHeadlessOutput(message.data);
            break;
    }
});

document.getElementById('evaluate-button').addEventListener('click', (e) => {
    console.info('evaluate button clicked', e);
    vscode.postMessage({ type: 'evaluate' });
});

document.getElementById('debug-button').addEventListener('click', (e) => {
    console.info('debug button clicked', e);
    vscode.postMessage({ type: 'debug' });
});

function onActiveDocumentChanged(activeDocument) {
    const supportedLanguage = ['csharp', 'javascript', 'typescript'].indexOf(activeDocument?.languageId) > -1;
    document.querySelector('body div.pt-result-container div')?.setAttribute('class', supportedLanguage ? '' : 'hidden');
    document.getElementById('output')?.setAttribute('class', supportedLanguage ? '' : 'hidden');
    document.querySelector('body div.pt-result-container h1')?.setAttribute('class', supportedLanguage ? 'hidden' : '');
    document.querySelector('body div.pt-toolbar')?.setAttribute('class', supportedLanguage ? 'pt-toolbar' : 'hidden pt-toolbar');

    if (supportedLanguage) {
        document.getElementById('evaluate-button').innerHTML = `Evaluate ${activeDocument.fileName}`;
        document.getElementById('debug-button').innerHTML = `Debug ${activeDocument.fileName}`;
    }

    vscode.setState({ ...vscode.getState(), activeDocument });
}

function createElement(parent, type, configurator) {
    const result = document.createElement(type);
    Object.keys(configurator ?? {}).map((k) => { result[k] = configurator[k]; });
    parent.appendChild(result);
    return result;
}

function onTreeViewParentClicked(e) {
    e.target.parentElement.querySelector('ul')?.classList.toggle('hidden');
    e.target.parentElement.querySelector('.pt-tree-view-parent')?.classList.toggle('pt-tree-view-parent-expanded');
}

function onHeadlessSpawned(instanceInfo) {
    const parent = createElement(document.getElementById('output'), 'li', { id: `output-${instanceInfo.token}`, className: 'pt-tree-view' });
    const topLevelHeading = createElement(parent, 'h1', { className: 'pt-tree-view-parent pt-tree-view-parent-expanded', innerHTML: `${new Date().toLocaleTimeString().split(' ')[0]} - Evaluate ${instanceInfo.fileName}` });
    topLevelHeading.addEventListener('click', onTreeViewParentClicked);
    createElement(parent, 'ul', { className: 'pt-tree-view' });

    const state = vscode.getState();
    state.headlessInstances = !!state.headlessInstances.set ? state.headlessInstances : new Map();
    state.headlessInstances.set(instanceInfo.token, instanceInfo);

    vscode.setState(state);
}

function onHeadlessOutput(output) {
    const types = document.querySelector(`#output-${output.token} ul`);
    const type = types.querySelector(`#heading-${output.type}-${output.token}`) ?? createElement(types, 'li', { id: `heading-${output.type}-${output.token}`, className: 'pt-tree-view' });
    const lines = type.querySelector('ul') ?? createElement(type, 'ul', { id: `${output.type}-${output.token}`, className: 'pt-tree-view' });

    output.buffer.split('\n').filter(b => b.trim().length).map(b => createElement(lines, 'h3', { className: `pt-tree-view ${output.type}` }).innerHTML = b.trim());
}