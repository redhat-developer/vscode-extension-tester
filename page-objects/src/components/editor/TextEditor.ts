import { ContentAssist, ContextMenu, InputBox, Workbench } from "../..";
import { By, ChromiumWebDriver, Key, until, WebElement } from "selenium-webdriver";
import { fileURLToPath } from "url";
import * as clipboard from 'clipboardy';
import { StatusBar } from "../statusBar/StatusBar";
import { Editor } from "./Editor";
import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { Breakpoint } from "./Breakpoint";

export class BreakpointError extends Error {}

/**
 * Page object representing the active text editor
 */
export class TextEditor extends Editor {

    /**
     * Find whether the active editor has unsaved changes
     * @returns Promise resolving to true/false
     */
    async isDirty(): Promise<boolean> {
        const tab = await this.enclosingItem.findElement(TextEditor.locators.TextEditor.activeTab);
        const klass = await tab.getAttribute('class');
        return klass.indexOf('dirty') >= 0;
    }

    /**
     * Saves the active editor
     * @returns Promise resolving when ctrl+s is invoked
     */
    async save(): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 's'));
    }

    /**
     * Open the Save as prompt
     * 
     * @returns InputBox serving as a simple file dialog
     */
    async saveAs(): Promise<InputBox> {
        const tab = await this.getTab();
        await tab.sendKeys(Key.chord(TextEditor.ctlKey, Key.SHIFT, 's'));
        return InputBox.create();
    }

    /**
     * Retrieve the Uri of the file opened in the active editor
     * @returns Promise resolving to editor's underlying Uri
     */
    async getFileUri(): Promise<string> {
        const ed = await this.findElement(TextEditor.locators.TextEditor.editorContainer);
        return ed.getAttribute(TextEditor.locators.TextEditor.dataUri);
    }

    /**
     * Retrieve the path to the file opened in the active editor
     * @returns Promise resolving to editor's underlying file path
     */
    async getFilePath(): Promise<string> {
        return fileURLToPath(await this.getFileUri());
    }

    /**
     * Open/Close the content assistant at the current position in the editor by sending the default
     * keyboard shortcut signal
     * @param open true to open, false to close
     * @returns Promise resolving to ContentAssist object when opening, void otherwise
     */
    async toggleContentAssist(open: boolean): Promise<ContentAssist | void> {
        let isHidden = true;
        try {
            const assist = await this.findElement(TextEditor.locators.ContentAssist.constructor)
            const klass = await assist.getAttribute('class');
            const visibility = await assist.getCssValue('visibility');
            isHidden = klass.indexOf('visible') < 0 || visibility === 'hidden';
        } catch (err) {
            isHidden = true;
        }
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);

        if (open) {
            if (isHidden) {
                await inputarea.sendKeys(Key.chord(Key.CONTROL, Key.SPACE));
                await this.getDriver().wait(until.elementLocated(TextEditor.locators.ContentAssist.constructor), 2000);
            }
            const assist = await new ContentAssist(this).wait();
            await this.getDriver().wait(() => { return assist.isLoaded(); }, 10000);
            return assist;
        } else {
            if (!isHidden) {
                await inputarea.sendKeys(Key.ESCAPE);
            }
        }
    }

    /**
     * Get all text from the editor
     * @returns Promise resolving to editor text
     */
    async getText(): Promise<string> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a'), Key.chord(TextEditor.ctlKey, 'c'));
        await new Promise(res => setTimeout(res, 500));
        const text = clipboard.readSync();
        await inputarea.sendKeys(Key.UP);
        clipboard.writeSync('');
        return text;
    }

    /**
     * Replace the contents of the editor with a given text
     * @param text text to type into the editor
     * @param formatText format the new text, default false
     * @returns Promise resolving once the new text is copied over
     */
    async setText(text: string, formatText: boolean = false): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        clipboard.writeSync(text);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a'), Key.chord(TextEditor.ctlKey, 'v'));
        clipboard.writeSync('');
        if (formatText) {
            await this.formatDocument();
        }
    }

    /**
     * Deletes all text within the editor
     * @returns Promise resolving once the text is deleted
     */
    async clearText(): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a'));
        await inputarea.sendKeys(Key.BACK_SPACE);
    }

    /**
     * Get text from a given line
     * @param line number of the line to retrieve
     * @returns Promise resolving to text at the given line number
     */
    async getTextAtLine(line: number): Promise<string> {
        const text = await this.getText();
        const lines = text.split('\n');
        if (line < 1 || line > lines.length) {
            throw new Error(`Line number ${line} does not exist`);
        }
        return lines[line - 1];
    }

    /**
     * Replace the contents of a line with a given text
     * @param line number of the line to edit
     * @param text text to set at the line
     * @returns Promise resolving when the text is typed in
     */
    async setTextAtLine(line: number, text: string): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`);
        }
        const lines = (await this.getText()).split('\n');
        lines[line - 1] = text;
        await this.setText(lines.join('\n'));
    }

    /**
     * Get line number that contains the given text. Not suitable for multi line inputs.
     * 
     * @param text text to search for
     * @param occurrence select which occurrence of the search text to look for in case there are multiple in the document, defaults to 1 (the first instance)
     * 
     * @returns Number of the line that contains the start of the given text. -1 if no such text is found.
     * If occurrence number is specified, searches until it finds as many instances of the given text.
     * Returns the line number that holds the last occurrence found this way.
     */
    async getLineOfText(text: string, occurrence = 1): Promise<number> {
        let lineNum = -1;
        let found = 0;
        const lines = (await this.getText()).split('\n');

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(text)) {
                found++;
                lineNum = i + 1;
                if (found >= occurrence) {
                    break; 
                }
            }
        }
        return lineNum;
    }

    /**
     * Find and select a given text. Not usable for multi line selection.
     * 
     * @param text text to select
     * @param occurrence specify which onccurrence of text to select if multiple are present in the document
     */
    async selectText(text: string, occurrence = 1): Promise<void> {
        const lineNum = await this.getLineOfText(text, occurrence);
        if (lineNum < 1) {
            throw new Error(`Text '${text}' not found`);
        }
    
        const line = await this.getTextAtLine(lineNum);
        const column = line.indexOf(text) + 1;

        await this.moveCursor(lineNum, column);
        
        let actions = this.getDriver().actions();
        await actions.clear();
        actions.keyDown(Key.SHIFT);
        for (let i = 0; i < text.length; i++) {
            actions = actions.sendKeys(Key.RIGHT);
        }
        actions = actions.keyUp(Key.SHIFT);
        await actions.perform();
        await new Promise(res => setTimeout(res, 500));
    }

    /**
     * Get the text that is currently selected as string
     */
    async getSelectedText(): Promise<string> {
        const selection = await this.getSelection();
        if (!selection) {
            return '';
        }
        const menu = await selection.openContextMenu();
        await menu.select('Copy');
        await new Promise(res => setTimeout(res, 500));
        return clipboard.read();
    }

    /**
     * Get the selection block as a page object
     * @returns Selection page object
     */
    async getSelection(): Promise<Selection|undefined> {
        const selection = await this.findElements(TextEditor.locators.TextEditor.selection);
        if (selection.length < 1) {
            return undefined;
        }
        return new Selection(selection[0], this);
    }

    async openFindWidget(): Promise<FindWidget> {
        let actions = this.getDriver().actions();
        await actions.clear();
        await actions.keyDown(TextEditor.ctlKey).sendKeys('f').keyUp(TextEditor.ctlKey).perform();
        const widget = await this.getDriver().wait(until.elementLocated(TextEditor.locators.TextEditor.findWidget), 2000);
        await this.getDriver().wait(until.elementIsVisible(widget), 2000);

        return new FindWidget(widget, this);
    }

    /**
     * Add the given text to the given coordinates
     * @param line number of the line to type into
     * @param column number of the column to start typing at
     * @param text text to add
     * @returns Promise resolving when the text is typed in
     */
    async typeTextAt(line: number, column: number, text: string): Promise<void> {
        await this.moveCursor(line, column);
        await this.typeText(text);
    }

    /**
     * Type given text at the current coordinates
     * @param text text to type
     * @returns promise resolving when the text is typed in
     */
    async typeText(text: string): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(text);
    }

    /**
     * Move the cursor to the given coordinates
     * @param line line number to move to
     * @param column column number to move to
     * @returns Promise resolving when the cursor has reached the given coordinates
     */
    async moveCursor(line: number, column: number): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`);
        }
        if (column < 1) {
            throw new Error(`Column number ${column} does not exist`);
        }
        if(process.platform === 'darwin') {
            const input = await new Workbench().openCommandPrompt();
            await input.setText(`:${line},${column}`);
            await input.confirm();
        } else {
            const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
            let coordinates = await this.getCoordinates();
            const lineGap = coordinates[0] - line;
            const lineKey = lineGap >= 0 ? Key.UP : Key.DOWN;
            for (let i = 0; i < Math.abs(lineGap); i++) {
                await inputarea.sendKeys(lineKey);
            }

            coordinates = await this.getCoordinates();
            const columnGap = coordinates[1] - column;
            const columnKey = columnGap >= 0 ? Key.LEFT : Key.RIGHT;
            for (let i = 0; i < Math.abs(columnGap); i++) {
                await inputarea.sendKeys(columnKey);
                let actualCoordinates = (await this.getCoordinates())[0];
                if (actualCoordinates != coordinates[0]) {
                    throw new Error(`Column number ${column} is not accessible on line ${line}`);
                }
            }
        }
        await this.getDriver().wait(async () => {
            const coor = await this.getCoordinates();
            return coor[0] === line && coor[1] === column;
        });
    }

    /**
     * Get number of lines in the editor
     * @returns Promise resolving to number of lines
     */
    async getNumberOfLines(): Promise<number> {
        const lines = (await this.getText()).split('\n');
        return lines.length;
    }

    /**
     * Use the built-in 'Format Document' option to format the text
     * @returns Promise resolving when the Format Document command is invoked
     */
    async formatDocument(): Promise<void> {
        const menu = await this.openContextMenu();
        try {
            await menu.select('Format Document');
        } catch (err) {
            console.log('Warn: Format Document not available for selected language');
            if (await menu.isDisplayed()) {
                await menu.close();
            }
        }
    }

    async openContextMenu(): Promise<ContextMenu> {
        await this.getDriver().actions().contextClick(this).perform();
        const shadowRootHost = await this.enclosingItem.findElements(By.className('shadow-root-host'));
        
        if (shadowRootHost.length > 0) {
            let shadowRoot;
            const webdriverCapabilities = await (this.getDriver() as ChromiumWebDriver).getCapabilities();
            const chromiumVersion = webdriverCapabilities.getBrowserVersion();
            if (chromiumVersion && parseInt(chromiumVersion.split('.')[0]) >= 96) {
                shadowRoot = await shadowRootHost[0].getShadowRoot();
                return new ContextMenu(await shadowRoot.findElement(By.className('monaco-menu-container'))).wait();
            } else {
                shadowRoot = await this.getDriver().executeScript('return arguments[0].shadowRoot', shadowRootHost[0]) as WebElement;
                return new ContextMenu(shadowRoot).wait();
            }
            
        }
        return super.openContextMenu();
    }

    /**
     * Get the cursor's coordinates as an array of two numbers: `[line, column]`
     *
     * **Caution** line & column coordinates do not start at `0` but at `1`!
     */
    async getCoordinates(): Promise<[number, number]> {
        const coords: number[] = [];
        const statusBar = new StatusBar();
        const coordinates = <RegExpMatchArray>(await statusBar.getCurrentPosition()).match(/\d+/g);
        for(const c of coordinates) {
            coords.push(+c);
        }
        return [coords[0], coords[1]];
    }

    /**
     * Toggle breakpoint on a given line
     * 
     * @param line target line number
     * @returns promise resolving to true when a breakpoint was added, false when removed or
     */
    async toggleBreakpoint(line: number): Promise<boolean> {
        const margin = await this.findElement(TextEditor.locators.TextEditor.marginArea);
        const lineNum = await margin.findElement(TextEditor.locators.TextEditor.lineNumber(line));
        await this.getDriver().actions().move({origin: lineNum}).perform();

        const lineOverlay = await margin.findElement(TextEditor.locators.TextEditor.lineOverlay(line));
        const breakPoint = await lineOverlay.findElements(TextEditor.locators.TextEditor.breakpoint.generalSelector);
        if (breakPoint.length > 0) {
            await breakPoint[0].click();
            await new Promise(res => setTimeout(res, 200));
            return false;
        }

        const noBreak = await lineOverlay.findElements(TextEditor.locators.TextEditor.debugHint);
        if (noBreak.length > 0) {
            await noBreak[0].click();
            await new Promise(res => setTimeout(res, 200));
            return true;
        } 
        return false;
    }

    /**
     * Get paused breakpoint if available. Otherwise, return undefined.
     * @returns promise which resolves to either Breakpoint page object or undefined
     */
    async getPausedBreakpoint(): Promise<Breakpoint | undefined> {
        const breakpointLocators = Breakpoint.locators.TextEditor.breakpoint;
        const breakpoints = await this.findElements(breakpointLocators.pauseSelector);
        
        if (breakpoints.length === 0) {
            return undefined;
        }

        if (breakpoints.length > 1) {
            throw new BreakpointError(`unexpected number of paused breakpoints: ${breakpoints.length}; expected 1 at most`);
        }

        // get parent
        const lineElement = breakpoints[0].findElement(By.xpath('./..'));
        return new Breakpoint(breakpoints[0], lineElement);
    }

    /**
     * Get all code lenses within the editor
     * @returns list of CodeLens page objects
     */
    async getCodeLenses(): Promise<CodeLens[]> {
        const lenses: CodeLens[] = [];
        const widgets = await this.findElement(By.className('contentWidgets'));
        const items = await widgets.findElements(By.xpath(`.//span[contains(@widgetid, 'codelens.widget')]`));

        for (const item of items) {
            lenses.push(await new CodeLens(item, this).wait());
        }
        return lenses;
    }

    /**
     * Get a code lens based on title, or zero based index
     * 
     * @param indexOrTitle zero based index (counting from the top of the editor), or partial title of the code lens
     * @returns CodeLens object if such a code lens exists, undefined otherwise
     */
    async getCodeLens(indexOrTitle: number | string): Promise<CodeLens | undefined> {
        const lenses = await this.getCodeLenses();
        
        if (typeof(indexOrTitle) === 'string') {
            for (const lens of lenses) {
                const title = await lens.getText();
                const match = title.match(indexOrTitle);
                if (match && match.length > 0) {
                    return lens;
                }
            }
        } else if (lenses[indexOrTitle]) {
            return lenses[indexOrTitle];
        }
        return undefined;
    }
}

