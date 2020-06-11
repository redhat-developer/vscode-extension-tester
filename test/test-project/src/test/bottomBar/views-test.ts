import { expect } from 'chai';
import { BottomBarPanel, OutputView, TerminalView, Workbench } from 'vscode-extension-tester';

(process.platform === 'darwin' ? describe.skip : describe)('Output View/Text Views', () => {
    let panel: BottomBarPanel;
    let view: OutputView;

    before(async () => {
        const center = await new Workbench().openNotificationsCenter();
        await center.clearAllNotifications();
        panel = new BottomBarPanel();
        await panel.toggle(true);
        view = await panel.openOutputView();
    });

    after(async () => {
        await panel.toggle(false);
    });

    it('getChannelNames returns list of channels', async () => {
        const channels = await view.getChannelNames();
        expect(channels).not.empty;
    });

    it('getCurrentChannel returns the selected channel name', async () => {
        const channel = await view.getCurrentChannel();
        expect(channel).not.empty;
    });

    it('selectChannel works', async () => {
        const desired = 'Git';
        await view.selectChannel(desired);
        const final = await view.getCurrentChannel();
        expect(desired).equals(final);
    });

    it('getText returns all current text', async () => {
        await view.selectChannel('Git');
        const text = await view.getText();
        expect(text).not.empty;
    });

    it('clearText clears the text view', async () => {
        await view.selectChannel('Git');
        const text = await view.getText();
        await view.clearText();
        const cleared = await view.getText();
        expect(cleared).not.has.string(text);
    });

    describe('Terminal View', () => {
        let terminal: TerminalView;
        const terminalName = process.platform === 'win32' ? 'powershell' : 'bash';

        before(async () => {
            terminal = await panel.openTerminalView();
        });

        it('getText returns all current text', async function() {
            this.timeout(5000);
            await terminal.selectChannel(`1: ${terminalName}`);
            const text = await terminal.getText();
            expect(text).not.empty;
        });

        it('newTerminal opens a new term channel', async () => {
            await terminal.newTerminal();
            const channel = await terminal.getCurrentChannel();
            expect(channel).equals(`2: ${terminalName}`);
        });

        it('killTerminal destroys the current term channel', async () => {
            await terminal.killTerminal();
            const channels = await terminal.getChannelNames();
            expect(channels).not.contains(`2: ${terminalName}`);
            expect(await terminal.getCurrentChannel()).equals(`1: ${terminalName}`);
        });
    });
});
