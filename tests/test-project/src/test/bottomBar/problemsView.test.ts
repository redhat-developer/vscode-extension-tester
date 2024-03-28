import * as path from 'path';
import { TextEditor, EditorView, ProblemsView, BottomBarPanel, MarkerType, VSBrowser } from 'vscode-extension-tester';
import { expect } from 'chai';

 describe('ProblemsView', function () {
    let editor: TextEditor;
    let view: ProblemsView;
    let bar: BottomBarPanel;

    before(async function () {
        this.timeout(25000);
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', 'test-file.ts'));

        bar = new BottomBarPanel();
        await bar.toggle(true);
        view = await bar.openProblemsView();

        editor = await new EditorView().openEditor('test-file.ts') as TextEditor;
        await editor.setText('aaaa');
        await view.getDriver().wait(() => { return problemsExist(view); }, 15000);
    });

    after(async function () {
        await view.clearFilter();
        await editor.clearText();
        if (await editor.isDirty()) {
            await editor.save();
        }
        await new EditorView().closeAllEditors();
        await bar.toggle(false);
    });

    it('get all markers works', async function () {
        const markers = await view.getAllVisibleMarkers(MarkerType.Any);
        expect(markers.length).greaterThan(1);
    });

    it('get warnings works', async function () {
        const markers = await view.getAllVisibleMarkers(MarkerType.Warning);
        expect(markers).empty;
    });

    it('get errors works', async function () {
        const markers = await view.getAllVisibleMarkers(MarkerType.Error);
        expect(markers.length).equals(1);
    });

    it('get files works', async function () {
        const markers = await view.getAllVisibleMarkers(MarkerType.File);
        expect(markers.length).equals(1);
    });

    it('filtering works', async function () {
        await view.setFilter('aaaa');
        await view.getDriver().sleep(500);
        const markers = await view.getAllVisibleMarkers(MarkerType.Any);
        expect(markers.length).equals(2);
    });

    describe('Marker', function () {
        it('getType works', async function () {
            const markers = await view.getAllVisibleMarkers(MarkerType.Error);
            expect(await markers[0].getType()).equals(MarkerType.Error);
        });

        it('getText works', async function () {
            const markers = await view.getAllVisibleMarkers(MarkerType.File);
            expect(await markers[0].getText()).has.string('test-file.ts');
        });

        it('toggleExpand works', async function () {
            const marker = (await view.getAllVisibleMarkers(MarkerType.File))[0];
            await marker.toggleExpand(false);
            let markers = await view.getAllVisibleMarkers(MarkerType.Any);
            expect(markers.length).equals(1);

            await marker.toggleExpand(true);
            markers = await view.getAllVisibleMarkers(MarkerType.Any);
            expect(markers.length).equals(2);
        });

        it('click works', async function () {
            const markers = await view.getAllVisibleMarkers(MarkerType.File);
            for (const marker of markers) {
                if(await marker.getLabel() === 'test-file.ts') {
                    await marker.click();
                }
            }
            const anyMarkers = await view.getAllVisibleMarkers(MarkerType.Any);
            expect(anyMarkers.length).equals(1);
        });
    });
});

async function problemsExist(view: ProblemsView) {
    const markers = await view.getAllVisibleMarkers(MarkerType.Any);
    return markers.length > 0;
}