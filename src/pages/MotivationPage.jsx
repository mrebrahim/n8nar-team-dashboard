import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// Sales impact per task type
const IMPACT_MAP = [
  { key: 'reel_content',    label: 'Reel محتوى',        who: ['أندرو إسحاق'],                       views: '10K',  leads: 100,  sales: 2,   icon: '🎬', color: '#9B59B6' },
  { key: 'montage_reel',   label: 'مونتاج Reel',        who: ['أندرو أيمن', 'إبرام'],               views: '50K',  leads: 500,  sales: 10,  icon: '✂️', color: '#E67E22' },
  { key: 'quality_post',   label: 'بوست جودة عالية',   who: ['مينا', 'أندرو إسحاق'],              views: '100K', leads: 1000, sales: 100, icon: '📝', color: '#3498DB' },
  { key: 'customer_support',label: 'دعم العملاء',       who: ['إنجي', 'بيشوي', 'مينا', 'إبراهيم'], views: null,   leads: null, sales: 2,   icon: '💬', color: '#1ABC9C', extra: '+ يجيب 10 أصدقاء' },
  { key: 'calls_dm',       label: '50 مكالمة + 100 DM', who: ['مريم'],                              views: null,   leads: null, sales: 3,   icon: '📞', color: '#27AE60', extra: 'يومياً' },
  { key: 'email_campaign', label: 'Email Campaign',     who: ['بيشوي'],                              views: null,   leads: null, sales: 1,   icon: '📧', color: '#2980B9' },
  { key: 'whatsapp_neg',   label: 'WhatsApp Negotiation',who: ['بيشوي'],                             views: null,   leads: null, sales: 1,   icon: '💚', color: '#25D366' },
  { key: 'fb_ads',         label: 'FB Ads Creative',    who: ['أندرو إسحاق', 'مريم', 'إبراهيم'],   views: null,   leads: null, sales: 10,  icon: '📢', color: '#4267B2' },
  { key: 'youtube_video',  label: 'فيديو YouTube',      who: ['إبراهيم', 'أندرو إسحاق', 'أندرو أيمن'], views: null, leads: null, sales: 2, icon: '▶️', color: '#FF0000' },
  { key: 'article',        label: 'مقالة SEO',          who: ['بيشوي'],                              views: null,   leads: null, sales: 1,   icon: '📄', color: '#16A085' },
  { key: 'new_offer',      label: 'فكرة عرض جديد',     who: ['الفريق كله'],                         views: null,   leads: null, sales: 1,   icon: '💡', color: '#F39C12', extra: 'Upsell' },
]

const MILESTONES = [
  { target: 200,  label: 'عشاء الفريق 🍽️',            color: '#3498DB' },
  { target: 400,  label: '1,000 جنيه لكل موظف 💰',     color: '#9B59B6' },
  { target: 700,  label: 'يوم إجازة مدفوعة 🏖️',        color: '#E67E22' },
  { target: 1000, label: '10,000 جنيه لكل موظف 🏆',    color: '#F1C40F' },
]

