"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmPopUpUI";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TOKENS = {
  heading: { variant: "h5" as const, weight: 500 as const },
  table: { headerFontWeight: 600 as const, actionsColWidth: 140, cellY: 1.25 },
  spacing: { sectionY: 3 },
};

type LogType = "CHECK_IN" | "CHECK_OUT" | "BOOK_SESSION" | "CANCEL_SESSION";

type ApiNullString = { String: string; Valid: boolean };
type ApiNullTime = { Time: string; Valid: boolean };

// ---- API row (ตามตัวอย่างที่ให้มา) ----
type ApiRow = {
  logId: number;
  customerUsername?: ApiNullString;
  customerFirstName: string;
  customerLastName: string;
  createdAt?: ApiNullTime;
  logType: LogType;
};

// ---- API response: เป็น array ล้วน ๆ ----
type ApiResp = ApiRow[];

// ---- UI row หลัง map ----
type UIRow = {
  logId: number;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  timestampISO: string; // เอา Time มาเก็บเป็น ISO string ถ้ามี
  logType: LogType;
};

const COLUMNS = [
  { key: "logId", label: "Log ID" },
  { key: "customerUsername", label: "Username" },
  { key: "customerFirstName", label: "First Name" },
  { key: "customerLastName", label: "Last Name" },
  { key: "timestampISO", label: "Recorded At" },
  { key: "logType", label: "Log Type" },
] as const;

const ns = (v?: ApiNullString | null) => (v && v.Valid ? v.String : "");
const nt = (v?: ApiNullTime | null) => (v && v.Valid ? v.Time : "");

// แสดงวันที่/เวลาแบบไทย (02/11/2568 14:05:00)
// ถ้าต้องการ “YYYY-MM-DD HH:mm:ss” ก็สามารถเปลี่ยนเป็น manual formatter ได้
const formatDateTimeTH = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export default function CustomerLogPage(): React.JSX.Element {
  const router = useRouter();
  const { setAlert } = useAlertPopUp();

  // เก็บทั้งหมด แล้วค่อย slice เป็นหน้า ๆ
  const [allRows, setAllRows] = React.useState<UIRow[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(10);

  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<UIRow | null>(null);

  const mapRow = (r: ApiRow): UIRow => ({
    logId: r.logId,
    customerUsername: ns(r.customerUsername),
    customerFirstName: r.customerFirstName ?? "",
    customerLastName: r.customerLastName ?? "",
    timestampISO: nt(r.createdAt),
    logType: r.logType,
  });

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      // <-- ดึงทั้งหมด ไม่มี page/limit ใน query string
      const res = await fetch(`${API_BASE}/api/customer-logs`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      // พยายาม parse เป็น array
      const body = (await res.json().catch(() => null)) as ApiResp | null;
      if (!res.ok || !Array.isArray(body)) {
        throw new Error(`Failed to load data (HTTP ${res.status})`);
      }

      const mapped = body.map(mapRow);

      // เรียงจากใหม่ไปเก่า: createdAt DESC, ถ้าเท่ากัน fallback logId DESC
      mapped.sort((a, b) => {
        const ta = a.timestampISO || "";
        const tb = b.timestampISO || "";
        const cmp = tb.localeCompare(ta);
        return cmp !== 0 ? cmp : b.logId - a.logId;
      });

      setAllRows(mapped);
      setPage(0);
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setGlobalErr(msg);
      setAlert({ open: true, msg, severity: "error" });
      setAllRows([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, [setAlert]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const totalItems = allRows.length;
  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return allRows.slice(start, end);
  }, [allRows, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const goEdit = (r: UIRow) =>
    router.push(`/admin/customer-log/edit/${encodeURIComponent(String(r.logId))}`);

  const askDelete = (r: UIRow) => {
    setTarget(r);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/customer-logs/${encodeURIComponent(String(target.logId))}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody?.message || `Delete failed (HTTP ${res.status})`);
      }

      setAlert({ open: true, msg: `Log: ${target.logId} deleted successfully`, severity: "success" });

      // อัปเดตฝั่ง client + จัดการ page ถ้าหน้าเกิน
      setAllRows((prev) => {
        const next = prev.filter((x) => x.logId !== target.logId);
        const maxPage = Math.max(0, Math.ceil(next.length / rowsPerPage) - 1);
        setPage((p) => (p > maxPage ? maxPage : p));
        return next;
      });
    } catch (e: unknown) {
      setAlert({ open: true, msg: errorMessage(e), severity: "error" });
    } finally {
      setConfirmOpen(false);
      setTarget(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: TOKENS.spacing.sectionY } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant={TOKENS.heading.variant} fontWeight={TOKENS.heading.weight}>
          Customer Log
        </Typography>
      </Stack>

      {globalErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErr}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto", position: "relative" }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {COLUMNS.map((c) => (
                  <TableCell
                    key={c.key as string}
                    sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}
                  >
                    {c.label}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    fontWeight: TOKENS.table.headerFontWeight,
                    whiteSpace: "nowrap",
                    width: TOKENS.table.actionsColWidth,
                    py: TOKENS.table.cellY,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pagedRows.map((r) => (
                <TableRow key={r.logId} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.logId}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.customerUsername || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.customerFirstName}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.customerLastName}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{formatDateTimeTH(r.timestampISO)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      size="small"
                      label={r.logType}
                      color={
                        r.logType === "CHECK_IN"
                          ? "success"
                          : r.logType === "CHECK_OUT"
                          ? "default"
                          : r.logType === "BOOK_SESSION"
                          ? "primary"
                          : "warning"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => goEdit(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => askDelete(r)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Deletion"
        message={
          target
            ? `Warning: Deleting this log (ID: ${target.logId}) for customer ${target.customerUsername || "—"} is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}