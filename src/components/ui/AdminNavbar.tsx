import Link from "next/link";
import React from "react";
import { useAuth } from "@/contexts/AuthProvider";
import Image from "next/image";

function AdminNavbar() {
  const { user } = useAuth();
  const role = user?.role;
  const profileHref = user ? `/profile/${encodeURIComponent(user.sub)}` : '/login';

  if (role === "ADMIN") {
    return (
      <header className="site-header">
        <div className="container topbar">
          <div className="brand">Private Fitness</div>
          <nav className="topnav" aria-label="main navigation">
            <Link href="/" className="nav-link is-active">หน้าแรก</Link>
            <Link href="/user-management" className="nav-link">จัดการผู้ใช้</Link>
            <Link href="/customer-management" className="nav-link">จัดการลูกค้า</Link>
            <Link href="/dashboard" className="nav-link">แดชบอร์ด</Link>
            <Link href={profileHref} className="text-gray-600 hover:text-gray-800 font-semibold">
              <Image src="/profile-icon.png" alt="profile icon" width={40} height={40} />
            </Link>
          </nav>
        </div>
      </header>
    );
  } else if (role === "MANAGER") {
    return (
      <header className="site-header">
        <div className="container topbar">
          <div className="brand">Private Fitness</div>
          <nav className="topnav" aria-label="main navigation">
            <Link href="/" className="nav-link is-active">หน้าแรก</Link>
            <Link href="/dashboard" className="nav-link">แดชบอร์ด</Link>
            <Link href={profileHref} className="text-gray-600 hover:text-gray-800 font-semibold">
              <Image src="/profile-icon.png" alt="profile icon" width={40} height={40} />
            </Link>
          </nav>
        </div>
      </header>
    );
  } else if (role === "TRAINER") {
    return (
      <header className="site-header">
        <div className="container topbar">
          <div className="brand">Private Fitness</div>
          <nav className="topnav" aria-label="main navigation">
            <Link href="/" className="nav-link is-active">หน้าแรก</Link>
            <Link href="/calendar-management" className="nav-link">จัดการปฏิทิน</Link>
            <Link href={profileHref} className="text-gray-600 hover:text-gray-800 font-semibold">
              <Image src="/profile-icon.png" alt="profile icon" width={40} height={40} />
            </Link>
          </nav>
        </div>
      </header>
    );
  } else if (role === "CUSTOMER") {
    return (
      <header className="site-header">
        <div className="container topbar">
          <div className="brand">Private Fitness</div>
          <nav className="topnav" aria-label="main navigation">
            <Link href="/" className="nav-link is-active">หน้าแรก</Link>
            <Link href="/calendar" className="nav-link">ปฏิทิน</Link>
            <Link href={profileHref} className="text-gray-600 hover:text-gray-800 font-semibold">
              <Image src="/profile-icon.png" alt="profile icon" width={40} height={40} />
            </Link>
          </nav>
        </div>
      </header>
    );
  } else if (role === "SALES") {
    return (
      <header className="site-header">
        <div className="container topbar">
          <div className="brand">Private Fitness</div>
          <nav className="topnav" aria-label="main navigation">
            <Link href="/" className="nav-link is-active">หน้าแรก</Link>
            <Link href="/registration" className="nav-link">ลงทะเบียน</Link>
            <Link href={profileHref} className="text-gray-600 hover:text-gray-800 font-semibold">
              <Image src="/profile-icon.png" alt="profile icon" width={40} height={40} />
            </Link>
          </nav>
        </div>
      </header>
    );
  } else {
    return null;
  }
}

export default AdminNavbar;