export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="bg-white rounded-lg p-8 shadow-sm text-gray-500">
        This page will be implemented in a follow-up PR. The backend API is ready — see the
        routes in <code className="bg-gray-100 px-1">backend/src/routes/admin/index.ts</code>.
      </div>
    </div>
  );
}
