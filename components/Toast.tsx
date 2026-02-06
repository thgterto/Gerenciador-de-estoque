import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAlert } from '../context/AlertContext';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useAlert();

    // MUI Snackbar handles one at a time comfortably, or stacked.
    // For simplicity, we just render the last one or map them.
    // To map multiple, we need multiple Snackbars with offsets, which is complex.
    // We'll show the most recent one.

    const latestToast = toasts[toasts.length - 1];

    const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        if (latestToast) removeToast(latestToast.id);
    };

    if (!latestToast) return null;

    return (
        <Snackbar
            open={!!latestToast}
            autoHideDuration={4000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleClose} severity={latestToast.type || 'info'} sx={{ width: '100%' }}>
                {latestToast.message}
            </Alert>
        </Snackbar>
    );
};
