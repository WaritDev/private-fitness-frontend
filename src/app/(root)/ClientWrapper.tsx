"use client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";
import { AlertPopUpUI } from "@/components/pop-up/AlertPopUpUI";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AlertPopUpUI>
                {children}
            </AlertPopUpUI>
        </ThemeProvider>
    );
}