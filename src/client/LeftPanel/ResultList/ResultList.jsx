import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import update from 'immutability-helper';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ErrorIcon from '@material-ui/icons/Error';
import CheckIcon from '@material-ui/icons/Check';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

import Edit from '@material-ui/icons/Edit';
import CloudDownload from '@material-ui/icons/CloudDownload';
import Delete from '@material-ui/icons/Delete';
import Description from '@material-ui/icons/Description';
import ChromeReaderMode from '@material-ui/icons/ChromeReaderMode';

import Territory from 'webgme-react-components/src/components/Territory';
import ConfirmDialog from '../../Dialogs/ConfirmStartDialog';//'webgme-react-components/src/components/ConfirmDialog';

import {downloadBlobArtifact} from '../../gme/utils/saveUrlToDisk';
import PlotVariableSelector from './PlotVariableSelector';
import RenameInput from './RenameInput';
import ConsoleDialog from '../../Dialogs/ConsoleDialog';

import getMetaNodeByName from '../../gme/utils/getMetaNodeByName';
import {setPlotNode, setSimResData, setResultNode} from '../../actions';

const mapStateToProps = state => ({
    plotNode: state.plotData.nodeId,
    resultNode: state.resultNode,
    simRes: state.plotData.simRes,
});

const mapDispatchToProps = dispatch => ({
    setPlotNode: (nodeId) => {
        dispatch(setPlotNode(nodeId));
    },
    setSimResData: (simRes) => {
        dispatch(setSimResData(simRes));
    },
    setResultNode: (resultNode) => {
        dispatch(setResultNode(resultNode));
    },
});

