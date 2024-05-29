import React from 'react';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

function ConfirmDialog(props) {
    return (
        <div>
            <Dialog
                open
                onClose={() => props.onClose(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {props.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => props.onClose(false)} color="primary">
                        {props.noButtonText}
                    </Button>
                    <Button onClick={() => props.onClose(true)} color="primary" autoFocus>
                        {props.yesButtonText}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

ConfirmDialog.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    noButtonText: PropTypes.string,
    yesButtonText: PropTypes.string,
};

ConfirmDialog.defaultProps = {
    onClose: (ok) => {
        console.log(`OK was${ok ? '' : ' not'} pressed`);
    },
    noButtonText: '取消',
    yesButtonText: '确定',
};

export default ConfirmDialog;
