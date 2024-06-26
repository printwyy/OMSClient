/* eslint-env browser */
/* globals window */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import superagent from 'superagent';
import classNames from 'classnames';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import PlayCircleOutline from '@material-ui/icons/PlayCircleOutline';
import CheckCircle from '@material-ui/icons/CheckCircle';
import AddCircle from '@material-ui/icons/AddCircle';
import Timeline from '@material-ui/icons/Timeline';
import History from '@material-ui/icons/History';
import {withStyles} from '@material-ui/core/styles';
import green from '@material-ui/core/colors/green';

import PartBrowser from 'webgme-react-components/src/components/PartBrowser';

import SystemSimulatorMetadata from '../../plugins/SystemSimulator/metadata.json';
import ModelCheckMetadata from '../../plugins/ModelCheck/metadata.json';
import ModelCheckPlugin from '../../plugins/ModelCheck/ModelCheck';
import getMetaNodeByName from '../gme/utils/getMetaNodeByName';
import {downloadBlobArtifact} from '../gme/utils/saveUrlToDisk';
import axios from 'axios';

import {removePlotVariable, toggleLeftDrawer, toggleModelingView, setResultNode, toggleRightDrawer} from '../actions';

import ResultList from './ResultList';
import PluginConfigDialog from '../Dialogs/PluginConfigDialog';
import DomainSelector from '../Dialogs/DomainSelector';
import NotifyDialog from '../Dialogs/NotifyDialog';
import PluginResultDialog from '../Dialogs/PluginResultDialog';
import ProjectHistory from '../containers/Dialogs/ProjectHistory';
import colorHash from '../gme/utils/colorHash';
import {sideDrawer as styles} from '../classes';

const mapStateToProps = state => ({
    open: state.leftDrawer,
    activeNode: state.activeNode,
    modelingView: state.modelingView,
    variables: state.plotData.variables,
    scale: state.scale,
});

const mapDispatchToProps = dispatch => ({
    hide: () => {
        dispatch(toggleLeftDrawer(false));
    },
    show: () => {
        dispatch(toggleLeftDrawer(true));
    },
    removePlotVariable: (varName) => {
        dispatch(removePlotVariable(varName));
    },
    toggleModelingView: (modelView) => {
        dispatch(toggleModelingView(modelView));
    },
    setResultNode: (resultNode) => {
        dispatch(setResultNode(resultNode));
    },
    toggleRightDrawer: (show) => {
        dispatch(toggleRightDrawer(show));
    },
});

