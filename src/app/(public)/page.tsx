export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary p-8 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">
        5 · 4 · 3 · 2 · 1
      </p>
      <h1 className="text-5xl font-bold tracking-tight text-fg-primary md:text-7xl">
        Liftoff
      </h1>
      <p className="max-w-md text-fg-secondary">
        Race multijugador de cohetes hacia un planeta. Pre-build.
      </p>
      <p className="font-mono text-xs text-fg-muted">starter-rich · scaffold ready</p>
    </main>
  );
}
