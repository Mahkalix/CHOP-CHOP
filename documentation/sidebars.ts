import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
const sidebars: SidebarsConfig = {
  projectSidebar: [
    'intro',
    {type: 'category', label: 'Équipe', link: {type: 'doc', id: 'equipe'}, items: ['conventions']},
    {type: 'category', label: 'Le jeu', items: ['regles-du-jeu', 'perimetre', 'gameplay', 'score']},
    {type: 'category', label: 'Conception et validation', items: ['design', 'classement', 'architecture', 'cas-utilisation', 'validation']},
    'references',
  ],
};
export default sidebars;
