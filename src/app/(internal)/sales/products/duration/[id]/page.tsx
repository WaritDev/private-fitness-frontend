import { redirect } from 'next/navigation';

export default function DurationDetailPage({ params }: { params: { id: string } }) {
  redirect(`/sales/products/duration/${params.id}/register`);
}