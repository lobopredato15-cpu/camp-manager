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

  function exportReport() {
    const safeCell = (value: string) => {
      const escaped = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${escaped.replaceAll('"', '""')}"`;
    };
    const rows = [["Name", "Company", "Trade", "Flight"], ...data.people.map((person) => [person.name, person.company, person.trade, person.flight])];
    const csv = rows.map((row) => row.map(safeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "camp-people-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand"><div className="brand-mark">CM</div><div><strong>Camp Manager</strong><span>Accommodation Ops</span></div></div>
        <nav>
          <a href="#dashboard"><Hotel size={18} /> Dashboard</a>
          <a href="#planning"><CalendarDays size={18} /> Planning</a>
          <a href="#people"><Users size={18} /> People</a>
          <a href="#reports"><ClipboardList size={18} /> Reports</a>
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
          <article><BedDouble /><span>Total beds</span><strong>{totalBeds}</strong></article>
          <article><Users /><span>Checked in</span><strong>{checkedInCount}</strong></article>
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

        <section className="content-grid">
          <article className="panel" id="reports"><div className="panel-heading"><div><p className="eyebrow">Reports</p><h3>Exports</h3></div><Download /></div><div className="report-grid"><button onClick={exportReport}><ClipboardList /> People CSV</button><button onClick={exportReport}><BedDouble /> Occupancy CSV</button><button onClick={exportReport}><Users /> Assignments CSV</button></div></article>
          <article className="panel" id="security"><div className="panel-heading"><div><p className="eyebrow">Audit trail</p><h3>Recent activity</h3></div><ShieldCheck /></div><div className="audit-list">{data.auditLogs.map((event) => <div key={event.id}><time>{new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><strong>{event.action}</strong><span>{event.detail}</span></div>)}</div></article>
        </section>

        <footer><Wrench size={16} /> Data is now persisted in Supabase. Next milestone: stricter assignment overlap checks and role-specific screens.</footer>
      </section>
    </main>
  );
}
