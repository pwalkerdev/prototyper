__webpack_nonce__ = [].filter.call(document.getElementsByTagName('script'), e => !!e.nonce)[0].nonce;

import * as html from './index.html';
document.body.setHTMLUnsafe(`${html.default}\r\n${document.body.innerHTML}`);

const vscode = acquireVsCodeApi();

window.addEventListener('message', ({ data: message }) => {
    console.trace(`message: ${message.type} recevied`, message.data);

    switch (message.type) {
        case 'activeDocumentChanged':
            onActiveDocumentChanged(message.data);
            break;
        case 'headlessSpawned':
            onHeadlessSpawned(message.data);
            break;
        case 'headlessExited':
            onHeadlessExited(message.data);
            break;
        case 'headlessOutput':
            onHeadlessOutput(message.data);
            break;
    }
});

document.getElementById('evaluate-button').addEventListener('click', (e) => {
    vscode.postMessage({ type: 'compileAndInvoke' });
});

document.getElementById('debug-button').addEventListener('click', (e) => {
    vscode.postMessage({ type: 'debug' });
});

function onActiveDocumentChanged(activeDocument) {
    const supportedLanguage = ['csharp', 'javascript', 'typescript'].indexOf(activeDocument?.languageId) > -1;
    document.querySelector('body div.pt-result-container div')?.setAttribute('class', supportedLanguage ? 'view-lines' : 'hidden');
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

function onHeadlessSpawned(instanceInfo) {
    const state = vscode.getState();
    state.headlessInstances = !!state.headlessInstances.set ? state.headlessInstances : new Map();
    state.headlessInstances.set(instanceInfo.token, instanceInfo);

    vscode.setState(state);
}

function onHeadlessExited(instanceInfo) {
    const lineElement = createElement(document.getElementById('output'), 'div', { className: `view-line` });
    const spanElement = createElement(lineElement, 'span',  {});
    createElement(spanElement, 'span', { className: 'mtk5', innerHTML: '---' });
}

function onHeadlessOutput(output) {
    output.buffer
        .split('\n')
        .filter(b => b.trim().length)
        .map((b) => {
            const segments = b.split(' ').filter(c => c.trim().length);
            const lineElement = createElement(document.getElementById('output') , 'div', { className: `view-line` });
            const spanElement = createElement(lineElement, 'span',  {});

            // YUCKY: this is a pretty crappy way to split out the log message template from any subsequent log lines but it works and it is all im gonna do for now so cringe away
            if (new Date(segments[0]).toString() !== 'Invalid Date' && segments.length > 3) {
                const level = segments[2].substring(1, segments[2].length - 1).toLowerCase();
                createElement(spanElement, 'span', { className: 'mtk5', innerHTML: segments[0] });
                createElement(spanElement, 'span', { className: 'mtk1', innerHTML: '&nbsp;' });
                createElement(spanElement, 'span', { className: 'mtk5', innerHTML: segments[1] });
                createElement(spanElement, 'span', { className: 'mtk1', innerHTML: '&nbsp;' });
                createElement(spanElement, 'span', { className: `${level} 69420`, innerHTML: segments[2] });
                createElement(spanElement, 'span', { className: 'mtk1', innerHTML: '&nbsp;' });
                createElement(spanElement, 'span', { className: 'mtk1', innerHTML: segments.slice(3).join(' ') });
            } else {
                const levels = document.querySelectorAll('.view-lines .view-line span span[class~="69420"]');
                createElement(spanElement, 'span', { className: 'mtk1', innerHTML: '&nbsp;' });
                createElement(spanElement, 'span', { className: 'mtk1', innerHTML: '&nbsp;' });
                createElement(spanElement, 'span', { className: levels[levels.length - 1].className, innerHTML: b });
            }
        });
}
