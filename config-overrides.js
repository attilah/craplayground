const { getLoader, loaderNameMatches } = require('react-app-rewired');
const rewireLess = require('react-app-rewire-less');
const VariablesOutput = require('less-plugin-variables-output');
const fs = require('fs');
const path = require('path');
const less = require('less');

module.exports = function override(config, env) {
  const tsLoader = getLoader(
    config.module.rules,
    rule => loaderNameMatches(rule, 'ts-loader')
  );

  if (!tsLoader) {
    console.log ('ts-loader was not found');
    return config;
  }

  const tsImportPluginFactory = require('ts-import-plugin');

  tsLoader.options = {
    ...tsLoader.options,
    getCustomTransformers: () => ({
      before: [
        tsImportPluginFactory({
          libraryName: 'antd',
          libraryDirectory: 'es',
          style: true
        })]
    })
  };

  const themeLessFileName = path.resolve(path.join(__dirname, 'src', 'theme.less'));
  const lessContent = fs.readFileSync(themeLessFileName, 'utf8');
  let lessOverrides = {};

  const lessPluginOptions = {
    callback: (vars) => lessOverrides = vars
  };

  less.render (lessContent, {
    plugins: [
      new VariablesOutput(lessPluginOptions)
    ]
  }, (error, output) => {
    if (error) {
      throw new Error('Error occured during the parsing of the theme.less file: ' + error);
      return config;
    }
  });

  config = rewireLess.withLoaderOptions({
    modifyVars: lessOverrides
  })(config, env);

  return config;
}
