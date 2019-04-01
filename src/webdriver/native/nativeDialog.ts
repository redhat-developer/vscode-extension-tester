export interface NativeDialog {
    confirm(): void | Promise<void>;
    cancel(): void;
}