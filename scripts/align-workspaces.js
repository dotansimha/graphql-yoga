const jsYaml = require('js-yaml');
const packageJson = require('../package.json');
const path = require('path');

const fs = require('fs');

const yamlContent = jsYaml.dump({
    packages: packageJson.workspaces,
});

fs.writeFileSync(path.join(__dirname, '..', 'pnpm-workspace.yaml'), yamlContent);
