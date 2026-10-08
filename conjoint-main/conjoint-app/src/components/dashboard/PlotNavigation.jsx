export default function PlotNavigation({ children, onPrevious, onNext, previousLabel = "Previous view", nextLabel = "Next view" }) {
  const buttonClass = "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none";

  return (
    <div className="relative min-w-0 px-7 sm:px-6">
      <button type="button" onClick={onPrevious} disabled={!onPrevious} aria-label={previousLabel} title={previousLabel} className={`${buttonClass} left-0`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14 6-6 6 6 6" /></svg>
      </button>
      {children}
      <button type="button" onClick={onNext} disabled={!onNext} aria-label={nextLabel} title={nextLabel} className={`${buttonClass} right-0`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m10 6 6 6-6 6" /></svg>
      </button>
    </div>
  );
}
