# Contributing to VSCode Extension Tester

First of all, welcome! Thank you for your interest in contributing to our framework.

There are many ways to get involved:

## Feedback & Issues

Have a question? Have you found a problem you would like to see fixed? 
Is there something you would like to see improved or features added?

Then we'd like to hear from you. Hop on to the [issue tracker](../../issues) and create an issue. If you add a tag that best fits the problem, that would be absolutely awesome, checking if a similar issue already exists beforehand even more so.

If you happen to find an existing issue or a pull request that interests you, feel free to comment and upvote/downvote to give us your opinion (we do prefer comments over votes).

## Code, Building, Testing and Pull Requests

If submitting issues just doesn't cut it for you, we are always happy to see code contributions. Here are a few steps to get your code in as fast as possible:

### Get the Code

The first step is to Fork this repository and clone your new fork. We also recommend adding the upstream as a new remote so you can easily get updates. 
```
$ git clone https://github.com/<your user name>/vscode-extension-tester
$ cd vscode-extension-tester
$ git remote add upstream https://github.com/redhat-developer/vscode-extension-tester
```

### Build It

Now that you have the code, you will need to build the project. First, we need to get all the modules linked and built.
```
$ npm run prepare-deps
```
Second step is to install all main module dependencies.
```
$ npm install
```
Now you can compile the typescript project. We recommend using the predefined script for that.
```
$ npm run build
```
After these steps, you should be able to run the project and make your changes. Just make sure to rebuild the project after changing the source files so you can test it.

### Test It

When you make a change, make sure the tests are passing. In the ```test/test-project``` directory there is a dummy vscode extension we use to test the framework itself.

First we need to install the dependencies of this project. For that, you can use the following script
```
$ npm run prepare-test
```

With test dependencies installed we can launch the tests
```
$ npm test
```

If you are adding a new feature, be sure to write new tests for it. If you navigate to the ```test/test-project/src/test``` folder, you will find a test file structure that mirrors the source files. Put your new test into the appropriate existing file, or create a new one that follows the same structure.

### Pull Requests

Having made and tested your changes, we recommend committing them into a new branch:
```
$ git checkout -b my-new-branch
$ git add <changed files>
$ git commit -m <commit message>
$ git push origin my-new-branch
```
Now that the changes are in a branch in your fork, you can submit a new pull request.

If your pull request is intended to fix an issue in the tracker, make sure to link the two together. You can do that by adding for example ```fix #<issue number>``` to the commit message, or to any comment on the pull request.

Lastly, a pull request check on Travis is going to kick in whenever a change is pushed. Please make sure it ends up green. Otherwise it might need a change on your part. Or maybe it also needs a change on our part - in that case opening an issue is the best way to go.

### Certificate of Origin

By contributing to this project you agree to the Developer Certificate of
Origin (DCO). This document was created by the Linux Kernel community and is a
simple statement that you, as a contributor, have the legal right to make the
contribution. See the [DCO](DCO) file for details.
