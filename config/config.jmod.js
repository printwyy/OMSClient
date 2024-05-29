/* eslint-env node */
/**
 * @author pmeijer / https://github.com/pmeijer
 */
const config = require('./config.dockerworker');


config.plugin.SystemSimulator.simulationTool = 'JModelica.org';
module.exports = config;
