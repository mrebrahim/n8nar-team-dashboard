import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const SOCIAL_DATA = {
  facebook: [24540,9008,25158,12905,35026,38024,40928],
  instagram: [1815,1682,1408,1141,982,632,526],
  tiktok: [67,135,181,192,507,509,0],
  youtube: [716,537,655,608,1395,0,0],
  ads_spend: [22.31,25.77,22.80,22.34,17.69,2.45,0],
  ads_ctr: [4.67,4.93,5.13,4.67,5.03,4.54,0],
}
const DAYS = ['8م','9م','10م','11م','12م','13م','14م']
const TEAM_GOAL_SALES = 1000
const TEAM_GOAL_REACH = 10000000

const TABS = [
  { id: 'overview', label: 'لوحة الرئيسية', icon: '🏠' },
  { id: 'team', label: 'الفريق', icon: '👥' },
  { id: 'social', label: 'السوشيال', icon: '📱' },
  { id: 'reports', label: 'التقارير', icon: '📋' },
]

function MiniBar({ data, color = '#4A90D9', height = 40 }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: i === data.length - 1 ? color : color + '60',
          borderRadius: '2px 2px 0 0', height: `${Math.max((v / max) * 100, 3)}%`,
          transition: 'height .5s ease'
        }} />
      ))}
    </div>
  )
}

