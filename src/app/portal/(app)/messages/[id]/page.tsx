import ChatThread from './ChatThread';

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatThread connectionId={id} />;
}
