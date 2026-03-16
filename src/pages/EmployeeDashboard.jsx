import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import MotivationPage from './MotivationPage'
import ContentSchedule from './ContentSchedule'

// Impact message per employee email
const IMPACT_MESSAGES = {
  'mina@n8nar.com': {
    headline: 'كل بوست بجودة عالية = 100 مبيعة 🔥',
    sub: 'بوست قوي → 100K reach → 1,000 lead → 100 مبيعة = 1,000 EGP في البونص',
    color: '#4A90D9',
    icon: '📝',
  },
  'andrew.i@n8nar.com': {
    headline: 'كل محتوى Reel قوي = 2 مبيعة 🎬',
    sub: 'Reel محتوى → 10K views → 100 lead → 2 مبيعة = 20 EGP في البونص',
    color: '#9B59B6',
    icon: '🎬',
  },
  'andrew.a@n8nar.com': {
    headline: 'كل مونتاج قوي = 10 مبيعات ✂️',
    sub: 'Reel مونتاج → 50K views → 500 lead → 10 مبيعات = 100 EGP في البونص',
    color: '#E67E22',
    icon: '✂️',
  },
  'ibram@n8nar.com': {
    headline: 'كل مونتاج قوي = 10 مبيعات ✂️',
    sub: 'Reel مونتاج → 50K views → 500 lead → 10 مبيعات = 100 EGP في البونص',
    color: '#E67E22',
    icon: '✂️',
  },
  'mariam@n8nar.com': {
    headline: '50 مكالمة + 100 DM = 3 مبيعات يومياً 📞',
    sub: 'تواصل مستمر مع العملاء → دعم قوي للعملاء → upsell 2 كورس + 10 أصدقاء',
    color: '#27AE60',
    icon: '📞',
  },
  'engy@n8nar.com': {
    headline: 'دعم العملاء الممتاز = مبيعات مضاعفة 💬',
    sub: 'دعم قوي → العميل يشتري 2 كورس إضافي + يجيب 10 أصدقاء',
    color: '#1ABC9C',
    icon: '💬',
  },
  'bishoy@n8nar.com': {
    headline: 'كل Email + مقالة + WhatsApp = 3 مبيعات يومياً ⚙️',
    sub: 'Email campaign → 1 مبيعة · WhatsApp negotiation → 1 مبيعة · مقالة SEO → 1 مبيعة',
    color: '#185FA5',
    icon: '⚙️',
  },
  'ibrahim@n8nar.com': {
    headline: 'كل فيديو YouTube = 2 مبيعات 🎥',
    sub: 'فيديو YouTube تعليمي → 2 مبيعة · FB Ads creative → 10 مبيعات · فكرة عرض جديدة → upsell',
    color: '#1B3A6B',
    icon: '🎥',
  },
}

const CAN_ASSIGN_EMAILS = ['ibrahim@n8nar.com','mina@n8nar.com','engy@n8nar.com','andrew.i@n8nar.com']

const TABS = [
  { id: 'targets', label: 'تارجتي',      icon: '🎯' },
  { id: 'tasks',   label: 'مهامي',        icon: '✅' },
  { id: 'report',  label: 'رفع تقرير',    icon: '📊' },
  { id: 'mission',   label: 'Mission 1000',  icon: '🔥' },
  { id: 'schedule', label: 'جدول المحتوى', icon: '📅' },
]

