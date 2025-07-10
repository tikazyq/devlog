// Disable static generation to prevent window issues
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <a href="/">Return Home</a>
    </div>
  );
}
