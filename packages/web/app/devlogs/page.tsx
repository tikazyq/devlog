import { DevlogListPage } from './DevlogListPage';

// Disable static generation for this page since it uses client-side features
export const dynamic = 'force-dynamic';

export default function DevlogsPage() {
  return <DevlogListPage />;
}
