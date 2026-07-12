import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, CalendarDays, Users, Building2, Search, Plus, X,
  Pencil, Trash2, Eye, CheckCircle2, Clock3, AlertTriangle, Phone,
  MapPin, ChevronLeft, ChevronRight, Sun, Moon, MessageCircle, Navigation2,
  Wrench, Signal, ClipboardList, Filter, ArrowUpRight, Sparkles, CalendarClock
} from "lucide-react";

/* ---------------------------------- tokens --------------------------------- */
const C = {
  ink: "#0B1220",
  inkSoft: "#141E33",
  paper: "#F6F7FA",
  card: "#FFFFFF",
  accent: "#0EA5A0",
  accentBright: "#22D3C4",
  scheduled: "#3B6EF6",
  confirmed: "#5B6EF5",
  inprogress: "#F5A524",
  completed: "#2FAE79",
  cancelled: "#E14F60",
  noshow: "#8A94A6",
  ink600: "#334155",
};

const STATUS_META = {
  Scheduled: { color: C.scheduled, bg: "#EAF0FE" },
  Confirmed: { color: C.confirmed, bg: "#ECEBFE" },
  "In Progress": { color: C.inprogress, bg: "#FEF3E0" },
  Completed: { color: C.completed, bg: "#E4F6EC" },
  Cancelled: { color: C.cancelled, bg: "#FCE9EB" },
  "No Show": { color: C.noshow, bg: "#EEF0F3" },
};

const PRIORITY_META = {
  Low: "#8A94A6",
  Normal: C.scheduled,
  High: C.inprogress,
  Urgent: C.cancelled,
};

const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date(2026, 6, 12); // Sun Jul 12 2026
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const todayStr = fmtDate(today);

/* --------------------------------- seed data -------------------------------- */
const seedBuildings = [];
const seedTechs = [];

const svcTypes = ["New Installation", "Repair", "Relocation", "Upgrade"];
const seedPlans = [
  { id: "p1", name: "Fiber 100 Mbps" },
  { id: "p2", name: "Fiber 300 Mbps" },
  { id: "p3", name: "Fiber 500 Mbps" },
  { id: "p4", name: "Fiber 1 Gbps" },
];

let seedAppointments = [];

/* ---------------------------------- helpers --------------------------------- */
function buildingName(id, buildings) { return buildings.find((b) => b.id === id)?.name || "—"; }
function techName(id, techs) { return techs.find((t) => t.id === id)?.name || "Unassigned"; }

function Badge({ label, color, bg }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color, backgroundColor: bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, accent, sub }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-800">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: accent + "1A" }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

