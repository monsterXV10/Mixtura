export const metadata = { title: 'Mentions légales – Mixtura' };

export default function MentionsPage() {
  return (
    <article className="space-y-8" style={{ color: 'var(--text)' }}>
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Mentions légales</h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Dernière mise à jour : mai 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>1. Éditeur du site</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <p><strong style={{ color: 'var(--text)' }}>Nom du service :</strong> Mixtura</p>
          <p><strong style={{ color: 'var(--text)' }}>Site web :</strong> mixtura.buzz</p>
          <p><strong style={{ color: 'var(--text)' }}>Statut :</strong> Projet en cours de création de société au Grand-Duché de Luxembourg</p>
          <p><strong style={{ color: 'var(--text)' }}>Email de contact :</strong>{' '}
            <a href="mailto:contact@mixtura.buzz" className="underline">contact@mixtura.buzz</a>
          </p>
        </div>
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
          Ces mentions légales seront mises à jour lors de l&apos;immatriculation de la société (RCS Luxembourg, numéro TVA LU).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>2. Hébergement</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <p><strong style={{ color: 'var(--text)' }}>Frontend :</strong> Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104 — vercel.com</p>
          <p><strong style={{ color: 'var(--text)' }}>Base de données :</strong> Supabase Inc. — Région : eu-west-1 (Irlande) — supabase.com</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>3. Propriété intellectuelle</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          L&apos;ensemble du contenu de mixtura.buzz (textes, design, logotype, code) est la propriété exclusive de Mixtura et protégé par les lois relatives à la propriété intellectuelle. Toute reproduction sans accord écrit est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>4. Limitation de responsabilité</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Mixtura s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées mais ne peut garantir leur exhaustivité. Mixtura décline toute responsabilité pour toute imprécision ou omission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>5. Droit applicable</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Le présent site est soumis au droit luxembourgeois. En cas de litige, les tribunaux de Luxembourg-Ville seront compétents.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>6. Contact</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          <a href="mailto:contact@mixtura.buzz" className="underline">contact@mixtura.buzz</a>
        </p>
      </section>
    </article>
  );
}