function PlatformCard({ label, color, data, unit, icon }) {
  const latest = data[data.filter(v => v > 0).length - 1] || 0
  const prev = data[data.filter(v => v > 0).length - 2] || 0
  const change = prev > 0 ? ((latest - prev) / prev * 100).toFixed(0) : null
  return (
    <div className="stat-card" style={{ borderColor: color + '30' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div className="stat-lbl">{icon} {label}</div>
          <div className="stat-val" style={{ color }}>{latest.toLocaleString()}<span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}> {unit}</span></div>
        </div>
        {change !== null && (
          <span className={`tag ${Number(change) >= 0 ? 'badge-ok' : 'badge-err'}`} style={{ fontSize: 10, marginTop: 4 }}>
            {Number(change) >= 0 ? '↑' : '↓'}{Math.abs(change)}%
          </span>
        )}
      </div>
      <MiniBar data={data} color={color} height={36} />
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
  const [selectedEmp, setSelectedEmp] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: emps } = await supabase.from('employees').select('*').neq('is_manager', true)
    setEmployees(emps || [])
    const { data: reps } = await supabase.from('daily_reports').select('*, employees(name, role, color, initials)').eq('report_date', today)
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
  }

  function getEmpReport(empId) { return reports.find(r => r.employee_id === empId) }
  function getEmpTasks(empId) { return allTasks.filter(t => t.employee_id === empId) }
  function getEmpCompletions(empId) {
    const rep = getEmpReport(empId)
    if (!rep) return []
    return completions.filter(c => c.report_id === rep.id)
  }
  function getEmpPct(empId) {
    const tasks = getEmpTasks(empId)
    const comps = getEmpCompletions(empId)
    if (!tasks.length) return 0
    return Math.round(comps.filter(c => c.is_done).length / tasks.length * 100)
  }

  const totalReach = SOCIAL_DATA.facebook.reduce((a,b)=>a+b,0) + SOCIAL_DATA.instagram.reduce((a,b)=>a+b,0)
  const salesTarget = teamTargets.find(t => t.metric_key === 'total_sales')
  const reachTarget = teamTargets.find(t => t.metric_key === 'total_reach')
  const salesPct = salesTarget ? Math.min(Math.round(salesTarget.current_value / salesTarget.target_value * 100), 100) : 0
  const reachPct = reachTarget ? Math.min(Math.round(reachTarget.current_value / reachTarget.target_value * 100), 100) : 2

  const reportedCount = reports.length
  const nonManagers = employees.filter(e => !e.is_manager)
  const avgPct = nonManagers.length > 0 ? Math.round(nonManagers.reduce((s, e) => s + getEmpPct(e.id), 0) / nonManagers.length) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1B3A6B,#4A90D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff'
          }}>إب</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>إبراهيم خليل</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>CEO — لوحة المدير</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            {new Date().toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'long' })}
          </div>
          <button onClick={loadAll} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', color: 'var(--blue)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>↻ تحديث</button>
          <button onClick={onLogout} style={{ background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text3)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>خروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)', padding: '0 20px', display: 'flex', gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}
            style={{ padding: '10px 14px', borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent', borderRadius: 0 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="fade-in">
            {/* Big goals */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">الهدف الكلي — 90 يوم</div>
              <div className="grid2">
                <div style={{ background: 'var(--bg1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,204,113,.15), transparent)' }} />
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>مبيعات الكورسات</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', marginBottom: 4 }}>
                    {salesTarget?.current_value?.toLocaleString() || 0}
                    <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / {TEAM_GOAL_SALES}</span>
                  </div>
                  <div className="prog-bar" style={{ height: 8, marginBottom: 8 }}>
                    <div className="prog-fill" style={{ width: salesPct + '%', background: 'var(--green)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{salesPct}% من الهدف</div>
                </div>
                <div style={{ background: 'var(--bg1)', border: '0.5px solid rgba(74,144,217,.3)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,144,217,.15), transparent)' }} />
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>الـ Reach الكلي</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue)', marginBottom: 4 }}>
                    {(reachTarget?.current_value || 185589).toLocaleString()}
                    <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / 10M</span>
                  </div>
                  <div className="prog-bar" style={{ height: 8, marginBottom: 8 }}>
                    <div className="prog-fill" style={{ width: reachPct + '%', background: 'var(--blue)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{reachPct}% من الـ 10 مليون</div>
                </div>
              </div>
            </div>

            {/* Today stats */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">اليوم — {today}</div>
              <div className="grid4">
                <div className="stat-card">
                  <div className="stat-lbl">رفعوا تقرير</div>
                  <div className="stat-val" style={{ color: 'var(--green)' }}>{reportedCount}</div>
                  <div className="stat-sub">من {nonManagers.length} موظف</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">متوسط الإنجاز</div>
                  <div className="stat-val" style={{ color: avgPct >= 80 ? 'var(--green)' : avgPct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{avgPct}%</div>
                  <div className="stat-sub">الفريق اليوم</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">FB Reach أمس</div>
                  <div className="stat-val" style={{ color: '#4A90D9' }}>40,928</div>
                  <div className="stat-sub" style={{ color: 'var(--green)' }}>↑ أعلى أسبوع</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">Ads CTR</div>
                  <div className="stat-val" style={{ color: '#F5A623' }}>4.9%</div>
                  <div className="stat-sub">هدف: ≥5%</div>
                </div>
              </div>
            </div>

            {/* Team quick view */}
            <div className="section-title">حالة الفريق اليوم</div>
            <div className="card">
              {nonManagers.map(emp => {
                const pct = getEmpPct(emp.id)
                const rep = getEmpReport(emp.id)
                return (
                  <div key={emp.id} onClick={() => { setSelectedEmp(emp); setTab('team'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {emp.avatar_initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{emp.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="prog-bar" style={{ flex: 1, margin: 0 }}>
                          <div className="prog-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : emp.color }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--text3)', minWidth: 32, textAlign: 'left' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      {rep
                        ? <span className="tag badge-ok" style={{ fontSize: 10 }}>رفع تقرير</span>
                        : <span className="tag badge-err" style={{ fontSize: 10 }}>لم يرفع</span>
                      }
                    </div>
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
                <button onClick={() => setSelectedEmp(null)} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', marginBottom: 16 }}>← الفريق</button>
                <div className="card" style={{ marginBottom: 14, borderColor: selectedEmp.color + '40' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: selectedEmp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{selectedEmp.avatar_initials}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedEmp.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedEmp.role}</div>
                    </div>
                    <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: selectedEmp.color }}>{getEmpPct(selectedEmp.id)}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>اليوم</div>
                    </div>
                  </div>
                  <div className="prog-bar" style={{ height: 8, marginBottom: 4 }}>
                    <div className="prog-fill" style={{ width: getEmpPct(selectedEmp.id) + '%', background: selectedEmp.color }} />
                  </div>
                </div>
                <div className="card">
                  <div className="section-title">المهام اليوم</div>
                  {getEmpTasks(selectedEmp.id).map(t => {
                    const comp = getEmpCompletions(selectedEmp.id).find(c => c.task_id === t.id)
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: comp?.is_done ? 'var(--green)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {comp?.is_done && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, color: comp?.is_done ? 'var(--text3)' : 'var(--text1)' }}>{t.task_text}</div>
                        {t.kpi_target && comp?.actual_value && (
                          <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{comp.actual_value}/{t.kpi_target}</span>
                        )}
                        {t.kpi_target && !comp?.actual_value && (
                          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>هدف: {t.kpi_target} {t.kpi_unit}</span>
                        )}
                      </div>
                    )
                  })}
                  {getEmpReport(selectedEmp.id)?.notes && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                      📝 {getEmpReport(selectedEmp.id).notes}
                    </div>
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
                    const tasks = getEmpTasks(emp.id)
                    const comps = getEmpCompletions(emp.id)
                    return (
                      <div key={emp.id} className="card" onClick={() => setSelectedEmp(emp)}
                        style={{ cursor: 'pointer', borderColor: emp.color + '30', transition: 'border-color .15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.avatar_initials}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{emp.role}</div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : emp.color }}>{pct}%</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{comps.filter(c=>c.is_done).length}/{tasks.length}</div>
                          </div>
                        </div>
                        <div className="prog-bar" style={{ marginBottom: 8 }}>
                          <div className="prog-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : emp.color }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {rep ? <span className="tag badge-ok" style={{ fontSize: 10 }}>✓ رفع تقرير</span> : <span className="tag badge-err" style={{ fontSize: 10 }}>لم يرفع بعد</span>}
                          {pct >= 100 && <span className="tag badge-ok" style={{ fontSize: 10 }}>أتمّ كل المهام 🎉</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
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
              <PlatformCard label="Facebook Reach" color="#4A90D9" data={SOCIAL_DATA.facebook} unit="يومي" icon="📘" />
              <PlatformCard label="Instagram Reach" color="#D4537E" data={SOCIAL_DATA.instagram} unit="يومي" icon="📸" />
              <PlatformCard label="TikTok Views" color="#9B59B6" data={SOCIAL_DATA.tiktok} unit="يومي" icon="🎵" />
              <PlatformCard label="YouTube Views" color="#D85A30" data={SOCIAL_DATA.youtube} unit="يومي" icon="▶️" />
            </div>

            <div className="section-title">إعلانات Facebook — آخر 7 أيام</div>
            <div className="grid2" style={{ marginBottom: 12 }}>
              <div className="stat-card">
                <div className="stat-lbl">📢 إنفاق يومي</div>
                <div className="stat-val" style={{ color: '#F5A623' }}>$2.45</div>
                <div className="stat-sub" style={{ color: 'var(--red)' }}>⚠ انخفض مفاجئ يوم 13</div>
                <MiniBar data={SOCIAL_DATA.ads_spend} color="#F5A623" height={36} />
              </div>
              <div className="stat-card">
                <div className="stat-lbl">🖱 CTR</div>
                <div className="stat-val" style={{ color: '#2ECC71' }}>4.9%</div>
                <div className="stat-sub">هدف: ≥5%</div>
                <MiniBar data={SOCIAL_DATA.ads_ctr} color="#2ECC71" height={36} />
              </div>
            </div>

            <div className="section-title">تاريخ Reach آخر 7 أيام</div>
            <div className="card">
              {DAYS.map((day, i) => {
                const total = (SOCIAL_DATA.facebook[i] || 0) + (SOCIAL_DATA.instagram[i] || 0)
                const max = 50000
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < DAYS.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', minWidth: 28, fontFamily: 'var(--mono)' }}>{day}</div>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((total / max) * 100, 100)}%`, background: '#4A90D9', borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#4A90D9', minWidth: 55, textAlign: 'left', fontWeight: 600 }}>{total.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', minWidth: 30, textAlign: 'left' }}>FB</div>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((SOCIAL_DATA.instagram[i] / 2000) * 100, 100)}%`, background: '#D4537E', borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#D4537E', minWidth: 40, textAlign: 'left', fontWeight: 600 }}>{(SOCIAL_DATA.instagram[i] || 0).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(231,76,60,.08)', border: '0.5px solid rgba(231,76,60,.2)', borderRadius: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>⚠ تنبيهات</div>
              <div style={{ color: 'var(--text2)', lineHeight: 2 }}>
                • Instagram Reach هبط من 1,815 → 526 — محتاج Reel جديد<br/>
                • Ads Spend يوم 13 = $2.45 فقط — افحص الحملات<br/>
                • TikTok Views منخفض — فيديوهات أقل من 20 ث أنجح
              </div>
            </div>
          </div>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <div className="fade-in">
            <div className="section-title">تقارير اليوم — {today}</div>
            {reports.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
                <div>لم يُرفع أي تقرير اليوم بعد</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map(r => {
                  const emp = employees.find(e => e.id === r.employee_id) || r.employees
                  const empComps = completions.filter(c => c.report_id === r.id)
                  const tasks = allTasks.filter(t => t.employee_id === r.employee_id)
                  const doneTasks = empComps.filter(c => c.is_done).length
                  const pct = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0
                  return (
                    <div key={r.id} className="card" style={{ borderColor: emp?.color + '30' || 'var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: emp?.color || '#4A90D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {emp?.avatar_initials || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{emp?.name || 'موظف'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)' }}>{pct}%</div>
                      </div>
                      <div className="prog-bar" style={{ marginBottom: 8 }}>
                        <div className="prog-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)' }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{doneTasks} من {tasks.length} مهمة مكتملة</div>
                      {r.notes && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                          📝 {r.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="section-title">لم يرفعوا تقرير اليوم</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {nonManagers.filter(e => !getEmpReport(e.id)).map(e => (
                  <div key={e.id} style={{ background: 'var(--bg2)', border: '0.5px solid rgba(231,76,60,.3)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: e.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{e.avatar_initials}</div>
                    <span style={{ fontSize: 12, color: 'var(--text1)' }}>{e.name}</span>
                    <span className="tag badge-err" style={{ fontSize: 10 }}>لم يرفع</span>
                  </div>
                ))}
                {nonManagers.every(e => getEmpReport(e.id)) && (
                  <div style={{ fontSize: 12, color: 'var(--green)' }}>✓ كل الفريق رفع تقاريرهم اليوم!</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