// Component: shows team tasks incomplete, grouped by employee
function TeamTasksSection({ teamTasks, userEmail }) {
  const isContentLead = userEmail === 'andrew.i@n8nar.com'
  const isMina = userEmail === 'mina@n8nar.com'
  const title = isContentLead
    ? '📱 حالة النشر على السوشيال — غير مكتملة'
    : isMina
    ? '👥 تاسكات الميديا — غير مكتملة'
    : '👥 تاسكات الفريق كله — غير مكتملة'

  // Group by employee
  const grouped = {}
  teamTasks.forEach(t => {
    const name = t.emp?.name || 'موظف'
    if (!grouped[name]) grouped[name] = { color: t.emp?.color || '#666', initials: t.emp?.avatar_initials || '?', tasks: [] }
    grouped[name].tasks.push(t)
  })

  // Get today's completions from supabase — we just show the tasks as-is
  // (actual done status comes from the DB query filtering)

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>{title}</div>
      {Object.entries(grouped).map(([name, info]) => (
        <div key={name} className="card" style={{ marginBottom: 8, padding: '12px 14px', borderColor: info.color + '30' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{info.initials}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
            <span className="tag badge-err" style={{ fontSize: 9, marginRight: 'auto' }}>{info.tasks.length} مهمة</span>
          </div>
          {info.tasks.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < info.tasks.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{t.task_text}</div>
              <span className="tag badge-err" style={{ fontSize: 9, flexShrink: 0 }}>لم تكتمل</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function EmployeeDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('mission') // ← opens Mission first
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
  const [teamTasks, setTeamTasks] = useState([])
  const [teamTasksDone, setTeamTasksDone] = useState({})
  const [allEmployees, setAllEmployees] = useState([])
  // Assign form
  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aTo, setATo] = useState('')
  const [aDue, setADue] = useState('')
  const [aPriority, setAPriority] = useState('medium')
  const [aSaving, setASaving] = useState(false)
  const [aSaved, setASaved] = useState(false)
  const [myAssignedOut, setMyAssignedOut] = useState([])
  const [salesInput, setSalesInput] = useState('')
  const [revenueInput, setRevenueInput] = useState('')
  const [salesNote, setSalesNote] = useState('')
  const [salesSaving, setSalesSaving] = useState(false)
  const [salesSaved, setSalesSaved] = useState(false)
  const [todaySales, setTodaySales] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const isEngy = user.email === 'engy@n8nar.com'
  const color = user.color || '#4A90D9'
  const impact = IMPACT_MESSAGES[user.email]

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: emp } = await supabase.from('employees').select('*').eq('email', user.email).single()
    if (emp) setEmployee(emp)
    const empId = emp?.id
    if (!empId) return

    // Own tasks
    const { data: t } = await supabase.from('tasks').select('*').eq('employee_id', empId).eq('is_active', true).order('task_order')
    setTasks(t || [])

    // Team tasks visible to this user (excluding own tasks)
    const ROLE_MAP = {
      'ibrahim@n8nar.com':  'manager',       // sees ALL team tasks
      'engy@n8nar.com':     'ops',           // sees ALL team tasks
      'mina@n8nar.com':     'team_leader',   // sees أندرو إسحاق + أندرو أيمن + إبرام
      'andrew.i@n8nar.com': 'content_lead',  // sees social publishing tasks only
    }
    const myRole = ROLE_MAP[user.email]
    if (myRole) {
      const { data: allVisible } = await supabase
        .from('tasks')
        .select('*, emp:employee_id(name, avatar_initials, color)')
        .contains('visible_to_roles', [myRole])
        .neq('employee_id', empId)
        .eq('is_active', true)
        .order('employee_id')
        .order('task_order')
      setTeamTasks(allVisible || [])
    }

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

    // Weekly target - fallback to nearest
    let { data: wt } = await supabase.from('weekly_targets').select('*').lte('week_start', today).gte('week_end', today).single()
    if (!wt) {
      const { data: next } = await supabase.from('weekly_targets').select('*').gte('week_start', today).order('week_start').limit(1).single()
      const { data: prev } = await supabase.from('weekly_targets').select('*').lte('week_end', today).order('week_end', { ascending: false }).limit(1).single()
      wt = next || prev
    }
    const activeWeek = wt || { week_number: 1, week_start: '2026-04-01', week_end: '2026-04-07', reach_target: 833333, sales_target: 84 }
    const { data: reachRows } = await supabase.from('daily_reach').select('total_reach').gte('reach_date', activeWeek.week_start).lte('reach_date', activeWeek.week_end)
    const weekReach = (reachRows || []).reduce((s, r) => s + (r.total_reach || 0), 0)
    const { data: salesRows } = await supabase.from('daily_sales').select('sales_count').gte('sale_date', activeWeek.week_start).lte('sale_date', activeWeek.week_end)
    const weekSales = (salesRows || []).reduce((s, r) => s + (r.sales_count || 0), 0)
    setWeeklyTarget({ ...activeWeek, reach_actual: weekReach, sales_actual: weekSales })

    const { data: hist } = await supabase.from('daily_reports').select('*').eq('employee_id', empId).order('report_date', { ascending: false }).limit(7)
    setHistoryReports(hist || [])

    // Load all employees for assign dropdown (excluding self)
    const { data: emps } = await supabase.from('employees').select('id,name,role,avatar_initials,color').neq('id', empId).neq('is_manager', true).order('name')
    setAllEmployees(emps || [])

    // Load tasks I assigned to others
    if (CAN_ASSIGN_EMAILS.includes(user.email)) {
      const { data: myOut } = await supabase.from('assigned_tasks')
        .select('*, assigned_to_emp:assigned_to(name,avatar_initials,color)')
        .eq('assigned_by', empId)
        .order('created_at', { ascending: false })
      setMyAssignedOut(myOut || [])
    }

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

  async function submitAssign(e) {
    e.preventDefault()
    if (!aTitle || !aTo || !employee) return
    setASaving(true)
    await supabase.from('assigned_tasks').insert({
      title: aTitle, description: aDesc || null,
      assigned_to: aTo, assigned_by: employee.id,
      due_date: aDue || null, priority: aPriority, status: 'pending'
    })
    setATitle(''); setADesc(''); setATo(''); setADue(''); setAPriority('medium')
    setASaving(false); setASaved(true)
    setTimeout(() => setASaved(false), 2500)
    loadAll()
  }

  async function deleteMyTask(id) {
    await supabase.from('assigned_tasks').delete().eq('id', id)
    setMyAssignedOut(prev => prev.filter(t => t.id !== id))
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
    await supabase.from('daily_sales').upsert({ sale_date: today, sales_count: parseInt(salesInput) || 0, revenue_usd: parseFloat(revenueInput) || 0, notes: salesNote, added_by: employee.id, updated_at: new Date().toISOString() }, { onConflict: 'sale_date' })
    const { data: allSales } = await supabase.from('daily_sales').select('sales_count')
    const total = (allSales || []).reduce((s, r) => s + (r.sales_count || 0), 0)
    await supabase.from('team_targets').update({ current_value: total }).eq('metric_key', 'total_sales')
    setSalesSaving(false); setSalesSaved(true)
    setTimeout(() => setSalesSaved(false), 3000)
    loadAll()
  }

  const completedCount = tasks.filter(t => done[t.id]).length
  const completionPct = tasks.length > 0 ? Math.round(completedCount / tasks.length * 100) : 0
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
      <div style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border)', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {[...TABS, ...(CAN_ASSIGN_EMAILS.includes(user.email) ? [{ id: 'assign', label: 'إسناد مهام', icon: '⚡' }] : [])].map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}
            style={{ padding: '12px 14px', borderBottom: tab === t.id ? `2px solid ${t.id === 'mission' ? '#F1C40F' : t.id === 'assign' ? '#F5A623' : color}` : '2px solid transparent', color: tab === t.id ? (t.id === 'mission' ? '#F1C40F' : t.id === 'assign' ? '#F5A623' : color) : 'var(--text3)', borderRadius: 0, whiteSpace: 'nowrap', fontSize: 12 }}>
            {t.icon} {t.label}
            {t.id === 'tasks' && assignedTasks.length > 0 && (
              <span style={{ background: '#E74C3C', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>{assignedTasks.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: tab === 'mission' ? 0 : '20px 16px' }}>

        {/* ══ SCHEDULE TAB ══ */}
        {tab === 'schedule' && (
          <div className="fade-in" style={{ margin: '-20px -16px' }}>
            <ContentSchedule user={user} />
          </div>
        )}

        {/* ══ ASSIGN TAB ══ */}
        {tab === 'assign' && CAN_ASSIGN_EMAILS.includes(user.email) && (
          <div className="fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>إسناد مهمة للفريق</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>أنت: {user.name}</div>

            {/* Form */}
            <div className="card" style={{ marginBottom: 14 }}>
              <form onSubmit={submitAssign}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>عنوان المهمة *</div>
                    <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="مثال: تصوير Reel للبوست الجديد" required />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>التفاصيل</div>
                    <textarea value={aDesc} onChange={e => setADesc(e.target.value)} rows={2} placeholder="تفاصيل إضافية..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>سند لـ *</div>
                      <select value={aTo} onChange={e => setATo(e.target.value)} required
                        style={{ width: '100%', padding: '9px 11px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, color: 'var(--text1)', fontSize: 13, fontFamily: 'var(--font)' }}>
                        <option value="">اختار موظف...</option>
                        {allEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
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
                  {aSaved && (
                    <div style={{ background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 8, padding: '9px 12px', color: 'var(--green)', fontSize: 12, textAlign: 'center' }}>
                      ✓ تم إسناد المهمة للموظف!
                    </div>
                  )}
                  <button className="primary-btn" type="submit" disabled={aSaving} style={{ background: '#F5A623' }}>
                    {aSaving ? 'جاري الإسناد...' : '⚡ إسناد المهمة'}
                  </button>
                </div>
              </form>
            </div>

            {/* My assigned tasks */}
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>
              المهام اللي أسندتها ({myAssignedOut.length})
            </div>
            {myAssignedOut.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>لم تسند أي مهام بعد</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myAssignedOut.map(t => (
                  <div key={t.id} className="card" style={{ padding: '12px 14px', borderColor: t.status === 'done' ? 'rgba(46,204,113,.2)' : t.priority === 'high' ? 'rgba(231,76,60,.25)' : 'var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: t.assigned_to_emp?.color || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {t.assigned_to_emp?.avatar_initials || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</span>
                          <span className={`tag ${t.status === 'done' ? 'badge-ok' : t.priority === 'high' ? 'badge-err' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}`} style={{ fontSize: 9 }}>
                            {t.status === 'done' ? '✓ منجزة' : t.priority === 'high' ? 'عاجل' : t.priority === 'medium' ? 'متوسط' : 'عادي'}
                          </span>
                        </div>
                        {t.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{t.description}</div>}
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                          لـ: <b style={{ color: 'var(--text2)' }}>{t.assigned_to_emp?.name}</b>
                          {t.due_date && <span style={{ color: '#F5A623', marginRight: 8 }}>· موعد: {t.due_date}</span>}
                        </div>
                      </div>
                      {t.status !== 'done' && (
                        <button onClick={() => deleteMyTask(t.id)} style={{ background: 'rgba(231,76,60,.1)', border: 'none', color: 'var(--red)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>حذف</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MISSION TAB (default) ══ */}
        {tab === 'mission' && (
          <div className="fade-in">
            <MotivationPage user={user} />
          </div>
        )}

        {/* ══ TARGETS TAB ══ */}
        {tab === 'targets' && (
          <div className="fade-in">
            {/* Impact Banner - personal */}
            {impact && (
              <div style={{
                background: `linear-gradient(135deg, ${impact.color}12, ${impact.color}06)`,
                border: `0.5px solid ${impact.color}40`,
                borderRight: `3px solid ${impact.color}`,
                borderRadius: 12, padding: '14px 18px', marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{impact.icon}</span>
                  <div>
                    <div style={{
                      fontSize: 16, fontWeight: 800, color: impact.color,
                      letterSpacing: .5, marginBottom: 4,
                      fontFamily: "'Cairo', sans-serif"
                    }}>{impact.headline}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{impact.sub}</div>
                  </div>
                </div>
              </div>
            )}

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
              {completionPct >= 100 && <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 8, fontSize: 12, color: 'var(--green)', textAlign: 'center' }}>🎉 أتممت كل مهامك اليوم!</div>}
            </div>

            {/* إنجي sales input */}
            {isEngy && (
              <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(46,204,113,.3)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--green)' }}>💰 تسجيل مبيعات اليوم</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>{todaySales ? `✓ تم التسجيل — ${todaySales.sales_count} مبيعة` : 'لم يُسجَّل بعد'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>عدد المبيعات</div><input type="number" value={salesInput} onChange={e => setSalesInput(e.target.value)} placeholder="مثال: 11" /></div>
                  <div><div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>الإيراد ($)</div><input type="number" value={revenueInput} onChange={e => setRevenueInput(e.target.value)} placeholder="مثال: 660" /></div>
                </div>
                <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>ملاحظة</div><input type="text" value={salesNote} onChange={e => setSalesNote(e.target.value)} placeholder="أي ملاحظة..." /></div>
                {salesSaved && <div style={{ background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--green)', textAlign: 'center', marginBottom: 8 }}>✓ تم تسجيل المبيعات وتحديث التارجت الأسبوعي!</div>}
                <button onClick={submitSales} disabled={salesSaving} className="primary-btn" style={{ background: 'var(--green)' }}>{salesSaving ? 'جاري الحفظ...' : todaySales ? '↻ تحديث مبيعات اليوم' : '+ تسجيل مبيعات اليوم'}</button>
              </div>
            )}

            {/* Weekly Target Cards */}
            {weeklyTarget && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1 }}>هدف الفريق الكلي — الأسبوع {weeklyTarget.week_number}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{weeklyTarget.week_start} → {weeklyTarget.week_end}</span>
                    <span className="tag badge-neutral" style={{ fontSize: 9 }}>⟳ يتحدث تلقائياً</span>
                  </div>
                </div>
                <div className="grid2">
                  <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,204,113,.1), transparent)', pointerEvents: 'none' }} />
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2, textAlign: 'left' }}>إجمالي المبيعات</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: wSalesPct >= 100 ? 'var(--green)' : 'var(--text1)', textAlign: 'left', direction: 'ltr', marginBottom: 2 }}>{weeklyTarget.sales_actual}<span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / {weeklyTarget.sales_target}</span></div>
                    <div className="prog-bar" style={{ height: 4, margin: '10px 0 8px' }}><div className="prog-fill" style={{ width: wSalesPct + '%', background: wSalesPct >= 100 ? 'var(--green)' : '#4A90D9', boxShadow: wSalesPct >= 100 ? '0 0 8px rgba(46,204,113,.5)' : 'none' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: wSalesPct >= 100 ? 'var(--green)' : wSalesPct >= 70 ? 'var(--amber)' : 'var(--text3)' }}>{wSalesPct}% من الهدف</span>
                      <span style={{ color: 'var(--text3)' }}>84 مبيعة/أسبوع</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,144,217,.08), transparent)', pointerEvents: 'none' }} />
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2, textAlign: 'left' }}>إجمالي الـ Reach</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: wReachPct >= 100 ? 'var(--green)' : 'var(--text1)', textAlign: 'left', direction: 'ltr', marginBottom: 2 }}>{Number(Math.round(weeklyTarget.reach_actual)).toLocaleString()}<span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / {Number(weeklyTarget.reach_target).toLocaleString()}</span></div>
                    <div className="prog-bar" style={{ height: 4, margin: '10px 0 8px' }}><div className="prog-fill" style={{ width: wReachPct + '%', background: wReachPct >= 100 ? 'var(--green)' : '#4A90D9', boxShadow: wReachPct >= 100 ? '0 0 8px rgba(46,204,113,.5)' : '0 0 6px rgba(74,144,217,.4)' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: wReachPct >= 100 ? 'var(--green)' : wReachPct >= 70 ? 'var(--amber)' : 'var(--text3)' }}>{wReachPct}% من الهدف</span>
                      <span style={{ color: 'var(--text3)' }}>833,333/أسبوع</span>
                    </div>
                  </div>
                </div>
              </div>
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
            {/* Impact reminder in tasks too */}
            {impact && (
              <div style={{
                background: `${impact.color}10`,
                border: `0.5px solid ${impact.color}30`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 20 }}>{impact.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: impact.color }}>{impact.headline}</div>
              </div>
            )}

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        {t.kpi_target && <span style={{ fontSize: 11, color: 'var(--text3)' }}><span style={{ color }}>هدف:</span> {t.kpi_target} {t.kpi_unit}</span>}
                        {t.deliver_to && (
                          <span style={{ fontSize: 10, background: 'rgba(74,144,217,.1)', border: '0.5px solid rgba(74,144,217,.25)', borderRadius: 5, padding: '2px 8px', color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ opacity: .7 }}>يُسلَّم إلى:</span>
                            <span style={{ fontWeight: 700 }}>{t.deliver_to}</span>
                            {t.deliver_by && <span style={{ opacity: .6 }}>· {t.deliver_by}</span>}
                          </span>
                        )}
                      </div>
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
                <div style={{ fontSize: 11, color: '#F5A623', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>⚡ مهام مُسنَدة إليك ({assignedTasks.length})</div>
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
                          <span className={`tag ${t.priority === 'high' ? 'badge-err' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}`} style={{ fontSize: 9 }}>{t.priority === 'high' ? 'عاجل 🔴' : t.priority === 'medium' ? 'متوسط' : 'عادي'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Team tasks - visible to manager/team_leader/ops/content_lead */}
            {teamTasks.length > 0 && (
              <TeamTasksSection
                teamTasks={teamTasks}
                userEmail={user.email}
              />
            )}
          </div>
        )}

        {/* ══ REPORT TAB ══ */}
        {tab === 'report' && (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>رفع تقرير اليوم</div>
              <div style={{ fontSize: 11, color: report ? 'var(--green)' : 'var(--text3)', marginTop: 2 }}>{report ? '✓ تم رفع تقرير اليوم — يمكنك التعديل' : 'لم يُرفع بعد'}</div>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}>المهام والأرقام الفعلية</div>
              {tasks.map((t, i) => (
                <div key={t.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < tasks.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: t.kpi_target ? 8 : 0 }}>
                    <div className={`check-circle ${done[t.id] ? 'done' : ''}`} onClick={() => toggleTask(t.id)}>
                      {done[t.id] && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{t.task_text}</div>
                      {t.deliver_to && (
                        <span style={{ fontSize: 10, background: 'rgba(74,144,217,.1)', border: '0.5px solid rgba(74,144,217,.2)', borderRadius: 5, padding: '2px 8px', color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <span style={{ opacity: .7 }}>يُسلَّم إلى:</span>
                          <span style={{ fontWeight: 700 }}>{t.deliver_to}</span>
                          {t.deliver_by && <span style={{ opacity: .6 }}>· {t.deliver_by}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  {t.kpi_target && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 30 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>الفعلي:</span>
                      <input type="number" value={kpiValues[t.id] || ''} onChange={e => setKpiValues(p => ({ ...p, [t.id]: e.target.value }))} placeholder={`هدف: ${t.kpi_target} ${t.kpi_unit}`} style={{ padding: '6px 10px', fontSize: 12, flex: 1 }} />
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
            {saved && <div style={{ background: 'rgba(46,204,113,.1)', border: '0.5px solid rgba(46,204,113,.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: 'var(--green)', fontSize: 13, textAlign: 'center' }}>✓ تم حفظ التقرير بنجاح!</div>}
            <button className="primary-btn" onClick={submitReport} disabled={saving} style={{ background: color }}>
              {saving ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />جاري الحفظ...</span> : report ? 'تحديث التقرير' : 'إرسال التقرير'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
