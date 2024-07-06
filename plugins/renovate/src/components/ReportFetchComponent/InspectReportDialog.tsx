import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { JsonViewer } from '@textea/json-viewer';
import React from 'react';

export interface InspectReportDialogProps {
  open: boolean;
  report: unknown;
  onClose: () => void;
}

export function InspectReportDialog(props: InspectReportDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xl">
      <DialogTitle id="report-inspector-dialog-title">
        Report Inspector
      </DialogTitle>
      <DialogContent>
        <JsonViewer theme="auto" value={props.report} />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
