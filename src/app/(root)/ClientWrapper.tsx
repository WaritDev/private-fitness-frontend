"use client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";
import { SnackProvider } from "@/components/snack/SnackProvider";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackProvider>
                {children}
            </SnackProvider>
        </ThemeProvider>
    );
}