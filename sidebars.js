// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Product Guides',
      link: {type: 'doc', id: 'product-guides/index'},
      items: [],
    },
    {
      type: 'category',
      label: 'Technical Resources',
      link: {type: 'doc', id: 'technical-resources/index'},
      items: [],
    },
  ],
};

module.exports = sidebars;