class LeftDrawer extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        open: PropTypes.bool.isRequired,
        classes: PropTypes.object.isRequired,
        activeNode: PropTypes.string.isRequired,
        scale: PropTypes.number.isRequired,
        modelingView: PropTypes.bool.isRequired,
        variables: PropTypes.arrayOf(PropTypes.string).isRequired,
        removePlotVariable: PropTypes.func.isRequired,
        toggleModelingView: PropTypes.func.isRequired,
        // setResultNode: PropTypes.func.isRequired,
        toggleRightDrawer: PropTypes.func.isRequired,
        show: PropTypes.func.isRequired,
        hide: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        const {gmeConfig} = this.props.gmeClient;
        this.SystemSimulatorMetadata = JSON.parse(JSON.stringify(SystemSimulatorMetadata));

        this.SystemSimulatorMetadata.configStructure.forEach((configDesc) => {
            if (gmeConfig.plugin.SystemSimulator && gmeConfig.plugin.SystemSimulator[configDesc.name] !== undefined) {
                configDesc.value = gmeConfig.plugin.SystemSimulator[configDesc.name];
                configDesc.readOnly = true;
            }
        });
    }

    state = {
        showSimulator: false,
        showChecker: false,
        showDomainSelector: false,
        showHistory: false,
        checkResult: null,
    };

    onUpdateDomains = (data) => {
        const {gmeClient} = this.props;

        this.setState({showDomainSelector: false});

        if (!data) {
            // Cancelled
            return;
        }

        const path = [
            window.location.origin + gmeClient.mountedPath,
            gmeClient.gmeConfig.rest.components.DomainManager.mount,
            'updateProject',
        ].join('/');

        superagent.post(path)
            .send({
                projectId: gmeClient.getActiveProjectId(),
                domains: data.domains,
            })
            .end((err, result) => {
                if (err) {
                    // TODO: we need to show these errors
                    console.error(err);
                } else {
                    console.log(result.body);
                    // const [owner, name] = result.body.projectId.split('+');
                    // this.props.history.push(`/p/${owner}/${name}`);
                }
            });
    };

    getCheckResultContent = () => {
        const {checkResult} = this.state;

        if (checkResult.success === true) {
            return (<NotifyDialog
                title="模型检查成功"
                text="该模型没有问题，可以进行仿真。"
                onOK={
                    () => {
                        this.setState({checkResult: null});
                    }}
            />);
        }
        return (<PluginResultDialog
            onOK={
                () => {
                    this.setState({checkResult: null});
                }
            }
            result={checkResult}
            title="模型检查结果"
        />);
    };

    runModelCheck = (config) => {
        const {gmeClient, activeNode} = this.props;

        console.log(ModelCheckPlugin);

        this.setState({showChecker: false});

        if (!config) {
            // Cancelled
            return;
        }

        const pluginId = ModelCheckMetadata.id;
        const context = gmeClient.getCurrentPluginContext(pluginId, activeNode);
        // TODO: Remove when engine is bumped
        context.managerConfig.activeNode = activeNode;

        gmeClient.runBrowserPlugin(ModelCheckPlugin, context, (err, result) => {
            if (err) {
                console.error(err);
            } else {
                console.log('model check finished');
                this.setState({checkResult: result});
            }
        });
    };

    runSimulator = (config) => {
        const {gmeClient, activeNode} = this.props;

        const pluginId = this.SystemSimulatorMetadata.id;
        this.setState({showSimulator: false});
        if (!config) {
            // Cancelled
            return;
        }

        if (config.simulationTool === 'Only Code Generation') {
            const context = gmeClient.getCurrentPluginContext(pluginId, activeNode);
            context.pluginConfig = config;

            gmeClient.runServerPlugin(pluginId, context, (err, result) => {
                if (err) {
                    console.error(err);
                } else if (result.success) {
                    //downloadBlobArtifact(result.artifacts[0]);
                    const targetUrl = 'http://192.168.31.217:10000/compile/savemojson';
                    const postresult={
                        "success": result.success,
                        "model":result.artifacts[0],
                        "modelconfig":{"startTime":0 ,"stopTime":config.stopTime,"stepSize":config.stepSize,"tolerance":config.tolerance,
                            "solver":config.solver,"outputFormat": "csv","variableFilter":".*"
                        },
                        "starttime":result.startTime,
                        "finishtime": result.finishTime,
                        "projectid": result.projectId,
                        "executionName":config.executionName,
                    };
                    axios.post(targetUrl,JSON.stringify(postresult),{   
                        headers: {
                          'Content-Type': 'application/json', 
                        },
                      })
                    .then(response => {
                        console.log('Data sent successfully:', response.data);
                    })
                    .catch(error => {
                    console.error('Error sending data:', error.message);
                });

                } else {
                    console.error(result);
                }
            });
        } else {
            const simResContainer = getMetaNodeByName(gmeClient, 'SimulationResults');
            const simResMeta = getMetaNodeByName(gmeClient, 'SimulationResult');

            if (!simResContainer || !simResMeta) {
                console.error(new Error('Could not find SimulationResults or SimulationResult in meta...'));
                return;
            }

            gmeClient.startTransaction();

            // Create a Simulation Result..
            const resId = gmeClient.createNode({
                parentId: simResContainer.getId(),
                baseId: simResMeta.getId(),
            }, {
                attributes: {
                    name: config.executionName,
                    timeStamp: Date.now(),
                },
            });

            // .. copy over the canvas model
            const modelId = gmeClient.copyNode(activeNode, resId);
            const uiId = gmeClient.addUI(null, () => {
            });
            gmeClient.updateTerritory(uiId, {[modelId]: {children: 0}});
            gmeClient.completeTransaction('创建仿真结果', (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                const context = gmeClient.getCurrentPluginContext(pluginId, modelId);
                context.pluginConfig = config;
                gmeClient.removeUI(uiId);

                this.props.toggleModelingView(false);
                this.props.show();
                this.props.toggleRightDrawer(false);
                gmeClient.runServerPlugin(pluginId, context, (err2, result) => {
                    if (err2) {
                        console.error(err2);
                    } else if (result.success) {
                        // downloadBlobArtifact(result.artifacts[0]);
                    } else {
                        console.error(result);
                    }
                });
            });
        }
    };

    render() {
        const {
            classes, gmeClient, open, modelingView, variables, activeNode, scale,
        } = this.props;
        let actionButtons;

        if (modelingView) {
            actionButtons = [
                {
                    id: 'showChecker',
                    iconClass: <CheckCircle style={{color: green[500]}}/>,
                    onClick: () => {
                        this.setState({showChecker: true});
                    },
                },
                {
                    id: 'showSimulator',
                    iconClass: <PlayCircleOutline color="primary"/>,
                    onClick: () => {
                        this.setState({showSimulator: true});
                    },
                },
                {
                    id: 'showDomainSelector',
                    iconClass: <AddCircle color="secondary"/>,
                    onClick: () => {
                        this.setState({showDomainSelector: true});
                    },
                },
                {
                    id: 'showHistory',
                    iconClass: <History color="primary"/>,
                    onClick: () => {
                        this.setState({showHistory: true});
                    },
                },
            ];
        } else if (!open) {
            actionButtons = variables.map(variable => ({
                id: variable,
                iconClass: <Timeline style={{color: colorHash(variable).rgb}}/>,
                color: colorHash(variable).rgb,
                onClick: () => {
                    this.props.removePlotVariable(variable);
                },
            }));
        } else {
            actionButtons = [];
        }

        return (
            <div>
                <Drawer
                    variant="permanent"
                    anchor="left"
                    open={open}
                    classes={{paper: classNames(classes.drawerPaper, !open && classes.drawerPaperClose)}}
                >
                    <span>
                        <IconButton onClick={open ? this.props.hide : this.props.show}>
                            {open ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
                        </IconButton>
                        {actionButtons.map(desc => (
                            <IconButton
                                key={desc.id}
                                onClick={desc.onClick}
                            >
                                {desc.iconClass}
                            </IconButton>
                        ))}
                    </span>
                    <Divider/>
                    {modelingView ?
                        <PartBrowser gmeClient={gmeClient} activeNode={activeNode} minimized={!open} scale={scale}/> :
                        <ResultList gmeClient={gmeClient} minimized={!open}/>}
                </Drawer>

                {this.state.showSimulator ?
                    <PluginConfigDialog
                        metadata={this.SystemSimulatorMetadata}
                        onOK={this.runSimulator}
                    /> : null}

                {this.state.showChecker ?
                    <PluginConfigDialog
                        metadata={ModelCheckMetadata}
                        onOK={this.runModelCheck}
                        fastForward
                    /> : null}

                {this.state.showDomainSelector ?
                    <DomainSelector
                        domains={(gmeClient.getProjectInfo().info.kind || '').split(':').slice(1)}
                        showDomainSelection
                        title="修改导入组件库"
                        onOK={this.onUpdateDomains}
                        onCancel={this.onUpdateDomains}
                    /> : null}
                {this.state.checkResult ? this.getCheckResultContent() : null}
                {this.state.showHistory ? <ProjectHistory
                    gmeClient={gmeClient}
                    onOK={() => {
                        this.setState({showHistory: false});
                    }}
                /> : null}
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LeftDrawer));
