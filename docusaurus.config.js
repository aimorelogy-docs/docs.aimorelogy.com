// @ts-check

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AIMORELOGY Docs',
  tagline: 'Product manuals and technical resources',
  favicon: 'img/favicon.svg',

  url: 'https://docs.aimorelogy.com',
  baseUrl: '/',
  organizationName: 'aimorelogy-docs',
  projectName: 'docs.aimorelogy.com',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN'],
    localeConfigs: {
      en: {
        label: 'English',
        htmlLang: 'en-US',
      },
      'zh-CN': {
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {name: 'keywords', content: 'AIMORELOGY, AIoT, edge AI, UAV, product manuals'},
      ],
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'AIMORELOGY // DOCS',
        hideOnScroll: true,
        items: [
          {to: '/', label: 'Documentation', position: 'left', exact: true},
          {to: '/product-guides', label: 'Product Guides', position: 'left'},
          {to: '/technical-resources', label: 'Technical Resources', position: 'left'},
          {
            href: 'https://aimorelogy.com',
            label: 'Company Website',
            position: 'right',
          },
          {type: 'localeDropdown', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {label: 'Product Guides', to: '/product-guides'},
              {label: 'Technical Resources', to: '/technical-resources'},
            ],
          },
          {
            title: 'AIMORELOGY',
            items: [
              {label: 'Company Website', href: 'https://aimorelogy.com'},
              {label: 'Community', href: 'https://forum.aimorelogy.com'},
              {label: 'Contact', href: 'https://aimorelogy.com/contact'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Shenzhen Aimorelogy Co., Ltd.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'c', 'cpp', 'cmake', 'json'],
      },
    }),
};

module.exports = config;
