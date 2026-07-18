// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Products',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Ovis',
          collapsed: false,
          link: {type: 'doc', id: 'products/ovis/index'},
          items: [
            'products/ovis/getting-started',
            'products/ovis/second-development',
            'products/ovis/resource-download',
          ],
        },
      ],
    },
  ],
};

module.exports = sidebars;
