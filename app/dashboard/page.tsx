"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
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
  Plane,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

type Camp = {
  id: string;
  name: string;
  location: string;
  manager: string;
};

type Room = {
  id: string;
  campId: string;
  building: string;
  name: string;
  beds: number;
  status: "available" | "maintenance" | "reserved";
};

type Person = {
  id: string;
  name: string;
  company: string;
  trade: string;
  flight: string;
};

type Reservation = {
  id: string;
  personId: string;
  roomId: string;
  start: string;
  end: string;
  status: "planned" | "checked-in" | "checked-out" | "cancelled";
};

type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  time: string;
};

const camps: Camp[] = [
  { id: "camp-north", name: "North Ridge Camp", location: "Pilbara Sector A", manager: "Mia Roberts" },
  { id: "camp-south", name: "South Gate Camp", location: "Pilbara Sector C", manager: "Owen Clark" },
];

const initialRooms: Room[] = [
  { id: "r-101", campId: "camp-north", building: "Block A", name: "A-101", beds: 2, status: "available" },
  { id: "r-102", campId: "camp-north", building: "Block A", name: "A-102", beds: 2, status: "reserved" },
  { id: "r-201", campId: "camp-north", building: "Block B", name: "B-201", beds: 4, status: "available" },
  { id: "r-301", campId: "camp-south", building: "Block C", name: "C-301", beds: 2, status: "maintenance" },
  { id: "r-302", campId: "camp-south", building: "Block C", name: "C-302", beds: 3, status: "available" },
];

const initialPeople: Person[] = [
  { id: "p-1", name: "Ava Thompson", company: "Karratha Mechanical", trade: "Mechanical fitter", flight: "QF1842" },
  { id: "p-2", name: "Noah Wilson", company: "Red Earth Civil", trade: "Electrician", flight: "VA1720" },
  { id: "p-3", name: "Sofia Martin", company: "BlueLine Services", trade: "Plumber", flight: "QF1850" },
  { id: "p-4", name: "Liam Carter", company: "OreWorks", trade: "Carpenter", flight: "VA1734" },
];

const initialReservations: Reservation[] = [
  { id: "a-1", personId: "p-1", roomId: "r-102", start: "2026-07-12", end: "2026-07-20", status: "checked-in" },
  { id: "a-2", personId: "p-2", roomId: "r-101", start: "2026-07-14", end: "2026-07-21", status: "planned" },
  { id: "a-3", personId: "p-3", roomId: "r-302", start: "2026-07-16", end: "2026-07-24", status: "planned" },
];

const initialAudit: AuditEvent[] = [
  { id: "log-1", action: "Import reviewed", detail: "4 people validated from roster sample", time: "09:12" },
  { id: "log-2", action: "Check-in completed", detail: "Ava Thompson assigned to A-102", time: "10:40" },
  { id: "log-3", action: "Maintenance flagged", detail: "Room C-301 unavailable", time: "11:05" },
];

const nextSevenDays = ["Jul 13", "Jul 14", "Jul 15", "Jul 16", "Jul 17", "Jul 18", "Jul 19"];

