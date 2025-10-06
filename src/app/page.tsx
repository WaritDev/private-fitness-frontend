import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";

export default function LandingPage() {
  return (
    <section>
      <HeroCarousel
        slides={[
          {
            img: '/hero-1.jpg',
            heading: 'PRIVATE FITNESS\nMEMBERSHIPS',
            sub: 'เทรนเนอร์ส่วนตัว โปรแกรมเฉพาะคุณ เข้าถึงได้ทุกที่ ทุกเวลา',
            ctaPrimary: { href: '/signup', label: 'เริ่มต้นเลย' },
            ctaSecondary: { href: '/plans', label: 'ดูแพ็กเกจ' },
          },
          {
            img: '/hero-2.jpg',
            heading: 'COACHING แบบ PERSONAL',
            sub: 'ติดตามผลและปรับโปรแกรมรายสัปดาห์',
            ctaPrimary: { href: '/trainers', label: 'เลือกเทรนเนอร์' },
          },
          {
            img: '/hero-3.jpg',
            heading: 'CLASS & PROGRAMS',
            sub: 'คาร์ดิโอ เวท โภชนาการ — ครบในที่เดียว',
            ctaPrimary: { href: '/courses', label: 'จองคอร์ส' },
            ctaSecondary: { href: '/login', label: 'เข้าสู่ระบบ' },
          },
        ]}
        interval={5500}
      />

      <section className="container section">
        <h2 className="section-title">สิทธิประโยชน์สมาชิก Private Fitness</h2>

        <div className="benefit-grid">
          <article className="benefit">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M4 15l3-2 2 1 3-3 2 1 3-4"/><path d="M18 16l2 3"/><circle cx="6" cy="6" r="2"/>
              </svg>
            </div>
            <h3 className="benefit-title">เหมาะกับทุกไลฟ์สไตล์</h3>
            <p className="benefit-desc">ปรับแผนให้เข้ากับตารางชีวิตและเป้าหมายของคุณ</p>
          </article>

          <article className="benefit">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
              </svg>
            </div>
            <h3 className="benefit-title">สมาชิกใบเดียว</h3>
            <p className="benefit-desc">เข้าได้หลายสาขา/หลายอุปกรณ์อย่างยืดหยุ่น</p>
          </article>

          <article className="benefit">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>
              </svg>
            </div>
            <h3 className="benefit-title">ยืดหยุ่น ไม่ผูกมัด</h3>
            <p className="benefit-desc">เลือกต่ออายุเป็นรอบ ๆ ปรับเปลี่ยนแพ็กเกจได้ตลอด</p>
          </article>
        </div>
      </section>

      <section className="container cta">
        <h3>พร้อมเริ่มเส้นทางสุขภาพของคุณแล้วหรือยัง?</h3>
        <div className="hero-actions">
          <Link href="/signup" className="button">สมัครสมาชิกวันนี้</Link>
          <Link href="/contact" className="button-outline">คุยกับเรา</Link>
        </div>
      </section>
    </section>
  );
}