/**
 * Text selection block
 */
class Selection extends ElementWithContexMenu {
    constructor(el: WebElement, editor: TextEditor) {
        super(el, editor);
    }

    async openContextMenu(): Promise<ContextMenu> {
        const ed = this.getEnclosingElement() as TextEditor;
        await this.getDriver().actions().contextClick(this).perform();
        const shadowRootHost = await ed.getEnclosingElement().findElements(By.className('shadow-root-host'));
        
        if (shadowRootHost.length > 0) {
            let shadowRoot;
            const webdriverCapabilities = await (this.getDriver() as ChromiumWebDriver).getCapabilities();
            const chromiumVersion = webdriverCapabilities.getBrowserVersion();
            if (chromiumVersion && parseInt(chromiumVersion.split('.')[0]) >= 96) {
                shadowRoot = await shadowRootHost[0].getShadowRoot();
                return new ContextMenu(await shadowRoot.findElement(By.className('monaco-menu-container'))).wait();
            } else {
                shadowRoot = await this.getDriver().executeScript('return arguments[0].shadowRoot', shadowRootHost[0]) as WebElement;
                return new ContextMenu(shadowRoot).wait();
            }
        }
        return super.openContextMenu();
    }
}

/**
 * Page object for Code Lens inside a text editor
 */
