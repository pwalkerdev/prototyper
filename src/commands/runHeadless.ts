import * as vscode from 'vscode';
import { spawn } from 'node:child_process';
import { uuid } from '../infrastructure/uuid';
import { headless } from '../infrastructure/headless';

export type headlessMessageProcessor = (message: any) => Thenable<boolean>;

export enum runMode {
  compileAndInvoke = 'compileAndInvoke',
  compileOnly = 'compileOnly',
  debug = 'debug'
}

export function runHeadless(document: vscode.TextDocument, messageProcessor: headlessMessageProcessor, mode: runMode, language: string | null = null) {
    const input = 'stream';
    const token = uuid.new();
    const implementationScheme = 'Method';

    const command = `./${headless.fileName}`;
    const args = [
        '-m', mode,
        '-l', language ?? document.languageId.toString(),
        '-i', input,
        '-t', token,
        '--cs-impl-scheme', implementationScheme,
        //'--cs-file-name', document.isUntitled ? document.fileName : document.uri.toString(true)
        '--cs-file-name', document.fileName
    ];
    const directory = `${headless.directory}`;

    let runner = spawn(command, args, { cwd: directory })
        .on('spawn', () => {
            messageProcessor({ type: 'headlessSpawned', data: { token, fileName: document.fileName, mode: mode.toString().toFriendlyName() } });

            runner.stdout.on('data', (chunk) => messageProcessor({ type: 'headlessOutput', data: { type: 'stdout', token, buffer: Buffer.from(chunk).toString('utf8') } }));
            runner.stderr.on('data', (chunk) => messageProcessor({ type: 'headlessOutput', data: { type: 'stderr', token, buffer: Buffer.from(chunk).toString('utf8') } }));

            runner.stdin?.setDefaultEncoding('utf8');
            runner.stdin.write(`${document.getText()}\n${token}\n`);
            runner.stdin.end();
        })
        .on('close', async (exitCode: number, exitSignal: string) => {
            messageProcessor({ type: 'headlessExited', data: { token, exitCode, exitSignal } });
        })
        .on('error', (err) => {
            console.error('fuck', err);
        });
}
