import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Private Fitness",
  description: "Modern, clean private fitness platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <header className="site-header">
          <div className="container topbar">
            <div className="brand">Private Fitness</div>

            <nav className="topnav" aria-label="main navigation">
              <Link href="/" className="nav-link is-active">หน้าแรก</Link>
              <Link href="/plans" className="nav-link">แพ็กเกจ</Link>
              <Link href="/trainers" className="nav-link">ผู้ฝึกสอนส่วนตัว</Link>
              <Link href="/classes" className="nav-link">คลาส</Link>
              <Link href="/blog" className="nav-link">บทความ</Link>
            </nav>

            <div className="top-actions">
              <Link href="/signup" className="button">สมัครสมาชิก</Link>
              <Link href="/trial" className="button-outline">ทดลองเล่นฟรี</Link>
            </div>
          </div>
        </header>

        <main className="site-main">{children}</main>

        <footer className="site-footer">
          <div className="container">
            <p>© {new Date().getFullYear()} Private Fitness. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}