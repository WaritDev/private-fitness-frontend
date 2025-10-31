"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter, useParams } from "next/navigation";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

const RE_URL =
  /^(https?:\/\/)([\w.-]+)(:\d+)?(\/[\w.\-~:/?#[\]@!$&'()*+,;=%]*)?$/i;

type ApiGetItem = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeImageUrl: string;
  isActive: boolean;
};

type UpdateBody = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string;
  isActive: boolean;
};

export default function EditPaymentAccountPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setAlert } = useAlertPopUp();

  const id = params?.id ?? "";

  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [accountName, setAccountName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState<"true" | "false">("true");
  const [saving, setSaving] = React.useState(false);

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setGlobalErr("");

      try {
        const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(id)}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setNotFound(true);
            return;
          }
          let msg = `Failed to load (HTTP ${res.status}).`;
          try {
            const body: unknown = await res.json();
            if (typeof body === "object" && body && "message" in body) {
              const m = (body as { message?: string }).message;
              if (m) msg = m;
            }
          } catch {}
          throw new Error(msg);
        }

        const row = (await res.json()) as ApiGetItem;
        if (cancelled) return;

        setAccountName(row.accountName ?? "");
        setAccountNumber(row.accountNumber ?? "");
        setBankName(row.bankName ?? "");
        setQrCodeUrl(row.qrCodeImageUrl ?? "");
        setIsActive(row.isActive ? "true" : "false");
      } catch (e) {
        if (!cancelled) {
          setGlobalErr(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const goBack = () => router.push("/admin/payments-management");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!accountName.trim()) e.accountName = "Required";
    if (!accountNumber.trim()) e.accountNumber = "Required";
    if (!bankName.trim()) e.bankName = "Required";
    if (!qrCodeUrl.trim()) e.qrCodeUrl = "Required";
    else if (!RE_URL.test(qrCodeUrl)) e.qrCodeUrl = "Invalid URL (must start with http:// or https://).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const body: UpdateBody = {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        qrCodeUrl: qrCodeUrl.trim(),
        isActive: isActive === "true",
      };

      const res = await fetch(
        `${API_BASE}/api/payments/${encodeURIComponent(id)}/update`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        let msg = `Save failed (HTTP ${res.status}).`;
        try {
          const rb: unknown = await res.json();
          if (typeof rb === "object" && rb && "message" in rb) {
            const m = (rb as { message?: string }).message;
            if (m) msg = m;
          }
        } catch {}
        throw new Error(msg);
      }

      setAlert({
        open: true,
        msg: `Payment Account: ${id} updated successfully`,
        severity: "success",
      });
      router.push("/admin/payments-management");
    } catch (e) {
      setAlert({
        open: true,
        msg: e instanceof Error ? e.message : String(e),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 3, md: 4 }, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Payment account not found (id={id || "—"})
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
      {globalErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErr}
        </Alert>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>
          Edit Payment Account
        </Typography>
        <Stack direction="row" spacing={1}>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Payment_Account_Id"
            value={id}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Account_Name"
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value);
              setErrors((p) => ({ ...p, accountName: "" }));
            }}
            error={!!errors.accountName}
            helperText={errors.accountName}
            fullWidth
          />
          <TextField
            label="Account_Number"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              setErrors((p) => ({ ...p, accountNumber: "" }));
            }}
            error={!!errors.accountNumber}
            helperText={errors.accountNumber}
            fullWidth
          />
          <TextField
            label="Bank_Name"
            value={bankName}
            onChange={(e) => {
              setBankName(e.target.value);
              setErrors((p) => ({ ...p, bankName: "" }));
            }}
            error={!!errors.bankName}
            helperText={errors.bankName}
            fullWidth
          />
          <TextField
            label="QR_Code_URL"
            value={qrCodeUrl}
            onChange={(e) => {
              setQrCodeUrl(e.target.value);
              setErrors((p) => ({ ...p, qrCodeUrl: "" }));
            }}
            error={!!errors.qrCodeUrl}
            helperText={errors.qrCodeUrl || "e.g. https://cdn.example.com/qr/xxx.png"}
            fullWidth
          />
          <TextField
            select
            label="Is_Active"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value as "true" | "false")}
            fullWidth
          >
            <MenuItem value="true">true (Active)</MenuItem>
            <MenuItem value="false">false (Inactive)</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          disabled={saving}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Box>
  );
}