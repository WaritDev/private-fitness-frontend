"use client";

import * as React from "react";
import { Snackbar, Alert } from "@mui/material";

type SnackState = {
  open: boolean;
  msg: string;
  severity: "success" | "error" | "warning" | "info";
};

type SnackContextType = {
  setSnack: React.Dispatch<React.SetStateAction<SnackState>>;
};

const SnackContext = React.createContext<SnackContextType | undefined>(undefined);

export const useSnack = () => {
  const ctx = React.useContext(SnackContext);
  if (!ctx) throw new Error("useSnack must be used within a SnackProvider");
  return ctx;
};

export const SnackProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [snack, setSnack] = React.useState<SnackState>({
    open: false,
    msg: "",
    severity: "success",
  });

  return (
    <SnackContext.Provider value={{ setSnack }}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </SnackContext.Provider>
  );
};