/* ============================== MAIN APPLICATION ============================= */
export default function FiberDispatch() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("dashboard");
  const [appointments, setAppointments] = useState(seedAppointments);
  const [buildings, setBuildings] = useState(seedBuildings);
  const [techs, setTechs] = useState(seedTechs);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [buildingFilter, setBuildingFilter] = useState("All");
  const [techFilter, setTechFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [calSelected, setCalSelected] = useState(todayStr);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [showTechForm, setShowTechForm] = useState(false);
  const [plans, setPlans] = useState(seedPlans);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(null);
  const [confirmDeleteBuilding, setConfirmDeleteBuilding] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const stats = useMemo(() => ({
    today: appointments.filter((a) => a.date === todayStr).length,
    pending: appointments.filter((a) => ["Scheduled", "Confirmed"].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  }), [appointments]);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => statusFilter === "All" || a.status === statusFilter)
      .filter((a) => buildingFilter === "All" || a.building === buildingFilter)
      .filter((a) => techFilter === "All" || a.tech === techFilter)
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [a.customer, buildingName(a.building, buildings), a.tower, a.unit, a.phone, techName(a.tech, techs)]
          .join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [appointments, statusFilter, buildingFilter, techFilter, search, buildings, techs]);

  const upcoming = useMemo(() => appointments
    .filter((a) => a.date >= todayStr && !["Cancelled", "Completed"].includes(a.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 6), [appointments]);

  const overdue = appointments.filter((a) => a.date < todayStr && ["Scheduled", "Confirmed"].includes(a.status));
  const tomorrowJobs = appointments.filter((a) => a.date === fmtDate(addDays(today, 1)));

  function upsertAppointment(payload) {
    if (payload.id) {
      setAppointments((prev) => prev.map((a) => (a.id === payload.id ? payload : a)));
      showToast("Schedule updated");
    } else {
      const jo = "JO-" + (10240 + appointments.length + 1);
      setAppointments((prev) => [...prev, { ...payload, id: "a" + Date.now(), jo }]);
      showToast("Schedule created");
    }
    setShowForm(false);
    setEditing(null);
  }

  function setStatus(id, status) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    showToast(`Marked as ${status}`);
  }

  function rescheduleAppointment(id, { date, time, tech }) {
    setAppointments((prev) => prev.map((a) => (a.id === id
      ? { ...a, date, time, tech, status: ["Cancelled", "No Show"].includes(a.status) ? "Scheduled" : a.status }
      : a)));
    setRescheduling(null);
    showToast("Appointment rescheduled");
  }

  function removeAppointment(id) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
    showToast("Schedule deleted");
  }

  const bg = dark ? "#0B1220" : C.paper;
  const textMain = dark ? "text-slate-100" : "text-slate-800";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "schedules", label: "Schedules", icon: ClipboardList },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "technicians", label: "Technicians", icon: Wrench },
    { id: "buildings", label: "Buildings", icon: Building2 },
    { id: "plans", label: "Internet Plans", icon: Signal },
  ];

  return (
    <div className={`flex h-full min-h-[720px] w-full ${textMain}`} style={{ backgroundColor: bg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col justify-between px-4 py-6" style={{ backgroundColor: C.ink }}>
        <div>
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="rounded-lg p-2" style={{ backgroundColor: C.accent + "26" }}>
              <Signal size={18} style={{ color: C.accentBright }} />
            </div>
            <div>
              <p className="text-white font-semibold leading-none text-sm">FiberDispatch</p>
              <p className="text-[11px] text-slate-400 mt-1">Field Ops Console</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
                  style={{
                    backgroundColor: active ? C.accent + "22" : "transparent",
                    color: active ? C.accentBright : "#B9C2D4",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="px-2">
          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: C.inkSoft, color: "#8A94A6" }}>
            <p className="flex items-center gap-1.5 text-slate-300 font-medium mb-1"><Sparkles size={12} style={{ color: C.accentBright }} /> Signal check</p>
            {techs.filter((t) => t.status === "Available").length} technicians available today
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: dark ? "#1E293B" : "#E7E9EE", backgroundColor: dark ? "#0F172A" : "#fff" }}>
          <div>
            <h1 className="text-lg font-semibold capitalize">{view === "dashboard" ? "Dashboard" : view}</h1>
            <p className="text-xs text-slate-400">{today.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDark((d) => !d)} className="rounded-lg p-2 border" style={{ borderColor: dark ? "#1E293B" : "#E7E9EE" }}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white shadow-sm"
              style={{ backgroundColor: C.accent }}
            >
              <Plus size={15} /> New Schedule
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Mobile nav */}
          <div className="flex md:hidden gap-2 mb-5 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setView(item.id)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border"
                style={{ backgroundColor: view === item.id ? C.accent : "transparent", color: view === item.id ? "#fff" : "#64748B", borderColor: "#E2E8F0" }}>
                {item.label}
              </button>
            ))}
          </div>

          {view === "dashboard" && (
            <DashboardView
              stats={stats} upcoming={upcoming} overdue={overdue} tomorrowJobs={tomorrowJobs}
              buildings={buildings} techs={techs} appointments={appointments}
              dark={dark} onOpen={(a) => setDetail(a)}
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              buildingFilter={buildingFilter} setBuildingFilter={setBuildingFilter}
              techFilter={techFilter} setTechFilter={setTechFilter}
              filtered={filtered}
              onEdit={(a) => { setEditing(a); setShowForm(true); }}
              onDelete={(a) => setConfirmDelete(a)}
              onComplete={(a) => setStatus(a.id, "Completed")}
              onReschedule={(a) => setRescheduling(a)}
            />
          )}

          {view === "schedules" && (
            <SchedulesView
              filtered={filtered} buildings={buildings} techs={techs} dark={dark}
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              buildingFilter={buildingFilter} setBuildingFilter={setBuildingFilter}
              techFilter={techFilter} setTechFilter={setTechFilter}
              onOpen={(a) => setDetail(a)}
              onEdit={(a) => { setEditing(a); setShowForm(true); }}
              onDelete={(a) => setConfirmDelete(a)}
              onComplete={(a) => setStatus(a.id, "Completed")}
              onReschedule={(a) => setRescheduling(a)}
            />
          )}

          {view === "calendar" && (
            <CalendarView
              appointments={appointments} calMonth={calMonth} setCalMonth={setCalMonth}
              calSelected={calSelected} setCalSelected={setCalSelected}
              buildings={buildings} techs={techs} dark={dark} onOpen={(a) => setDetail(a)}
            />
          )}

          {view === "technicians" && (
            <TechniciansView techs={techs} appointments={appointments} dark={dark}
              onAdd={() => setShowTechForm(true)}
              onCycleStatus={(id) => setTechs((prev) => prev.map((t) => t.id === id
                ? { ...t, status: t.status === "Available" ? "Busy" : t.status === "Busy" ? "Off" : "Available" } : t))}
            />
          )}

          {view === "buildings" && (
            <BuildingsView buildings={buildings} appointments={appointments} dark={dark}
              onAdd={() => { setEditingBuilding(null); setShowBuildingForm(true); }}
              onEdit={(b) => { setEditingBuilding(b); setShowBuildingForm(true); }}
              onDelete={(b) => setConfirmDeleteBuilding(b)}
            />
          )}

          {view === "plans" && (
            <PlansView plans={plans} appointments={appointments} dark={dark}
              onAdd={() => { setEditingPlan(null); setShowPlanForm(true); }}
              onEdit={(p) => { setEditingPlan(p); setShowPlanForm(true); }}
              onDelete={(p) => setConfirmDeletePlan(p)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showForm && (
        <ScheduleFormModal
          initial={editing} buildings={buildings} techs={techs} plans={plans}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={upsertAppointment}
        />
      )}
      {detail && (
        <DetailModal appointment={detail} buildings={buildings} techs={techs}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); setShowForm(true); }}
          onComplete={() => { setStatus(detail.id, "Completed"); setDetail(null); }}
          onCancel={() => { setStatus(detail.id, "Cancelled"); setDetail(null); }}
          onReschedule={() => { setRescheduling(detail); setDetail(null); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this schedule?"
          body={`This will permanently remove ${confirmDelete.customer}'s appointment. This can't be undone.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeAppointment(confirmDelete.id)}
        />
      )}
      {showBuildingForm && (
        <BuildingFormModal initial={editingBuilding}
          onClose={() => { setShowBuildingForm(false); setEditingBuilding(null); }}
          onSave={(b) => {
            if (b.id) {
              setBuildings((p) => p.map((x) => (x.id === b.id ? b : x)));
              showToast("Building updated");
            } else {
              setBuildings((p) => [...p, { ...b, id: "b" + Date.now() }]);
              showToast("Building added");
            }
            setShowBuildingForm(false);
            setEditingBuilding(null);
          }}
        />
      )}
      {confirmDeleteBuilding && (
        <ConfirmDialog
          title="Delete this building?"
          body={`This will remove ${confirmDeleteBuilding.name} from your building list. Existing appointments will keep showing it as an unlinked reference.`}
          onCancel={() => setConfirmDeleteBuilding(null)}
          onConfirm={() => {
            setBuildings((p) => p.filter((x) => x.id !== confirmDeleteBuilding.id));
            setConfirmDeleteBuilding(null);
            showToast("Building deleted");
          }}
        />
      )}
      {showTechForm && (
        <TechFormModal onClose={() => setShowTechForm(false)}
          onSave={(t) => { setTechs((p) => [...p, { ...t, id: "t" + Date.now() }]); setShowTechForm(false); showToast("Technician added"); }}
        />
      )}
      {showPlanForm && (
        <PlanFormModal initial={editingPlan}
          onClose={() => { setShowPlanForm(false); setEditingPlan(null); }}
          onSave={(p) => {
            if (p.id) {
              setPlans((prev) => prev.map((x) => (x.id === p.id ? p : x)));
              showToast("Plan updated");
            } else {
              setPlans((prev) => [...prev, { ...p, id: "p" + Date.now() }]);
              showToast("Plan added");
            }
            setShowPlanForm(false);
            setEditingPlan(null);
          }}
        />
      )}
      {confirmDeletePlan && (
        <ConfirmDialog
          title="Delete this plan?"
          body={`This will remove ${confirmDeletePlan.name} from the plan list. Existing appointments keep their recorded plan name.`}
          onCancel={() => setConfirmDeletePlan(null)}
          onConfirm={() => {
            setPlans((prev) => prev.filter((x) => x.id !== confirmDeletePlan.id));
            setConfirmDeletePlan(null);
            showToast("Plan deleted");
          }}
        />
      )}
      {rescheduling && (
        <RescheduleModal appointment={rescheduling} techs={techs}
          onClose={() => setRescheduling(null)}
          onSave={(payload) => rescheduleAppointment(rescheduling.id, payload)}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg" style={{ backgroundColor: C.ink }}>
          <CheckCircle2 size={16} style={{ color: C.accentBright }} /> {toast}
        </div>
      )}
    </div>
  );
}

/* ============================== DASHBOARD VIEW =============================== */
function DashboardView(props) {
  const { stats, upcoming, overdue, tomorrowJobs, buildings, techs, dark, onOpen, onEdit, onDelete, onComplete, onReschedule,
    search, setSearch, statusFilter, setStatusFilter, buildingFilter, setBuildingFilter, techFilter, setTechFilter, filtered } = props;

  const week = Array.from({ length: 7 }, (_, i) => addDays(addDays(today, -3), i));
  const weekCounts = week.map((d) => props.appointments.filter((a) => a.date === fmtDate(d)).length);
  const maxCount = Math.max(1, ...weekCounts);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Installations" value={stats.today} icon={CalendarDays} accent={C.scheduled} />
        <StatCard label="Pending" value={stats.pending} icon={Clock3} accent={C.inprogress} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent={C.completed} />
        <StatCard label="Cancelled" value={stats.cancelled} icon={X} accent={C.cancelled} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-700">Installations this week</h3>
            <span className="text-xs text-slate-400">Mon–Sun</span>
          </div>
          <div className="flex items-end gap-3 h-32">
            {week.map((d, i) => {
              const h = (weekCounts[i] / maxCount) * 100;
              const isToday = fmtDate(d) === todayStr;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-md flex items-end justify-center" style={{ height: "96px" }}>
                    <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(h, 6)}%`, backgroundColor: isToday ? C.accent : "#CBD5E1" }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1.5"><AlertTriangle size={14} style={{ color: C.inprogress }} /> Notifications</h3>
          <div className="space-y-2.5 text-sm">
            {overdue.length > 0 && (
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "#FCE9EB" }}>
                <p className="font-medium" style={{ color: C.cancelled }}>{overdue.length} overdue job{overdue.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-500">Past date, still open</p>
              </div>
            )}
            {tomorrowJobs.length > 0 && (
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "#EAF0FE" }}>
                <p className="font-medium" style={{ color: C.scheduled }}>{tomorrowJobs.length} install{tomorrowJobs.length > 1 ? "s" : ""} tomorrow</p>
                <p className="text-xs text-slate-500">Confirm technician assignments</p>
              </div>
            )}
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "#FCE9EB" }}>
              <p className="font-medium" style={{ color: C.cancelled }}>{stats.cancelled} cancelled this period</p>
            </div>
            {overdue.length === 0 && tomorrowJobs.length === 0 && (
              <p className="text-slate-400 text-xs">You're all caught up.</p>
            )}
          </div>
        </div>
      </div>

      <FilterBar {...{ search, setSearch, statusFilter, setStatusFilter, buildingFilter, setBuildingFilter, techFilter, setTechFilter, buildings, techs }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-700">Schedule</h3>
            <span className="text-xs text-slate-400">{filtered.length} results</span>
          </div>
          <ScheduleTable rows={filtered.slice(0, 8)} buildings={buildings} techs={techs} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} onReschedule={onReschedule} compact />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-sm text-slate-700 mb-3">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <button key={a.id} onClick={() => onOpen(a)} className="w-full text-left rounded-lg border border-slate-100 hover:border-slate-200 px-3 py-2.5 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{a.customer}</p>
                  <Badge label={a.status} color={STATUS_META[a.status].color} bg={STATUS_META[a.status].bg} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{a.date} · {a.time} · {buildingName(a.building, buildings)}</p>
              </button>
            ))}
            {upcoming.length === 0 && <p className="text-xs text-slate-400">Nothing scheduled ahead.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBar({ search, setSearch, statusFilter, setStatusFilter, buildingFilter, setBuildingFilter, techFilter, setTechFilter, buildings, techs }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 flex-1 min-w-[200px]">
        <Search size={15} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, building, unit, contact..."
          className="w-full text-sm outline-none placeholder:text-slate-400" />
      </div>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600">
        <option>All</option>
        {Object.keys(STATUS_META).map((s) => <option key={s}>{s}</option>)}
      </select>
      <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600">
        <option value="All">All buildings</option>
        {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600">
        <option value="All">All technicians</option>
        {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  );
}

/* ============================== SCHEDULES VIEW =============================== */
function SchedulesView(props) {
  const { filtered, buildings, techs, onOpen, onEdit, onDelete, onComplete, onReschedule } = props;
  return (
    <div className="space-y-5">
      <FilterBar {...props} />
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <ScheduleTable rows={filtered} buildings={buildings} techs={techs} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} onReschedule={onReschedule} />
      </div>
    </div>
  );
}

function ScheduleTable({ rows, buildings, techs, onOpen, onEdit, onDelete, onComplete, onReschedule, compact }) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <ClipboardList size={28} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">No appointments match these filters.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Date / Time</th>
            <th className="px-5 py-3 font-medium">Customer</th>
            {!compact && <th className="px-5 py-3 font-medium">Building / Floor / Unit</th>}
            {!compact && <th className="px-5 py-3 font-medium">Technician</th>}
            {!compact && <th className="px-5 py-3 font-medium">Contact</th>}
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
              <td className="px-5 py-3 whitespace-nowrap">
                <p className="font-medium text-slate-700">{a.date}</p>
                <p className="text-xs text-slate-400">{a.time}</p>
              </td>
              <td className="px-5 py-3">
                <p className="font-medium text-slate-700">{a.customer}</p>
                <p className="text-xs text-slate-400">{a.service}</p>
              </td>
              {!compact && <td className="px-5 py-3 text-slate-600">{buildingName(a.building, buildings)} · Floor {a.floor || "—"} · Unit {a.unit}</td>}
              {!compact && <td className="px-5 py-3 text-slate-600">{techName(a.tech, techs)}</td>}
              {!compact && <td className="px-5 py-3 text-slate-600">{a.phone}</td>}
              <td className="px-5 py-3"><Badge label={a.status} color={STATUS_META[a.status].color} bg={STATUS_META[a.status].bg} /></td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <IconBtn onClick={() => onOpen(a)} title="View"><Eye size={14} /></IconBtn>
                  <IconBtn onClick={() => onReschedule(a)} title="Reschedule"><CalendarClock size={14} /></IconBtn>
                  <IconBtn onClick={() => onEdit(a)} title="Edit"><Pencil size={14} /></IconBtn>
                  <IconBtn onClick={() => onComplete(a)} title="Mark completed"><CheckCircle2 size={14} /></IconBtn>
                  <IconBtn onClick={() => onDelete(a)} title="Delete" danger><Trash2 size={14} /></IconBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title}
      className="rounded-md p-1.5 border border-transparent hover:border-slate-200 hover:bg-white transition-colors"
      style={{ color: danger ? C.cancelled : "#64748B" }}>
      {children}
    </button>
  );
}

