import { Workbench, TextEditor, EditorView, ProblemsView, BottomBarPanel, MarkerType } from "vscode-extension-tester";
import { expect } from 'chai';

describe('ProblemsView', () => {
    let editor: TextEditor;
    let view: ProblemsView;

    before(async function() {
        this.timeout(5000);
        await new Workbench().executeCommand('open test file');
        await new Promise((res) => { setTimeout(res, 1000); });

        editor = await new EditorView().openEditor('test-file.ts') as TextEditor;
        await editor.setText('aaaa');
        const bar = new BottomBarPanel();
        await bar.toggle(true);
        view = await bar.openProblemsView();
    });

    after(async () => {
        await view.clearFilter();
        await editor.setText('');
        await new EditorView().closeAllEditors();
    });

    it('get all markers works', async () => {
        const markers = await view.getAllMarkers(MarkerType.Any);
        expect(markers.length).equals(3);
    });

    it('get warnings works', async () => {
        const markers = await view.getAllMarkers(MarkerType.Warning);
        expect(markers.length).equals(2);
    });

    it('get errors works', async () => {
        const markers = await view.getAllMarkers(MarkerType.Error);
        expect(markers).empty;
    });

    it('get files works', async () => {
        const markers = await view.getAllMarkers(MarkerType.File);
        expect(markers.length).equals(1);
    });

    it('filtering works', async () => {
        await view.setFilter('Missing semicolon');
        await view.getDriver().sleep(500);
        const markers = await view.getAllMarkers(MarkerType.Any);
        expect(markers.length).equals(2);
        await view.getDriver().sleep(500);
        await view.setFilter('*');
    });

    describe('Marker', () => {
        it('getType works', async () => {
            const markers = await view.getAllMarkers(MarkerType.Warning);
            expect(await markers[0].getType()).equals(MarkerType.Warning);
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
            expect(markers.length).equals(3);
        });
    });
});