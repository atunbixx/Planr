export const revalidate = 0;

export default function HealthPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Status</p>
        <h1 className="text-3xl font-bold text-green-600">OK</h1>
        <p className="text-xs text-gray-500">/health page is rendering and Tailwind loaded.</p>
      </div>
    </div>
  );
}

