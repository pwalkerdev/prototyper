///<summary>
/// Generates a new `nonce` key
///</summary>
export class nonce {
    static new(): string { return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0).toString(16)); }
}
