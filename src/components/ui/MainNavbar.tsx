import Link from "next/link";
import React from "react";

function MainNavbar() {
  return (
    <header className="site-header">
      <div className="container topbar">
        <div className="brand">Private Fitness</div>

        <nav className="topnav" aria-label="main navigation">
          <Link href="/" className="nav-link is-active">
            หน้าแรก
          </Link>
          <Link href="/plans" className="nav-link">
            แพ็กเกจ
          </Link>
          <Link href="/courses" className="nav-link">
            คอร์ส
          </Link>
        </nav>

        <div className="top-actions">
          <Link href="/login" className="button-outline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </header>
  );
}

export default MainNavbar;
