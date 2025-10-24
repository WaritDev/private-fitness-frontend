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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" };

type Order = "asc" | "desc";
type ActiveFilter = "All" | "Active" | "Inactive";

interface DurationPackage {
    id: number;
    name: string;
    durationDays: number;
    priceTHB: number;
    allowFreezeDays: number;
    maxFreezeTimes: number;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const THB = (v: number) =>
    v.toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 0
    });

const MOCK: DurationPackage[] = [
    {
        id: 1,
        name: "Monthly 30d",
        durationDays: 30,
        priceTHB: 1590,
        allowFreezeDays: 7,
        maxFreezeTimes: 1,
        description: "เข้าฟิตเนสไม่จำกัด 30 วัน",
        isActive: true,
        createdAt: "2025-09-01",
        updatedAt: "2025-10-01"
    },
    {
        id: 2,
        name: "Quarter 90d",
        durationDays: 90,
        priceTHB: 3990,
        allowFreezeDays: 14,
        maxFreezeTimes: 2,
        description: "สุดคุ้ม 3 เดือน",
        isActive: true,
        createdAt: "2025-07-15",
        updatedAt: "2025-09-20"
    },
    {
        id: 3,
        name: "Annual 365d",
        durationDays: 365,
        priceTHB: 12900,
        allowFreezeDays: 30,
        maxFreezeTimes: 3,
        description: "สมาชิกปี",
        isActive: false,
        createdAt: "2025-01-01",
        updatedAt: "2025-08-01"
    }
];

