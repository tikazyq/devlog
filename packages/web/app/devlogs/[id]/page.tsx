import { DevlogDetailsPage } from './DevlogDetailsPage';

interface DevlogPageProps {
  params: {
    id: string;
  };
}

export default function DevlogPage({ params }: DevlogPageProps) {
  return <DevlogDetailsPage id={params.id} />;
}
