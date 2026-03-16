import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import MotivationPage from './MotivationPage'

const SOCIAL_DATA = {
  facebook: [24540,9008,25158,12905,35026,38024,40928],
  instagram: [1815,1682,1408,1141,982,632,526],
  tiktok: [67,135,181,192,507,509,0],
  youtube: [716,537,655,608,1395,0,0],
  ads_spend: [22.31,25.77,22.80,22.34,17.69,2.45,0],
  ads_ctr: [4.67,4.93,5.13,4.67,5.03,4.54,0],
}
const DAYS = ['8م','9م','10م','11م','12م','13م','14م']

// Who can assign tasks
const CAN_ASSIGN = ['ibrahim@n8nar.com','mina@n8nar.com','engy@n8nar.com']

const TABS = [
  { id: 'overview', label: 'الرئيسية', icon: '🏠' },
  { id: 'weekly', label: 'التارجت الأسبوعي', icon: '📅' },
  { id: 'team', label: 'الفريق', icon: '👥' },
  { id: 'assign', label: 'إسناد مهام', icon: '⚡' },
  { id: 'social', label: 'السوشيال', icon: '📱' },
  { id: 'reports',    label: 'التقارير',    icon: '📋' },
  { id: 'mission',   label: 'Mission 1000', icon: '🔥' },
]

function MiniBar({ data, color = '#4A90D9', height = 40 }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: i === data.filter(x=>x>0).length-1 ? color : color + '55', borderRadius: '2px 2px 0 0', height: `${Math.max((v / max) * 100, 3)}%`, transition: 'height .5s ease' }} />
      ))}
    </div>
  )
}