export class CodeLens extends AbstractElement {
    constructor(element: WebElement, editor: TextEditor) {
        super(element, editor);
    }

    /**
     * Get the text displayed on the code lens
     * @returns text as string
     */
    async getText(): Promise<string> {
        const link = await this.findElement(By.css('a'));
        return link.getText();
    }

    /**
     * Get tooltip of the code lens
     * @returns tooltip as string
     */
    async getTooltip(): Promise<string> {
        const link = await this.findElement(By.css('a'));
        return link.getAttribute('title');
    }
}

/**
 * Text Editor's Find Widget
 */
export class FindWidget extends AbstractElement {

    constructor(element: WebElement, editor: TextEditor) {
        super(element, editor);
    }

    /**
     * Toggle between find and replace mode
     * @param replace true for replace, false for find
     */
    async toggleReplace(replace: boolean): Promise<void> {
        const btn = await this.findElement(FindWidget.locators.FindWidget.toggleReplace);
        const klass = await btn.getAttribute('class');
        
        if (replace && klass.includes('collapsed') || !replace && !klass.includes('collapsed')) {
            await btn.sendKeys(Key.SPACE);
            const repl = await this.getDriver().wait(until.elementLocated(FindWidget.locators.FindWidget.replacePart), 2000);
            if (replace) {
                await this.getDriver().wait(until.elementIsVisible(repl), 2000);
            } else {
                await this.getDriver().wait(until.elementIsNotVisible(repl), 2000);
            }
        }
    }

