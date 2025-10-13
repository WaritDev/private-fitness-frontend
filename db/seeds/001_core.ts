import type { PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function hp(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

export default async function run(conn: PoolConnection) {
  const users = [
    ['sarah_m', await hp('pass1234'), 'TRAINER',  'Sarah',  'Miller',   null, 'sarah@fit.com',   1, 'Strength'],
    ['ethan_w', await hp('pass1234'), 'TRAINER',  'Ethan',  'Walker',   null, 'ethan@fit.com',   1, 'Endurance'],
    ['noom_e',  await hp('pass1234'), 'SALES',    'Noom',   'Sale',     null, 'noom@sales.com',  1, null],
    ['mana_k',  await hp('pass1234'), 'MANAGER',  'Mana',   'Kittikun', null, 'manager@gym.com', 1, null],
    ['sophia_c',await hp('pass1234'), 'CUSTOMER', 'Sophia', 'Clark',    null, 'sophia@client.com',1, null],
  ];

  for (const r of users) {
    await conn.query(
      'INSERT INTO `USER` (Username, Password, Role, First_Name, Last_Name, Phone_Number, Gmail, Is_Active, Specialty, Created_At, Updated_At) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE Username=Username',
      r
    );
  }

  await conn.query(
    'INSERT INTO `CUSTOMER` (Username, Health_Info, Marketing_Source) VALUES (?,?,?) ON DUPLICATE KEY UPDATE Username=Username',
    ['sophia_c', 'No injury', 'Walk-in']
  );

  const products = [
    ['3 Months Membership', 'DURATION', 'Business',    3990.0, 90,  null, 1],
    ['1 Month Membership',  'DURATION', 'Economy',     1590.0, 30,  null, 1],
    ['PT 10 Sessions',      'SESSION',  'First_Class', 4990.0, null, 10, 1],
    ['PT 5 Sessions',       'SESSION',  'Economy',     2790.0, null, 5,  1],
  ];
  for (const p of products) {
    await conn.query(
      'INSERT INTO `PRODUCTS` (Name, Product_Type, Product_Category, List_Price, Duration_Days, Session_Amount, Is_Active, Created_At, Updated_At) VALUES (?,?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE Name=Name',
      p
    );
  }
}