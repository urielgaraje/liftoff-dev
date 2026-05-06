export function UnknownStage({ stageId }: { stageId: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">LIFTOFF</p>
        <h1 className="text-2xl font-medium text-fg-primary">
          Stage en construcción
        </h1>
        <p className="font-mono text-xs text-fg-muted">id: {stageId}</p>
      </div>
    </main>
  );
}
