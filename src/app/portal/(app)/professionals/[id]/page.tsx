import ProfessionalDetail from './ProfessionalDetail';

export default async function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfessionalDetail id={id} />;
}
