declare global {
    interface String {
        toFriendlyName(): string;
    }
}

String.prototype.toFriendlyName = function (): string {
    return this
        .replace(/^./, char => char.toUpperCase()) // Capitalize the first character
        .replace(/([a-z])([A-Z])/g, '$1 $2'); // Adds space before uppercase letters
};
