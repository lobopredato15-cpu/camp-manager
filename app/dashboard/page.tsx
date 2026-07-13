"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileUp,
  Hotel,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

type Camp = { id: string; name: string; location: string; manager: string };
type Room = { id: string; camp_id: string; building: string; name: string; beds: number; status: "available" | "maintenance" | "reserved" };
type Person = { id: string; name: string; company: string; trade: string; flight: string };
type Assignment = { id: string; person_id: string; room_id: string; start_date: string; end_date: string; status: "planned" | "checked-in" | "checked-out" | "cancelled" };
type AuditEvent = { id: string; action: string; detail: string; created_at: string };
type ImportRow = { name: string; company: string; startDate: string; endDate: string };
type DashboardData = { camps: Camp[]; rooms: Room[]; people: Person[]; assignments: Assignment[]; auditLogs: AuditEvent[] };

const emptyData: DashboardData = { camps: [], rooms: [], people: [], assignments: [], auditLogs: [] };
const nextSevenDays = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

function todayLabel() {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date());
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCamp, setSelectedCamp] = useState("");
  const [query, setQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);

  const [campName, setCampName] = useState("");
  const [campLocation, setCampLocation] = useState("");
  const [campManager, setCampManager] = useState("");
  const [roomName, setRoomName] = useState("");
  const [building, setBuilding] = useState("Main");
  const [beds, setBeds] = useState(1);
  const [personName, setPersonName] = useState("");
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");
  const [flight, setFlight] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/data", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load data");
      setData(payload);
      setSelectedCamp((current) => current || payload.camps[0]?.id || "");
      setSelectedPerson((current) => current || payload.people[0]?.id || "");
      setSelectedRoom((current) => current || payload.rooms.find((room: Room) => room.status === "available")?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const activeRooms = data.rooms.filter((room) => room.camp_id === selectedCamp);
  const activeAssignments = data.assignments.filter((assignment) => assignment.status !== "cancelled");
  const checkedInCount = data.assignments.filter((assignment) => assignment.status === "checked-in").length;
  const plannedCount = data.assignments.filter((assignment) => assignment.status === "planned").length;
  const totalBeds = data.rooms.reduce((sum, room) => sum + room.beds, 0);
  const usedBeds = activeAssignments.length;
  const occupancy = totalBeds ? Math.round((usedBeds / totalBeds) * 100) : 0;
  const availableRooms = data.rooms.filter((room) => room.status === "available");
  const dirtyRooms = data.rooms.filter((room) => room.status === "maintenance" || data.assignments.some((assignment) => assignment.room_id === room.id && assignment.status === "checked-in"));
  const stayReportRows = data.rooms.map((room) => {
    const camp = data.camps.find((item) => item.id === room.camp_id);
    const assignment = data.assignments.find((item) => item.room_id === room.id && item.status !== "cancelled" && item.status !== "checked-out");
    const person = assignment ? data.people.find((item) => item.id === assignment.person_id) : null;
    const stayDays = assignment
      ? Math.max(1, Math.ceil((new Date(assignment.end_date).getTime() - new Date(assignment.start_date).getTime()) / 86400000))
      : 0;
    const roomState = room.status === "maintenance" ? "Mantenimiento" : assignment ? "Ocupada" : "Libre";
    const cleaningState = room.status === "maintenance" ? "Sucia" : assignment?.status === "checked-in" ? "Sucia" : "Limpia";
    return {
      id: room.id,
      camp: camp?.name || "Sin campamento",
      room: room.name,
      person: person?.name || "-",
      company: person?.company || "-",
      startDate: assignment?.start_date || "-",
      endDate: assignment?.end_date || "-",
      stayDays,
      roomState,
      cleaningState,
    };
  });

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.people;
    return data.people.filter((person) => [person.name, person.company, person.trade, person.flight].some((value) => value.toLowerCase().includes(normalized)));
  }, [data.people, query]);

  async function createCamp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!campName.trim()) return;
    await postJson<Camp>("/api/camps", { name: campName, location: campLocation, manager: campManager });
    setCampName("");
    setCampLocation("");
    setCampManager("");
    await loadData();
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCamp || !roomName.trim()) return;
    await postJson<Room>("/api/rooms", { campId: selectedCamp, name: roomName, building, beds });
    setRoomName("");
    setBuilding("Main");
    setBeds(1);
    await loadData();
  }

  async function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!personName.trim()) return;
    await postJson<Person>("/api/people", { name: personName, company, trade, flight });
    setPersonName("");
    setCompany("");
    setTrade("");
    setFlight("");
    await loadData();
  }

  async function createAssignment() {
    if (!selectedPerson || !selectedRoom) return;
    await postJson<Assignment>("/api/assignments", { personId: selectedPerson, roomId: selectedRoom });
    await loadData();
  }

  async function updateAssignment(id: string, status: Assignment["status"]) {
    await postJson<Assignment>("/api/assignments/status", { id, status });
    await loadData();
  }

  function safeCsvCell(value: string) {
    const escaped = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${escaped.replaceAll('"', '""')}"`;
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows.map((row) => row.map(safeCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function readCell(row: Record<string, unknown>, names: string[]) {
    const entries = Object.entries(row);
    for (const name of names) {
      const match = entries.find(([key]) => key.trim().toLowerCase() === name);
      if (match && match[1] !== undefined && match[1] !== null) return String(match[1]).trim();
    }
    return "";
  }

  function normalizeImportDate(value: unknown) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      excelEpoch.setUTCDate(excelEpoch.getUTCDate() + value);
      return excelEpoch.toISOString().slice(0, 10);
    }
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parts = raw.split(/[/-]/).map((part) => part.padStart(2, "0"));
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  }

  async function handleRosterImport(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!selectedCamp) {
      setImportStatus("Primero crea o selecciona un campamento.");
      return;
    }

    setImporting(true);
    setImportStatus("Leyendo archivo...");

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      const parsedRows: ImportRow[] = rows
        .map((row) => ({
          name: readCell(row, ["nombre", "name", "persona"]),
          company: readCell(row, ["empresa", "company"]),
          startDate: normalizeImportDate(readCell(row, ["dia de entrada", "dÃ­a de entrada", "entrada", "start", "start date"])),
          endDate: normalizeImportDate(readCell(row, ["dia de salida", "dÃ­a de salida", "salida", "end", "end date"])),
        }))
        .filter((row) => row.name && row.company && row.startDate && row.endDate);

      if (!parsedRows.length) {
        setImportStatus("No encontre filas validas. Usa columnas: nombre, empresa, dia de entrada, dia de salida.");
        return;
      }

      const roomQueue = data.rooms.filter((room) => room.camp_id === selectedCamp && room.status === "available");
      let assigned = 0;
      const skipped: string[] = [];

      for (const row of parsedRows) {
        const room = roomQueue.shift();
        if (!room) {
          skipped.push(row.name);
          continue;
        }
        const person = await postJson<Person>("/api/people", { name: row.name, company: row.company, trade: "Importado", flight: "Pendiente" });
        await postJson<Assignment>("/api/assignments", { personId: person.id, roomId: room.id, startDate: row.startDate, endDate: row.endDate });
        assigned += 1;
      }

      setImportStatus(`${assigned} personas importadas y asignadas.${skipped.length ? ` Sin habitacion: ${skipped.join(", ")}.` : ""}`);
      await loadData();
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    } finally {
      setImporting(false);
    }
  }
  function exportPeopleReport() {
    downloadCsv("camp-people-report.csv", [["Name", "Company", "Trade", "Flight"], ...data.people.map((person) => [person.name, person.company, person.trade, person.flight])]);
  }

  function exportStayReport() {
    downloadCsv("camp-stay-room-report.csv", [
      ["Camp", "Room", "Person", "Company", "Start", "End", "Stay days", "Room status", "Cleaning status"],
      ...stayReportRows.map((row) => [row.camp, row.room, row.person, row.company, row.startDate, row.endDate, String(row.stayDays), row.roomState, row.cleaningState]),
    ]);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand"><div className="brand-mark">CM</div><div><strong>Camp Manager</strong><span>Accommodation Ops</span></div></div>
        <nav>
          <a href="#dashboard"><Hotel size={18} /> Dashboard</a>
          <a href="#planning"><CalendarDays size={18} /> Planning</a>
          <a href="#people"><Users size={18} /> People</a>
          <a href="#imports"><FileUp size={18} /> Importar</a>
          <a href="#stay-report"><ClipboardList size={18} /> Reporte</a>
          <a href="#security"><ShieldCheck size={18} /> Audit</a>
          <a href="/api/logout"><LogOut size={18} /> Logout</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><p className="eyebrow">Live operations</p><h1>Camp Accommodation Manager</h1></div><div className="topbar-actions"><span>{todayLabel()}</span><a href="/FINAL_AUDIT.md">Final audit</a></div></header>

        {error && <div className="import-box"><AlertTriangle /><p>{error}</p></div>}
        {loading && <div className="panel"><strong>Loading camp data...</strong></div>}

        <section className="hero-product" id="dashboard">
          <div><p className="eyebrow">Manual camp setup</p><h2>Create camps, load rooms, and assign people to rooms with persistent Supabase data.</h2></div>
          <div className="camp-switcher" aria-label="Select camp">
            {data.camps.length ? data.camps.map((camp) => <button className={camp.id === selectedCamp ? "active" : ""} key={camp.id} onClick={() => setSelectedCamp(camp.id)}>{camp.name}</button>) : <p className="login-copy">Create your first camp to start assigning rooms.</p>}
          </div>
        </section>

        <section className="metric-grid" aria-label="Operational summary">
          <article><Hotel /><span>Camps</span><strong>{data.camps.length}</strong></article>
          <article><BedDouble /><span>Habitaciones libres</span><strong>{availableRooms.length}</strong></article>
          <article><Users /><span>Sucias</span><strong>{dirtyRooms.length}</strong></article>
          <article><Building2 /><span>Occupancy</span><strong>{occupancy}%</strong></article>
        </section>

        <section className="content-grid">
          <article className="panel planning-panel" id="planning">
            <div className="panel-heading"><div><p className="eyebrow">Planning board</p><h3>{data.camps.find((camp) => camp.id === selectedCamp)?.name || "No camp selected"}</h3></div><span>{activeRooms.length} rooms</span></div>
            <div className="board">
              <div className="board-head"><span>Room</span>{nextSevenDays.map((day) => <span key={day}>{day}</span>)}</div>
              {activeRooms.map((room) => (
                <div className="board-row" key={room.id}>
                  <strong>{room.name}<small>{room.building} - {room.beds} beds</small></strong>
                  {nextSevenDays.map((day, index) => {
                    const isOccupied = data.assignments.some((assignment) => assignment.room_id === room.id && assignment.status !== "cancelled" && index >= 1 && index <= 4);
                    return <span className={room.status === "maintenance" ? "cell maintenance" : isOccupied ? "cell occupied" : "cell free"} key={day} />;
                  })}
                </div>
              ))}
            </div>
          </article>

          <aside className="panel action-panel">
            <div className="panel-heading"><div><p className="eyebrow">Create camp</p><h3>Campamento</h3></div><Plus /></div>
            <form onSubmit={createCamp}>
              <label>Camp name<input value={campName} onChange={(event) => setCampName(event.target.value)} placeholder="Campamento Norte" /></label>
              <label>Location<input value={campLocation} onChange={(event) => setCampLocation(event.target.value)} placeholder="Ubicacion" /></label>
              <label>Manager<input value={campManager} onChange={(event) => setCampManager(event.target.value)} placeholder="Responsable" /></label>
              <button className="primary" type="submit">Create camp</button>
            </form>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Rooms</p><h3>Manual room loading</h3></div><BedDouble /></div>
            <div className="table"><div className="table-head"><span>Room</span><span>Camp</span><span>Building</span><span>Beds</span></div>{data.rooms.map((room) => <div className="table-row" key={room.id}><strong>{room.name}</strong><span>{data.camps.find((camp) => camp.id === room.camp_id)?.name || "-"}</span><span>{room.building}</span><span>{room.beds}</span></div>)}</div>
          </article>
          <aside className="panel action-panel">
            <div className="panel-heading"><div><p className="eyebrow">Add room</p><h3>Habitacion</h3></div><Plus /></div>
            <form onSubmit={createRoom}>
              <label>Camp<select value={selectedCamp} onChange={(event) => setSelectedCamp(event.target.value)}>{data.camps.map((camp) => <option value={camp.id} key={camp.id}>{camp.name}</option>)}</select></label>
              <label>Room number/name<input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="101" /></label>
              <label>Building<input value={building} onChange={(event) => setBuilding(event.target.value)} placeholder="Block A" /></label>
              <label>Beds<input value={beds} min={1} type="number" onChange={(event) => setBeds(Number(event.target.value))} /></label>
              <button className="primary" type="submit" disabled={!selectedCamp}>Add room</button>
            </form>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel" id="people">
            <div className="panel-heading"><div><p className="eyebrow">People</p><h3>Lista de personas</h3></div><div className="search"><Search size={16} /><input aria-label="Search roster" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, trade" /></div></div>
            <div className="table"><div className="table-head"><span>Name</span><span>Company</span><span>Trade</span><span>Flight</span></div>{filteredPeople.map((person) => <div className="table-row" key={person.id}><strong>{person.name}</strong><span>{person.company}</span><span>{person.trade}</span><span>{person.flight}</span></div>)}</div>
          </article>
          <aside className="panel action-panel">
            <div className="panel-heading"><div><p className="eyebrow">Add person</p><h3>Persona</h3></div><Users /></div>
            <form onSubmit={addPerson}>
              <label>Name<input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Nombre completo" /></label>
              <label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Empresa" /></label>
              <label>Trade<input value={trade} onChange={(event) => setTrade(event.target.value)} placeholder="Oficio / rol" /></label>
              <label>Flight<input value={flight} onChange={(event) => setFlight(event.target.value)} placeholder="Opcional" /></label>
              <button className="primary" type="submit">Add person</button>
            </form>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Room assignments</p><h3>Reservas / asignaciones</h3></div><CheckCircle2 /></div>
            <div className="reservation-list">
              {data.assignments.map((assignment) => {
                const person = data.people.find((item) => item.id === assignment.person_id);
                const room = data.rooms.find((item) => item.id === assignment.room_id);
                return <div className="reservation-card" key={assignment.id}><div><strong>{person?.name || "Unknown"}</strong><span>{room?.name || "Room"} - {assignment.start_date} to {assignment.end_date}</span></div><div className="reservation-actions"><span className={`pill ${assignment.status}`}>{assignment.status}</span>{assignment.status === "planned" && <button onClick={() => updateAssignment(assignment.id, "checked-in")}>Check in</button>}{assignment.status === "checked-in" && <button onClick={() => updateAssignment(assignment.id, "checked-out")}><LogOut size={14} /> Check out</button>}{assignment.status !== "cancelled" && assignment.status !== "checked-out" && <button onClick={() => updateAssignment(assignment.id, "cancelled")}>Cancel</button>}</div></div>;
              })}
            </div>
          </article>
          <aside className="panel action-panel">
            <div className="panel-heading"><div><p className="eyebrow">Assign room</p><h3>Reserva</h3></div><Plus /></div>
            <label>Person<select value={selectedPerson} onChange={(event) => setSelectedPerson(event.target.value)}>{data.people.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label>
            <label>Available room<select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)}>{availableRooms.map((room) => <option value={room.id} key={room.id}>{room.name} - {room.beds} beds</option>)}</select></label>
            <button className="primary" onClick={createAssignment} disabled={!selectedPerson || !selectedRoom}>Assign room</button>
          </aside>
        </section>

        <section className="panel import-panel" id="imports">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Importacion automatica</p>
              <h3>Subir lista desde Excel o Google Sheets</h3>
            </div>
            <FileUp />
          </div>
          <div className="import-layout">
            <div className="import-help">
              <strong>Columnas requeridas</strong>
              <span>nombre</span>
              <span>empresa</span>
              <span>dia de entrada</span>
              <span>dia de salida</span>
            </div>
            <label className="file-upload">
              <input accept=".xlsx,.xls,.csv,.tsv" type="file" onChange={handleRosterImport} disabled={importing || !selectedCamp} />
              <span>{importing ? "Importando..." : "Seleccionar archivo"}</span>
            </label>
          </div>
          <p className="import-note">Desde Google Sheets usa Archivo, Descargar y luego Microsoft Excel (.xlsx) o Valores separados por comas (.csv).</p>
          {importStatus && <p className="import-result">{importStatus}</p>}
        </section>
        <section className="panel stay-report" id="stay-report">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reporte general</p>
              <h3>Estadia, ocupacion y limpieza</h3>
            </div>
            <button className="primary" onClick={exportStayReport}><Download size={16} /> Export CSV</button>
          </div>
          <div className="report-table">
            <div className="report-table-head">
              <span>Campamento</span>
              <span>Habitacion</span>
              <span>Persona</span>
              <span>Empresa</span>
              <span>Estadia</span>
              <span>Estado</span>
              <span>Limpieza</span>
            </div>
            {stayReportRows.map((row) => (
              <div className="report-table-row" key={row.id}>
                <span>{row.camp}</span>
                <strong>{row.room}</strong>
                <span>{row.person}</span>
                <span>{row.company}</span>
                <span>{row.stayDays ? `${row.startDate} - ${row.endDate} (${row.stayDays} dias)` : "Sin reserva"}</span>
                <span className={`status-chip ${row.roomState.toLowerCase()}`}>{row.roomState}</span>
                <span className={`status-chip ${row.cleaningState.toLowerCase()}`}>{row.cleaningState}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-grid">
          <article className="panel" id="reports"><div className="panel-heading"><div><p className="eyebrow">Reports</p><h3>Exports</h3></div><Download /></div><div className="report-grid"><button onClick={exportPeopleReport}><ClipboardList /> People CSV</button><button onClick={exportStayReport}><BedDouble /> Estadias CSV</button><button onClick={exportStayReport}><Users /> Habitaciones CSV</button></div></article>
          <article className="panel" id="security"><div className="panel-heading"><div><p className="eyebrow">Audit trail</p><h3>Recent activity</h3></div><ShieldCheck /></div><div className="audit-list">{data.auditLogs.map((event) => <div key={event.id}><time>{new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><strong>{event.action}</strong><span>{event.detail}</span></div>)}</div></article>
        </section>

        <footer><Wrench size={16} /> Data is now persisted in Supabase. Next milestone: stricter assignment overlap checks and role-specific screens.</footer>
      </section>
    </main>
  );
}








