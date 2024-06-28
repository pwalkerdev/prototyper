import * as vscode from 'vscode';
import { DebugProtocol } from '@vscode/debugprotocol';

class TransientSourceCodeDebugAdapter implements vscode.DebugAdapter {

    private sendMessage = new vscode.EventEmitter<vscode.DebugProtocolMessage>();
    private sequence = 1;

    readonly onDidSendMessage: vscode.Event<vscode.DebugProtocolMessage> = this.sendMessage.event;
    

    handleMessage(message: vscode.DebugProtocolMessage): void {
        const request = <any>message;
        switch (request.type) {
            case 'request':
                const request = <DebugProtocol.Request>message;
                switch (request.command) {
                    case 'initialize':
                        const response: any = {
                            type: 'response',
                            seq: this.sequence++,
                            success: true,
                            request_seq: request.seq,
                            command: request.command,
                        };
                        this.sendMessage.fire(response);
                        break;
                    default:
                        break;
                }
                break;
            case 'response':
                break;
            case 'event':
                break;
        }
    }

    dispose() {
        // clean up resources
    }
}

export class TransientSourceCodeDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {

    createDebugAdapterDescriptor(_session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        // since DebugAdapterInlineImplementation is proposed API, a cast to <any> is required for now
        return <any>new vscode.DebugAdapterInlineImplementation(new TransientSourceCodeDebugAdapter());
    }
}