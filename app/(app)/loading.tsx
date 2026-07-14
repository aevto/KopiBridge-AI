export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading page">
      <div className="h-4 w-28 rounded bg-espresso-100" />
      <div className="h-10 max-w-xl rounded bg-espresso-100" />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="h-36 rounded-lg bg-white shadow-card" />
        <div className="h-36 rounded-lg bg-white shadow-card" />
        <div className="h-36 rounded-lg bg-white shadow-card" />
      </div>
      <div className="h-72 rounded-lg bg-white shadow-card" />
    </div>
  );
}
