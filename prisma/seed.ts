import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hp(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

async function main() {
  // Users (password: pass1234)
  await prisma.user.createMany({
    data: [
      { Username: 'sarah_m', Password: await hp('pass1234'), Role: 'TRAINER',  First_Name: 'Sarah',  Last_Name: 'Miller', Gmail: 'sarah@fit.com',  Specialty: 'Strength',   Is_Active: true },
      { Username: 'ethan_w', Password: await hp('pass1234'), Role: 'TRAINER',  First_Name: 'Ethan',  Last_Name: 'Walker', Gmail: 'ethan@fit.com',  Specialty: 'Endurance',  Is_Active: true },
      { Username: 'noom_e',  Password: await hp('pass1234'), Role: 'SALES',    First_Name: 'Noom',   Last_Name: 'Sale',   Gmail: 'noom@sales.com',                          Is_Active: true },
      { Username: 'mana_k',  Password: await hp('pass1234'), Role: 'MANAGER',  First_Name: 'Mana',   Last_Name: 'Kittikun', Gmail: 'manager@gym.com',                       Is_Active: true },
      { Username: 'sophia_c',Password: await hp('pass1234'), Role: 'CUSTOMER', First_Name: 'Sophia', Last_Name: 'Clark',  Gmail: 'sophia@client.com',                        Is_Active: true },
    ],
    skipDuplicates: true,
  });

  // Customer profile (1:1)
  await prisma.customer.upsert({
    where: { Username: 'sophia_c' },
    update: {},
    create: {
      Username: 'sophia_c',
      Health_Info: 'No injury',
      Marketing_Source: 'Walk-in',
    },
  });

  // Products
  await prisma.products.createMany({
    data: [
      { Name: '3 Months Membership', Product_Type: 'DURATION', Product_Category: 'Business',    List_Price: 3990.0, Duration_Days: 90, Session_Amount: null, Is_Active: true },
      { Name: '1 Month Membership',  Product_Type: 'DURATION', Product_Category: 'Economy',     List_Price: 1590.0, Duration_Days: 30, Session_Amount: null, Is_Active: true },
      { Name: 'PT 10 Sessions',      Product_Type: 'SESSION',  Product_Category: 'First_Class', List_Price: 4990.0, Duration_Days: null, Session_Amount: 10, Is_Active: true },
      { Name: 'PT 5 Sessions',       Product_Type: 'SESSION',  Product_Category: 'Economy',     List_Price: 2790.0, Duration_Days: null, Session_Amount: 5,  Is_Active: true },
    ],
    skipDuplicates: true,
  });

  const prodPT10 = await prisma.products.findFirstOrThrow({ where: { Name: 'PT 10 Sessions' } });
  const prod3m   = await prisma.products.findFirstOrThrow({ where: { Name: '3 Months Membership' } });

  // Purchase: Duration
  await prisma.customer_Duration.create({
    data: {
      Customer_Username: 'sophia_c',
      Product_Id: prod3m.Product_Id,
      Sales_Username: 'noom_e',
      Purchase_Date: new Date('2025-07-01T09:00:00'),
      Start_Date: new Date('2025-07-01'),
      End_Date: new Date('2025-09-30'),
      Price_Paid: 3591.0,
      Discount_Amount: 399.0,
      Status: 'ACTIVE',
    },
  });

  // Purchase: Session
  const cs = await prisma.customer_Session.create({
    data: {
      Customer_Username: 'sophia_c',
      Trainer_Username: 'sarah_m',
      Product_Id: prodPT10.Product_Id,
      Sales_Username: 'noom_e',
      Purchase_Date: new Date('2025-07-05T10:00:00'),
      Total_Sessions: 10,
      Used_Sessions: 0,
      Price_Paid: 4990.0,
      Discount_Amount: 0.0,
      Status: 'ACTIVE',
    },
  });

  // Schedule: Appointment + Day Off
  await prisma.training_Schedule.createMany({
    data: [
      {
        Trainer_Username: 'sarah_m',
        Customer_Username: 'sophia_c',
        Session_Id: cs.Session_Id,
        Start_Time: new Date('2025-07-25T10:00:00'),
        End_Time: new Date('2025-07-25T11:00:00'),
        Schedule_Type: 'APPOINTMENT',
      },
      {
        Trainer_Username: 'sarah_m',
        Customer_Username: null,
        Session_Id: null,
        Start_Time: new Date('2025-07-27T00:00:00'),
        End_Time: new Date('2025-07-27T23:59:59'),
        Schedule_Type: 'DAY_OFF',
      },
    ],
    skipDuplicates: true,
  });

  // Logs
  await prisma.customer_Log.createMany({
    data: [
      { Customer_Username: 'sophia_c', Timestamp: new Date('2025-07-25T09:55:00'), Log_Type: 'CHECK_IN',      Detail: 'QR check-in at branch A' },
      { Customer_Username: 'sophia_c', Timestamp: new Date('2025-07-25T10:58:00'), Log_Type: 'BOOK_SESSION', Detail: 'PT with Sarah' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed');
}

main().finally(() => prisma.$disconnect());