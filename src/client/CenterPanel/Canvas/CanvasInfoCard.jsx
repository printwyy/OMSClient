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
                正在加载工作台
            </Typography>
            <Typography component="p">
                使用左侧菜单将组件添加到系统中。找到需要的组件
                然后把它们拖放到画布上。基于它们的接口，您可以进行组件连接
                    通过单击端口图标将组件组合在一起。 <br/><br/>
                双击组件可编辑参数
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
                查看Modelica标准库文档
            </Button>
        </CardActions>
    </Card>
);

export default CanvasInfoCard;
