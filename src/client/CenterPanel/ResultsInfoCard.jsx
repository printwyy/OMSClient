import React from 'react';
import {Link} from 'react-router-dom';

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const CanvasInfoCard = () => (
    <Card style={{
        position: 'absolute',
        maxWidth: 600,
        left: 'calc(50% - 300px)',
        top: '20%',
    }}
    >
        <CardContent>
            <Typography style={{marginBottom: 20}} variant="headline" component="h2">
                仿真结果集
            </Typography>
            <Typography component="p">
            使用左侧菜单查看该工作台中的模型当前和以前执行的仿真结果。
            
                <br/><br/>
                
            </Typography>
        </CardContent>
        <CardActions>
            <Button
                size="small"
                color="primary"
                component={Link}
                to="http://doc.modelica.org/om/Modelica.html"
                target="_blank"
            >
                了解更多Modelica标准库
            </Button>
        </CardActions>
    </Card>
);

export default CanvasInfoCard;
