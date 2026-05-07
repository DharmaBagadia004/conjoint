function DashboardLayout({ datasetPanel, personaPanel, mainPanel }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:h-full xl:grid-cols-[190px_250px_minmax(0,1fr)] xl:overflow-hidden">
      <aside className="space-y-4 xl:hidden">
        {datasetPanel}
        {personaPanel}
      </aside>

      <aside className="hidden xl:min-h-0 xl:space-y-4 xl:overflow-hidden xl:block">
        {datasetPanel}
      </aside>

      <aside className="hidden xl:min-h-0 xl:space-y-4 xl:overflow-hidden xl:block">
        {personaPanel}
      </aside>

      <main className="min-w-0 space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
        {mainPanel}
      </main>
    </div>
  );
}

export default DashboardLayout;
