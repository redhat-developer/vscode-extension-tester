# Contributing Guide

First of all, **Welcome!** :wave: and thank you for your interest in contributing to our UI testing framework.

## Feedback

### Issues

Have you a **question**? Have you found a **problem** 🚫 you would like to see fixed? Is there something you would like to see improved or **features** 🚀 added?

Then we'd like to hear from you. Hop on to the [issue tracker](../../issues) and create an issue. If you would **check if a similar issue already exists** beforehand, it would be much appreciated :heart:.

If you happen to find an **existing issue or a pull request** that interests you, feel free to **comment** or upvote :+1: / downvote :-1: to give us your opinion (**we do prefer comments over votes**).

## Code, Building, Testing and Pull Requests

If submitting issues just doesn't cut it for you, we are always happy to see code contributions. Here are a few steps to get your code in as fast as possible:

### Get the Code

The first step is to fork this repository and clone your new fork. We also recommend adding the upstream as a new remote so you can easily get updates.

```shell
git clone https://github.com/<your user name>/vscode-extension-tester
cd vscode-extension-tester
git remote add upstream https://github.com/redhat-developer/vscode-extension-tester
```

### Build It

Now that you have the code, you will need to build the project. First, we need to install all modules dependencies:

```nodejs
npm install
```

Now you can compile the typescript project. We recommend using the predefined script for that:

```nodejs
npm run build
```

After these steps, you should be able to run the project and make your changes. Just make sure to rebuild the project after changing the source files so you can test it.

### Test It

**When you make a change, make sure the tests are passing**. In the ```test/test-project``` directory there is a dummy VS Code extension we use to test the framework itself.

For that, you can use the following script and launch the tests:

```nodejs
npm test
```

If you are adding a new feature, be sure to **write new tests** for it. If you navigate to the ```test/test-project/src/test``` folder, you will find a test file structure that mirrors the source files. Put your new test into the appropriate existing file, or create a new one that follows the same structure.

### Pull Requests

Having made and tested your changes, we recommend committing them into a new branch:

```shell
git checkout -b <my-new-branch>
git add <changed files>
git commit -m <type>(optional scope): <description> # see https://www.conventionalcommits.org/en/v1.0.0/#summary
git push origin <my-new-branch>
```

Now the changes are in a new branch in your fork, you can submit a new pull request. **If your pull request is intended to fix an issue in the tracker, make sure to link the two together**.

Lastly, a pull request check on [Github Actions](../../actions) is going to kick in whenever a change is pushed. **Please make sure it ends up green**. Otherwise it might need a change on your part. Or maybe it also needs a change on our part - in that case opening a [new issue](../../issues) is the best way to go.

## Release new ExTester version

- [ ] Check all related PR's were merged and the `Main CI`is green

1. _(optional)_ Publish `monaco-page-objects` package
    - `cd page-objects`
    - [ ] `npm version (major|minor|patch)`
    - [ ] `npm publish`
2. _(optional)_ Publish `vscode-extension-tester-locators` package
    - `cd locators`
    - [ ] `npm version (major|minor|patch)`
    - [ ] bump `monaco-page-objects` peerDependency to recently published in step 1)
    - [ ] `npm publish`
3. Publish `vscode-extension-tester` package
    - [ ] `npm version (major|minor|patch) --no-git-tag-version`
    - [ ] bump `page-objects` dependency
      - `npm install monaco-page-objects@latest`
    - [ ] bump `locators` dependency
      - `npm install vscode-extension-tester-locators@latest`
    - [ ] commit changes and open new PR
    - [ ] wait for PR is approved and merged
    - [ ] after merge, wait until `Main CI` is green
    - [ ] create and push new `vX.X.X` tag
    - [ ] `npm publish`
    - [ ] create a new GitHub [release](https://github.com/redhat-developer/vscode-extension-tester/releases) from a new `vX.X.X` tag (with generated release notes)

### Post publish tasks

- [ ] Close published version [milestone](https://github.com/redhat-developer/vscode-extension-tester/milestones) and update ExTester [project board](https://github.com/orgs/redhat-developer/projects/41/views/3)
- Update `sample-projects/helloworld-sample` project
  - [ ] Bump `vscode-extension-tester` version to recently released one
  - [ ] Run tests and check everything is working properly
- _(optional)_ Spread a message about new release using IM tools, mailing lists and social media

## DCO

**By contributing to this project you agree to the Developer Certificate of Origin (DCO)**. This document was created by the Linux Kernel community and is a simple statement that you, as a contributor, have the legal right to make the contribution.

See the [DCO](DCO) file for the details.
