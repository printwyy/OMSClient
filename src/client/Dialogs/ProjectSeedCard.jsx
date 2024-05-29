import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

export default class ProjectSeedCards extends Component {
    static propTypes = {
        seedsInfo: PropTypes.arrayOf(PropTypes.object).isRequired,
        onCreate: PropTypes.func,
        mediaStyle: PropTypes.object,
        contentStyle: PropTypes.object,
    };

    static defaultProps = {
        onCreate: (createData) => {
            console.log('onCreate', createData);
        },
        mediaStyle: {
            height: 120,
        },
        contentStyle: {
            minHeight: 160,
        },
    };

    render() {
        const {seedsInfo} = this.props;

        const cards = seedsInfo.map((seedInfo) => {
            const {infoUrl} = seedInfo;
            const buttons = [];
            const createBtn = (
                <Button
                    key="createBtn"
                    size="small"
                    color="primary"
                    onClick={() => {
                        this.props.onCreate(seedInfo.createData);
                    }}
                >

                    创建
                </Button>);

            buttons.push(createBtn);

            if (infoUrl) {
                const infoBtn = (
                    <a
                        href={infoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        key="infoBtn"
                        style={{textDecoration: 'none'}}
                    >
                        <Button
                            size="small"
                            color="primary"
                        >

                            详情说明
                        </Button>
                    </a>);

                buttons.push(infoBtn);
            }

            return (
                <Grid item lg={6} md={12} sm={6} xs={12} key={seedInfo.title}>
                    <Card>
                        <CardMedia
                            style={this.props.mediaStyle}
                            image={seedInfo.imageUrl}
                            title={seedInfo.title}
                        />
                        <CardContent style={this.props.contentStyle}>
                            <Typography variant="headline">
                                {seedInfo.title}
                            </Typography>
                            <Typography component="p">
                                {seedInfo.description}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            {buttons}
                        </CardActions>
                    </Card>
                </Grid>
            );
        });

        return (
            <Grid container spacing={24}>
                {cards}
            </Grid>
        );
    }
}
