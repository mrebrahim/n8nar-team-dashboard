import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const TABS = [
  { id: 'targets', label: 'تارجتي', icon: '🎯' },
  { id: 'tasks',   label: 'مهامي',  icon: '✅' },
  { id: 'report',  label: 'رفع تقرير', icon: '📊' },
]

export default function EmployeeDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('targets')
  const [tasks, setTasks] = useState([])
  const [assignedTasks, setAssignedTasks] = useState([])
  const [done, setDone] = useState({})
  const [report, setReport] = useState(null)
  const [kpiValues, setKpiValues] = useState({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weeklyTarget, setWeeklyTarget] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [historyReports, setHistoryReports] = useState([])
  // إنجي only
  const [salesInput, setSalesInput] = useState('')
  const [revenueInput, setRevenueInput] = useState('')
  const [salesNote, setSalesNote] = useState('')
  const [salesSaving, setSalesSaving] = useState(false)
  const [salesSaved, setSalesSaved] = useState(false)
  const [todaySales, setTodaySales] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const isEngy = user.email === 'engy@n8nar.com'

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: emp } = await supabase.from('employees').select('*').eq('email', user.email).single()
    if (emp) setEmployee(emp)
    const empId = emp?.id
    if (!empId) return

    const { data: t } = await supabase.from('tasks').select('*').eq('employee_id', empId).eq('is_active', true).order('task_order')
    setTasks(t || [])

    const { data: at } = await supabase.from('assigned_tasks').select('*, assigned_by_emp:assigned_by(name)').eq('assigned_to', empId).neq('status', 'done').order('created_at', { ascending: false })
    setAssignedTasks(at || [])

    const { data: todayRep } = await supabase.from('daily_reports').select('*').eq('employee_id', empId).eq('report_date', today).single()
    if (todayRep) {
      setReport(todayRep)
      const { data: completions } = await supabase.from('task_completions').select('*').eq('report_id', todayRep.id)
      const doneMap = {}
      completions?.forEach(c => { doneMap[c.task_id] = c.is_done })
      setDone(doneMap)
      setNotes(todayRep.notes || '')
    }

    // Get current week target with live actuals
    const { data: wt } = await supabase.from('weekly_targets')
      .select('*').lte('week_start', today).gte('week_end', today).single()
    if (wt) {
      // Get week reach from daily_reach
      const { data: reachRows } = await supabase.from('daily_reach')
        .select('total_reach').gte('reach_date', wt.week_start).lte('reach_date', wt.week_end)
      const weekReach = (reachRows || []).reduce((s, r) => s + (r.total_reach || 0), 0)

      // Get week sales from daily_sales
      const { data: salesRows } = await supabase.from('daily_sales')
        .select('sales_count').gte('sale_date', wt.week_start).lte('sale_date', wt.week_end)
      const weekSales = (salesRows || []).reduce((s, r) => s + (r.sales_count || 0), 0)

      setWeeklyTarget({ ...wt, reach_actual: weekReach, sales_actual: weekSales })
    }

    const { data: hist } = await supabase.from('daily_reports').select('*').eq('employee_id', empId).order('report_date', { ascending: false }).limit(7)
    setHistoryReports(hist || [])

    // إنجي: load today's sales
    if (isEngy) {
      const { data: ts } = await supabase.from('daily_sales').select('*').eq('sale_date', today).single()
      setTodaySales(ts)
      if (ts) { setSalesInput(ts.sales_count || ''); setRevenueInput(ts.revenue_usd || ''); setSalesNote(ts.notes || '') }
    }
  }

  async function toggleTask(taskId) {
    const newDone = { ...done, [taskId]: !done[taskId] }
    setDone(newDone)
    if (!employee) return
    let repId = report?.id
    if (!repId) {
      const { data: r } = await supabase.from('daily_reports').upsert({ employee_id: employee.id, report_date: today, notes }).select().single()
      setReport(r); repId = r?.id
    }
    if (!repId) return
    await supabase.from('task_completions').upsert({ report_id: repId, task_id: taskId, is_done: newDone[taskId] }, { onConflict: 'report_id,task_id' })
  }

  async function markAssignedDone(taskId) {
    await supabase.from('assigned_tasks').update({ status: 'done' }).eq('id', taskId)
    setAssignedTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function submitReport() {
    if (!employee) return
    setSaving(true)
    const { data: r } = await supabase.from('daily_reports').upsert({ employee_id: employee.id, report_date: today, notes }, { onConflict: 'employee_id,report_date' }).select().single()
    if (!r) { setSaving(false); return }
    setReport(r)
    for (const task of tasks) {
      await supabase.from('task_completions').upsert({ report_id: r.id, task_id: task.id, is_done: !!done[task.id], actual_value: kpiValues[task.id] || null }, { onConflict: 'report_id,task_id' })
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    loadAll()
  }

  async function submitSales() {
    if (!employee) return
    setSalesSaving(true)
    await supabase.from('daily_sales').upsert({
      sale_date: today,
      sales_count: parseInt(salesInput) || 0,
      revenue_usd: parseFloat(revenueInput) || 0,
      notes: salesNote,
      added_by: employee.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'sale_date' })

    // Update team_targets total sales
    const { data: allSales } = await supabase.from('daily_sales').select('sales_count')
    const total = (allSales || []).reduce((s, r) => s + (r.sales_count || 0), 0)
    await supabase.from('team_targets').update({ current_value: total }).eq('metric_key', 'total_sales')

    setSalesSaving(false); setSalesSaved(true)
    setTimeout(() => setSalesSaved(false), 3000)
    loadAll()
  }

  const completedCount = tasks.filter(t => done[t.id]).length
  const completionPct = tasks.length > 0 ? Math.round(completedCount / tasks.length * 100) : 0
  const color = user.color || '#4A90D9'

  const wReachPct = weeklyTarget ? Math.min(Math.round((weeklyTarget.reach_actual / weeklyTarget.reach_target) * 100), 100) : 0
  const wSalesPct = weeklyTarget ? Math.min(Math.round((weeklyTarget.sales_actual / weeklyTarget.sales_target) * 100), 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{user.initials || user.name?.[0]}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <button onClick={onLogout} style={{ background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text3)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>خروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)', padding: '0 20px', display: 'flex', gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}
            style={{ padding: '12px 14px', borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent', color: tab === t.id ? color : 'var(--text3)', borderRadius: 0 }}>
            {t.icon} {t.label}
            {t.id === 'tasks' && assignedTasks.length > 0 && (
              <span style={{ background: '#E74C3C', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>{assignedTasks.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* ══ TARGETS TAB ══ */}
        {tab === 'targets' && (
          <div className="fade-in">

            {/* My daily completion */}
            <div className="card" style={{ marginBottom: 14, borderColor: color + '40' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>إنجازي اليوم</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{today}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: completionPct >= 100 ? 'var(--green)' : completionPct >= 70 ? 'var(--amber)' : color }}>{completionPct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{completedCount}/{tasks.length} مهمة</div>
                </div>
              </div>
              <div className="prog-bar" style={{ height: 8 }}>
                <div className="prog-fill" style={{ width: completionPct + '%', background: completionPct >= 100 ? 'var(--green)' : completionPct >= 70 ? 'var(--amber)' : color }} />
              </div>
              {completionPct >= 100 && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 8, fontSize: 12, color: 'var(--green)', textAlign: 'center' }}>
                  🎉 أتممت كل مهامك اليوم!
                </div>
              )}
            </div>

            {/* إنجي sales input */}
            {isEngy && (
              <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(46,204,113,.3)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--green)' }}>💰 تسجيل مبيعات اليوم</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
                  {todaySales ? `✓ تم التسجيل — ${todaySales.sales_count} مبيعة` : 'لم يُسجَّل بعد'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>عدد المبيعات</div>
                    <input type="number" value={salesInput} onChange={e => setSalesInput(e.target.value)} placeholder="مثال: 11" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>الإيراد ($)</div>
                    <input type="number" value={revenueInput} onChange={e => setRevenueInput(e.target.value)} placeholder="مثال: 660" />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>ملاحظة</div>
                  <input type="text" value={salesNote} onChange={e => setSalesNote(e.target.value)} placeholder="أي ملاحظة..." />
                </div>
                {salesSaved && (
                  <div style={{ background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--green)', textAlign: 'center', marginBottom: 8 }}>
                    ✓ تم تسجيل المبيعات وتحديث التارجت الأسبوعي!
                  </div>
                )}
                <button onClick={submitSales} disabled={salesSaving} className="primary-btn" style={{ background: 'var(--green)' }}>
                  {salesSaving ? 'جاري الحفظ...' : todaySales ? '↻ تحديث مبيعات اليوم' : '+ تسجيل مبيعات اليوم'}
                </button>
              </div>
            )}

            {/* Weekly Target — auto updated */}
            {weeklyTarget && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1 }}>
                    التارجت الأسبوعي — الأسبوع {weeklyTarget.week_number}
                  </div>
                  <span className="tag badge-neutral" style={{ fontSize: 9 }}>⟳ يتحدث تلقائياً</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10 }}>
                  {weeklyTarget.week_start} → {weeklyTarget.week_end}
                </div>
                <div className="grid2" style={{ marginBottom: 14 }}>
                  <div style={{ background: 'var(--bg1)', border: '0.5px solid rgba(74,144,217,.3)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>📘 Reach هذا الأسبوع</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: wReachPct >= 100 ? 'var(--green)' : 'var(--blue)' }}>
                      {Number(Math.round(weeklyTarget.reach_actual)).toLocaleString()}
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}> / {Number(weeklyTarget.reach_target).toLocaleString()}</span>
                    </div>
                    <div className="prog-bar" style={{ margin: '8px 0 4px' }}>
                      <div className="prog-fill" style={{ width: wReachPct + '%', background: wReachPct >= 100 ? 'var(--green)' : 'var(--blue)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                      <span style={{ color: wReachPct >= 100 ? 'var(--green)' : wReachPct >= 70 ? 'var(--amber)' : 'var(--text3)' }}>{wReachPct}%</span>
                      <span>من Windsor.ai</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>💰 مبيعات هذا الأسبوع</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: wSalesPct >= 100 ? 'var(--green)' : 'var(--amber)' }}>
                      {weeklyTarget.sales_actual}
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}> / {weeklyTarget.sales_target}</span>
                    </div>
                    <div className="prog-bar" style={{ margin: '8px 0 4px' }}>
                      <div className="prog-fill" style={{ width: wSalesPct + '%', background: wSalesPct >= 100 ? 'var(--green)' : 'var(--amber)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                      <span style={{ color: wSalesPct >= 100 ? 'var(--green)' : wSalesPct >= 70 ? 'var(--amber)' : 'var(--text3)' }}>{wSalesPct}%</span>
                      <span>من تقارير إنجي</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* History */}
            {historyReports.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: 'var(--text3)', margin: '14px 0 8px', fontWeight: 600, letterSpacing: 1 }}>آخر 7 أيام</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {historyReports.map(r => (
                    <div key={r.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', textAlign: 'center', minWidth: 56 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{new Date(r.report_date).toLocaleDateString('ar-EG', { weekday: 'short' })}</div>
                      <div style={{ fontSize: 14, color: 'var(--green)' }}>✓</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TASKS TAB ══ */}
        {tab === 'tasks' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>مهامي اليوم</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{completedCount} من {tasks.length} مكتملة</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: completionPct >= 100 ? 'var(--green)' : color }}>{completionPct}%</div>
            </div>
            <div className="prog-bar" style={{ marginBottom: 16, height: 6 }}>
              <div className="prog-fill" style={{ width: completionPct + '%', background: completionPct >= 100 ? 'var(--green)' : color }} />
            </div>

            <div className="card" style={{ marginBottom: 14 }}>
              {tasks.map((t, i) => {
                const isDone = !!done[t.id]
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: i < tasks.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                    <div className={`check-circle ${isDone ? 'done' : ''}`} onClick={() => toggleTask(t.id)} style={{ marginTop: 2 }}>
                      {isDone && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: isDone ? 'var(--text3)' : 'var(--text1)', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.5 }}>{t.task_text}</div>
                      {t.kpi_target && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}><span style={{ color }}>هدف:</span> {t.kpi_target} {t.kpi_unit}</div>}
                    </div>
                    {isDone && <span className="tag badge-ok" style={{ flexShrink: 0, marginTop: 2, fontSize: 10 }}>✓</span>}
                  </div>
                )
              })}
              {tasks.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>جاري التحميل...</div>}
            </div>

            {/* Assigned tasks */}
            {assignedTasks.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#F5A623', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>
                  ⚡ مهام مُسنَدة إليك ({assignedTasks.length})
                </div>
                <div className="card" style={{ borderColor: 'rgba(245,166,35,.3)' }}>
                  {assignedTasks.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: i < assignedTasks.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <div className="check-circle" onClick={() => markAssignedDone(t.id)} style={{ marginTop: 2, borderColor: '#F5A623' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                        {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{t.description}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                          {t.assigned_by_emp && <span style={{ fontSize: 10, color: 'var(--text3)' }}>من: {t.assigned_by_emp.name}</span>}
                          {t.due_date && <span style={{ fontSize: 10, color: '#F5A623' }}>موعد: {t.due_date}</span>}
                          <span className={`tag ${t.priority === 'high' ? 'badge-err' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}`} style={{ fontSize: 9 }}>
                            {t.priority === 'high' ? 'عاجل 🔴' : t.priority === 'medium' ? 'متوسط' : 'عادي'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ REPORT TAB ══ */}
        {tab === 'report' && (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>رفع تقرير اليوم</div>
              <div style={{ fontSize: 11, color: report ? 'var(--green)' : 'var(--text3)', marginTop: 2 }}>
                {report ? '✓ تم رفع تقرير اليوم — يمكنك التعديل' : 'لم يُرفع بعد'}
              </div>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}>المهام والأرقام الفعلية</div>
              {tasks.map((t, i) => (
                <div key={t.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < tasks.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: t.kpi_target ? 8 : 0 }}>
                    <div className={`check-circle ${done[t.id] ? 'done' : ''}`} onClick={() => toggleTask(t.id)}>
                      {done[t.id] && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ fontSize: 13, flex: 1 }}>{t.task_text}</div>
                  </div>
                  {t.kpi_target && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 30 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>الفعلي:</span>
                      <input type="number" value={kpiValues[t.id] || ''} onChange={e => setKpiValues(p => ({ ...p, [t.id]: e.target.value }))}
                        placeholder={`هدف: ${t.kpi_target} ${t.kpi_unit}`} style={{ padding: '6px 10px', fontSize: 12, flex: 1 }} />
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{t.kpi_unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>ملاحظات / عقبات</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="أي ملاحظة مهمة عن اليوم..." style={{ resize: 'vertical' }} />
            </div>
            {saved && (
              <div style={{ background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: 'var(--green)', fontSize: 13, textAlign: 'center' }}>✓ تم حفظ التقرير بنجاح!</div>
            )}
            <button className="primary-btn" onClick={submitReport} disabled={saving} style={{ background: color }}>
              {saving ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />جاري الحفظ...</span> : report ? 'تحديث التقرير' : 'إرسال التقرير'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
