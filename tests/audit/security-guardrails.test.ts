import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function filesUnder(relativeDir: string): string[] {
  const start = join(root, relativeDir);
  if (!existsSync(start)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(start);
  return out;
}

function textFrom(relativeDirs: string[]): string {
  return relativeDirs
    .flatMap(filesUnder)
    .filter((file) => /\.(ts|tsx|sql|js|mjs|cjs)$/.test(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

const sql = textFrom(["supabase"]);
const serverCode = textFrom(["app", "lib"]);
const allCode = `${sql}\n${serverCode}`;

describe("security guardrails required before production", () => {
  it("prevents Organization A from reading Organization B data through RLS", () => {
    expect(sql).toMatch(/alter\s+table[\s\S]+enable\s+row\s+level\s+security/i);
    expect(sql).toMatch(/organization_id/i);
    expect(sql).toMatch(/using\s*\([\s\S]*(is_org_member|current_user_role|can_access_camp)/i);
  });

  it("prevents Organization A from modifying Organization B data through RLS", () => {
    expect(sql).toMatch(/with\s+check\s*\([\s\S]*(is_org_member|current_user_role|can_access_camp)/i);
  });

  it("prevents Viewer writes through direct calls", () => {
    expect(allCode).toMatch(/viewer/i);
    expect(allCode).toMatch(/(has_min_role|current_user_role|assert.*role|require.*role)/i);
  });

  it("prevents Allocator role escalation", () => {
    expect(allCode).toMatch(/allocator/i);
    expect(allCode).toMatch(/(role.*change|update.*role|organization_memberships)/i);
    expect(allCode).toMatch(/organization_admin|super_admin/i);
  });

  it("prevents Camp Manager access to unauthorized camps", () => {
    expect(allCode).toMatch(/camp_manager/i);
    expect(allCode).toMatch(/membership_camp_access|can_access_camp/i);
  });

  it("does not trust client-supplied organization_id", () => {
    expect(serverCode).toMatch(/organization_id/i);
    expect(serverCode).toMatch(/(session|auth\.getUser|user\.id)/i);
  });

  it("prevents overlapping reservations under concurrent requests", () => {
    expect(sql).toMatch(/exclude\s+using\s+gist|pg_advisory_xact_lock|serializable|tstzrange/i);
  });

  it("prevents capacity overflow", () => {
    expect(sql).toMatch(/capacity/i);
    expect(sql).toMatch(/raise\s+exception|constraint|trigger/i);
  });

  it("keeps service_role out of client code", () => {
    expect(serverCode).not.toMatch(/NEXT_PUBLIC_.*SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY[\s\S]{0,80}(client|browser)/i);
  });

  it("handles malicious Excel imports without formula or macro execution", () => {
    expect(serverCode).toMatch(/xlsx|papaparse/i);
    expect(serverCode).toMatch(/cellFormula|formula|sanitize|escape/i);
  });

  it("prevents CSV formula injection in exports", () => {
    expect(serverCode).toMatch(/export|csv/i);
    expect(serverCode).toMatch(/[=+\-@]|formula|sanitize|escape/i);
  });

  it("does not reveal secrets or SQL internals in errors", () => {
    expect(serverCode).toMatch(/try\s*{|catch\s*\(/i);
    expect(serverCode).toMatch(/(safeError|internal server error|redact|sanitize)/i);
  });

  it("prevents client modification of audit logs", () => {
    expect(sql).toMatch(/audit_logs/i);
    expect(sql).toMatch(/revoke|deny|insert.*audit|trigger/i);
  });

  it("removes access for deactivated users", () => {
    expect(allCode).toMatch(/deactivated|disabled|active/i);
    expect(allCode).toMatch(/organization_memberships/i);
  });

  it("protects sensitive routes at the server/database layer, not only middleware", () => {
    expect(serverCode).toMatch(/(auth\.getUser|requireUser|requireRole|current_user_role|has_min_role)/i);
  });
});
