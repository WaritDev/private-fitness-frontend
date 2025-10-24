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
type Status = "Active" | "Inactive";
type FilterStatus = "All" | Status;

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: Status;
}

const MOCK: Product[] = [
    { id: 1, name: "Protein Powder", category: "Supplements", price: 1200, stock: 50, status: "Active" },
    { id: 2, name: "Yoga Mat", category: "Equipment", price: 800, stock: 20, status: "Active" },
    { id: 3, name: "Boxing Gloves", category: "Equipment", price: 1500, stock: 10, status: "Inactive" },
];

export default function AdminProducts(): React.JSX.Element {
const [rows, setRows] = React.useState<Product[]>(MOCK);
const [search, setSearch] = React.useState<string>("");
const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("All");
const [order, setOrder] = React.useState<Order>("asc");
const [orderBy, setOrderBy] = React.useState<keyof Product>("name");
const [page, setPage] = React.useState<number>(0);
const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);

const [openEdit, setOpenEdit] = React.useState<Product | null>(null);

const filtered: Product[] = rows.filter((p) => {
const q = search.toLowerCase();
const hit =
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q);
const okStatus = statusFilter === "All" ? true : p.status === statusFilter;
return hit && okStatus;
});

const sorted: Product[] = [...filtered].sort((a, b) => {
const av = String(a[orderBy] ?? "").toLowerCase();
const bv = String(b[orderBy] ?? "").toLowerCase();
const cmp = av.localeCompare(bv);
return order === "asc" ? cmp : -cmp;
});

const paged: Product[] = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

// --- handlers ---
const handleRequestSort = (key: keyof Product): void => {
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
        จัดการข้อมูล Products
    </Typography>
    <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        onClick={() =>
        setOpenEdit({
            id: 0,
            name: "",
            category: "",
            price: 0,
            stock: 0,
            status: "Active",
        })
        }
    >
        เพิ่ม Product
    </Button>
    </Stack>

    {/* Filters */}
    <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
    <TextField
        placeholder="ค้นหาชื่อสินค้า / หมวดหมู่"
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
        <MenuItem value="Inactive">Inactive</MenuItem>
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
                { key: "name", label: "ชื่อสินค้า" },
                { key: "category", label: "หมวดหมู่" },
                { key: "price", label: "ราคา (THB)" },
                { key: "stock", label: "จำนวนคงเหลือ" },
                { key: "status", label: "สถานะ" },
            ] as const
            ).map((col) => (
            <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                <TableSortLabel
                active={orderBy === (col.key as keyof Product)}
                direction={orderBy === (col.key as keyof Product) ? order : "asc"}
                onClick={() => handleRequestSort(col.key as keyof Product)}
                >
                {col.label}
                </TableSortLabel>
            </TableCell>
            ))}
            <TableCell sx={{ fontWeight: 500, width: 160 }}>การจัดการ</TableCell>
        </TableRow>
        </TableHead>

        <TableBody>
        {paged.map((p) => (
            <TableRow key={p.id} hover>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.category}</TableCell>
            <TableCell>{p.price.toLocaleString("th-TH")}</TableCell>
            <TableCell>{p.stock}</TableCell>
            <TableCell>{p.status}</TableCell>
            <TableCell>
                <Stack direction="row" spacing={1}>
                <Tooltip title="แก้ไข">
                    <IconButton size="small" color="primary" onClick={() => setOpenEdit(p)}>
                    <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="ลบ">
                    <IconButton size="small" color="error" onClick={() => softDelete(p.id)}>
                    <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                </Stack>
            </TableCell>
            </TableRow>
        ))}

        {paged.length === 0 && (
            <TableRow>
            <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
    <DialogTitle>{openEdit && openEdit.id ? "แก้ไข Product" : "เพิ่ม Product"}</DialogTitle>
    <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
        <TextField
            label="ชื่อสินค้า"
            value={openEdit?.name ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOpenEdit((v) => (v ? { ...v, name: e.target.value } : v))
            }
            fullWidth
        />
        <TextField
            label="หมวดหมู่"
            value={openEdit?.category ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOpenEdit((v) => (v ? { ...v, category: e.target.value } : v))
            }
            fullWidth
        />
        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
            label="ราคา (THB)"
            type="number"
            value={openEdit?.price ?? 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOpenEdit((v) => (v ? { ...v, price: parseInt(e.target.value) || 0 } : v))
            }
            fullWidth
            />
            <TextField
            label="จำนวนคงเหลือ"
            type="number"
            value={openEdit?.stock ?? 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOpenEdit((v) => (v ? { ...v, stock: parseInt(e.target.value) || 0 } : v))
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
            <MenuItem value="Inactive">Inactive</MenuItem>
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