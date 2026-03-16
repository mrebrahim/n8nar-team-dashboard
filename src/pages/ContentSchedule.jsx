import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const STATUS_CONFIG = {
  'pending':     { label: 'لم يبدأ',        bg: 'rgba(100,100,100,.15)', color: '#888',          border: 'rgba(100,100,100,.2)' },
  'in_progress': { label: 'قيد الكتابة',    bg: 'rgba(245,166,35,.12)',  color: '#F5A623',       border: 'rgba(245,166,35,.3)' },
  'scheduled':   { label: 'جاهز للنشر',     bg: 'rgba(74,144,217,.12)',  color: '#4A90D9',       border: 'rgba(74,144,217,.3)' },
  'published':   { label: 'تم النشر ✓',     bg: 'rgba(46,204,113,.12)',  color: '#2ECC71',       border: 'rgba(46,204,113,.3)' },
}

const DAY_COLORS = {
  'الأربعاء': '#4A90D9',
  'الخميس':  '#9B59B6',
  'الأحد':   '#1ABC9C',
  'الاثنين':  '#E67E22',
  'الثلاثاء': '#E74C3C',
}

const COURSE_COLORS = {
  'n8n Automation': '#4A90D9',
  'AI Video':       '#0F6E56',
  'Vibe Coding':    '#9B59B6',
  'Bundle الـ 3':   '#F5A623',
  'Evergreen':      '#888',
}

