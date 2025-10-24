import MainNavbar from "@/components/ui/MainNavbar";
import "../globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import ClientWrapper from "./ClientWrapper";

export const metadata = {
  title: "Private Fitness",
  description: "Modern, clean private fitness platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AppRouterCacheProvider>
          <ClientWrapper>
            <MainNavbar />
            <main className="site-main">{children}</main>
            <footer className="site-footer">
              <div className="container">
                <p>© {new Date().getFullYear()} Private Fitness. All rights reserved.</p>
              </div>
            </footer>
          </ClientWrapper>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}