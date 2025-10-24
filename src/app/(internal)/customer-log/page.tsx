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
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" };

type Order = "asc" | "desc";
type LogType = "Check-in" | "Purchase" | "Class Booking" | "Other";
type FilterType = "All" | LogType;

interface CustomerLog {
    id: number;
    customer: string;
    logType: LogType;
    detail: string;
    date: string; // YYYY-MM-DD
}

const MOCK: CustomerLog[] = [
    { id: 1, customer: "Somchai Prasert", logType: "Check-in", detail: "เข้าฟิตเนส", date: "2025-10-20" },
    { id: 2, customer: "Warunee Boonmee", logType: "Purchase", detail: "ซื้อ Protein Powder", date: "2025-10-19" },
    { id: 3, customer: "Arthit Meechai", logType: "Class Booking", detail: "จองโยคะ", date: "2025-10-18" },
];

export default function AdminCustomerLogs(): React.JSX.Element {
const [rows, setRows] = React.useState<CustomerLog[]>(MOCK);
const [search, setSearch] = React.useState<string>("");
const [typeFilter, setTypeFilter] = React.useState<FilterType>("All");
const [order, setOrder] = React.useState<Order>("desc");
const [orderBy, setOrderBy] = React.useState<keyof CustomerLog>("date");
const [page, setPage] = React.useState<number>(0);
const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);

const [openEdit, setOpenEdit] = React.useState<CustomerLog | null>(null);

// --- derived data ---
const filtered: CustomerLog[] = rows.filter((l) => {
const q = search.toLowerCase();
const hit =
    l.customer.toLowerCase().includes(q) ||
    l.detail.toLowerCase().includes(q);
const okType = typeFilter === "All" ? true : l.logType === typeFilter;
return hit && okType;
});

const sorted: CustomerLog[] = [...filtered].sort((a, b) => {
const av = String(a[orderBy] ?? "").toLowerCase();
const bv = String(b[orderBy] ?? "").toLowerCase();
const cmp = av.localeCompare(bv);
return order === "asc" ? cmp : -cmp;
});

const paged: CustomerLog[] = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

// --- handlers ---
const handleRequestSort = (key: keyof CustomerLog): void => {
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

const onChangeTypeFilter = (e: SelectChangeEvent<FilterType>): void => {
setTypeFilter(e.target.value as FilterType);
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
        จัดการข้อมูล Customer Log
    </Typography>
    <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        onClick={() =>
        setOpenEdit({
            id: 0,
            customer: "",
            logType: "Check-in",
            detail: "",
            date: new Date().toISOString().slice(0, 10),
        })
        }
    >
        เพิ่ม Log
    </Button>
    </Stack>

    {/* Filters */}
    <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
    <TextField
        placeholder="ค้นหาชื่อลูกค้า / รายละเอียด"
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
        <InputLabel id="typeFilterLabel">ประเภท</InputLabel>
        <Select<FilterType>
        labelId="typeFilterLabel"
        label="ประเภท"
        value={typeFilter}
        onChange={onChangeTypeFilter}
        >
        <MenuItem value="All">ทั้งหมด</MenuItem>
        <MenuItem value="Check-in">Check-in</MenuItem>
        <MenuItem value="Purchase">Purchase</MenuItem>
        <MenuItem value="Class Booking">Class Booking</MenuItem>
        <MenuItem value="Other">Other</MenuItem>
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
                { key: "logType", label: "ประเภท" },
                { key: "detail", label: "รายละเอียด" },
                { key: "date", label: "วันที่" },
            ] as const
            ).map((col) => (
            <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                <TableSortLabel
                active={orderBy === (col.key as keyof CustomerLog)}
                direction={orderBy === (col.key as keyof CustomerLog) ? order : "asc"}
                onClick={() => handleRequestSort(col.key as keyof CustomerLog)}
                >
                {col.label}
                </TableSortLabel>
            </TableCell>
            ))}
            <TableCell sx={{ fontWeight: 500, width: 100 }}>การจัดการ</TableCell>
        </TableRow>
        </TableHead>

        <TableBody>
        {paged.map((l) => (
            <TableRow key={l.id} hover>
            <TableCell>{l.customer}</TableCell>
            <TableCell>{l.logType}</TableCell>
            <TableCell>{l.detail}</TableCell>
            <TableCell>{l.date}</TableCell>
            <TableCell>
                <Tooltip title="ลบ">
                <IconButton size="small" color="error" onClick={() => softDelete(l.id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
                </Tooltip>
            </TableCell>
            </TableRow>
        ))}

        {paged.length === 0 && (
            <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
    <DialogTitle>{openEdit && openEdit.id ? "แก้ไข Log" : "เพิ่ม Log"}</DialogTitle>
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
        <FormControl fullWidth>
            <InputLabel id="logTypeLabel">ประเภท</InputLabel>
            <Select<LogType>
            labelId="logTypeLabel"
            label="ประเภท"
            value={openEdit?.logType ?? "Check-in"}
            onChange={(e: SelectChangeEvent<LogType>) =>
                setOpenEdit((v) => (v ? { ...v, logType: e.target.value as LogType } : v))
            }
            >
            <MenuItem value="Check-in">Check-in</MenuItem>
            <MenuItem value="Purchase">Purchase</MenuItem>
            <MenuItem value="Class Booking">Class Booking</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
            </Select>
        </FormControl>
        <TextField
            label="รายละเอียด"
            value={openEdit?.detail ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOpenEdit((v) => (v ? { ...v, detail: e.target.value } : v))
            }
            fullWidth
        />
        <TextField
            label="วันที่ (YYYY-MM-DD)"
            value={openEdit?.date ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOpenEdit((v) => (v ? { ...v, date: e.target.value } : v))
            }
            fullWidth
        />
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