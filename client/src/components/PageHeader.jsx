export default function PageHeader({ title, description, actions = null, badge = null }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-700/80 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
