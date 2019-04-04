/**
 * General purpose native dialog
 */
export interface NativeDialog {
    /**
     * Confirms the dialog
     */
    confirm(): void | Promise<void>;

    /**
     * Cancels the dialog
     */
    cancel(): void;
}