export default function ManagerDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [reports, setReports] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [completions, setCompletions] = useState([])
  const [teamTargets, setTeamTargets] = useState([])
  const [weeklyTargets, setWeeklyTargets] = useState([])
  const [currentWeek, setCurrentWeek] = useState(null)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [assignedTasks, setAssignedTasks] = useState([])
  const [assigner, setAssigner] = useState(null)

  // Assign form state
  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aTo, setATo] = useState('')
  const [aDue, setADue] = useState('')
  const [aPriority, setAPriority] = useState('medium')
  const [aSaving, setASaving] = useState(false)
  const [aSaved, setASaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const canAssign = CAN_ASSIGN.includes(user.email)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: emps } = await supabase.from('employees').select('*')
    setEmployees(emps || [])
    const nonMgr = (emps || []).filter(e => !e.is_manager)

    const { data: reps } = await supabase.from('daily_reports').select('*, employees(name,role,color,avatar_initials)').eq('report_date', today)
    setReports(reps || [])

    const { data: tasks } = await supabase.from('tasks').select('*')
    setAllTasks(tasks || [])

    const repIds = (reps || []).map(r => r.id)
    if (repIds.length > 0) {
      const { data: comps } = await supabase.from('task_completions').select('*').in('report_id', repIds)
      setCompletions(comps || [])
    }

    const { data: tt } = await supabase.from('team_targets').select('*')
    setTeamTargets(tt || [])

    const { data: wt } = await supabase.from('weekly_targets').select('*').order('week_number')
    setWeeklyTargets(wt || [])

    const { data: cw } = await supabase.from('weekly_targets').select('*').lte('week_start', today).gte('week_end', today).single()
    setCurrentWeek(cw)

    const { data: at } = await supabase.from('assigned_tasks').select('*, assigned_to_emp:assigned_to(name,color,avatar_initials), assigned_by_emp:assigned_by(name)').order('created_at', { ascending: false })
    setAssignedTasks(at || [])

    const { data: me } = await supabase.from('employees').select('*').eq('email', user.email).single()
    setAssigner(me)
  }

  async function submitAssign(e) {
    e.preventDefault()
    if (!aTitle || !aTo || !assigner) return
    setASaving(true)
    await supabase.from('assigned_tasks').insert({
      title: aTitle, description: aDesc || null,
      assigned_to: aTo, assigned_by: assigner.id,
      due_date: aDue || null, priority: aPriority, status: 'pending'
    })
    setATitle(''); setADesc(''); setATo(''); setADue(''); setAPriority('medium')
    setASaving(false); setASaved(true)
    setTimeout(() => setASaved(false), 2500)
    loadAll()
  }

  async function deleteAssignedTask(id) {
    await supabase.from('assigned_tasks').delete().eq('id', id)
    setAssignedTasks(prev => prev.filter(t => t.id !== id))
  }

  function getEmpReport(empId) { return reports.find(r => r.employee_id === empId) }
  function getEmpTasks(empId) { return allTasks.filter(t => t.employee_id === empId) }
  function getEmpComps(empId) {
    const rep = getEmpReport(empId)
    if (!rep) return []
    return completions.filter(c => c.report_id === rep.id)
  }
  function getEmpPct(empId) {
    const t = getEmpTasks(empId); const c = getEmpComps(empId)
    return t.length > 0 ? Math.round(c.filter(x=>x.is_done).length / t.length * 100) : 0
  }

  const nonManagers = employees.filter(e => !e.is_manager)
  const salesTarget = teamTargets.find(t => t.metric_key === 'total_sales')
  const reachTarget = teamTargets.find(t => t.metric_key === 'total_reach')
  const salesPct = salesTarget ? Math.min(Math.round(salesTarget.current_value / salesTarget.target_value * 100), 100) : 0
  const reachPct = reachTarget ? Math.min(Math.round((reachTarget.current_value || 185000) / reachTarget.target_value * 100), 100) : 2
  const avgPct = nonManagers.length > 0 ? Math.round(nonManagers.reduce((s, e) => s + getEmpPct(e.id), 0) / nonManagers.length) : 0

  const wReachPct = currentWeek ? Math.min(Math.round((currentWeek.reach_actual / currentWeek.reach_target) * 100), 100) : 0
  const wSalesPct = currentWeek ? Math.min(Math.round((currentWeek.sales_actual / currentWeek.sales_target) * 100), 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1B3A6B,#4A90D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>إب</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{user.role} — لوحة المدير</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{new Date().toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'long' })}</div>
          <button onClick={loadAll} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', color: 'var(--blue)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>↻</button>
          <button onClick={onLogout} style={{ background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text3)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>خروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.filter(t => t.id !== 'assign' || canAssign).map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}
            style={{ padding: '10px 12px', borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent', borderRadius: 0, whiteSpace: 'nowrap', fontSize: 12 }}>
            {t.icon} {t.label}
            {t.id === 'assign' && assignedTasks.filter(x=>x.status==='pending').length > 0 && (
              <span style={{ background: '#E74C3C', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                {assignedTasks.filter(x=>x.status==='pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="fade-in">
            <div style={{ marginBottom: 14 }}>
              <div className="section-title">الهدف الكلي — 90 يوم</div>
              <div className="grid2">
                <div style={{ background: 'var(--bg1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>مبيعات الكورسات</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--green)' }}>{salesTarget?.current_value || 0}<span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / 1,000</span></div>
                  <div className="prog-bar" style={{ height: 8, margin: '10px 0 6px' }}><div className="prog-fill" style={{ width: salesPct + '%', background: 'var(--green)' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}><span>{salesPct}%</span><span>84 مبيعة/أسبوع · 11 مبيعة/يوم</span></div>
                </div>
                <div style={{ background: 'var(--bg1)', border: '0.5px solid rgba(74,144,217,.3)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>الـ Reach الكلي</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--blue)' }}>{Number(reachTarget?.current_value || 185000).toLocaleString()}<span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / 10M</span></div>
                  <div className="prog-bar" style={{ height: 8, margin: '10px 0 6px' }}><div className="prog-fill" style={{ width: reachPct + '%', background: 'var(--blue)' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}><span>{reachPct}%</span><span>833,333/أسبوع · 119,047/يوم</span></div>
                </div>
              </div>
            </div>

            {/* Current week banner */}
            {currentWeek && (
              <div style={{ background: 'linear-gradient(135deg, var(--bg2), var(--bg1))', border: '0.5px solid var(--border2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>الأسبوع {currentWeek.week_number} الحالي</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{currentWeek.week_start} — {currentWeek.week_end}</div>
                  </div>
                  <span className="tag badge-neutral" style={{ fontSize: 10 }}>هذا الأسبوع</span>
                </div>
                <div className="grid2">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>Reach</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontWeight: 600 }}>{Number(currentWeek.reach_actual).toLocaleString()} / {Number(currentWeek.reach_target).toLocaleString()}</span>
                    </div>
                    <div className="prog-bar"><div className="prog-fill" style={{ width: wReachPct + '%', background: 'var(--blue)' }} /></div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{wReachPct}%</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>مبيعات</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: 600 }}>{currentWeek.sales_actual} / {currentWeek.sales_target}</span>
                    </div>
                    <div className="prog-bar"><div className="prog-fill" style={{ width: wSalesPct + '%', background: 'var(--green)' }} /></div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{wSalesPct}%</div>
                  </div>
                </div>
              </div>
            )}

            <div className="section-title">اليوم</div>
            <div className="grid4" style={{ marginBottom: 14 }}>
              <div className="stat-card"><div className="stat-lbl">رفعوا تقرير</div><div className="stat-val" style={{ color: 'var(--green)' }}>{reports.length}</div><div className="stat-sub">من {nonManagers.length} موظف</div></div>
              <div className="stat-card"><div className="stat-lbl">متوسط الإنجاز</div><div className="stat-val" style={{ color: avgPct >= 80 ? 'var(--green)' : avgPct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{avgPct}%</div><div className="stat-sub">الفريق</div></div>
              <div className="stat-card"><div className="stat-lbl">FB Reach أمس</div><div className="stat-val" style={{ color: 'var(--blue)' }}>40,928</div><div className="stat-sub" style={{ color: 'var(--green)' }}>↑ أعلى أسبوع</div></div>
              <div className="stat-card"><div className="stat-lbl">Ads CTR</div><div className="stat-val" style={{ color: '#F5A623' }}>4.9%</div><div className="stat-sub">هدف ≥5%</div></div>
            </div>

            <div className="section-title">حالة الفريق اليوم</div>
            <div className="card">
              {nonManagers.map(emp => {
                const pct = getEmpPct(emp.id)
                const rep = getEmpReport(emp.id)
                return (
                  <div key={emp.id} onClick={() => { setSelectedEmp(emp); setTab('team') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.avatar_initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{emp.name}</div>
                      <div className="prog-bar" style={{ margin: 0 }}><div className="prog-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : emp.color }} /></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--text3)' }}>{pct}%</span>
                      {rep ? <span className="tag badge-ok" style={{ fontSize: 9 }}>✓ رفع</span> : <span className="tag badge-err" style={{ fontSize: 9 }}>لم يرفع</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* WEEKLY TARGETS */}
        {tab === 'weekly' && (
          <div className="fade-in">
            <div style={{ marginBottom: 14 }}>
              <div className="section-title">جدول التارجت الأسبوعي — 12 أسبوع (3 شهور)</div>
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
                الهدف: 10,000,000 Reach ÷ 12 أسبوع = <span style={{ color: 'var(--blue)', fontWeight: 600, fontFamily: 'var(--mono)' }}>833,333 Reach/أسبوع</span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                1,000 مبيعة ÷ 12 أسبوع = <span style={{ color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--mono)' }}>84 مبيعة/أسبوع</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weeklyTargets.map(w => {
                const isCurrentWeek = today >= w.week_start && today <= w.week_end
                const rPct = Math.min(Math.round((w.reach_actual / w.reach_target) * 100), 100)
                const sPct = Math.min(Math.round((w.sales_actual / w.sales_target) * 100), 100)
                const isPast = today > w.week_end
                return (
                  <div key={w.id} className="card" style={{ borderColor: isCurrentWeek ? 'rgba(74,144,217,.4)' : 'var(--border)', background: isCurrentWeek ? 'var(--bg2)' : 'var(--bg1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>الأسبوع {w.week_number}</span>
                          {isCurrentWeek && <span className="tag badge-neutral" style={{ fontSize: 9 }}>الآن</span>}
                          {isPast && rPct >= 100 && sPct >= 100 && <span className="tag badge-ok" style={{ fontSize: 9 }}>✓ مكتمل</span>}
                          {isPast && (rPct < 100 || sPct < 100) && <span className="tag badge-err" style={{ fontSize: 9 }}>لم يكتمل</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{w.week_start} → {w.week_end}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Reach</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: rPct >= 100 ? 'var(--green)' : 'var(--blue)', fontFamily: 'var(--mono)' }}>{rPct}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>مبيعات</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: sPct >= 100 ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--mono)' }}>{sPct}%</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text3)' }}>Reach</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>{Number(w.reach_actual).toLocaleString()} / {Number(w.reach_target).toLocaleString()}</span>
                        </div>
                        <div className="prog-bar"><div className="prog-fill" style={{ width: rPct + '%', background: rPct >= 100 ? 'var(--green)' : 'var(--blue)' }} /></div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text3)' }}>مبيعات</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>{w.sales_actual} / {w.sales_target}</span>
                        </div>
                        <div className="prog-bar"><div className="prog-fill" style={{ width: sPct + '%', background: sPct >= 100 ? 'var(--green)' : 'var(--amber)' }} /></div>
                      </div>
                    </div>
                    {/* Update actuals for current week */}
                    {isCurrentWeek && (
                      <WeekActualsForm week={w} onUpdate={loadAll} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TEAM */}
        {tab === 'team' && (
          <div className="fade-in">
            {selectedEmp ? (
              <>
                <button onClick={() => setSelectedEmp(null)} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', marginBottom: 14 }}>← الفريق</button>
                <div className="card" style={{ marginBottom: 12, borderColor: selectedEmp.color + '40' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: selectedEmp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>{selectedEmp.avatar_initials}</div>
                    <div><div style={{ fontSize: 15, fontWeight: 700 }}>{selectedEmp.name}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedEmp.role}</div></div>
                    <div style={{ marginRight: 'auto', textAlign: 'left' }}><div style={{ fontSize: 24, fontWeight: 800, color: selectedEmp.color }}>{getEmpPct(selectedEmp.id)}%</div></div>
                  </div>
                  <div className="prog-bar" style={{ height: 8 }}><div className="prog-fill" style={{ width: getEmpPct(selectedEmp.id) + '%', background: selectedEmp.color }} /></div>
                </div>
                <div className="card">
                  <div className="section-title">المهام اليوم</div>
                  {getEmpTasks(selectedEmp.id).map(t => {
                    const comp = getEmpComps(selectedEmp.id).find(c => c.task_id === t.id)
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '0.5px solid var(--border)' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: comp?.is_done ? 'var(--green)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {comp?.is_done && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div style={{ flex: 1, fontSize: 12, color: comp?.is_done ? 'var(--text3)' : 'var(--text1)' }}>{t.task_text}</div>
                        {t.kpi_target && <span style={{ fontSize: 10, color: comp?.actual_value ? 'var(--green)' : 'var(--text3)', fontFamily: 'var(--mono)' }}>{comp?.actual_value || 0}/{t.kpi_target}</span>}
                      </div>
                    )
                  })}
                  {getEmpReport(selectedEmp.id)?.notes && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>📝 {getEmpReport(selectedEmp.id).notes}</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="section-title">الفريق — {today}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nonManagers.map(emp => {
                    const pct = getEmpPct(emp.id)
                    const rep = getEmpReport(emp.id)
                    const empAssigned = assignedTasks.filter(t => t.assigned_to === emp.id && t.status === 'pending').length
                    return (
                      <div key={emp.id} className="card" onClick={() => setSelectedEmp(emp)} style={{ cursor: 'pointer', borderColor: emp.color + '30' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.avatar_initials}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{emp.role}</div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : emp.color }}>{pct}%</div>
                          </div>
                        </div>
                        <div className="prog-bar" style={{ marginBottom: 8 }}><div className="prog-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : emp.color }} /></div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {rep ? <span className="tag badge-ok" style={{ fontSize: 9 }}>✓ رفع تقرير</span> : <span className="tag badge-err" style={{ fontSize: 9 }}>لم يرفع</span>}
                          {empAssigned > 0 && <span className="tag badge-warn" style={{ fontSize: 9 }}>⚡ {empAssigned} مهام مُسنَدة</span>}
                          {pct >= 100 && <span className="tag badge-ok" style={{ fontSize: 9 }}>🎉 أتمّ الكل</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ASSIGN TASKS */}
        {tab === 'assign' && canAssign && (
          <div className="fade-in">
            <div className="section-title">إسناد مهمة جديدة</div>
            <div className="card" style={{ marginBottom: 14 }}>
              <form onSubmit={submitAssign}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>عنوان المهمة *</div>
                    <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="مثال: تصوير Reel لكورس n8n" required />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>التفاصيل</div>
                    <textarea value={aDesc} onChange={e => setADesc(e.target.value)} rows={2} placeholder="تفاصيل إضافية..." style={{ resize: 'vertical' }} />
                  </div>
                  <div className="grid2" style={{ gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>سند لـ *</div>
                      <select value={aTo} onChange={e => setATo(e.target.value)} required
                        style={{ width: '100%', padding: '9px 11px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, color: 'var(--text1)', fontSize: 13, fontFamily: 'var(--font)' }}>
                        <option value="">اختار موظف...</option>
                        {nonManagers.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>الأولوية</div>
                      <select value={aPriority} onChange={e => setAPriority(e.target.value)}
                        style={{ width: '100%', padding: '9px 11px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, color: 'var(--text1)', fontSize: 13, fontFamily: 'var(--font)' }}>
                        <option value="low">عادي</option>
                        <option value="medium">متوسط</option>
                        <option value="high">عاجل 🔴</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>موعد التسليم</div>
                      <input type="date" value={aDue} onChange={e => setADue(e.target.value)} />
                    </div>
                  </div>
                  {aSaved && <div style={{ background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 8, padding: '9px 12px', color: 'var(--green)', fontSize: 12, textAlign: 'center' }}>✓ تم إسناد المهمة!</div>}
                  <button className="primary-btn" type="submit" disabled={aSaving}>
                    {aSaving ? 'جاري الإسناد...' : '⚡ إسناد المهمة'}
                  </button>
                </div>
              </form>
            </div>

            <div className="section-title">المهام المُسنَدة الحالية ({assignedTasks.filter(t=>t.status==='pending').length} معلقة)</div>
            {assignedTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>لا توجد مهام مُسنَدة</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignedTasks.map(t => (
                  <div key={t.id} className="card" style={{ borderColor: t.status === 'done' ? 'rgba(46,204,113,.2)' : t.priority === 'high' ? 'rgba(231,76,60,.3)' : 'var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.assigned_to_emp?.color || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {t.assigned_to_emp?.avatar_initials || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</span>
                          <span className={`tag ${t.status === 'done' ? 'badge-ok' : t.priority === 'high' ? 'badge-err' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}`} style={{ fontSize: 9 }}>
                            {t.status === 'done' ? '✓ منجزة' : t.priority === 'high' ? 'عاجل' : t.priority === 'medium' ? 'متوسط' : 'عادي'}
                          </span>
                        </div>
                        {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{t.description}</div>}
                        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
                          <span>لـ: <b style={{ color: 'var(--text2)' }}>{t.assigned_to_emp?.name}</b></span>
                          <span>من: {t.assigned_by_emp?.name}</span>
                          {t.due_date && <span style={{ color: '#F5A623' }}>موعد: {t.due_date}</span>}
                          <span>{new Date(t.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                      {t.status !== 'done' && (
                        <button onClick={() => deleteAssignedTask(t.id)} style={{ background: 'rgba(231,76,60,.1)', border: 'none', color: 'var(--red)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>حذف</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOCIAL */}
        {tab === 'social' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="section-title" style={{ margin: 0 }}>السوشيال ميديا — Windsor.ai</div>
              <span className="tag badge-ok" style={{ fontSize: 10 }}>● بيانات حية</span>
            </div>
            <div className="grid2" style={{ marginBottom: 12 }}>
              {[
                { label: 'Facebook Reach', color: '#4A90D9', data: SOCIAL_DATA.facebook, unit: 'يومي', icon: '📘' },
                { label: 'Instagram Reach', color: '#D4537E', data: SOCIAL_DATA.instagram, unit: 'يومي', icon: '📸' },
                { label: 'TikTok Views', color: '#9B59B6', data: SOCIAL_DATA.tiktok, unit: 'يومي', icon: '🎵' },
                { label: 'YouTube Views', color: '#D85A30', data: SOCIAL_DATA.youtube, unit: 'يومي', icon: '▶️' },
              ].map(p => {
                const latest = p.data.filter(v=>v>0).slice(-1)[0] || 0
                const prev = p.data.filter(v=>v>0).slice(-2,-1)[0] || 0
                const ch = prev > 0 ? ((latest-prev)/prev*100).toFixed(0) : null
                return (
                  <div key={p.label} className="stat-card" style={{ borderColor: p.color + '30' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div><div className="stat-lbl">{p.icon} {p.label}</div><div className="stat-val" style={{ color: p.color }}>{latest.toLocaleString()}<span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}> {p.unit}</span></div></div>
                      {ch !== null && <span className={`tag ${Number(ch) >= 0 ? 'badge-ok' : 'badge-err'}`} style={{ fontSize: 10, marginTop: 4 }}>{Number(ch) >= 0 ? '↑' : '↓'}{Math.abs(ch)}%</span>}
                    </div>
                    <MiniBar data={p.data} color={p.color} height={36} />
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(231,76,60,.08)', border: '0.5px solid rgba(231,76,60,.2)', borderRadius: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>⚠ تنبيهات</div>
              <div style={{ color: 'var(--text2)', lineHeight: 2 }}>
                • Instagram هبط من 1,815 → 526 — محتاج Reel جديد<br/>
                • Ads Spend يوم 13 = $2.45 فقط — افحص الحملات<br/>
                • TikTok منخفض — فيديوهات أقل من 20 ث أنجح
              </div>
            </div>
          </div>
        )}

        {/* MISSION */}
        {tab === 'mission' && (
          <div className="fade-in" style={{ margin: '-20px -16px' }}>
            <MotivationPage user={user} />
          </div>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <div className="fade-in">
            <div className="section-title">تقارير اليوم — {today}</div>
            {reports.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}><div style={{ fontSize: 28, marginBottom: 10 }}>📋</div><div>لم يُرفع أي تقرير اليوم بعد</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {reports.map(r => {
                  const emp = employees.find(e => e.id === r.employee_id)
                  const empComps = completions.filter(c => c.report_id === r.id)
                  const tasks = allTasks.filter(t => t.employee_id === r.employee_id)
                  const doneTasks = empComps.filter(c => c.is_done).length
                  const pct = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0
                  return (
                    <div key={r.id} className="card" style={{ borderColor: (emp?.color || '#4A90D9') + '30' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: emp?.color || '#4A90D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp?.avatar_initials || '?'}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{emp?.name}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}</div></div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)' }}>{pct}%</div>
                      </div>
                      <div className="prog-bar" style={{ marginBottom: 6 }}><div className="prog-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)' }} /></div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{doneTasks} من {tasks.length} مهمة مكتملة</div>
                      {r.notes && <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>📝 {r.notes}</div>}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="section-title">لم يرفعوا تقرير</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {nonManagers.filter(e => !getEmpReport(e.id)).map(e => (
                <div key={e.id} style={{ background: 'var(--bg2)', border: '0.5px solid rgba(231,76,60,.3)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: e.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{e.avatar_initials}</div>
                  <span style={{ fontSize: 12 }}>{e.name}</span>
                  <span className="tag badge-err" style={{ fontSize: 9 }}>لم يرفع</span>
                </div>
              ))}
              {nonManagers.every(e => getEmpReport(e.id)) && (
                <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 12px' }}>✓ كل الفريق رفع تقاريرهم! 🎉</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mini component to update week actuals
function WeekActualsForm({ week, onUpdate }) {
  const [reach, setReach] = useState(week.reach_actual || '')
  const [sales, setSales] = useState(week.sales_actual || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('weekly_targets').update({ reach_actual: Number(reach) || 0, sales_actual: Number(sales) || 0 }).eq('id', week.id)
    setSaving(false)
    onUpdate()
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--blue)', marginBottom: 8, fontWeight: 600 }}>تحديث الفعلي لهذا الأسبوع:</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Reach الفعلي</div>
          <input type="number" value={reach} onChange={e => setReach(e.target.value)} placeholder="مثال: 250000" style={{ padding: '7px 10px', fontSize: 12 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>مبيعات الفعلي</div>
          <input type="number" value={sales} onChange={e => setSales(e.target.value)} placeholder="مثال: 45" style={{ padding: '7px 10px', fontSize: 12 }} />
        </div>
        <button onClick={save} disabled={saving} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', height: 36 }}>
          {saving ? '...' : 'حفظ'}
        </button>
      </div>
    </div>
  )
}