function todayLabel() {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export default function HomePage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [people, setPeople] = useState(initialPeople);
  const [reservations, setReservations] = useState(initialReservations);
  const [auditEvents, setAuditEvents] = useState(initialAudit);
  const [selectedCamp, setSelectedCamp] = useState(camps[0].id);
  const [query, setQuery] = useState("");
  const [personName, setPersonName] = useState("");
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");
  const [flight, setFlight] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(initialPeople[3].id);
  const [selectedRoom, setSelectedRoom] = useState(initialRooms[0].id);

  const activeRooms = rooms.filter((room) => room.campId === selectedCamp);
  const activeReservations = reservations.filter((reservation) => reservation.status !== "cancelled");
  const checkedInCount = reservations.filter((reservation) => reservation.status === "checked-in").length;
  const plannedCount = reservations.filter((reservation) => reservation.status === "planned").length;
  const totalBeds = rooms.reduce((sum, room) => sum + room.beds, 0);
  const usedBeds = activeReservations.length;
  const occupancy = Math.round((usedBeds / totalBeds) * 100);

  const availableRooms = rooms.filter((room) => room.status === "available");

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return people;
    return people.filter((person) =>
      [person.name, person.company, person.trade, person.flight].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [people, query]);

  function log(action: string, detail: string) {
    setAuditEvents((current) => [
      {
        id: `log-${Date.now()}`,
        action,
        detail,
        time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      },
      ...current,
    ]);
  }

  function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!personName || !company || !trade) return;
    const person: Person = {
      id: `p-${Date.now()}`,
      name: personName,
      company,
      trade,
      flight: flight || "Pending",
    };
    setPeople((current) => [person, ...current]);
    setSelectedPerson(person.id);
    setPersonName("");
    setCompany("");
    setTrade("");
    setFlight("");
    log("Person created", `${person.name} added for ${person.company}`);
  }

  function createReservation() {
    const person = people.find((item) => item.id === selectedPerson);
    const room = rooms.find((item) => item.id === selectedRoom);
    if (!person || !room || room.status !== "available") return;
    const reservation: Reservation = {
      id: `a-${Date.now()}`,
      personId: person.id,
      roomId: room.id,
      start: "2026-07-18",
      end: "2026-07-25",
      status: "planned",
    };
    setReservations((current) => [reservation, ...current]);
    setRooms((current) => current.map((item) => (item.id === room.id ? { ...item, status: "reserved" } : item)));
    log("Reservation created", `${person.name} reserved ${room.name}`);
  }

  function updateReservation(id: string, status: Reservation["status"]) {
    const reservation = reservations.find((item) => item.id === id);
    if (!reservation) return;
    const person = people.find((item) => item.id === reservation.personId);
    const room = rooms.find((item) => item.id === reservation.roomId);
    setReservations((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    if (status === "checked-out" || status === "cancelled") {
      setRooms((current) => current.map((item) => (item.id === reservation.roomId ? { ...item, status: "available" } : item)));
    }
    log(status === "checked-in" ? "Check-in completed" : status === "checked-out" ? "Check-out completed" : "Reservation cancelled", `${person?.name ?? "Guest"} - ${room?.name ?? "Room"}`);
  }

  function importRoster() {
    const importedPerson: Person = {
      id: `p-${Date.now()}`,
      name: "Emma Davis",
      company: "West Coast Energy",
      trade: "Instrumentation tech",
      flight: "QF1888",
    };
    setPeople((current) => [importedPerson, ...current]);
    log("Roster imported", "1 valid row imported, 0 blocking errors");
  }

  function exportReport() {
    const safeCell = (value: string) => {
      const escaped = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${escaped.replaceAll('"', '""')}"`;
    };
    const rows = [
      ["Name", "Company", "Trade", "Flight"],
      ...people.map((person) => [person.name, person.company, person.trade, person.flight]),
    ];
    const csv = rows.map((row) => row.map(safeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "camp-people-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    log("Report exported", "People report downloaded as CSV");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">CM</div>
          <div>
            <strong>Camp Manager</strong>
            <span>Accommodation Ops</span>
          </div>
        </div>
        <nav>
          <a href="#dashboard"><Hotel size={18} /> Dashboard</a>
          <a href="#planning"><CalendarDays size={18} /> Planning</a>
          <a href="#people"><Users size={18} /> People</a>
          <a href="#imports"><FileUp size={18} /> Imports</a>
          <a href="#reports"><ClipboardList size={18} /> Reports</a>
          <a href="#security"><ShieldCheck size={18} /> Audit</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live operations prototype</p>
            <h1>Camp Accommodation Manager</h1>
          </div>
          <div className="topbar-actions">
            <span>{todayLabel()}</span>
            <a href="/FINAL_AUDIT.md">Final audit</a>
          </div>
        </header>

        <section className="hero-product" id="dashboard">
          <div>
            <p className="eyebrow">Multi-camp allocation control</p>
            <h2>Plan rooms, arrivals, check-ins, and capacity from one working board.</h2>
          </div>
          <div className="camp-switcher" aria-label="Select camp">
            {camps.map((camp) => (
              <button className={camp.id === selectedCamp ? "active" : ""} key={camp.id} onClick={() => setSelectedCamp(camp.id)}>
                {camp.name}
              </button>
            ))}
          </div>
        </section>

        <section className="metric-grid" aria-label="Operational summary">
          <article>
            <BedDouble />
            <span>Total beds</span>
            <strong>{totalBeds}</strong>
          </article>
          <article>
            <Users />
            <span>Checked in</span>
            <strong>{checkedInCount}</strong>
          </article>
          <article>
            <Plane />
            <span>Planned arrivals</span>
            <strong>{plannedCount}</strong>
          </article>
          <article>
            <Building2 />
            <span>Occupancy</span>
            <strong>{occupancy}%</strong>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel planning-panel" id="planning">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Planning board</p>
                <h3>{camps.find((camp) => camp.id === selectedCamp)?.name}</h3>
              </div>
              <span>{activeRooms.length} rooms</span>
            </div>
            <div className="board">
              <div className="board-head">
                <span>Room</span>
                {nextSevenDays.map((day) => <span key={day}>{day}</span>)}
              </div>
              {activeRooms.map((room) => (
                <div className="board-row" key={room.id}>
                  <strong>{room.name}<small>{room.building} - {room.beds} beds</small></strong>
                  {nextSevenDays.map((day, index) => {
                    const isOccupied = reservations.some((reservation) => reservation.roomId === room.id && reservation.status !== "cancelled" && index >= 1 && index <= 4);
                    return <span className={room.status === "maintenance" ? "cell maintenance" : isOccupied ? "cell occupied" : "cell free"} key={day} />;
                  })}
                </div>
              ))}
            </div>
          </article>

          <aside className="panel action-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Quick assignment</p>
                <h3>Create reservation</h3>
              </div>
              <Plus />
            </div>
            <label>
              Person
              <select value={selectedPerson} onChange={(event) => setSelectedPerson(event.target.value)}>
                {people.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
              </select>
            </label>
            <label>
              Available room
              <select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)}>
                {availableRooms.map((room) => <option value={room.id} key={room.id}>{room.name} - {room.beds} beds</option>)}
              </select>
            </label>
            <button className="primary" onClick={createReservation} disabled={!availableRooms.length}>Reserve room</button>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel" id="people">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">People and companies</p>
                <h3>Workforce roster</h3>
              </div>
              <div className="search">
                <Search size={16} />
                <input aria-label="Search roster" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, trade" />
              </div>
            </div>
            <div className="table">
              <div className="table-head">
                <span>Name</span>
                <span>Company</span>
                <span>Trade</span>
                <span>Flight</span>
              </div>
              {filteredPeople.map((person) => (
                <div className="table-row" key={person.id}>
                  <strong>{person.name}</strong>
                  <span>{person.company}</span>
                  <span>{person.trade}</span>
                  <span>{person.flight}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel action-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Fast create</p>
                <h3>Add person</h3>
              </div>
              <Users />
            </div>
            <form onSubmit={addPerson}>
              <label>Name<input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Full name" /></label>
              <label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" /></label>
              <label>Trade<input value={trade} onChange={(event) => setTrade(event.target.value)} placeholder="Role or trade" /></label>
              <label>Flight<input value={flight} onChange={(event) => setFlight(event.target.value)} placeholder="Optional" /></label>
              <button className="primary" type="submit">Add to roster</button>
            </form>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Reservations</p>
                <h3>Current assignments</h3>
              </div>
              <CheckCircle2 />
            </div>
            <div className="reservation-list">
              {reservations.map((reservation) => {
                const person = people.find((item) => item.id === reservation.personId);
                const room = rooms.find((item) => item.id === reservation.roomId);
                return (
                  <div className="reservation-card" key={reservation.id}>
                    <div>
                      <strong>{person?.name}</strong>
                      <span>{room?.name} - {reservation.start} to {reservation.end}</span>
                    </div>
                    <div className="reservation-actions">
                      <span className={`pill ${reservation.status}`}>{reservation.status}</span>
                      {reservation.status === "planned" && <button onClick={() => updateReservation(reservation.id, "checked-in")}>Check in</button>}
                      {reservation.status === "checked-in" && <button onClick={() => updateReservation(reservation.id, "checked-out")}><LogOut size={14} /> Check out</button>}
                      {reservation.status !== "cancelled" && reservation.status !== "checked-out" && <button onClick={() => updateReservation(reservation.id, "cancelled")}>Cancel</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="panel action-panel" id="imports">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Imports</p>
                <h3>Roster intake</h3>
              </div>
              <FileUp />
            </div>
            <div className="import-box">
              <AlertTriangle />
              <p>CSV/XLSX validation will reject empty names, unknown companies, duplicate active bookings, and unsafe spreadsheet formulas.</p>
            </div>
            <button className="primary" onClick={importRoster}>Run sample import</button>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel" id="reports">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Reports</p>
                <h3>Operational exports</h3>
              </div>
              <Download />
            </div>
            <div className="report-grid">
              <button onClick={exportReport}><ClipboardList /> People CSV</button>
              <button onClick={exportReport}><BedDouble /> Occupancy CSV</button>
              <button onClick={exportReport}><Plane /> Arrivals CSV</button>
            </div>
          </article>

          <article className="panel" id="security">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Audit trail</p>
                <h3>Recent activity</h3>
              </div>
              <ShieldCheck />
            </div>
            <div className="audit-list">
              {auditEvents.map((event) => (
                <div key={event.id}>
                  <time>{event.time}</time>
                  <strong>{event.action}</strong>
                  <span>{event.detail}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer>
          <Wrench size={16} />
          MVP front-end is live. Supabase schema, RLS, authentication, and server-side enforcement are the next production milestones.
        </footer>
      </section>
    </main>
  );
}
