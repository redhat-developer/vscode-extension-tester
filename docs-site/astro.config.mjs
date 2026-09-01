// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

// https://astro.build/config
export default defineConfig({
  site: 'https://redhat-developer.github.io',
  base: '/vscode-extension-tester',
  integrations: [
    starlight({
      title: 'ExTester',
      logo: {
        src: './src/assets/logo.png',
        alt: 'ExTester',
      },
      favicon: '/favicon.png',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/redhat-developer/vscode-extension-tester',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/redhat-developer/vscode-extension-tester/edit/main/docs-site/',
      },
      head: [
        {
          // open external links in a new tab, site-wide (content, header, edit link, cards)
          tag: 'script',
          content:
            "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a&&/^https?:/.test(a.href)&&a.host!==location.host){a.target='_blank';a.rel='noopener noreferrer';}},true);",
        },
      ],
      plugins: [starlightLinksValidator()],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            'getting-started/installation',
            'getting-started/supported-versions',
            'getting-started/writing-simple-tests',
            'getting-started/opening-files-and-folders',
          ],
        },
        {
          label: 'Guides',
          items: [
            'guides/test-setup',
            'guides/mocha-configuration',
            'guides/debugging-tests',
            'guides/code-coverage',
            'guides/locale-testing',
            'guides/taking-screenshots',
            'guides/custom-page-objects',
            'guides/automated-version-updates',
            'guides/extester-runner',
          ],
        },
        {
          label: 'Page Object Reference',
          items: [
            'objects',
            { label: 'Activity Bar', items: [{ autogenerate: { directory: 'objects/activity-bar' } }] },
            { label: 'Bottom Bar', items: [{ autogenerate: { directory: 'objects/bottom-bar' } }] },
            { label: 'Dialogs', items: [{ autogenerate: { directory: 'objects/dialogs' } }] },
            { label: 'Editor', items: [{ autogenerate: { directory: 'objects/editor' } }] },
            { label: 'Menu', items: [{ autogenerate: { directory: 'objects/menu' } }] },
            { label: 'Side Bar', items: [{ autogenerate: { directory: 'objects/side-bar' } }] },
            { label: 'Status Bar', items: [{ autogenerate: { directory: 'objects/status-bar' } }] },
            { label: 'Title Bar', items: [{ autogenerate: { directory: 'objects/title-bar' } }] },
            { label: 'Workbench', items: [{ autogenerate: { directory: 'objects/workbench' } }] },
          ],
        },
      ],
    }),
  ],
});
