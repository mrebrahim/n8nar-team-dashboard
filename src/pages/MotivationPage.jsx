import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const IMPACT_MAP = [
  { key: 'reel_content',    label: 'Reel محتوى',         who: ['أندرو إسحاق'],                        views: '10K',  leads: 100,  sales: 2,   icon: '🎬', color: '#9B59B6' },
  { key: 'montage_reel',   label: 'مونتاج Reel',          who: ['أندرو أيمن', 'إبرام'],                views: '50K',  leads: 500,  sales: 10,  icon: '✂️', color: '#E67E22' },
  { key: 'quality_post',   label: 'بوست جودة عالية',      who: ['مينا', 'أندرو إسحاق'],               views: '100K', leads: 1000, sales: 100, icon: '📝', color: '#3498DB' },
  { key: 'customer_support',label: 'دعم العملاء',          who: ['إنجي','بيشوي','مينا','إبراهيم'],      views: null,   leads: null, sales: 2,   icon: '💬', color: '#1ABC9C', extra: '+ يجيب 10 أصدقاء' },
  { key: 'calls_dm',       label: '50 مكالمة + 100 DM',   who: ['مريم'],                               views: null,   leads: null, sales: 3,   icon: '📞', color: '#27AE60', extra: 'يومياً' },
  { key: 'email_campaign', label: 'Email Campaign',        who: ['بيشوي'],                              views: null,   leads: null, sales: 1,   icon: '📧', color: '#2980B9' },
  { key: 'whatsapp_neg',   label: 'WhatsApp Negotiation',  who: ['بيشوي'],                              views: null,   leads: null, sales: 1,   icon: '💚', color: '#25D366' },
  { key: 'fb_ads',         label: 'FB Ads Creative',       who: ['أندرو إسحاق','مريم','إبراهيم'],      views: null,   leads: null, sales: 10,  icon: '📢', color: '#4267B2' },
  { key: 'youtube_video',  label: 'فيديو YouTube',         who: ['إبراهيم','أندرو إسحاق','أندرو أيمن'],views: null,   leads: null, sales: 2,   icon: '▶️', color: '#FF0000' },
  { key: 'article',        label: 'مقالة SEO',             who: ['بيشوي'],                              views: null,   leads: null, sales: 1,   icon: '📄', color: '#16A085' },
  { key: 'new_offer',      label: 'فكرة عرض جديد',        who: ['الفريق كله'],                         views: null,   leads: null, sales: 1,   icon: '💡', color: '#F39C12', extra: 'Upsell' },
]

// Milestones with deadlines per the 3-month plan
const MILESTONES = [
  {
    target: 200,
    label: 'عشاء الفريق 🍽️',
    deadline: '30 أبريل 2026',
    deadlineDate: '2026-04-30',
    month: 'الشهر الأول',
    monthColor: '#3498DB',
    color: '#3498DB',
    desc: '200 مبيعة في أبريل',
  },
  {
    target: 400,
    label: '1,000 جنيه لكل موظف 💰',
    deadline: '31 مايو 2026',
    deadlineDate: '2026-05-31',
    month: 'الشهر الثاني',
    monthColor: '#9B59B6',
    color: '#9B59B6',
    desc: '400 مبيعة بنهاية مايو',
  },
  {
    target: 700,
    label: 'يوم إجازة مدفوعة 🏖️',
    deadline: '23 يونيو 2026',
    deadlineDate: '2026-06-23',
    month: 'الشهر الثالث',
    monthColor: '#E67E22',
    color: '#E67E22',
    desc: '700 مبيعة بنهاية يونيو',
  },
  {
    target: 1000,
    label: '10,000 جنيه لكل موظف 🏆',
    deadline: '23 يونيو 2026',
    deadlineDate: '2026-06-23',
    month: 'الهدف الكلي',
    monthColor: '#F1C40F',
    color: '#F1C40F',
    desc: '1,000 مبيعة — البونص الكامل',
  },
]

// Days remaining calculator
function daysLeft(dateStr) {
  const today = new Date()
  today.setHours(0,0,0,0)
  const target = new Date(dateStr)
  const diff = Math.ceil((target - today) / (1000*60*60*24))
  return diff
}

function Counter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current; const end = value; prev.current = value
    if (start === end) return
    const steps = 50; const inc = (end - start) / steps; let cur = start; let s = 0
    const t = setInterval(() => {
      s++; cur += inc; setDisplay(Math.round(cur))
      if (s >= steps) { setDisplay(end); clearInterval(t) }
    }, duration / steps)
    return () => clearInterval(t)
  }, [value])
  return <>{display.toLocaleString()}</>
}

