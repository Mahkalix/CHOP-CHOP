import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CHOP-CHOP',
  tagline: 'Un jeu de cuisine solo. Cinq niveaux, un classement par niveau.',
  favicon: 'img/chopchop-logo.svg',
  // Use the standard toolchain to avoid native SWC cache issues on Windows.
  future: {v4: true, faster: false},
  // Set DOCUSAURUS_URL and DOCUSAURUS_BASE_URL to the actual hosting target.
  url: process.env.DOCUSAURUS_URL || 'http://localhost:3000',
  baseUrl: process.env.DOCUSAURUS_BASE_URL || '/',
  onBrokenLinks: 'throw',
  markdown: {hooks: {onBrokenMarkdownLinks: 'throw'}},
  i18n: {defaultLocale: 'fr', locales: ['fr']},
  presets: [['classic', {
    docs: {
      sidebarPath: './sidebars.ts',
      exclude: ['tutorial-basics/**', 'tutorial-extras/**'],
    },
    blog: false,
    theme: {customCss: './src/css/custom.css'},
  } satisfies Preset.Options]],
  themeConfig: {
    colorMode: {defaultMode: 'light', respectPrefersColorScheme: false},
    navbar: {
      title: 'CHOP-CHOP',
      logo: {alt: 'CHOP-CHOP', src: 'img/chopchop-logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'projectSidebar', position: 'left', label: 'Documentation'},
        {to: '/docs/regles-du-jeu', label: 'Règles du jeu', position: 'left'},
        {to: '/docs/design', label: 'Design', position: 'left'},
        {type: 'dropdown', label: 'Équipe', position: 'left', items: [
          {to: '/docs/equipe', label: 'Présentation de l’équipe'},
          {to: '/docs/conventions', label: 'Conventions et règles de travail'},
        ]},
        {to: '/docs/cas-utilisation', label: 'Cas d’utilisation', position: 'left'},
        {to: '/docs/references', label: 'Références', position: 'right'},
        {href: 'https://www.figma.com/design/5YyQNON3zicZCKuN1CkEH0/Chop-Chop?node-id=0-1', label: 'Figma', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [{title: 'Le projet', items: [
        {label: 'Présentation', to: '/docs/intro'},
        {label: 'Gameplay', to: '/docs/gameplay'},
        {label: 'Règles du jeu', to: '/docs/regles-du-jeu'},
        {label: 'Validation du prototype', to: '/docs/validation'},
        {label: 'Design et maquettes', to: '/docs/design'},
        {label: 'Présentation de l’équipe', to: '/docs/equipe'},
      ]}],
      copyright: `CHOP-CHOP · Documentation du projet · ${new Date().getFullYear()}`,
    },
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
  } satisfies Preset.ThemeConfig,
};
export default config;
