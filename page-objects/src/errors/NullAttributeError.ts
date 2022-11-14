export class NullAttributeError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'NullAttributeError';
    }
}
