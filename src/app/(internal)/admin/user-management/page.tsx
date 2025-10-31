"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmPopUpUI";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

// --- UI tokens ---
const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;
const TOKENS = {
  heading: { variant: "h5" as const, weight: 500 as const },
  table: { headerFontWeight: 600 as const, actionsColWidth: 140, cellY: 1.25 },
  button: { height: 40, borderRadius: 10 },
  spacing: { sectionY: 3 },
};

// --- Types ---
type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "MALE" | "FEMALE" | "OTHER";
type Order = "asc" | "desc";

type ApiNullString = { String: string; Valid: boolean };
type ApiNullBool = { Bool: boolean; Valid: boolean };

type ApiStaff = {
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber: string;
  gmail: string;
  specialty: ApiNullString;
  isActive: ApiNullBool;
};

type Envelope = { data?: ApiStaff[]; message?: string };

type Staff = {
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  gmail?: string | null;
  specialty?: string | null;
  isActive: boolean;
};

type ConfirmState = { open: boolean; target?: Staff };

// --- Runtime guards (no any) ---
function isApiNullString(v: unknown): v is ApiNullString {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.String === "string" && typeof o.Valid === "boolean";
}

function isApiNullBool(v: unknown): v is ApiNullBool {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.Bool === "boolean" && typeof o.Valid === "boolean";
}

function isApiStaff(v: unknown): v is ApiStaff {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.username === "string" &&
    typeof o.role === "string" &&
    typeof o.firstName === "string" &&
    typeof o.lastName === "string"
  );
}

function isApiStaffArray(v: unknown): v is ApiStaff[] {
  return Array.isArray(v) && v.every(isApiStaff);
}

function isEnvelope(v: unknown): v is Envelope {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (!("data" in o)) return false;
  return o.data === undefined || isApiStaffArray(o.data);
}

// --- Helpers (no any) ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    const v = (await res.json()) as unknown;
    return v as T;
  } catch {
    return null;
  }
}

/** support both pure array and envelope { data: [...] } */
function pickStaffArray(body: unknown): ApiStaff[] {
  if (isApiStaffArray(body)) return body;
  if (isEnvelope(body)) return body.data ?? [];
  return [];
}

