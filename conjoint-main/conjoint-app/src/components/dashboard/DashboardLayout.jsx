function DashboardLayout({ datasetPanel, personaPanel, mainPanel }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside aria-label="Study and persona selection" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        {datasetPanel}
        {personaPanel}
      </aside>
      <div className="min-w-0">{mainPanel}</div>
    </div>
  );
}

export default DashboardLayout;
