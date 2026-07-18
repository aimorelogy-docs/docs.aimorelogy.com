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
            {
              type: 'category',
              label: 'Getting Started',
              collapsed: false,
              link: {type: 'doc', id: 'products/ovis/getting-started'},
              items: [
                'products/ovis/getting-started/hardware-connection',
                'products/ovis/getting-started/software-flashing',
                'products/ovis/getting-started/usage',
                'products/ovis/getting-started/ovis-web-management',
              ],
            },
            {
              type: 'category',
              label: 'Secondary Development',
              collapsed: false,
              link: {type: 'doc', id: 'products/ovis/secondary-development'},
              items: [
                'products/ovis/secondary-development/sdk-compilation',
                {
                  type: 'category',
                  label: 'Custom AI Model Deployment',
                  collapsed: false,
                  link: {
                    type: 'doc',
                    id: 'products/ovis/secondary-development/custom-ai-model-deployment',
                  },
                  items: [
                    'products/ovis/secondary-development/custom-ai-model-deployment/yolov5',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: 'Resource Download',
              collapsed: false,
              link: {type: 'doc', id: 'products/ovis/resource-download'},
              items: [
                'products/ovis/resource-download/software-development-kit',
                'products/ovis/resource-download/hardware-development-kit',
                'products/ovis/resource-download/development-manual',
              ],
            },
          ],
        },
      ],
    },
  ],
};

module.exports = sidebars;