// Animated counter
function Counter({ value, duration = 1500, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const end = value
    prev.current = value
    if (start === end) return
    const steps = 60
    const inc = (end - start) / steps
    let current = start
    let step = 0
    const timer = setInterval(() => {
      step++
      current += inc
      setDisplay(Math.round(current))
      if (step >= steps) { setDisplay(end); clearInterval(timer) }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>
}

export default function MotivationPage({ user }) {
  const [totalSales, setTotalSales] = useState(0)
  const [weekSales, setWeekSales] = useState(0)
  const [weekReach, setWeekReach] = useState(0)
  const [currentWeek, setCurrentWeek] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [showImpact, setShowImpact] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    // Total sales
    const { data: sales } = await supabase.from('daily_sales').select('sales_count')
    const total = (sales || []).reduce((s, r) => s + (r.sales_count || 0), 0)
    setTotalSales(total)

    // Current week
    let { data: wt } = await supabase.from('weekly_targets')
      .select('*').lte('week_start', today).gte('week_end', today).single()
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

    // Milestones
    const { data: ms } = await supabase.from('milestones').select('*').order('sort_order')
    setMilestones(ms || [])
  }

  const GOAL = 1000
  const BONUS_PER_SALE = 10
  const progress = Math.min(Math.round((totalSales / GOAL) * 100), 100)
  const bonusPool = totalSales * BONUS_PER_SALE
  const weekSalesPct = currentWeek ? Math.min(Math.round((weekSales / currentWeek.sales_target) * 100), 100) : 0
  const weekReachPct = currentWeek ? Math.min(Math.round((weekReach / currentWeek.reach_target) * 100), 100) : 0

  // Next milestone
  const nextMilestone = MILESTONES.find(m => totalSales < m.target)
  const salesToNext = nextMilestone ? nextMilestone.target - totalSales : 0

  return (
    <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>

      {/* ══ MISSION BOARD ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0F1F3D 50%, #0A1628 100%)',
        border: '0.5px solid rgba(74,144,217,.3)',
        borderRadius: 16, padding: '24px 24px 20px', marginBottom: 16,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,144,217,.06), transparent)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 4, fontWeight: 600, marginBottom: 6 }}>MISSION</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>1000 SALES</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>1 أبريل — 23 يونيو 2026</div>
        </div>

        {/* Big progress */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: progress >= 100 ? '#2ECC71' : '#4A90D9', lineHeight: 1, fontFamily: 'var(--mono)' }}>
            <Counter value={totalSales} />
            <span style={{ fontSize: 22, color: 'var(--text3)', fontWeight: 400 }}> / 1,000</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{progress}% من الهدف</div>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'relative', height: 12, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'visible', marginBottom: 16 }}>
          <div style={{
            height: '100%', width: progress + '%', borderRadius: 99,
            background: 'linear-gradient(90deg, #4A90D9, #2ECC71)',
            boxShadow: '0 0 12px rgba(74,144,217,.6)',
            transition: 'width 1.5s cubic-bezier(.4,0,.2,1)'
          }} />
          {/* Milestone markers */}
          {MILESTONES.map(m => {
            const pct = (m.target / GOAL) * 100
            const reached = totalSales >= m.target
            return (
              <div key={m.target} style={{ position: 'absolute', top: -4, left: pct + '%', transform: 'translateX(-50%)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: reached ? m.color : 'var(--bg3)', border: `2px solid ${reached ? m.color : 'rgba(255,255,255,.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
                  {reached ? '✓' : ''}
                </div>
                <div style={{ fontSize: 8, color: 'var(--text3)', textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap' }}>{m.target}</div>
              </div>
            )
          })}
        </div>

        {/* Bonus pool */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'rgba(241,196,15,.06)', border: '0.5px solid rgba(241,196,15,.2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'rgba(241,196,15,.6)', letterSpacing: 2, marginBottom: 6 }}>TEAM BONUS UNLOCKED</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F1C40F', fontFamily: 'var(--mono)' }}>
              <Counter value={bonusPool} suffix=" EGP" />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(241,196,15,.5)', marginTop: 4 }}>كل مبيعة = +10 جنيه للبونص</div>
          </div>
          <div style={{ background: 'rgba(46,204,113,.06)', border: '0.5px solid rgba(46,204,113,.2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'rgba(46,204,113,.6)', letterSpacing: 2, marginBottom: 6 }}>لو وصلنا 1000 مبيعة</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2ECC71', fontFamily: 'var(--mono)' }}>10,000 EGP</div>
            <div style={{ fontSize: 10, color: 'rgba(46,204,113,.5)', marginTop: 4 }}>لكل موظف في الفريق 🏆</div>
          </div>
        </div>
      </div>

      {/* ══ WEEKLY TRACKER ══ */}
      {currentWeek && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>WEEK {currentWeek.week_number}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>مبيعات الأسبوع</div>
              </div>
              {weekSalesPct >= 100
                ? <span style={{ fontSize: 20 }}>🔥</span>
                : <span style={{ fontSize: 11, color: 'var(--text3)' }}>{currentWeek.sales_target - weekSales} باقي</span>
              }
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: weekSalesPct >= 100 ? 'var(--green)' : 'var(--text1)', fontFamily: 'var(--mono)', marginBottom: 8 }}>
              {weekSales}<span style={{ fontSize: 15, color: 'var(--text3)', fontWeight: 400 }}> / {currentWeek.sales_target}</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: weekSalesPct + '%', background: weekSalesPct >= 100 ? 'var(--green)' : '#4A90D9', borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
            {weekSalesPct >= 100 && (
              <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)', letterSpacing: 1 }}>🔥 WEEK TARGET ACHIEVED</div>
            )}
          </div>
          <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>WEEK {currentWeek.week_number}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Reach الأسبوع</div>
              </div>
              {weekReachPct >= 100 && <span style={{ fontSize: 20 }}>🔥</span>}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: weekReachPct >= 100 ? 'var(--green)' : 'var(--text1)', fontFamily: 'var(--mono)', marginBottom: 8 }}>
              {Number(Math.round(weekReach)).toLocaleString()}<span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}> / {Number(currentWeek.reach_target).toLocaleString()}</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: weekReachPct + '%', background: weekReachPct >= 100 ? 'var(--green)' : '#4A90D9', borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8, textAlign: 'left' }}>{weekReachPct}% • {currentWeek.week_start} → {currentWeek.week_end}</div>
          </div>
        </div>
      )}

      {/* ══ MILESTONES ══ */}
      <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14, letterSpacing: 1 }}>🏆 MILESTONES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {MILESTONES.map(m => {
            const reached = totalSales >= m.target
            const pct = Math.min(Math.round((totalSales / m.target) * 100), 100)
            const isCurrent = totalSales < m.target && (!MILESTONES.find(x => x.target < m.target) || totalSales >= MILESTONES[MILESTONES.indexOf(m) - 1]?.target)
            return (
              <div key={m.target} style={{
                background: reached ? `rgba(${m.color === '#F1C40F' ? '241,196,15' : m.color === '#9B59B6' ? '155,89,182' : m.color === '#E67E22' ? '230,126,34' : '52,152,219'},.08)` : 'var(--bg2)',
                border: `0.5px solid ${reached ? m.color + '60' : isCurrent ? m.color + '40' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 14px',
                opacity: reached ? 1 : 0.7,
                position: 'relative', overflow: 'hidden'
              }}>
                {reached && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${m.color}15, transparent)` }} />}
                <div style={{ fontSize: 22, fontWeight: 800, color: reached ? m.color : 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>{m.target}</div>
                <div style={{ fontSize: 11, color: reached ? 'var(--text1)' : 'var(--text3)', marginBottom: 8, lineHeight: 1.4 }}>{m.label}</div>
                <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: m.color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4 }}>
                  {reached ? '✓ تم تحقيقه' : `${m.target - totalSales} مبيعة متبقية`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ NEXT MILESTONE ══ */}
      {nextMilestone && (
        <div style={{
          background: `linear-gradient(135deg, rgba(74,144,217,.08), rgba(46,204,113,.05))`,
          border: '0.5px solid rgba(74,144,217,.25)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, letterSpacing: 1 }}>الـ Milestone الجاي</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{nextMilestone.label}</div>
          </div>
          <div style={{ textAlign: 'left', flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{salesToNext}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>مبيعة متبقية</div>
          </div>
        </div>
      )}

      {/* ══ IMPACT MAP - Toggle ══ */}
      <button onClick={() => setShowImpact(!showImpact)} style={{
        width: '100%', background: showImpact ? 'var(--bg2)' : 'var(--bg1)',
        border: '0.5px solid var(--border2)', borderRadius: 12, padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', fontFamily: 'var(--font)', marginBottom: showImpact ? 10 : 16
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>⚡ شغلك = مبيعات</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>اضغط وشوف إزاي كل مهمة بتتحول لمبيعات حقيقية</div>
        </div>
        <div style={{ fontSize: 18, color: 'var(--blue)' }}>{showImpact ? '▲' : '▼'}</div>
      </button>

      {showImpact && (
        <div className="fade-in" style={{ marginBottom: 16 }}>
          {IMPACT_MAP.map((item, i) => (
            <div key={item.key} className="fade-in" style={{
              animationDelay: `${i * 0.04}s`,
              background: 'var(--bg1)', border: `0.5px solid ${item.color}30`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 8,
              borderRight: `3px solid ${item.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{item.who.join(' · ')}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontFamily: 'var(--mono)' }}>
                    +{item.sales}
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}> مبيعة</span>
                  </div>
                  {item.extra && <div style={{ fontSize: 9, color: item.color, textAlign: 'right' }}>{item.extra}</div>}
                </div>
              </div>
              {/* Flow: Task → Views → Leads → Sales */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text1)' }}>
                  {item.label}
                </div>
                {item.views && (
                  <>
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}>→</span>
                    <div style={{ background: `${item.color}15`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: item.color }}>{item.views} views</div>
                  </>
                )}
                {item.leads && (
                  <>
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}>→</span>
                    <div style={{ background: 'rgba(245,166,35,.12)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#F5A623' }}>{item.leads.toLocaleString()} leads</div>
                  </>
                )}
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>→</span>
                <div style={{ background: 'rgba(46,204,113,.12)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>
                  {item.sales} {item.sales > 1 ? 'مبيعات' : 'مبيعة'} = {item.sales * 10} EGP للبونص
                </div>
              </div>
            </div>
          ))}

          {/* Summary message */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(46,204,113,.08), rgba(74,144,217,.05))',
            border: '0.5px solid rgba(46,204,113,.2)', borderRadius: 12, padding: '14px 18px',
            textAlign: 'center', marginTop: 10
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text1)' }}>كل مهمة تعملها بجودة عالية</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
              بتتحول لـ <span style={{ color: 'var(--green)', fontWeight: 700 }}>مبيعات</span><br/>
              كل مبيعة = <span style={{ color: '#F1C40F', fontWeight: 700 }}>+10 جنيه للبونص</span><br/>
              1000 مبيعة = <span style={{ color: '#F1C40F', fontWeight: 700 }}>10,000 جنيه لكل موظف 🏆</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
