"use client";
import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Chip, CircularProgress
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  requireTextMatch?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title = "ยืนยันการทำรายการ",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  requireTextMatch,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState("");

  React.useEffect(() => { if (!open) { setBusy(false); setInput(""); } }, [open]);
  const canConfirm = !busy && (!requireTextMatch || input.trim() === requireTextMatch.trim());

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle
        component="div"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
        <WarningAmberIcon color="warning" />
        <Typography variant="h6" component="span">{title}</Typography>
        <Chip label="WARNING" size="small" sx={{ ml: "auto" }} variant="outlined" color="warning" />
        </DialogTitle>
      <DialogContent>
        {typeof message === "string" ? <Typography sx={{ mt: 0.5 }}>{message}</Typography> : message}
        {requireTextMatch && (
          <input
            style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            placeholder={`พิมพ์ ${requireTextMatch} เพื่อยืนยัน`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={busy}> {cancelText} </Button>
        <Button
          variant="contained"
          color="error"
          onClick={async () => {
            if (!canConfirm) return;
            try { setBusy(true); await onConfirm(); } finally { setBusy(false); onClose(); }
          }}
          disabled={!canConfirm}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {busy ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}