function mapStaff(s: ApiStaff): Staff {
  return {
    username: s.username,
    role: s.role,
    firstName: s.firstName,
    lastName: s.lastName,
    gender: s.gender ?? null,
    dateOfBirth: s.dateOfBirth ?? null,
    phoneNumber: s.phoneNumber ?? null,
    gmail: s.gmail ?? null,
    specialty: isApiNullString(s.specialty) && s.specialty.Valid ? s.specialty.String : null,
    isActive: isApiNullBool(s.isActive) && s.isActive.Valid ? s.isActive.Bool : false,
  };
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function renderGender(g?: Gender | null): string {
  return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : g ? "Other" : "—";
}

function formatDOB(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().split("T")[0];
}

// --- Component ---
export default function StaffAccounts(): React.JSX.Element {
  const router = useRouter();
  const { setAlert } = useAlertPopUp();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [allRows, setAllRows] = React.useState<Staff[]>([]);
  const totalItems = allRows.length;

  const [order, setOrder] = React.useState<Order>("asc");
  const [loading, setLoading] = React.useState(false);

  const [confirm, setConfirm] = React.useState<ConfirmState>({ open: false });

  const loadAllStaffAccounts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/staffs`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errBody = await safeJson<Envelope | ApiStaff[]>(res);
        throw new Error((errBody as Envelope | null)?.message ?? `Failed to load data (HTTP ${res.status})`);
      }

      const body = await safeJson<Envelope | ApiStaff[]>(res);
      const raw = pickStaffArray(body);
      if (!isApiStaffArray(raw)) {
        throw new Error("Unexpected response shape");
      }

      const mapped = raw.map(mapStaff);
      mapped.sort((a, b) => a.firstName.localeCompare(b.firstName, "en"));

      setAllRows(mapped);

      const maxPage = Math.max(0, Math.ceil(mapped.length / rowsPerPage) - 1);
      setPage((p) => (p > maxPage ? maxPage : p));
    } catch (e: unknown) {
      setAlert({ open: true, msg: errorMessage(e), severity: "error" });
      setAllRows([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage, setAlert]);

  React.useEffect(() => {
    void loadAllStaffAccounts();
  }, [loadAllStaffAccounts]);

  const sortedAll = React.useMemo(() => {
    const arr = [...allRows];
    arr.sort((a, b) => {
      const cmp = a.firstName.localeCompare(b.firstName, "en");
      return order === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [allRows, order]);

  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedAll.slice(start, end);
  }, [sortedAll, page, rowsPerPage]);

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    setRowsPerPage(next);
    setPage(0);
  };

  const goEdit = (u: Staff) =>
    router.push(`/admin/user-management/edit/${encodeURIComponent(u.username)}`);

  const onDeleteClick = (u: Staff) => setConfirm({ open: true, target: u });

  const deleteStaffAccount = async (): Promise<void> => {
    const username = confirm.target?.username;
    if (!username) return;

    try {
      const res = await fetch(`${API_BASE}/api/staffs/${encodeURIComponent(username)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok && res.status !== 204) {
        const body = await safeJson<{ message?: string }>(res);
        throw new Error(body?.message ?? `Delete failed (HTTP ${res.status})`);
      }

      setAlert({ open: true, msg: `Username: ${username} deleted successfully`, severity: "success" });
      setConfirm({ open: false });

      setAllRows((prev) => {
        const next = prev.filter((r) => r.username !== username);
        const maxPage = Math.max(0, Math.ceil(next.length / rowsPerPage) - 1);
        setPage((p) => (p > maxPage ? maxPage : p));
        return next;
      });
    } catch (e: unknown) {
      setAlert({ open: true, msg: errorMessage(e), severity: "error" });
    }
  };

  const COLUMNS = [
    { key: "firstName", label: "First Name", sortable: true },
    { key: "lastName", label: "Last Name", sortable: false },
    { key: "username", label: "Username", sortable: false },
    { key: "role", label: "Role", sortable: false },
    { key: "gender", label: "Gender", sortable: false },
    { key: "dateOfBirth", label: "Date of Birth", sortable: false },
    { key: "phoneNumber", label: "Phone", sortable: false },
    { key: "gmail", label: "Email", sortable: false },
    { key: "specialty", label: "Specialty", sortable: false },
    { key: "isActive", label: "Status", sortable: false },
  ] as const;

  return (
    <Box sx={{ p: { xs: 2, md: TOKENS.spacing.sectionY } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Typography variant={TOKENS.heading.variant} fontWeight={TOKENS.heading.weight}>
          Staff Accounts
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            height: TOKENS.button.height,
            borderRadius: TOKENS.button.borderRadius,
            backgroundColor: PRIMARY.main,
            "&:hover": { backgroundColor: PRIMARY.dark },
          }}
          onClick={() => router.push("/admin/user-management/add")}
        >
          Add Staff
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell
                  key={c.key}
                  sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}
                >
                  {c.key === "firstName" ? (
                    <TableSortLabel
                      active
                      direction={order}
                      onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                    >
                      {c.label}
                    </TableSortLabel>
                  ) : (
                    c.label
                  )}
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
            {loading && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              pagedRows.map((u) => (
                <TableRow key={u.username} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.firstName}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.lastName}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.username}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.role}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{renderGender(u.gender)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{formatDOB(u.dateOfBirth)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.phoneNumber || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.gmail || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {u.role === "TRAINER" ? u.specialty || "—" : "None"}
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      size="small"
                      label={u.isActive ? "Active" : "Inactive"}
                      color={u.isActive ? "success" : "default"}
                      variant={u.isActive ? "filled" : "outlined"}
                    />
                  </TableCell>

                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => goEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDeleteClick(u)}>
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

        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      <ConfirmDialog
        open={confirm.open}
        title="Confirm Deletion"
        message={
          <>
            Warning: Are you sure you want to delete user: <b>{confirm.target?.username}</b>?<br />
            Role: <b>{confirm.target?.role}</b>
          </>
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={deleteStaffAccount}
        onClose={() => setConfirm({ open: false })}
      />
    </Box>
  );
}