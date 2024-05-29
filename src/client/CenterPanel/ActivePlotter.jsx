import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';

import colorHash from '../gme/utils/colorHash';

/* eslint-disable */
class Plotter extends Component {
    static propTypes = {
      variables: PropTypes.arrayOf(PropTypes.string).isRequired,
      simRes: PropTypes.object.isRequired,
    };
  
    constructor(props) {
      super(props);
      this.state = {
        data: [],
        loadRatio: 0, // 新增状态，用于跟踪当前加载的数据比例
      };
    }
  
    componentDidMount() {
      this.updateChartData();
      this.timer = setInterval(() => this.incrementLoadRatio(), 1500); // 每2秒增加加载比例
    }
  
    componentWillUnmount() {
      clearInterval(this.timer);
    }
  
    incrementLoadRatio = () => {
      const nextRatio = Math.min(this.state.loadRatio + 0.1, 1); // 加载比例增加1/10，最多到1
      
      this.setState({ loadRatio: nextRatio }, () => this.updateChartData());
    }
  
    updateChartData = () => {
      const { variables, simRes } = this.props;
      const { loadRatio } = this.state;
  
      let data = [];
      const maxIndex = Math.floor(simRes.timeSeries.time.length * loadRatio);
  
      for (let i = 0; i <= maxIndex; i++) {
        const plotPoints = { time: simRes.timeSeries.time[i] };
        variables.forEach((varName) => {
          plotPoints[varName] = parseFloat(simRes.timeSeries[varName][i]);
        });
        data.push(plotPoints);
      }
  
      this.setState({ data });
    }
  
    render() {
      const { data } = this.state;
  
      return (
        <div>
          <LineChart
            width={1000}
            height={450}
            data={data}
            style={{
              marginTop: 15,
              marginBottom: 15,
            }}
          >
            <XAxis dataKey="time" tickCount={10} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend layout="vertical" align="left" verticalAlign="middle" />
            {data[0] ?
              Object.keys(data[0])
                .filter(varName => varName !== 'time' || this.props.variables.length === 0)
                .map((varName) => {
                  let name = varName;
                  if (varName === 'time') {
                    name = 'Time is the master...';
                  }
  
                  return (
                    <Line
                      dot={false}
                      name={name}
                      key={varName}
                      type="monotone"
                      dataKey={varName}
                      stroke={colorHash(varName).rgb}
                    />
                  );
                })
              : null}
          </LineChart>
        </div>
      );
    }
  }
  
  export default Plotter;
  