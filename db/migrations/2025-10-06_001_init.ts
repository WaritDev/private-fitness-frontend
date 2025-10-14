import type { PoolConnection } from "mysql2/promise";

export async function up(conn: PoolConnection) {
  await conn.query(`SET NAMES utf8mb4`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`USER\` (
      \`Username\`       VARCHAR(100) PRIMARY KEY,
      \`Password\`       VARCHAR(255) NOT NULL,
      \`Role\`           ENUM('CUSTOMER','TRAINER','SALES','MANAGER','ADMIN') NOT NULL,
      \`First_Name\`     VARCHAR(100) NOT NULL,
      \`Last_Name\`      VARCHAR(100) NOT NULL,
      \`Gender\`         VARCHAR(20) NULL,
      \`Date_of_Birth\`  DATE NULL,
      \`Phone_Number\`   VARCHAR(20) UNIQUE NULL,
      \`Gmail\`          VARCHAR(150) UNIQUE NULL,
      \`Profile_Image\`  TEXT NULL,
      \`Specialty\`      VARCHAR(100) NULL,
      \`Is_Active\`      TINYINT(1) NOT NULL DEFAULT 1,
      \`Created_At\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Updated_At\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`CUSTOMER\` (
      \`Username\` VARCHAR(100) PRIMARY KEY,
      \`Health_Info\` TEXT NULL,
      \`Address\` TEXT NULL,
      \`Company_Name\` VARCHAR(150) NULL,
      \`Company_Position\` VARCHAR(150) NULL,
      \`Marital_Status\` VARCHAR(50) NULL,
      \`Emergency_Contact_Name\` VARCHAR(150) NULL,
      \`Emergency_Contact_Relationship\` VARCHAR(100) NULL,
      \`Emergency_Contact_Phone\` VARCHAR(20) NULL,
      \`Marketing_Source\` VARCHAR(100) NULL,
      CONSTRAINT \`fk_customer_user\` FOREIGN KEY (\`Username\`) REFERENCES \`USER\`(\`Username\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`PRODUCTS\` (
      \`Product_Id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`Name\` VARCHAR(150) NOT NULL,
      \`Product_Type\` ENUM('DURATION','SESSION') NOT NULL,
      \`Product_Category\` ENUM('Economy','Business','First_Class') NOT NULL,
      \`List_Price\` DECIMAL(10,2) NOT NULL,
      \`Duration_Days\` INT NULL,
      \`Session_Amount\` INT NULL,
      \`Is_Active\` TINYINT(1) NOT NULL DEFAULT 1,
      \`Created_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Updated_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (\`Product_Type\`, \`Product_Category\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`CUSTOMER_DURATION\` (
      \`Duration_Id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`Customer_Username\` VARCHAR(100) NOT NULL,
      \`Product_Id\` INT NOT NULL,
      \`Sales_Username\` VARCHAR(100) NULL,
      \`Purchase_Date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Start_Date\` DATE NOT NULL,
      \`End_Date\` DATE NOT NULL,
      \`Price_Paid\` DECIMAL(10,2) NOT NULL,
      \`Discount_Amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
      \`Status\` ENUM('ACTIVE','EXPIRED','FROZEN','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
      \`Created_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Updated_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (\`Customer_Username\`, \`Status\`),
      INDEX (\`Product_Id\`),
      INDEX (\`Sales_Username\`),
      CONSTRAINT \`fk_cd_customer\` FOREIGN KEY (\`Customer_Username\`) REFERENCES \`CUSTOMER\`(\`Username\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`fk_cd_product\` FOREIGN KEY (\`Product_Id\`) REFERENCES \`PRODUCTS\`(\`Product_Id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT \`fk_cd_sales\` FOREIGN KEY (\`Sales_Username\`) REFERENCES \`USER\`(\`Username\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`CUSTOMER_SESSION\` (
      \`Session_Id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`Customer_Username\` VARCHAR(100) NOT NULL,
      \`Trainer_Username\` VARCHAR(100) NULL,
      \`Product_Id\` INT NOT NULL,
      \`Sales_Username\` VARCHAR(100) NULL,
      \`Purchase_Date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Total_Sessions\` INT NOT NULL,
      \`Used_Sessions\` INT NOT NULL DEFAULT 0,
      \`Price_Paid\` DECIMAL(10,2) NOT NULL,
      \`Discount_Amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
      \`Status\` ENUM('ACTIVE','EXPIRED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
      \`Created_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Updated_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (\`Customer_Username\`, \`Status\`),
      INDEX (\`Trainer_Username\`),
      INDEX (\`Product_Id\`),
      INDEX (\`Sales_Username\`),
      CONSTRAINT \`fk_cs_customer\` FOREIGN KEY (\`Customer_Username\`) REFERENCES \`CUSTOMER\`(\`Username\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`fk_cs_trainer\` FOREIGN KEY (\`Trainer_Username\`) REFERENCES \`USER\`(\`Username\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`fk_cs_product\` FOREIGN KEY (\`Product_Id\`) REFERENCES \`PRODUCTS\`(\`Product_Id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT \`fk_cs_sales\` FOREIGN KEY (\`Sales_Username\`) REFERENCES \`USER\`(\`Username\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ตารางตารางเวลาฝั่งเทรนเนอร์
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`TRAINING_SCHEDULE\` (
      \`Schedule_Id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`Trainer_Username\` VARCHAR(100) NOT NULL,
      \`Customer_Username\` VARCHAR(100) NULL,
      \`Session_Id\` INT NULL,
      \`Start_Time\` DATETIME NOT NULL,
      \`End_Time\` DATETIME NOT NULL,
      \`Schedule_Type\` ENUM('APPOINTMENT','DAY_OFF','BREAK','HOLIDAY') NOT NULL,
      \`Created_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`Updated_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (\`Trainer_Username\`, \`Start_Time\`),
      INDEX (\`Customer_Username\`),
      INDEX (\`Session_Id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Log ลูกค้า
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`CUSTOMER_LOG\` (
      \`Log_Id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`Customer_Username\` VARCHAR(100) NOT NULL,
      \`Log_Type\` VARCHAR(50) NOT NULL,
      \`Created_At\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (\`Customer_Username\`, \`Created_At\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