export default function ContentSchedule({ user }) {
  const [schedule, setSchedule] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [view, setView] = useState('week') // 'week' | 'today'
  const [updating, setUpdating] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  const canEdit = ['ibrahim@n8nar.com','mina@n8nar.com','andrew.i@n8nar.com','bishoy@n8nar.com'].includes(user.email)

  useEffect(() => { loadSchedule() }, [])

  async function loadSchedule() {
    const { data } = await supabase.from('content_schedule').select('*').order('publish_date').order('post_number')
    setSchedule(data || [])

    // Auto-select current week
    const todayDate = new Date(today)
    const weekStarts = [
      [1,'2026-04-01'],[2,'2026-04-08'],[3,'2026-04-15'],[4,'2026-04-22']
    ]
    for (const [wn, ws] of weekStarts.reverse()) {
      if (todayDate >= new Date(ws)) { setSelectedWeek(wn); break }
    }
  }

  async function updateStatus(id, newStatus) {
    setUpdating(id)
    await supabase.from('content_schedule').update({ status: newStatus }).eq('id', id)
    setSchedule(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
    setUpdating(null)
  }

  const weekPosts = schedule.filter(p => p.week_number === selectedWeek)
  const todayPosts = schedule.filter(p => p.publish_date === today || p.prep_date === today)

  // Group week posts by publish date
  const byDate = {}
  weekPosts.forEach(p => {
    const key = p.publish_date
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(p)
  })

  const weeks = [1,2,3,4]
  const weekSats = { 1:'السبت 4 أبريل',2:'السبت 11 أبريل',3:'السبت 18 أبريل',4:'السبت 25 أبريل' }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3, letterSpacing: 1 }}>CONTENT SCHEDULE</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>جدول المحتوى — أبريل 2026</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
          الجمعة والسبت إجازة — محتوى السبت يُنشر الخميس ويُجهَّز الأربعاء
        </div>
      </div>

      {/* Rule explanation */}
      <div style={{ background: 'rgba(74,144,217,.06)', border: '0.5px solid rgba(74,144,217,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
        📅 <b style={{ color: 'var(--text1)' }}>قاعدة الجدول:</b> أيام العمل الأحد → الخميس &nbsp;|&nbsp;
        🔴 الجمعة والسبت إجازة<br/>
        📝 المحتوى اللي كان مفروض <b style={{ color: '#9B59B6' }}>السبت</b> → يُنشر <b style={{ color: '#9B59B6' }}>الخميس</b> ويُجهَّز <b style={{ color: '#4A90D9' }}>الأربعاء</b>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setView('week')} style={{ background: view === 'week' ? 'var(--bg2)' : 'transparent', border: `0.5px solid ${view === 'week' ? 'var(--border2)' : 'var(--border)'}`, color: view === 'week' ? 'var(--blue)' : 'var(--text3)', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>
          📅 عرض أسبوعي
        </button>
        <button onClick={() => setView('today')} style={{ background: view === 'today' ? 'var(--bg2)' : 'transparent', border: `0.5px solid ${view === 'today' ? 'var(--border2)' : 'var(--border)'}`, color: view === 'today' ? 'var(--green)' : 'var(--text3)', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>
          ⚡ مهام اليوم فقط
        </button>
      </div>

      {/* Week selector */}
      {view === 'week' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {weeks.map(w => {
            const wPosts = schedule.filter(p => p.week_number === w)
            const done = wPosts.filter(p => p.status === 'published').length
            return (
              <button key={w} onClick={() => setSelectedWeek(w)} style={{
                background: selectedWeek === w ? 'var(--bg2)' : 'transparent',
                border: `0.5px solid ${selectedWeek === w ? 'var(--border2)' : 'var(--border)'}`,
                borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font)', color: selectedWeek === w ? 'var(--text1)' : 'var(--text3)'
              }}>
                الأسبوع {w}
                <span style={{ marginRight: 6, fontSize: 10, color: done === wPosts.length && wPosts.length > 0 ? 'var(--green)' : 'var(--text3)' }}>
                  {done}/{wPosts.length}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* TODAY VIEW */}
      {view === 'today' && (
        <div className="fade-in">
          {todayPosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
              <div>مفيش محتوى مجدول ليوم {today}</div>
            </div>
          ) : (
            todayPosts.map(post => (
              <PostCard key={post.id} post={post} today={today} canEdit={canEdit} updating={updating} onStatusChange={updateStatus} />
            ))
          )}
        </div>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div className="fade-in">
          {/* Off days notice */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'rgba(231,76,60,.08)', border: '0.5px solid rgba(231,76,60,.2)', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#E74C3C' }}>
              🔴 الجمعة {weekSats[selectedWeek]?.replace('السبت','').trim()} — إجازة
            </div>
            <div style={{ background: 'rgba(231,76,60,.08)', border: '0.5px solid rgba(231,76,60,.2)', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#E74C3C' }}>
              🔴 {weekSats[selectedWeek]} — إجازة
            </div>
          </div>

          {/* Posts grouped by day */}
          {Object.entries(byDate).sort().map(([dateStr, posts]) => {
            const d = new Date(dateStr + 'T00:00:00')
            const dayAr = posts[0]?.publish_day_ar || ''
            const dayColor = DAY_COLORS[dayAr] || 'var(--text3)'
            const isToday = dateStr === today
            const isPast = dateStr < today
            return (
              <div key={dateStr} style={{ marginBottom: 14 }}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ background: isToday ? dayColor : 'var(--bg2)', border: `0.5px solid ${dayColor}50`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: isToday ? '#fff' : dayColor }}>
                    {dayAr} {dateStr}
                    {isToday && <span style={{ marginRight: 6, fontSize: 10, background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: 4 }}>اليوم</span>}
                  </div>
                  {posts.some(p => p.scheduled_on_sat) && (
                    <span style={{ fontSize: 10, color: '#9B59B6', background: 'rgba(155,89,182,.12)', padding: '3px 8px', borderRadius: 5, border: '0.5px solid rgba(155,89,182,.3)' }}>
                      📌 يشمل محتوى السبت المحرَّك
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 'auto' }}>
                    {posts.filter(p=>p.status==='published').length}/{posts.length} منشور
                  </span>
                </div>

                {posts.map(post => (
                  <PostCard key={post.id} post={post} today={today} canEdit={canEdit} updating={updating} onStatusChange={updateStatus} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, today, canEdit, updating, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG['pending']
  const courseColor = COURSE_COLORS[post.course_target] || '#888'
  const isPrep = post.prep_date === today
  const isPast = post.publish_date < today

  return (
    <div style={{
      background: 'var(--bg1)',
      border: `0.5px solid ${post.status === 'published' ? 'rgba(46,204,113,.25)' : 'var(--border)'}`,
      borderRight: `3px solid ${courseColor}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
      opacity: isPast && post.status === 'pending' ? 0.6 : 1
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Content info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: `${courseColor}20`, color: courseColor, padding: '2px 8px', borderRadius: 5 }}>
              {post.course_target}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{post.pattern}</span>
            {post.scheduled_on_sat && (
              <span style={{ fontSize: 9, color: '#9B59B6', background: 'rgba(155,89,182,.1)', padding: '2px 6px', borderRadius: 4 }}>كان السبت</span>
            )}
            {isPrep && (
              <span style={{ fontSize: 9, color: '#F5A623', background: 'rgba(245,166,35,.12)', padding: '2px 6px', borderRadius: 4 }}>📝 يوم التجهيز</span>
            )}
          </div>
          {/* Hook */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 6, lineHeight: 1.4 }}>
            {post.hook?.substring(0, 100)}{post.hook?.length > 100 ? '...' : ''}
          </div>
          {/* Meta */}
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
            <span>📅 نشر: <b style={{ color: 'var(--text2)' }}>{post.publish_day_ar} {post.publish_date}</b></span>
            <span>📝 تجهيز: <b style={{ color: 'var(--text2)' }}>{post.prep_day_ar} {post.prep_date}</b></span>
            <span>✍️ {post.post_owner}</span>
            <span>📄 {post.article_owner}</span>
          </div>

          {/* Article */}
          {expanded && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>📄 المقالة المرتبطة</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1ABC9C', marginBottom: 3 }}>{post.article_title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                كلمة مفتاحية: {post.article_keyword}<br/>
                رابط: {post.article_url}
              </div>
            </div>
          )}
        </div>

        {/* Status + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`, padding: '3px 10px', borderRadius: 6 }}>
            {sc.label}
          </div>
          {canEdit && (
            <select
              value={post.status}
              disabled={updating === post.id}
              onChange={e => onStatusChange(post.id, e.target.value)}
              style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontSize: 10, padding: '3px 6px', fontFamily: 'var(--font)', cursor: 'pointer' }}
            >
              <option value="pending">لم يبدأ</option>
              <option value="in_progress">قيد الكتابة</option>
              <option value="scheduled">جاهز للنشر</option>
              <option value="published">تم النشر ✓</option>
            </select>
          )}
          <button onClick={() => setExpanded(!expanded)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}>
            {expanded ? '▲ أقل' : '▼ المقالة'}
          </button>
        </div>
      </div>
    </div>
  )
}
