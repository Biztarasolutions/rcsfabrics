// Shown instantly while a product page opens, so a click always gives feedback
export default function ProductLoading() {
  return (
    <div className="container-main py-6" aria-busy="true" aria-label="Loading product">
      <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/5] w-full animate-pulse rounded-3xl bg-gray-100 dark:bg-dark-800" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
          <div className="h-7 w-32 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-dark-800" />
        </div>
      </div>
    </div>
  );
}
