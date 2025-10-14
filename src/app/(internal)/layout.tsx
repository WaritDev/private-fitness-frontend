import "../globals.css";
import AdminLayoutClient from "./ClientWrapper";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata = {
  title: "Private Fitness",
  description: "Modern, clean private fitness platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AppRouterCacheProvider >
          <AdminLayoutClient>{children}</AdminLayoutClient>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}