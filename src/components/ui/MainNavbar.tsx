import Button from "@mui/material/Button";
import Link from "next/link";
import React from "react";

function MainNavbar() {
  return (
    <header className="site-header">
      <div className="container topbar">
        <div className="brand">Private Fitness</div>

        <nav className="topnav">
          <Link href="/" className="nav-link is-active">
            หน้าแรก
          </Link>
        </nav>

        <div className="top-actions">
          <Button variant="contained" href="/login" color="success">
            เข้าสู่ระบบ
          </Button>
        </div>
      </div>
    </header>
  );
}

export default MainNavbar;