/* =============================== CALENDAR VIEW ================================ */
function CalendarView({ appointments, calMonth, setCalMonth, calSelected, setCalSelected, buildings, techs, onOpen }) {
  const year = calMonth.getFullYear(), month = calMonth.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: startOffset }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const dayAppointments = (day) => {
    const ds = fmtDate(new Date(year, month, day));
    return appointments.filter((a) => a.date === ds);
  };
  const selectedApps = appointments.filter((a) => a.date === calSelected).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">{calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="rounded-md p-1.5 border border-slate-200"><ChevronLeft size={15} /></button>
            <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="rounded-md p-1.5 border border-slate-200"><ChevronRight size={15} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-slate-400 mb-1.5">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = fmtDate(new Date(year, month, day));
            const apps = dayAppointments(day);
            const isToday = ds === todayStr;
            const isSelected = ds === calSelected;
            return (
              <button key={i} onClick={() => setCalSelected(ds)}
                className="aspect-square rounded-lg border p-1.5 flex flex-col items-start text-left transition-colors"
                style={{
                  borderColor: isSelected ? C.accent : "#EEF0F3",
                  backgroundColor: isToday ? "#EAF0FE" : "transparent",
                }}>
                <span className="text-xs font-medium text-slate-600">{day}</span>
                <div className="flex flex-wrap gap-0.5 mt-auto">
                  {apps.slice(0, 4).map((a) => (
                    <span key={a.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_META[a.status].color }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-slate-400">
          {Object.entries(STATUS_META).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: v.color }} />{k}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-sm text-slate-700 mb-3">{calSelected}</h3>
        <div className="space-y-2.5">
          {selectedApps.map((a) => (
            <button key={a.id} onClick={() => onOpen(a)} className="w-full text-left rounded-lg border border-slate-100 hover:border-slate-200 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">{a.time} · {a.customer}</p>
                <Badge label={a.status} color={STATUS_META[a.status].color} bg={STATUS_META[a.status].bg} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{buildingName(a.building, buildings)} · {a.tower} · {a.unit}</p>
            </button>
          ))}
          {selectedApps.length === 0 && <p className="text-xs text-slate-400">No appointments this day.</p>}
        </div>
      </div>
    </div>
  );
}

/* ============================= TECHNICIANS VIEW =============================== */
function TechniciansView({ techs, appointments, onAdd, onCycleStatus }) {
  const statusColor = { Available: C.completed, Busy: C.inprogress, Off: "#8A94A6" };
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          <Plus size={15} /> Add Technician
        </button>
      </div>
      {techs.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center border border-slate-100">
          <Wrench size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No technicians yet. Add your first one to start assigning jobs.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {techs.map((t) => {
          const jobs = appointments.filter((a) => a.tech === t.id && !["Cancelled", "Completed"].includes(a.status));
          return (
            <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: C.ink }}>
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={11} />{t.phone}</p>
                  </div>
                </div>
                <button onClick={() => onCycleStatus(t.id)}>
                  <Badge label={t.status} color={statusColor[t.status]} bg={statusColor[t.status] + "1F"} />
                </button>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1.5">Assigned jobs ({jobs.length})</p>
                <div className="space-y-1">
                  {jobs.slice(0, 3).map((j) => <p key={j.id} className="text-xs text-slate-600">{j.date} · {j.customer}</p>)}
                  {jobs.length === 0 && <p className="text-xs text-slate-300">No active jobs</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== BUILDINGS VIEW ================================ */
function BuildingsView({ buildings, appointments, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          <Plus size={15} /> Add Building
        </button>
      </div>
      {buildings.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center border border-slate-100">
          <Building2 size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No buildings yet. Add one so it appears in the schedule form.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b) => {
          const count = appointments.filter((a) => a.building === b.id).length;
          return (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg p-2" style={{ backgroundColor: C.accent + "1A" }}><Building2 size={16} style={{ color: C.accent }} /></div>
                  <p className="font-medium text-slate-700 text-sm">{b.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <IconBtn onClick={() => onEdit(b)} title="Edit building"><Pencil size={14} /></IconBtn>
                  <IconBtn onClick={() => onDelete(b)} title="Delete building" danger><Trash2 size={14} /></IconBtn>
                </div>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mb-1"><MapPin size={11} />{b.address}</p>
              <p className="text-xs text-slate-500">{b.towers} tower{b.towers > 1 ? "s" : ""} · {count} job{count !== 1 ? "s" : ""} on record</p>
              {b.notes && <p className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2">{b.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================ PLANS VIEW =================================== */
function PlansView({ plans, appointments, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          <Plus size={15} /> Add Plan
        </button>
      </div>
      {plans.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center border border-slate-100">
          <Signal size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No internet plans yet. Add one so it appears in the schedule form.</p>
        </div>
      )}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        {plans.map((p, i) => {
          const count = appointments.filter((a) => a.plan === p.name).length;
          return (
            <div key={p.id} className={`flex items-center justify-between px-5 py-3.5 ${i !== plans.length - 1 ? "border-b border-slate-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2" style={{ backgroundColor: C.accent + "1A" }}><Signal size={14} style={{ color: C.accent }} /></div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.name}</p>
                  <p className="text-xs text-slate-400">{count} appointment{count !== 1 ? "s" : ""} using this plan</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconBtn onClick={() => onEdit(p)} title="Edit plan"><Pencil size={14} /></IconBtn>
                <IconBtn onClick={() => onDelete(p)} title="Delete plan" danger><Trash2 size={14} /></IconBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ SCHEDULE FORM MODAL ============================= */
function ScheduleFormModal({ initial, buildings, techs, plans, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    customer: "", phone: "", alt: "", email: "",
    building: buildings[0]?.id || "", tower: "", unit: "", floor: "", address: "",
    date: todayStr, time: "09:00", service: svcTypes[0], plan: plans[0]?.name || "", notes: "",
    tech: techs[0]?.id || "", priority: "Normal", status: "Scheduled",
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function submit() {
    const req = { customer: "Full name", phone: "Contact number", building: "Building", unit: "Unit number", date: "Date", time: "Time" };
    const errs = {};
    Object.entries(req).forEach(([k, label]) => { if (!f[k]) errs[k] = `${label} is required`; });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(f);
  }

  return (
    <ModalShell onClose={onClose} title={initial ? "Edit Schedule" : "New Schedule"} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Customer Information">
          <Field label="Full Name" error={errors.customer}><input value={f.customer} onChange={set("customer")} className={inputCls(errors.customer)} /></Field>
          <Field label="Contact Number" error={errors.phone}><input value={f.phone} onChange={set("phone")} className={inputCls(errors.phone)} /></Field>
          <Field label="Alternate Contact (optional)"><input value={f.alt} onChange={set("alt")} className={inputCls()} /></Field>
          <Field label="Email (optional)"><input value={f.email} onChange={set("email")} className={inputCls()} /></Field>
        </Section>
        <Section title="Location">
          <Field label="Condominium Building" error={errors.building}>
            <select value={f.building} onChange={set("building")} className={inputCls(errors.building)}>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Tower"><input value={f.tower} onChange={set("tower")} className={inputCls()} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Floor"><input value={f.floor} onChange={set("floor")} className={inputCls()} /></Field>
            <Field label="Unit Number" error={errors.unit}><input value={f.unit} onChange={set("unit")} className={inputCls(errors.unit)} /></Field>
          </div>
          <Field label="Complete Address"><input value={f.address} onChange={set("address")} className={inputCls()} /></Field>
        </Section>
        <Section title="Installation Details">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" error={errors.date}><input type="date" value={f.date} onChange={set("date")} className={inputCls(errors.date)} /></Field>
            <Field label="Time" error={errors.time}><input type="time" value={f.time} onChange={set("time")} className={inputCls(errors.time)} /></Field>
          </div>
          <Field label="Service Type">
            <select value={f.service} onChange={set("service")} className={inputCls()}>{svcTypes.map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
          <Field label="Internet Plan">
            <select value={f.plan} onChange={set("plan")} className={inputCls()}>{plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
          </Field>
          <Field label="Notes"><textarea value={f.notes} onChange={set("notes")} rows={2} className={inputCls()} /></Field>
        </Section>
        <Section title="Assignment & Status">
          <Field label="Assigned Technician">
            <select value={f.tech} onChange={set("tech")} className={inputCls()}>{techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          </Field>
          <Field label="Priority">
            <select value={f.priority} onChange={set("priority")} className={inputCls()}>{Object.keys(PRIORITY_META).map((p) => <option key={p}>{p}</option>)}</select>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={set("status")} className={inputCls()}>{Object.keys(STATUS_META).map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
        </Section>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 border border-slate-200">Cancel</button>
        <button onClick={submit} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          {initial ? "Save Changes" : "Create Schedule"}
        </button>
      </div>
    </ModalShell>
  );
}

function inputCls(err) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${err ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:ring-teal-100"}`;
}
function Section({ title, children }) {
  return <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>{children}</div>;
}
function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      {children}
      {error && <span className="block text-[11px] mt-1" style={{ color: C.cancelled }}>{error}</span>}
    </label>
  );
}

/* =============================== DETAIL MODAL ================================= */
function DetailModal({ appointment: a, buildings, techs, onClose, onEdit, onComplete, onCancel, onReschedule }) {
  const timeline = [
    { label: "Created", done: true },
    { label: "Confirmed", done: ["Confirmed", "In Progress", "Completed"].includes(a.status) },
    { label: "In Progress", done: ["In Progress", "Completed"].includes(a.status) },
    { label: "Completed", done: a.status === "Completed" },
  ];
  return (
    <ModalShell onClose={onClose} title={a.jo} subtitle={`${a.service} · ${a.plan}`}>
      <div className="flex items-center justify-between mb-4">
        <Badge label={a.status} color={STATUS_META[a.status].color} bg={STATUS_META[a.status].bg} />
        <Badge label={a.priority + " priority"} color={PRIORITY_META[a.priority]} bg={PRIORITY_META[a.priority] + "1A"} />
      </div>

      <Section title="Customer">
        <p className="text-sm font-medium text-slate-700">{a.customer}</p>
        <div className="flex flex-wrap gap-2 mt-1.5">
          <a href={`tel:${a.phone}`} className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border border-slate-200"><Phone size={11} />{a.phone}</a>
          <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border border-slate-200"><MessageCircle size={11} />WhatsApp</a>
        </div>
      </Section>

      <div className="h-4" />
      <Section title="Installation Address">
        <p className="text-sm text-slate-600">{buildingName(a.building, buildings)} · {a.tower} · Floor {a.floor} · Unit {a.unit}</p>
        <a className="inline-flex items-center gap-1 text-xs mt-1.5" style={{ color: C.accent }}
           href={`https://maps.google.com/?q=${encodeURIComponent(buildingName(a.building, buildings))}`} target="_blank" rel="noreferrer">
          <Navigation2 size={11} /> Open in Google Maps <ArrowUpRight size={11} />
        </a>
      </Section>

      <div className="h-4" />
      <Section title="Schedule">
        <p className="text-sm text-slate-600">{a.date} at {a.time} · Technician: {techName(a.tech, techs)}</p>
      </Section>

      {a.notes && (<><div className="h-4" /><Section title="Notes"><p className="text-sm text-slate-600">{a.notes}</p></Section></>)}

      <div className="h-4" />
      <Section title="Status Timeline">
        <div className="flex items-center gap-1 mt-1">
          {timeline.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex flex-col items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.done ? C.accent : "#E2E8F0" }} />
                <span className="text-[10px] text-slate-400">{s.label}</span>
              </div>
              {i < timeline.length - 1 && <div className="flex-1 h-px" style={{ backgroundColor: s.done ? C.accent : "#E2E8F0" }} />}
            </React.Fragment>
          ))}
        </div>
      </Section>

      <div className="flex flex-wrap justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={() => window.print()} className="rounded-lg px-4 py-2 text-sm text-slate-500 border border-slate-200">Print Job Order</button>
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm border" style={{ color: C.cancelled, borderColor: "#F3D3D8" }}>Cancel Appointment</button>
        <button onClick={onReschedule} className="rounded-lg px-4 py-2 text-sm text-slate-600 border border-slate-200 flex items-center gap-1.5"><CalendarClock size={14} />Reschedule</button>
        <button onClick={onEdit} className="rounded-lg px-4 py-2 text-sm text-slate-600 border border-slate-200">Edit</button>
        <button onClick={onComplete} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.completed }}>Complete Installation</button>
      </div>
    </ModalShell>
  );
}

/* ============================ SUPPORTING MODALS =============================== */
function BuildingFormModal({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial || { name: "", address: "", towers: 1, notes: "" });
  return (
    <ModalShell onClose={onClose} title={initial ? "Edit Building" : "Add Building"}>
      <div className="space-y-3">
        <Field label="Building Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls()} /></Field>
        <Field label="Address"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={inputCls()} /></Field>
        <Field label="Number of Towers"><input type="number" min={1} value={f.towers} onChange={(e) => setF({ ...f, towers: +e.target.value })} className={inputCls()} /></Field>
        <Field label="Notes"><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} className={inputCls()} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 border border-slate-200">Cancel</button>
        <button onClick={() => f.name && onSave(f)} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          {initial ? "Save Changes" : "Save Building"}
        </button>
      </div>
    </ModalShell>
  );
}

function PlanFormModal({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial || { name: "" });
  return (
    <ModalShell onClose={onClose} title={initial ? "Edit Internet Plan" : "Add Internet Plan"}>
      <div className="space-y-3">
        <Field label="Plan Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Fiber 300 Mbps" className={inputCls()} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 border border-slate-200">Cancel</button>
        <button onClick={() => f.name.trim() && onSave({ ...f, name: f.name.trim() })} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          {initial ? "Save Changes" : "Save Plan"}
        </button>
      </div>
    </ModalShell>
  );
}

function RescheduleModal({ appointment, techs, onClose, onSave }) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [tech, setTech] = useState(appointment.tech);
  return (
    <ModalShell onClose={onClose} title="Reschedule Appointment" subtitle={`${appointment.customer} · ${appointment.jo}`}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="New Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls()} /></Field>
          <Field label="New Time"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls()} /></Field>
        </div>
        <Field label="Technician">
          <select value={tech} onChange={(e) => setTech(e.target.value)} className={inputCls()}>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        {["Cancelled", "No Show"].includes(appointment.status) && (
          <p className="text-xs text-slate-400">This will reopen the appointment with status "Scheduled".</p>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 border border-slate-200">Cancel</button>
        <button onClick={() => date && time && onSave({ date, time, tech })} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>
          Confirm Reschedule
        </button>
      </div>
    </ModalShell>
  );
}

function TechFormModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: "", phone: "", status: "Available" });
  return (
    <ModalShell onClose={onClose} title="Add Technician">
      <div className="space-y-3">
        <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls()} /></Field>
        <Field label="Phone Number"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls()} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputCls()}>
            <option>Available</option><option>Busy</option><option>Off</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 border border-slate-200">Cancel</button>
        <button onClick={() => f.name && onSave(f)} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.accent }}>Save Technician</button>
      </div>
    </ModalShell>
  );
}

function ConfirmDialog({ title, body, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="font-semibold text-slate-800 mb-1.5">{title}</p>
        <p className="text-sm text-slate-500 mb-5">{body}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3.5 py-2 text-sm text-slate-500 border border-slate-200">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white" style={{ backgroundColor: C.cancelled }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ children, onClose, title, subtitle, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50"><X size={16} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
