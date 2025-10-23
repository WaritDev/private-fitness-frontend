'use client';
import React from 'react';
import { useRouter } from 'next/router';
import { redirect } from 'next/navigation';
import SessionRegisterForm from '@/components/registartion/SessionRegisterForm';

function SessionRegisterPage() {
  const router = useRouter();
  const { id } = router.query;

  redirect(`/products/session/${id}/register`);

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Register for Session</h1>
      <SessionRegisterForm sessionId={id} />
    </div>
  );
}

export default SessionRegisterPage;