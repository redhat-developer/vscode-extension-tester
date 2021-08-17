import * as path from 'path';
import { TextEditor, EditorView, ProblemsView, BottomBarPanel, MarkerType, VSBrowser } from "vscode-extension-tester";
import { expect } from 'chai';

(process.platform === 'darwin' ? describe.skip : describe)('ProblemsView', () => {
    let editor: TextEditor;
    let view: ProblemsView;
    let bar: BottomBarPanel;

    before(async function() {
        this.timeout(25000);
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file.ts'));

        bar = new BottomBarPanel();
        await bar.toggle(true);
        view = await bar.openProblemsView();

        editor = await new EditorView().openEditor('test-file.ts') as TextEditor;
        await editor.setText('aaaa');
        await view.getDriver().wait(() => { return problemsExist(view); }, 15000);
    });

    after(async () => {
        await view.clearFilter();
        await editor.clearText();
        if (await editor.isDirty()) {
            await editor.save();
        }
        await new EditorView().closeAllEditors();
        await bar.toggle(false);
    });

    it('get all markers works', async () => {
        const markers = await view.getAllMarkers(MarkerType.Any);
        expect(markers.length).greaterThan(1);
    });

    it('get warnings works', async () => {
        const markers = await view.getAllMarkers(MarkerType.Warning);
        expect(markers).empty;
    });

    it('get errors works', async () => {
        const markers = await view.getAllMarkers(MarkerType.Error);
        expect(markers.length).equals(1);
    });

    it('get files works', async () => {
        const markers = await view.getAllMarkers(MarkerType.File);
        expect(markers.length).equals(1);
    });

    it('filtering works', async () => {
        await view.setFilter('aaaa');
        await view.getDriver().sleep(500);
        const markers = await view.getAllMarkers(MarkerType.Any);
        expect(markers.length).equals(2);
    });

    describe('Marker', () => {
        it('getType works', async () => {
            const markers = await view.getAllMarkers(MarkerType.Error);
            expect(await markers[0].getType()).equals(MarkerType.Error);
        });

        it('getText works', async () => {
            const markers = await view.getAllMarkers(MarkerType.File);
            expect(await markers[0].getText()).has.string('test-file.ts');
        });

        it('toggleExpand works', async () => {
            const marker = (await view.getAllMarkers(MarkerType.File))[0];
            await marker.toggleExpand(false);
            let markers = await view.getAllMarkers(MarkerType.Any);
            expect(markers.length).equals(1);


            await marker.toggleExpand(true);
            markers = await view.getAllMarkers(MarkerType.Any);
            expect(markers.length).equals(2);
        });
    });
});

async function problemsExist(view: ProblemsView) {
    const markers = await view.getAllMarkers(MarkerType.Any);
    return markers.length > 0;
}