    /**
     * Set text in the search box
     * @param text text to fill in
     */
    async setSearchText(text: string): Promise<void> {
        const findPart = await this.findElement(FindWidget.locators.FindWidget.findPart);
        await this.setText(text, findPart);
    }

    /**
     * Get text from Find input box
     * @returns value of find input as string
     */
    async getSearchText(): Promise<string> {
        const findPart = await this.findElement(FindWidget.locators.FindWidget.findPart);
        return this.getInputText(findPart);
    }

    /**
     * Set text in the replace box. Will toggle replace mode on if called in find mode.
     * @param text text to fill in
     */
    async setReplaceText(text: string): Promise<void> {
        await this.toggleReplace(true);
        const replacePart = await this.findElement(FindWidget.locators.FindWidget.replacePart);
        await this.setText(text, replacePart);
    }


    /**
     * Get text from Replace input box
     * @returns value of replace input as string
     */
     async getReplaceText(): Promise<string> {
        const replacePart = await this.findElement(FindWidget.locators.FindWidget.replacePart);
        return this.getInputText(replacePart);
    }

    /**
     * Click 'Next match'
     */
    async nextMatch(): Promise<void> {
        const name = TextEditor.versionInfo.version < '1.59.0' ? 'Next match' : 'Next Match';
        await this.clickButton(name, 'find');
    }

