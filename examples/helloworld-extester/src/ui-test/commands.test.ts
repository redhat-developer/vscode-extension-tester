import { Workbench } from "vscode-extension-tester";

describe('Sample Command palette tests', () => {

    it('using executeCommand', async () => {
        // the simplest way to execute a command
        // this opens the command palette, puts in the command, and confirms
        await new Workbench().executeCommand('hello world');
    });

    it('using the command prompt', async () => {
        // or you can open the command prompt/palette and work with it as with an input box
        const prompt = await new Workbench().openCommandPrompt();
        
        // make sure that when executing a command this way you prepend it with a '>' symbol
        // otherwise it is going to try and find a file with the given name
        await prompt.setText('>hello world');
        await prompt.confirm();
    });
});