class ResultList extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        minimized: PropTypes.bool.isRequired,

        setPlotNode: PropTypes.func.isRequired,
        setSimResData: PropTypes.func.isRequired,
        setResultNode: PropTypes.func.isRequired,
        resultNode: PropTypes.string,
        // plotNode: PropTypes.string,
        simRes: PropTypes.object,
    };

    static defaultProps = {
        // plotNode: null,
        resultNode: null,
        simRes: null,
    };

    constructor(props) {
        super(props);
        const {gmeClient} = this.props;
        const simResNode = getMetaNodeByName(gmeClient, 'SimulationResults');

        if (simResNode) {
            this.state.containerId = simResNode.getId();
            this.state.territory = {
                [this.state.containerId]: {children: 1},
            };
        } else {
            console.error(new Error('在meta中找不到SimulationResults…'));
        }
    }

    state = {
        containerId: null,
        expandedResId: null,
        territory: null,
        results: {},
        editResultName: false,
        showConfirmDelete: false,
        showConsoleDialog: false,
    };

    onDeleteConfirmed = (doDelete) => {
        const {gmeClient} = this.props;
        const {expandedResId} = this.state;

        if (doDelete && expandedResId) {
            gmeClient.deleteNode(expandedResId, `结果已被移除 ${expandedResId}`);
        }

        this.setState({showConfirmDelete: false});
    };

    handleEvents = (hash, loads, updates, unloads) => {
        const {gmeClient, resultNode} = this.props;
        const {containerId} = this.state;
        const updateDesc = {};
        const attrNames = ['name', 'simRes', 'simPackage', 'csvFile', 'timeStamp'];

        loads.forEach((nodeId) => {
            if (nodeId !== containerId) {
                const nodeObj = gmeClient.getNode(nodeId);
                const modelId = nodeObj.getChildrenIds()[0]; // FIXME: This is assuming one and only one model
                const isRunning = !nodeObj.getAttribute('stdout');

                updateDesc[nodeId] = {
                    $set: {
                        isRunning,
                        modelId,
                    },
                };

                attrNames.forEach((attrName) => {
                    updateDesc[nodeId].$set[attrName] = nodeObj.getAttribute(attrName);
                });

                if (nodeId === resultNode && isRunning === false) {
                    // FIXME
                    setTimeout(() => this.switchPlotNode(nodeId));
                }
            }
        });

        updates.forEach((nodeId) => {
            if (nodeId !== containerId) {
                const nodeObj = gmeClient.getNode(nodeId);
                const modelId = nodeObj.getChildrenIds()[0]; // FIXME: This is assuming one and only one model
                const isRunning = !nodeObj.getAttribute('stdout');

                updateDesc[nodeId] = {
                    isRunning: {$set: isRunning},
                    modelId: {$set: modelId},
                };

                attrNames.forEach((attrName) => {
                    updateDesc[nodeId][attrName] = {$set: nodeObj.getAttribute(attrName)};
                });

                if (nodeId === resultNode && isRunning === false) {
                    // FIXME
                    setTimeout(() => this.switchPlotNode(nodeId));
                }
            }
        });

        updateDesc.$unset = unloads.filter(nodeId => nodeId !== containerId);

        if (unloads.includes(resultNode)) {
            this.props.setResultNode(null);
            this.switchPlotNode(null);
        }

        this.setState({
            results: update(this.state.results, updateDesc),
        });
    };

    handleExpand = resId => (event, expanded) => {
        // extract attribute simRes and add it to the state

        if (expanded) {
            this.props.setResultNode(resId);
            this.switchPlotNode(resId);
            this.setState({expandedResId: resId});
        } else {
            this.setState({expandedResId: null});
        }
    };

    updateResultTitle = (resId, canceled, newName) => {
        const {gmeClient} = this.props;
        const {results} = this.state;

        if (results[resId] && canceled === false && results[resId].name !== newName) {
            gmeClient.setAttribute(resId, 'name', newName);
        }

        this.setState({editResultName: false});
    };

    downloadArtifact = (entirePackage) => {
        const {results, expandedResId} = this.state;

        if (expandedResId && results[expandedResId]) {
            if (entirePackage && results[expandedResId].simPackage) {
                downloadBlobArtifact(results[expandedResId].simPackage);
            }

            if (!entirePackage && results[expandedResId].csvFile) {
                downloadBlobArtifact(results[expandedResId].csvFile);
            }
        }
    };

    switchPlotNode = (resId) => {
        const {results} = this.state;

        if (resId === null) {
            this.props.setPlotNode(null);
            this.props.setSimResData(null);
        } else {
            this.props.setPlotNode(results[resId].modelId);
            this.props.setSimResData(results[resId].simRes ? JSON.parse(results[resId].simRes) : null);
        }
    };

    render() {
        const {
            minimized, gmeClient, simRes,
        } = this.props;

        const {
            territory,
            results,
            expandedResId,
            editResultName,
            showConfirmDelete,
            showConsoleDialog,
        } = this.state;

        const resultIds = Object.keys(results).sort((a, b) => {
            const tA = results[a].timeStamp || 0;
            const tB = results[b].timeStamp || 0;

            if (tA > tB) {
                return -1;
            } else if (tB > tA) {
                return 1;
            }

            return 0;
        });

        return (
            <div style={{display: minimized ? 'none' : undefined}}>
                <Territory
                    gmeClient={gmeClient}
                    territory={territory}
                    onUpdate={this.handleEvents}
                    onlyActualEvents
                    reuseTerritory={false}
                />

                {resultIds.map((resId) => {
                    const resInfo = results[resId];
                    const hasResults = simRes !== null;
                    const isExpanded = resId === expandedResId;
                    const failed = resInfo.isRunning === false && !resInfo.simRes;

                    const actionButtons = [
                        {
                            id: 'modeEdit',
                            toolTip: '重命名该仿真结果名称',
                            iconClass: <Edit style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: 18}}/>,
                            onClick: () => {
                                this.setState({editResultName: true});
                            },
                        },
                        {
                            id: 'delete',
                            toolTip: '删除该仿真结果',
                            iconClass: <Delete style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: 18}}/>,
                            onClick: () => {
                                this.setState({showConfirmDelete: true});
                            },
                        },
                        {
                            id: 'viewConsole',
                            toolTip: '查看控制台日志',
                            iconClass: <ChromeReaderMode style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: 18}}/>,
                            onClick: () => {
                                this.setState({showConsoleDialog: true});
                            },
                        },
                    ];

                    let statusIcon;

                    if (resInfo.isRunning) {
                        statusIcon = <CircularProgress size={18}/>;
                    } else if (failed) {
                        statusIcon = <ErrorIcon style={{color: 'pink', width: 18, height: 18}}/>;
                    } else {
                        statusIcon = <CheckIcon style={{color: 'lightgreen', width: 18, height: 18}}/>;
                        actionButtons.push({
                            id: '下载CSV',
                            toolTip: '下载CSV结果文件',
                            iconClass: <Description style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: 18}}/>,
                            onClick: () => {
                                this.downloadArtifact(false);
                            },
                        });

                        actionButtons.push({
                            id: '下载仿真代码',
                            toolTip: '下载仿真代码',
                            iconClass: <CloudDownload style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: 18}}/>,
                            onClick: () => {
                                this.downloadArtifact(true);
                            },
                        });
                    }

                    return (
                        <ExpansionPanel
                            key={resId}
                            expanded={isExpanded}
                            onChange={this.handleExpand(resId)}
                        >
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                <div style={{marginRight: 6, marginLeft: -18}}>
                                    {statusIcon}
                                </div>
                                {editResultName && expandedResId === resId && results[expandedResId] ?
                                    (
                                        <RenameInput
                                            initialValue={results[expandedResId].name}
                                            onDone={(canceled, newValue) => {
                                                this.updateResultTitle(resId, canceled, newValue);
                                            }}
                                        />) :
                                    (
                                        <Typography
                                            type="subheading"
                                            style={{
                                                textOverflow: 'ellipsis',
                                                maxWidth: 160,
                                                overflow: 'hidden',
                                            }}
                                        >{resInfo.name}
                                        </Typography>)
                                }

                            </ExpansionPanelSummary>

                            <ExpansionPanelDetails style={{display: 'block', padding: 0, paddingBottom: 10}}>
                                <span>
                                    {actionButtons.map(desc => (
                                        <Tooltip
                                            key={desc.id}
                                            id={desc.id}
                                            title={desc.toolTip}
                                            placement="top"
                                        >
                                            <IconButton
                                                key={desc.id}
                                                onClick={desc.onClick}
                                            >
                                                {desc.iconClass}
                                            </IconButton>
                                        </Tooltip>
                                    ))}
                                </span>
                                {(() => {
                                    if (hasResults) {
                                        return <PlotVariableSelector gmeClient={gmeClient} nodeId={resId}/>;
                                    } else if (failed) {
                                        return null;
                                    }

                                    return (
                                        <div>
                                            <LinearProgress/>
                                            <br/>
                                            <LinearProgress color="secondary"/>
                                        </div>);
                                })()}
                            </ExpansionPanelDetails>
                        </ExpansionPanel>);
                })}

                {showConfirmDelete ?
                    <ConfirmDialog
                        title="删除结果"
                        message="是否要删除结果？如果仿真求解正在运行，它将被中止"
                        onClose={this.onDeleteConfirmed}
                    /> : null
                }
                {showConsoleDialog && expandedResId ?
                    <ConsoleDialog
                        gmeClient={gmeClient}
                        attributeName="stdout"
                        title="控制台仿真日志详情"
                        nodeId={expandedResId}
                        onClose={() => this.setState({showConsoleDialog: false})}
                    /> : null
                }
            </div>);
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultList);
