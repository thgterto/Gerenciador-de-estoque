import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title?: string;
    children: React.ReactNode;
    hideHeader?: boolean;
    noPadding?: boolean;
    className?: string; // Ignored/Mapped
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, onClose, title, children, hideHeader, noPadding, footer
}) => {
    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            {!hideHeader && (
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {title && <Typography variant="h6">{title}</Typography>}
                    {onClose ? (
                        <IconButton onClick={onClose} aria-label="close">
                            <CloseIcon />
                        </IconButton>
                    ) : null}
                </DialogTitle>
            )}
            <DialogContent dividers={!hideHeader} sx={{ p: noPadding ? 0 : 2 }}>
                {children}
            </DialogContent>
            {footer && <DialogActions>{footer}</DialogActions>}
        </Dialog>
    );
};
