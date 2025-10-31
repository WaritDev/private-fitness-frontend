"use client";

import * as React from "react";
import { Snackbar, Alert } from "@mui/material";

type AlertState = {
  open: boolean;
  msg: string;
  severity: "success" | "error" | "warning" | "info";
};

type AlertContextType = {
  setAlert: React.Dispatch<React.SetStateAction<AlertState>>;
};

const AlertContext = React.createContext<AlertContextType | undefined>(undefined);

export const useAlertPopUp = () => {
  const ctx = React.useContext(AlertContext);
  if (!ctx) throw new Error("useAlertPopUp must be used within AlertPopUpUI");
  return ctx;
};

export const AlertPopUpUI: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [alert, setAlert] = React.useState<AlertState>({
    open: false,
    msg: "",
    severity: "success",
  });

  return (
    <AlertContext.Provider value={{ setAlert }}>
      {children}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 2 }}
      >
        <Alert
          severity={alert.severity}
          variant="filled"
          onClose={() => setAlert((s) => ({ ...s, open: false }))}
          sx={{
            minWidth: 400,
            fontSize: "1rem",
            fontWeight: 500,
            boxShadow: 3,
            "& .MuiAlert-icon": {
              fontSize: "1.5rem",
            },
          }}
        >
          {alert.msg}
        </Alert>
      </Snackbar>
    </AlertContext.Provider>
  );
};