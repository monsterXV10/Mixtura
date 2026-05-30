export const metadata = { title: 'Mentions légales – Mixtura' };

export default function MentionsPage() {
  return (
    <article className="prose prose-sm max-w-none space-y-8" style={{ color: 'var(--text)' }}>
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Mentions légales</h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Dernière mise à jour : mai 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>1. Éditeur du site</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <p><strong style={{ color: 'var(--text)' }}>Dénomination sociale :</strong> [NOM DE LA SOCIÉTÉ] </p>
          <p><strong style={{ color: 'var(--text)' }}>Forme juridique :</strong> [SARL / SA / SÀRL / SAS]</p>
          <p><strong style={{ color: 'var(--text)' }}>Siège social :</strong> [ADRESSE COMPLÈTE], Luxembourg</p>
          <p><strong style={{ color: 'var(--text)' }}>Numéro RCS :</strong> Luxembourg B [NUMÉRO]</p>
          <p><strong style={{ color: 'var(--text)' }}>Numéro TVA :</strong> LU [NUMÉRO]</p>
          <p><strong style={{ color: 'var(--text)' }}>Email :</strong> contact@mixtura.buzz</p>
          <p><strong style={{ color: 'var(--text)' }}>Directeur de la publication :</strong> [NOM DU RESPONSABLE]</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>2. Hébergement</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <p><strong style={{ color: 'var(--text)' }}>Hébergeur frontend :</strong> Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis — vercel.com</p>
          <p><strong style={{ color: 'var(--text)' }}>Hébergeur base de données :</strong> Supabase Inc. — Région : eu-west-1 (Irlande) — supabase.com</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>3. Propriété intellectuelle</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          L&apos;ensemble du contenu présent sur mixtura.buzz (textes, graphismes, logotypes, icônes, images, clips audio ou vidéo, compilations de données et logiciels) est la propriété exclusive de Mixtura ou de ses partenaires et est protégé par les lois luxembourgeoises et internationales relatives à la propriété intellectuelle.
        </p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces éléments est strictement interdite sans l&apos;accord exprès par écrit de Mixtura.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>4. Limitation de responsabilité</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Mixtura s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Mixtura ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition. Mixtura décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>5. Droit applicable</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Le présent site est soumis au droit luxembourgeois. En cas de litige et à défaut de résolution amiable, les tribunaux luxembourgeois seront seuls compétents.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>6. Contact</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l&apos;adresse : <a href="mailto:contact@mixtura.buzz" className="underline">contact@mixtura.buzz</a>
        </p>
      </section>
    </article>
  );
}