export default function MotivationPage({ user }) {
  const [totalSales, setTotalSales] = useState(0)
  const [weekSales, setWeekSales] = useState(0)
  const [weekReach, setWeekReach] = useState(0)
  const [currentWeek, setCurrentWeek] = useState(null)
  const [showImpact, setShowImpact] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: sales } = await supabase.from('daily_sales').select('sales_count')
    const total = (sales || []).reduce((s, r) => s + (r.sales_count || 0), 0)
    setTotalSales(total)

    let { data: wt } = await supabase.from('weekly_targets').select('*').lte('week_start', today).gte('week_end', today).single()
    if (!wt) {
      const { data: next } = await supabase.from('weekly_targets').select('*').gte('week_start', today).order('week_start').limit(1).single()
      wt = next
    }
    setCurrentWeek(wt)
    if (wt) {
      const { data: wr } = await supabase.from('daily_reach').select('total_reach').gte('reach_date', wt.week_start).lte('reach_date', wt.week_end)
      setWeekReach((wr || []).reduce((s, r) => s + (r.total_reach || 0), 0))
      const { data: ws } = await supabase.from('daily_sales').select('sales_count').gte('sale_date', wt.week_start).lte('sale_date', wt.week_end)
      setWeekSales((ws || []).reduce((s, r) => s + (r.sales_count || 0), 0))
    }
  }

  const GOAL = 1000
  const progress = Math.min(Math.round((totalSales / GOAL) * 100), 100)
  const bonusPool = totalSales * 10
  const weekSalesPct = currentWeek ? Math.min(Math.round((weekSales / currentWeek.sales_target) * 100), 100) : 0
  const weekReachPct = currentWeek ? Math.min(Math.round((weekReach / currentWeek.reach_target) * 100), 100) : 0

  const nextMilestone = MILESTONES.find(m => totalSales < m.target)

  return (
    <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>

      {/* ══ MISSION BOARD ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628, #0F1F3D, #0A1628)',
        border: '0.5px solid rgba(74,144,217,.3)', borderRadius: 16,
        padding: '24px 24px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,144,217,.05), transparent)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 5, fontWeight: 600, marginBottom: 5 }}>MISSION</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>1000 SALES</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>1 أبريل — 23 يونيو 2026 · 3 شهور</div>
        </div>

        {/* Big number */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: progress >= 100 ? '#2ECC71' : '#4A90D9', lineHeight: 1, fontFamily: 'var(--mono)' }}>
            <Counter value={totalSales} />
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,.3)', fontWeight: 400 }}> / 1,000</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{progress}% من الهدف</div>
        </div>

        {/* Progress bar with month markers */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div style={{ height: 10, background: 'rgba(255,255,255,.07)', borderRadius: 99, overflow: 'visible' }}>
            <div style={{
              height: '100%', width: progress + '%', borderRadius: 99,
              background: 'linear-gradient(90deg, #4A90D9, #9B59B6, #2ECC71)',
              boxShadow: '0 0 14px rgba(74,144,217,.5)',
              transition: 'width 1.5s cubic-bezier(.4,0,.2,1)'
            }} />
          </div>
          {/* Milestone dots on bar */}
          {MILESTONES.map(m => {
            const pct = (m.target / GOAL) * 100
            const reached = totalSales >= m.target
            return (
              <div key={m.target} style={{ position: 'absolute', top: -5, left: `calc(${pct}% - 10px)` }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: reached ? m.color : 'var(--bg2)',
                  border: `2px solid ${reached ? m.color : 'rgba(255,255,255,.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff', fontWeight: 700,
                  boxShadow: reached ? `0 0 10px ${m.color}80` : 'none',
                  transition: 'all .5s'
                }}>
                  {reached ? '✓' : ''}
                </div>
                <div style={{
                  position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9, color: reached ? m.color : 'var(--text3)',
                  whiteSpace: 'nowrap', fontWeight: reached ? 700 : 400
                }}>{m.target}</div>
              </div>
            )
          })}
        </div>

        {/* Bonus cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(241,196,15,.06)', border: '0.5px solid rgba(241,196,15,.2)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'rgba(241,196,15,.6)', letterSpacing: 2, marginBottom: 5 }}>TEAM BONUS UNLOCKED</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#F1C40F', fontFamily: 'var(--mono)' }}>
              <Counter value={bonusPool} /> EGP
            </div>
            <div style={{ fontSize: 10, color: 'rgba(241,196,15,.45)', marginTop: 3 }}>كل مبيعة = +10 جنيه</div>
          </div>
          <div style={{ background: 'rgba(46,204,113,.06)', border: '0.5px solid rgba(46,204,113,.2)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'rgba(46,204,113,.6)', letterSpacing: 2, marginBottom: 5 }}>FINAL BONUS</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#2ECC71', fontFamily: 'var(--mono)' }}>10,000 EGP</div>
            <div style={{ fontSize: 10, color: 'rgba(46,204,113,.45)', marginTop: 3 }}>لكل موظف عند 1000 مبيعة 🏆</div>
          </div>
        </div>
      </div>

      {/* ══ MILESTONES WITH DEADLINES ══ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 2, marginBottom: 10 }}>🏆 MILESTONES — خطة 3 شهور</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          {MILESTONES.map((m, i) => {
            const reached = totalSales >= m.target
            const pct = Math.min(Math.round((totalSales / m.target) * 100), 100)
            const days = daysLeft(m.deadlineDate)
            const isNext = !reached && (i === 0 || totalSales >= MILESTONES[i-1]?.target)
            return (
              <div key={m.target} style={{
                background: reached ? `${m.color}12` : isNext ? `${m.color}08` : 'var(--bg1)',
                border: `0.5px solid ${reached ? m.color + '50' : isNext ? m.color + '35' : 'var(--border)'}`,
                borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden',
                transition: 'all .3s'
              }}>
                {reached && (
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${m.color}18, transparent)`, pointerEvents: 'none' }} />
                )}
                {/* Month label */}
                <div style={{ fontSize: 9, fontWeight: 700, color: m.monthColor, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                  {m.month}
                </div>
                {/* Target number */}
                <div style={{ fontSize: 30, fontWeight: 900, color: reached ? m.color : 'var(--text1)', fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 4 }}>
                  {m.target.toLocaleString()}
                </div>
                {/* Reward */}
                <div style={{ fontSize: 12, color: reached ? 'var(--text1)' : 'var(--text2)', marginBottom: 8, lineHeight: 1.4, fontWeight: reached ? 600 : 400 }}>
                  {m.label}
                </div>
                {/* Description */}
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>{m.desc}</div>
                {/* Progress */}
                <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: pct + '%', background: m.color, borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: reached ? m.color : 'var(--text3)', fontWeight: reached ? 700 : 400 }}>
                    {reached ? '✓ تم تحقيقه!' : `${m.target - totalSales} متبقية`}
                  </span>
                  {!reached && (
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: days <= 7 ? '#E74C3C' : days <= 30 ? '#F5A623' : 'var(--text3)',
                      background: days <= 7 ? 'rgba(231,76,60,.15)' : days <= 30 ? 'rgba(245,166,35,.15)' : 'var(--bg2)',
                      padding: '2px 6px', borderRadius: 4
                    }}>
                      {days > 0 ? `${days} يوم` : '⚠️ انتهى الوقت'}
                    </span>
                  )}
                </div>
                {/* Deadline */}
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 5 }}>
                  الموعد: {m.deadline}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ NEXT MILESTONE COUNTDOWN ══ */}
      {nextMilestone && (
        <div style={{
          background: `linear-gradient(135deg, ${nextMilestone.color}10, ${nextMilestone.color}06)`,
          border: `0.5px solid ${nextMilestone.color}35`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, letterSpacing: 1 }}>الـ Milestone الجاية</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: nextMilestone.color }}>{nextMilestone.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{nextMilestone.month} · موعد {nextMilestone.deadline}</div>
          </div>
          <div style={{ display: 'flex', gap: 14, textAlign: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: nextMilestone.color, fontFamily: 'var(--mono)' }}>{nextMilestone.target - totalSales}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>مبيعة متبقية</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: daysLeft(nextMilestone.deadlineDate) <= 7 ? '#E74C3C' : 'var(--amber)', fontFamily: 'var(--mono)' }}>{daysLeft(nextMilestone.deadlineDate)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>يوم باقي</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ WEEKLY TRACKER ══ */}
      {currentWeek && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 2 }}>WEEK {currentWeek.week_number}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>مبيعات الأسبوع</div>
              </div>
              <span style={{ fontSize: weekSalesPct >= 100 ? 20 : 11, color: 'var(--text3)' }}>
                {weekSalesPct >= 100 ? '🔥' : `${currentWeek.sales_target - weekSales} باقي`}
              </span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--mono)', color: weekSalesPct >= 100 ? 'var(--green)' : 'var(--text1)', marginBottom: 8 }}>
              {weekSales}<span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}> / {currentWeek.sales_target}</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: weekSalesPct + '%', background: weekSalesPct >= 100 ? 'var(--green)' : '#4A90D9', borderRadius: 99 }} />
            </div>
            {weekSalesPct >= 100 && <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--green)', letterSpacing: 1 }}>🔥 WEEK TARGET ACHIEVED</div>}
          </div>
          <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 2 }}>WEEK {currentWeek.week_number}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Reach الأسبوع</div>
              </div>
              {weekReachPct >= 100 && <span style={{ fontSize: 20 }}>🔥</span>}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--mono)', color: weekReachPct >= 100 ? 'var(--green)' : 'var(--text1)', marginBottom: 8 }}>
              {Number(Math.round(weekReach)).toLocaleString()}<span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}> / {Number(currentWeek.reach_target).toLocaleString()}</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: weekReachPct + '%', background: weekReachPct >= 100 ? 'var(--green)' : '#4A90D9', borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, textAlign: 'left' }}>{weekReachPct}% • {currentWeek.week_start} → {currentWeek.week_end}</div>
          </div>
        </div>
      )}

      {/* ══ IMPACT MAP ══ */}
      <button onClick={() => setShowImpact(!showImpact)} style={{
        width: '100%', background: showImpact ? 'var(--bg2)' : 'var(--bg1)',
        border: '0.5px solid var(--border2)', borderRadius: 12, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', fontFamily: 'var(--font)', marginBottom: showImpact ? 10 : 0
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>⚡ شغلك = مبيعات</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>اضغط وشوف إزاي كل مهمة بتتحول لمبيعات حقيقية</div>
        </div>
        <div style={{ fontSize: 16, color: 'var(--blue)' }}>{showImpact ? '▲' : '▼'}</div>
      </button>

      {showImpact && (
        <div className="fade-in">
          {IMPACT_MAP.map((item, i) => (
            <div key={item.key} className="fade-in" style={{
              animationDelay: `${i * 0.03}s`,
              background: 'var(--bg1)', borderRadius: 10, padding: '12px 14px',
              marginBottom: 8, borderRight: `3px solid ${item.color}`,
              border: `0.5px solid ${item.color}20`, borderRight: `3px solid ${item.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{item.who.join(' · ')}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: 'var(--mono)' }}>
                    +{item.sales} <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>مبيعة</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#F1C40F', textAlign: 'left' }}>= {item.sales * 10} EGP للبونص</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg2)', borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{item.label}</div>
                {item.views && (<><span style={{ color: 'var(--text3)', fontSize: 11 }}>→</span><div style={{ background: `${item.color}18`, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: item.color }}>{item.views} views</div></>)}
                {item.leads && (<><span style={{ color: 'var(--text3)', fontSize: 11 }}>→</span><div style={{ background: 'rgba(245,166,35,.12)', borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#F5A623' }}>{item.leads.toLocaleString()} leads</div></>)}
                <span style={{ color: 'var(--text3)', fontSize: 11 }}>→</span>
                <div style={{ background: 'rgba(46,204,113,.12)', borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>{item.sales} {item.sales > 1 ? 'مبيعات' : 'مبيعة'}</div>
                {item.extra && <span style={{ fontSize: 10, color: item.color }}>{item.extra}</span>}
              </div>
            </div>
          ))}
          <div style={{ background: 'linear-gradient(135deg, rgba(46,204,113,.08), rgba(241,196,15,.05))', border: '0.5px solid rgba(46,204,113,.2)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>كل مهمة تعملها بجودة عالية</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.9 }}>
              بتتحول لـ <span style={{ color: 'var(--green)', fontWeight: 700 }}>مبيعات حقيقية</span><br/>
              كل مبيعة = <span style={{ color: '#F1C40F', fontWeight: 700 }}>+10 جنيه للبونص</span><br/>
              1000 مبيعة = <span style={{ color: '#F1C40F', fontWeight: 700 }}>10,000 جنيه لكل موظف 🏆</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
