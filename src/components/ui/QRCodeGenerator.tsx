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
  const value = mode === 'uuid' ? uuid : `${baseUrl}/${uuid}`;
  
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
