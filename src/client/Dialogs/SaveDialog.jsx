import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';

export default class SaveDialog extends React.Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        onClose: PropTypes.func.isRequired,
    };

    state = {
        message: '',
    };

    save = () => {
        const {gmeClient} = this.props;
        const {message} = this.state;
        const prepend = 'save: ';
        gmeClient.startTransaction('');
        gmeClient.setRegistry('', '_save', !(gmeClient.getNode('')
            .getRegistry('_save') === true), '');
        gmeClient.completeTransaction(prepend + message);
        this.props.onClose(true);
    };

    render() {
        const {message} = this.state;

        return (
            <div>
                <Dialog
                    open
                    onClose={() => this.props.onClose(false)}
                    aria-labelledby="save-dialog-title"
                    aria-describedby="save-dialog-description"
                >
                    <DialogTitle id="save-dialog-title">创建保存点</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="save-dialog-description">
                        描述该模型的给定更改的内容
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="msg"
                            label="Save message"
                            placeholder="Description of the change"
                            value={message}
                            onChange={(event) => {
                                this.setState({message: event.target.value});
                            }}
                            fullWidth
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.props.onClose(false)} color="primary">
                            取消
                        </Button>
                        <Button disabled={message.length === 0} onClick={() => this.save()} color="primary">
                            保存
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}
