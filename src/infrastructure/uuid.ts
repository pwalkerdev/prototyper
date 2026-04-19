///<summary>
/// This is a simple low effort implementation of UUID v4; this spec was chosen because of it's lack of any specific input seed to be used to generate the output.
/// Essentially the result legally can be completely "random" and in fact it is, which minimises complexity.
/// for more info on UUIDs see: https://datatracker.ietf.org/doc/html/rfc4122#section-4.1.3
///</summary>
export class uuid {
    static new(): string { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | (c === 'x' ? 0 : 0 & 0x3 | 0x8)).toString(16)); }
}
