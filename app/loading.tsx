export default function Loading() {
  return (
    <div className="container-site min-h-[65vh] py-10" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="h-3 w-28 animate-pulse rounded-full bg-stone-200" />
      <div className="mt-4 h-9 w-64 max-w-full animate-pulse rounded-xl bg-stone-200" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index}><div className="aspect-[3/4] animate-pulse rounded-2xl bg-stone-100" /><div className="mt-3 h-3 w-2/3 animate-pulse rounded-full bg-stone-100" /><div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-stone-100" /></div>)}
      </div>
    </div>
  );
}