export default function AdminPackagesDuration_NoGrid(): React.JSX.Element {
    const [rows, setRows] = React.useState<DurationPackage[]>(MOCK);
    const [search, setSearch] = React.useState<string>("");
    const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>("All");
    const [order, setOrder] = React.useState<Order>("asc");
    const [orderBy, setOrderBy] = React.useState<keyof DurationPackage>("name");
    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);

    const [openEdit, setOpenEdit] = React.useState<DurationPackage | null>(null);

    // filter
    const filtered = rows.filter((p) => {
        const q = search.toLowerCase();
        const hit =
        p.name.toLowerCase().includes(q) ||
        String(p.durationDays).includes(q) ||
        String(p.priceTHB).includes(q);
        const okActive =
        activeFilter === "All"
            ? true
            : activeFilter === "Active"
            ? p.isActive
            : !p.isActive;
        return hit && okActive;
    });

    // sort
    const sorted = [...filtered].sort((a, b) => {
        const av = a[orderBy];
        const bv = b[orderBy];
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
        } else {
        const sa = String(av ?? "").toLowerCase();
        const sb = String(bv ?? "").toLowerCase();
        cmp = sa.localeCompare(sb);
        }
        return order === "asc" ? cmp : -cmp;
    });

    const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // handlers
    const handleRequestSort = (key: keyof DurationPackage): void => {
        const isAsc = orderBy === key && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(key);
    };

    const handleChangePage = (
        _: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number
    ): void => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const onChangeActiveFilter = (e: SelectChangeEvent<ActiveFilter>): void => {
        setActiveFilter(e.target.value as ActiveFilter);
        setPage(0);
    };

    const removeRow = (id: number): void => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const toggleActive = (id: number): void => {
        setRows((prev) =>
        prev.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString().slice(0, 10) } : r
        )
        );
    };

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
            แพ็กเกจ Duration
            </Typography>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
                backgroundColor: PRIMARY.main,
                "&:hover": { backgroundColor: PRIMARY.dark }
            }}
            onClick={() =>
                setOpenEdit({
                id: 0,
                name: "",
                durationDays: 30,
                priceTHB: 0,
                allowFreezeDays: 0,
                maxFreezeTimes: 0,
                description: "",
                isActive: true,
                createdAt: new Date().toISOString().slice(0, 10),
                updatedAt: new Date().toISOString().slice(0, 10)
                })
            }
            >
            เพิ่มแพ็กเกจ
            </Button>
        </Stack>

        {/* Filters */}
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
            <TextField
            placeholder="ค้นหาชื่อ / ราคา / จำนวนวัน"
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
                )
            }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="activeFilterLabel">สถานะ</InputLabel>
            <Select<ActiveFilter>
                labelId="activeFilterLabel"
                label="สถานะ"
                value={activeFilter}
                onChange={onChangeActiveFilter}
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
                    { key: "name", label: "ชื่อแพ็กเกจ" },
                    { key: "durationDays", label: "จำนวนวัน" },
                    { key: "priceTHB", label: "ราคา" },
                    { key: "allowFreezeDays", label: "พักได้ (วัน)" },
                    { key: "maxFreezeTimes", label: "พักได้ (ครั้ง)" },
                    { key: "isActive", label: "สถานะ" },
                    { key: "updatedAt", label: "อัปเดตล่าสุด" }
                    ] as const
                ).map((col) => (
                    <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                    <TableSortLabel
                        active={orderBy === (col.key as keyof DurationPackage)}
                        direction={orderBy === (col.key as keyof DurationPackage) ? order : "asc"}
                        onClick={() => handleRequestSort(col.key as keyof DurationPackage)}
                    >
                        {col.label}
                    </TableSortLabel>
                    </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 500, width: 220 }}>การจัดการ</TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paged.map((p) => (
                <TableRow key={p.id} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.durationDays}</TableCell>
                    <TableCell>{THB(p.priceTHB)}</TableCell>
                    <TableCell>{p.allowFreezeDays}</TableCell>
                    <TableCell>{p.maxFreezeTimes}</TableCell>
                    <TableCell>
                    <Chip
                        size="small"
                        label={p.isActive ? "Active" : "Inactive"}
                        color={p.isActive ? "success" : "default"}
                        variant={p.isActive ? "filled" : "outlined"}
                    />
                    </TableCell>
                    <TableCell>{p.updatedAt}</TableCell>
                    <TableCell>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="แก้ไข">
                        <IconButton size="small" color="primary" onClick={() => setOpenEdit(p)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                        </Tooltip>
                        <Tooltip title={p.isActive ? "ปิดการขาย" : "เปิดการขาย"}>
                        <IconButton size="small" color="secondary" onClick={() => toggleActive(p.id)}>
                            <MonetizationOnIcon fontSize="small" />
                        </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                        <IconButton size="small" color="error" onClick={() => removeRow(p.id)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        </Tooltip>
                    </Stack>
                    </TableCell>
                </TableRow>
                ))}
                {paged.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
            <DialogTitle>{openEdit && openEdit.id ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจ"}</DialogTitle>
            <DialogContent>
            <Stack gap={2} sx={{ mt: 1 }}>
                <TextField
                label="ชื่อแพ็กเกจ"
                value={openEdit?.name ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, name: e.target.value } : v))
                }
                fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                <TextField
                    label="จำนวนวัน"
                    type="number"
                    value={openEdit?.durationDays ?? 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, durationDays: Number(e.target.value) } : v))
                    }
                    fullWidth
                />
                <TextField
                    label="ราคา (THB)"
                    type="number"
                    value={openEdit?.priceTHB ?? 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, priceTHB: Number(e.target.value) } : v))
                    }
                    fullWidth
                />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                <TextField
                    label="พักได้ (วันรวม)"
                    type="number"
                    value={openEdit?.allowFreezeDays ?? 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, allowFreezeDays: Number(e.target.value) } : v))
                    }
                    fullWidth
                />
                <TextField
                    label="พักได้ (ครั้ง)"
                    type="number"
                    value={openEdit?.maxFreezeTimes ?? 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, maxFreezeTimes: Number(e.target.value) } : v))
                    }
                    fullWidth
                />
                </Stack>
                <TextField
                label="คำอธิบาย"
                value={openEdit?.description ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOpenEdit((v) => (v ? { ...v, description: e.target.value } : v))
                }
                fullWidth
                multiline
                minRows={2}
                />
                <FormControlLabel
                control={
                    <Switch
                    checked={openEdit?.isActive ?? true}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOpenEdit((v) => (v ? { ...v, isActive: e.target.checked } : v))
                    }
                    />
                }
                label={openEdit?.isActive ? "Active" : "Inactive"}
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
                const now = new Date().toISOString().slice(0, 10);
                if (openEdit.id === 0) {
                    const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
                    setRows((prev) => [
                    { ...openEdit, id: nextId, createdAt: now, updatedAt: now },
                    ...prev
                    ]);
                } else {
                    setRows((prev) =>
                    prev.map((r) => (r.id === openEdit.id ? { ...openEdit, updatedAt: now } : r))
                    );
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