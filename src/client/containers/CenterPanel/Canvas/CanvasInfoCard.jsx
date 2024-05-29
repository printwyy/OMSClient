import React from 'react';
import InfoCard from 'webgme-react-components/src/components/InfoCard';


export default InfoCard(
    '这是您的模型工作台',
    (<span>
        使用左侧菜单将组件添加到系统中。找到需要的组件
        然后把它们拖放到画布上。基于它们的接口，您可以进行连接
            通过单击端口图标将组件组合在一起。 <br/><br/>
        双击组件编辑仿真参数
    </span>
    ),
    {
        target: '/'/*'http://doc.modelica.org/om/Modelica.html'*/,
        title: '了解更多Modelica标准库信息',
    },
);
