'use client';

import * as React from 'react';
import QRCode from 'react-qr-code';

type Props = {
  uuid: string;
  size?: number;
  mode?: 'uuid' | 'url';
  baseUrl?: string;
};

export default function QRCodeGenerator({ 
  uuid, 
  size = 220, 
  mode = 'uuid', 
  baseUrl = 'https://yourdomain.com/checkin'
}: Props) {
  // ถ้า mode = 'url' และ uuid เริ่มด้วย http:// หรือ https:// ให้ใช้ตรงๆ
  let value: string;
  if (mode === 'url' && (uuid.startsWith('http://') || uuid.startsWith('https://'))) {
    value = uuid; // ใช้ URL เต็มที่ส่งมาจาก API
  } else if (mode === 'url') {
    value = `${baseUrl}/${uuid}`; // สร้าง URL จาก baseUrl + uuid
  } else {
    value = uuid; // mode = 'uuid' ใช้ uuid โดยตรง
  }
  
  return (
    <div style={{ background: 'white', padding: '16px' }}>
      <QRCode
        value={value}
        size={size}
        level="H"
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
}
