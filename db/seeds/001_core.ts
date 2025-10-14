import type { PoolConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";

async function hp(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

export default async function run(conn: PoolConnection) {
  const users = [
    [
      "sarah_m",
      await hp("pass1234"),
      "TRAINER",
      "Sarah",
      "Miller",
      null,
      "sarah@fit.com",
      1,
      "Strength",
    ],
    [
      "ethan_w",
      await hp("pass1234"),
      "TRAINER",
      "Ethan",
      "Walker",
      null,
      "ethan@fit.com",
      1,
      "Endurance",
    ],
    [
      "noom_e",
      await hp("pass1234"),
      "SALES",
      "Noom",
      "Sale",
      null,
      "noom@sales.com",
      1,
      null,
    ],
    [
      "mana_k",
      await hp("pass1234"),
      "MANAGER",
      "Mana",
      "Kittikun",
      null,
      "manager@gym.com",
      1,
      null,
    ],
    [
      "sophia_c",
      await hp("pass1234"),
      "CUSTOMER",
      "Sophia",
      "Clark",
      null,
      "sophia@client.com",
      1,
      null,
    ],
  ];

  for (const r of users) {
    await conn.query(
      "INSERT INTO `USER` (Username, Password, Role, First_Name, Last_Name, Phone_Number, Gmail, Is_Active, Specialty, Created_At, Updated_At) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE Username=Username",
      r
    );
  }

  await conn.query(
    "INSERT INTO `CUSTOMER` (Username, Health_Info, Marketing_Source) VALUES (?,?,?) ON DUPLICATE KEY UPDATE Username=Username",
    ["sophia_c", "No injury", "Walk-in"]
  );

  const products = [
    ["3 Months Membership", "DURATION", "Business", 3990.0, 90, null, 1],
    ["1 Month Membership", "DURATION", "Economy", 1590.0, 30, null, 1],
    ["PT 10 Sessions", "SESSION", "First_Class", 4990.0, null, 10, 1],
    ["PT 5 Sessions", "SESSION", "Economy", 2790.0, null, 5, 1],
  ];
  for (const p of products) {
    await conn.query(
      "INSERT INTO `PRODUCTS` (Name, Product_Type, Product_Category, List_Price, Duration_Days, Session_Amount, Is_Active, Created_At, Updated_At) VALUES (?,?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE Name=Name",
      p
    );
  }
  const [rows] = await conn.query<any[]>(
    'SELECT Product_Id, Name FROM `PRODUCTS` WHERE Product_Type = "SESSION"'
  );
  const pt5 = rows.find((r) => r.Name === "PT 5 Sessions")?.Product_Id;
  const pt10 = rows.find((r) => r.Name === "PT 10 Sessions")?.Product_Id;
  if (pt5) {
    await conn.query(
      `INSERT INTO \`CUSTOMER_SESSION\`
        (Customer_Username, Trainer_Username, Product_Id, Sales_Username, Total_Sessions, Used_Sessions, Price_Paid, Discount_Amount, Status, Created_At, Updated_At)
       VALUES (?,?,?,?,?,?,?,?, 'ACTIVE', NOW(), NOW())
       ON DUPLICATE KEY UPDATE Updated_At = NOW()`,
      ["sophia_c", null, pt5, "noom_e", 5, 0, 2790.0, 0]
    );
  }
  // เคลียร์ TRAINING_SCHEDULE อนาคต (กันซ้ำตอน seed)
  await conn.query(
    "DELETE FROM `TRAINING_SCHEDULE` WHERE Start_Time >= CURDATE() AND Trainer_Username IN (?, ?)",
    ["sarah_m", "ethan_w"]
  );

  // สร้าง slots ให้ trainer 2 คน สำหรับ 7 วันถัดไป เวลา 10:00 และ 14:00 น.
  function toDT(date: Date, h: number, m = 0) {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
    const y = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const da = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = "00";
    return `${y}-${mo}-${da} ${hh}:${mm}:${ss}`;
  }

  const today = new Date();
  const trainers = ["sarah_m", "ethan_w"];
  const hours = [
    [10, 0],
    [14, 0],
  ] as const;

  for (let i = 0; i < 7; i++) {
    const base = new Date(today);
    base.setDate(base.getDate() + i);
    for (const t of trainers) {
      for (const [h, m] of hours) {
        const start = toDT(base, h, m);
        const end = toDT(base, h + 1, m); // 1 ชม.
        await conn.query(
          `INSERT INTO \`TRAINING_SCHEDULE\`
            (Trainer_Username, Customer_Username, Session_Id, Start_Time, End_Time, Schedule_Type, Created_At, Updated_At)
           VALUES (?, NULL, NULL, ?, ?, 'APPOINTMENT', NOW(), NOW())`,
          [t, start, end]
        );
      }
    }
  }
}
