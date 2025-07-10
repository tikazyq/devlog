import { DevlogDetailsPage } from './DevlogDetailsPage';

// Disable static generation for this page since it uses client-side features
export const dynamic = 'force-dynamic';

interface DevlogPageProps {
  params: {
    id: string;
  };
}

export default function DevlogPage({ params }: DevlogPageProps) {
  return <DevlogDetailsPage id={params.id} />;
}