    /**
     * Click 'Previous match'
     */
    async previousMatch(): Promise<void> {
        const name = TextEditor.versionInfo.version < '1.59.0' ? 'Previous match' : 'Previous Match';
        await this.clickButton(name, 'find');
    }

    /**
     * Click 'Replace'. Only works in replace mode.
     */
    async replace(): Promise<void> {
        await this.clickButton('Replace', 'replace');
    }


    /**
     * Click 'Replace All'. Only works in replace mode.
     */
    async replaceAll(): Promise<void> {
        await this.clickButton('Replace All', 'replace');
    }

    /**
     * Close the widget.
     */
    async close(): Promise<void> {
        await this.clickButton('Close', 'find');
    }

    /**
     * Get the number of results as an ordered pair of numbers
     * @returns pair in form of [current result index, total number of results]
     */
    async getResultCount(): Promise<[number, number]> {
        const count = await this.findElement(FindWidget.locators.FindWidget.matchCount);
        const text = await count.getText();

        if (text.includes('No results')) {
            return [0,0];
        }
        const numbers = text.split(' of ');
        return [+numbers[0], +numbers[1]];
    }

    /**
     * Toggle the search to match case
     * @param toggle true to turn on, false to turn off
     */
    async toggleMatchCase(toggle: boolean) {
        await this.toggleControl('Match Case', 'find', toggle);
    }

    /**
     * Toggle the search to match whole words
     * @param toggle true to turn on, false to turn off
     */
    async toggleMatchWholeWord(toggle: boolean) {
        await this.toggleControl('Match Whole Word', 'find', toggle);
    }

    /**
     * Toggle the search to use regular expressions
     * @param toggle true to turn on, false to turn off
     */
    async toggleUseRegularExpression(toggle: boolean) {
        await this.toggleControl('Use Regular Expression', 'find', toggle);
    }

    /**
     * Toggle the replace to preserve case
     * @param toggle true to turn on, false to turn off
     */
    async togglePreserveCase(toggle: boolean) {
        await this.toggleControl('Preserve Case', 'replace', toggle);
    }

    private async toggleControl(title: string, part: 'find'|'replace', toggle: boolean) {
        let element!: WebElement;
        if (part === 'find') {
            element = await this.findElement(FindWidget.locators.FindWidget.findPart);
        }
        if (part === 'replace') {
            element = await this.findElement(FindWidget.locators.FindWidget.replacePart);
            await this.toggleReplace(true);
        }

        const control = await element.findElement(FindWidget.locators.FindWidget.checkbox(title));
        const checked = await control.getAttribute('aria-checked');
        if ((toggle && checked !== 'true') || (!toggle && checked === 'true')) {
            await control.click();
        }
    }

    private async clickButton(title: string, part: 'find'|'replace') {
        let element!: WebElement;
        if (part === 'find') {
            element = await this.findElement(FindWidget.locators.FindWidget.findPart);
        }
        if (part === 'replace') {
            element = await this.findElement(FindWidget.locators.FindWidget.replacePart);
            await this.toggleReplace(true);
        }

        const btn = await element.findElement(FindWidget.locators.FindWidget.button(title));
        await btn.click();
        await this.getDriver().sleep(100);
    }

    private async setText(text: string, composite: WebElement) {
        const input = await composite.findElement(FindWidget.locators.FindWidget.input);
        await input.clear();
        await input.sendKeys(text);
    }

    private async getInputText(composite: WebElement) {
        const input = await composite.findElement(FindWidget.locators.FindWidget.content);
        return input.getAttribute('innerHTML');
    }
}
