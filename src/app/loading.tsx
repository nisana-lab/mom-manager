export default function RootLoading() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-4 pb-28 pt-16">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-sage-200 border-t-sage-600" />
      <p className="text-sm font-medium text-slate-600">טוען…</p>
    </div>
  );
}
