import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { JsonViewer } from '@textea/json-viewer';

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
