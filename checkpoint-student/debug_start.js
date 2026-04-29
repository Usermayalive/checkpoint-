'use strict';
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

console.log('STEP 1: Loading env...');
require('./node_modules/react-scripts/config/env');
console.log('STEP 2: Loading paths...');
const paths = require('./node_modules/react-scripts/config/paths');
console.log('STEP 3: Loading WebpackDevServerUtils...');
const t1 = Date.now();
const { choosePort } = require('react-dev-utils/WebpackDevServerUtils');
console.log('STEP 4: WebpackDevServerUtils loaded in', Date.now() - t1, 'ms');
console.log('STEP 5: Calling choosePort...');
const t2 = Date.now();
choosePort('0.0.0.0', 3001).then(port => {
  console.log('STEP 6: choosePort returned', port, 'in', Date.now() - t2, 'ms');
  console.log('STEP 7: Loading webpack.config...');
  const t3 = Date.now();
  const configFactory = require('./node_modules/react-scripts/config/webpack.config');
  console.log('STEP 8: webpack.config loaded in', Date.now() - t3, 'ms');
  const config = configFactory('development');
  console.log('STEP 9: config created');
  console.log('STEP 10: Loading webpack...');
  const t4 = Date.now();
  const webpack = require('webpack');
  console.log('STEP 11: webpack loaded in', Date.now() - t4, 'ms');
  process.exit(0);
}).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
