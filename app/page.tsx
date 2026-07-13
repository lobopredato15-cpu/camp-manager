const findings = [
  "No production deploy recommended yet",
  "Database schema and RLS are not implemented",
  "Server actions, imports, exports, and assignment flows are still missing",
  "Security guardrail tests are included for the next implementation phase",
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Independent Audit Package</p>
        <h1>Camp Accommodation Manager</h1>
        <p className="lede">
          This repository currently contains the final audit, architecture notes, and security guardrails for the Camp Accommodation Manager project.
        </p>
        <div className="actions">
          <a href="/FINAL_AUDIT.md">Open final audit</a>
          <a className="secondary" href="https://github.com/lobopredato15-cpu/camp-manager">View repository</a>
        </div>
      </section>

      <section className="panel" aria-label="Audit status">
        <div>
          <p className="status-label">Production recommendation</p>
          <strong className="status">NO-GO</strong>
        </div>
        <ul>
          {findings.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
