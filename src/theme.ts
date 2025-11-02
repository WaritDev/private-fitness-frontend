import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    typography: {
        fontFamily: "inherit",
        fontWeightLight: 300,
        fontWeightRegular: 300,
        fontWeightMedium: 400,
        fontWeightBold: 500,
        h1: { fontWeight: 400, letterSpacing: "0.2px" },
        h2: { fontWeight: 400, letterSpacing: "0.2px" },
        h3: { fontWeight: 400, letterSpacing: "0.2px" },
        button: { fontWeight: 300 },
    },
    components: {
        MuiButton: {
        styleOverrides: { root: { textTransform: "none", fontWeight: 300 } },
        },
    },
});