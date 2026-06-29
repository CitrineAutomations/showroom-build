import { AlertTriangle, MapPin, Clock, Phone, Mail } from 'lucide-react'

export default function ReturnPage() {
  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Return & Policy</div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-cormorant, serif)',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
          }}
        >
          How to return your items
        </h1>
      </div>

      {/* Process */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="section-label">Return Process</div>
        <ol style={{ margin: 0, padding: '0 0 0 var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <li style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            Package all items carefully in their original garment bags. Ensure all accessories and tags are included.
          </li>
          <li style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            Bring items to the showroom or contact your rep to arrange a messenger pickup.
          </li>
          <li style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            Items must be returned in original condition — no alterations, stains, odors, or missing accessories.
          </li>
        </ol>

        <hr className="divider" style={{ margin: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
            <MapPin size={16} style={{ color: 'var(--color-text-secondary)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Showroom Address</div>
              <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
                8285 Sunset Blvd, Studio #1<br />
                West Hollywood, CA 90046
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
            <Clock size={16} style={{ color: 'var(--color-text-secondary)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Hours</div>
              <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
                Monday – Friday · 10AM – 6PM PT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Damage policy */}
      <div className="alert alert-danger" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
          <AlertTriangle size={16} />
          Damage &amp; Loss Policy
        </div>
        <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Items returned damaged, stained, with missing parts, or not returned at all are subject to
          a loan fee per the sample loan agreement you signed.
        </p>
        <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Returns more than 2 days past the agreed return date will incur a late return penalty
          as outlined in your contract.
        </p>
      </div>

      {/* Rep contact */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="section-label">Need to Extend Your Return?</div>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Extensions are not available through the portal. Contact your rep directly.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Division PR Showroom
          </div>
          <a
            href="mailto:studio@divisionpr.com"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-accent)', fontSize: '0.9375rem', textDecoration: 'none' }}
          >
            <Mail size={15} />
            studio@divisionpr.com
          </a>
          <a
            href="tel:+13105550100"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-accent)', fontSize: '0.9375rem', textDecoration: 'none' }}
          >
            <Phone size={15} />
            +1 (310) 555-0100
          </a>
        </div>
      </div>
    </div>
  )
}
