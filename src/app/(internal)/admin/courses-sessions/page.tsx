"use client";

import * as React from "react";
import {
    Box,
    Stack,
    Typography,
    Button,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    TableSortLabel,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" };

type Order = "asc" | "desc";
type Status = "Active" | "Completed" | "Cancelled";
type FilterStatus = "All" | Status;

interface Session {
    id: number;
    customer: string;
    trainer: string;
    sessionType: string;   // เช่น "Yoga", "Weight Training"
    date: string;          // ISO date YYYY-MM-DD
    time: string;          // HH:mm
    status: Status;
}

const MOCK: Session[] = [
    { id: 1, customer: "Somchai Prasert", trainer: "Trainer A", sessionType: "Yoga", date: "2025-10-20", time: "09:00", status: "Active" },
    { id: 2, customer: "Warunee Boonmee", trainer: "Trainer B", sessionType: "HIIT", date: "2025-10-21", time: "14:00", status: "Completed" },
    { id: 3, customer: "Arthit Meechai", trainer: "Trainer C", sessionType: "Weight Training", date: "2025-10-22", time: "16:00", status: "Cancelled" },
];

export default function AdminSessions(): React.JSX.Element {
    const [rows, setRows] = React.useState<Session[]>(MOCK);
    const [search, setSearch] = React.useState<string>("");
    const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("All");
    const [order, setOrder] = React.useState<Order>("asc");
    const [orderBy, setOrderBy] = React.useState<keyof Session>("date");
    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);

    const [openEdit, setOpenEdit] = React.useState<Session | null>(null);

    // --- derived data ---
    const filtered: Session[] = rows.filter((s) => {
        const q = search.toLowerCase();
        const hit =
        s.customer.toLowerCase().includes(q) ||
        s.trainer.toLowerCase().includes(q) ||
        s.sessionType.toLowerCase().includes(q);
        const okStatus = statusFilter === "All" ? true : s.status === statusFilter;
        return hit && okStatus;
    });

    const sorted: Session[] = [...filtered].sort((a, b) => {
        const av = String(a[orderBy] ?? "").toLowerCase();
        const bv = String(b[orderBy] ?? "").toLowerCase();
        const cmp = av.localeCompare(bv);
        return order === "asc" ? cmp : -cmp;
    });

    const paged: Session[] = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // --- handlers ---
    const handleRequestSort = (key: keyof Session): void => {
        const isAsc = orderBy === key && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(key);
    };

    const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number): void => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const onChangeStatusFilter = (e: SelectChangeEvent<FilterStatus>): void => {
        setStatusFilter(e.target.value as FilterStatus);
        setPage(0);
    };

    const softDelete = (id: number): void => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    // --- UI ---
    return (
        <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            flexWrap="wrap"
            sx={{ mb: 2 }}
        >
            <Typography variant="h5" fontWeight={400}>
            จัดการข้อมูลคอร์ส Sessions ของลูกค้า
            </Typography>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
            onClick={() =>
                setOpenEdit({
                id: 0,
                customer: "",
                trainer: "",
                sessionType: "",
                date: new Date().toISOString().slice(0, 10),
                time: "09:00",
                status: "Active",
                })
            }
            >
            เพิ่ม Session
            </Button>
        </Stack>

        {/* Filters */}
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
            <TextField
            placeholder="ค้นหาลูกค้า / เทรนเนอร์ / ประเภทคอร์ส"
            size="small"
            fullWidth
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setPage(0);
            }}
            InputProps={{
                startAdornment: (
                <InputAdornment position="start">
                    <SearchIcon />
                </InputAdornment>
                ),
            }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="statusFilterLabel">สถานะ</InputLabel>
            <Select<FilterStatus>
                labelId="statusFilterLabel"
                label="สถานะ"
                value={statusFilter}
                onChange={onChangeStatusFilter}
            >
                <MenuItem value="All">ทั้งหมด</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
            </FormControl>
        </Stack>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
            <TableHead>
                <TableRow>
                {(
                    [
                    { key: "customer", label: "ลูกค้า" },
                    { key: "trainer", label: "เทรนเนอร์" },
                    { key: "sessionType", label: "ประเภทคอร์ส" },
                    { key: "date", label: "วันที่" },
                    { key: "time", label: "เวลา" },
                    { key: "status", label: "สถานะ" },
                    ] as const
                ).map((col) => (
                    <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                    <TableSortLabel
                        active={orderBy === (col.key as keyof Session)}
                        direction={orderBy === (col.key as keyof Session) ? order : "asc"}
                        onClick={() => handleRequestSort(col.key as keyof Session)}
                    >
                        {col.label}
                    </TableSortLabel>
                    </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 500, width: 160 }}>การจัดการ</TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paged.map((s) => (
                <TableRow key={s.id} hover>
                    <TableCell>{s.customer}</TableCell>
                    <TableCell>{s.trainer}</TableCell>
                    <TableCell>{s.sessionType}</TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.time}</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="แก้ไข">
                        <IconButton size="small" color="primary" onClick={() => setOpenEdit(s)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                        <IconButton size="small" color="error" onClick={() => softDelete(s.id)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        </Tooltip>
                    </Stack>
                    </TableCell>
                </TableRow>
                ))}

                {paged.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    ไม่พบข้อมูล
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>

            <TablePagination
            component="div"
            count={sorted.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            />
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog open={openEdit !== null} onClose={() => setOpenEdit(null)} maxWidth="sm" fullWidth>
            <DialogTitle>{openEdit && openEdit.id ? "แก้ไข Session" : "เพิ่ม Session"}</DialogTitle>
            <DialogContent>
            <Stack gap={2} sx={{ mt: 1 }}>
                <TextField
                label="ชื่อลูกค้า"
                value={openEdit?.customer ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, customer: e.target.value } : v))
                }
                fullWidth
                />
                <TextField
                label="เทรนเนอร์"
                value={openEdit?.trainer ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, trainer: e.target.value } : v))
                }
                fullWidth
                />
                <TextField
                label="ประเภทคอร์ส"
                value={openEdit?.sessionType ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, sessionType: e.target.value } : v))
                }
                fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                <TextField
                    label="วันที่ (YYYY-MM-DD)"
                    value={openEdit?.date ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, date: e.target.value } : v))
                    }
                    fullWidth
                />
                <TextField
                    label="เวลา (HH:mm)"
                    value={openEdit?.time ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, time: e.target.value } : v))
                    }
                    fullWidth
                />
                </Stack>
                <FormControl fullWidth>
                <InputLabel id="statusLabel">สถานะ</InputLabel>
                <Select<Status>
                    labelId="statusLabel"
                    label="สถานะ"
                    value={openEdit?.status ?? "Active"}
                    onChange={(e: SelectChangeEvent<Status>) =>
                    setOpenEdit((v) => (v ? { ...v, status: e.target.value as Status } : v))
                    }
                >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
                </FormControl>
            </Stack>
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setOpenEdit(null)}>ยกเลิก</Button>
            <Button
                variant="contained"
                sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
                onClick={() => {
                if (!openEdit) return;
                if (openEdit.id === 0) {
                    const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
                    setRows((prev) => [{ ...openEdit, id: nextId }, ...prev]);
                } else {
                    setRows((prev) => prev.map((r) => (r.id === openEdit.id ? openEdit : r)));
                }
                setOpenEdit(null);
                }}
            >
                บันทึก
            </Button>
            </DialogActions>
        </Dialog>
        </Box>
    );
}