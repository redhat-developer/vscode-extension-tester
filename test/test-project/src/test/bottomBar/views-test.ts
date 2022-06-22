import { expect } from 'chai';
import { BottomBarPanel, OutputView, TerminalView, VSBrowser, Workbench } from 'vscode-extension-tester';

(process.platform === 'darwin' ? describe.skip : describe)('Output View/Text Views', () => {
    let panel: BottomBarPanel;
    let view: OutputView;
    const channelName = 'Git';

    before(async () => {
        const center = await new Workbench().openNotificationsCenter();
        await center.clearAllNotifications();
        await center.close();
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
        await view.selectChannel('Tasks');
        const final = await view.getCurrentChannel();
        expect('Tasks').equals(final);
    });

    it('getText returns all current text', async () => {
        await view.selectChannel(channelName);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const text = await view.getText();
        expect(text).not.empty;
    });

    it('clearText clears the text view', async () => {
        await view.selectChannel(channelName);
        const text = await view.getText();
        await view.clearText();
        const cleared = await view.getText();
        expect(cleared).not.has.string(text);
    });

    describe('Terminal View', () => {
        let terminal: TerminalView;
        let terminalName = process.platform === 'win32' ? (VSBrowser.instance.version >= '1.53.0' ? 'pwsh' : 'powershell') : 'bash';

        before(async () => {
            terminal = await panel.openTerminalView();
            await new Promise(res => setTimeout(res, 2000));
        });

        it('getText returns all current text', async () => {
            try {
                await terminal.selectChannel(`1: ${terminalName}`);
            } catch (err) {
                terminalName = 'sh';
                await terminal.selectChannel(`1: ${terminalName}`);
            }
            const text = await terminal.getText();
            expect(text).not.empty;
        });

        it('executeCommand works', async () => {
            const command = `${process.platform === 'win32' ? 'start-sleep -s' : 'sleep'} 2`
            await terminal.executeCommand(command, 3000);
        })

        it('newTerminal opens a new term channel', async () => {
            await terminal.newTerminal();
            const channel = await terminal.getCurrentChannel();
            expect(channel).equals(`2: ${terminalName}`);
        });
    });
});
