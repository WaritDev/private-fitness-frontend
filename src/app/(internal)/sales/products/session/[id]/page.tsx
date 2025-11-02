import { redirect } from 'next/navigation';

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  redirect(`/sales/products/session/${params.id}/register`);
}