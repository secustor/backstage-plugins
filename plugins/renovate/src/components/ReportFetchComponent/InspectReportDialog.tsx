import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from '@backstage/ui';

import { JsonViewer } from '@textea/json-viewer';

export interface InspectReportDialogProps {
  open: boolean;
  report: unknown;
  onClose: () => void;
}

export function InspectReportDialog(props: InspectReportDialogProps) {
  return (
    <Dialog
      isOpen={props.open}
      onOpenChange={isOpen => !isOpen && props.onClose()}
      width="90vw"
    >
      <DialogHeader>Report Inspector</DialogHeader>
      <DialogBody>
        <JsonViewer theme="auto" value={props.report} />
      </DialogBody>
      <DialogFooter>
        <Button slot="close" variant="primary">
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
