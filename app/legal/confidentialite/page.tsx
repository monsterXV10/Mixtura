export const metadata = { title: 'Politique de confidentialité – Mixtura' };

export default function ConfidentialitePage() {
  return (
    <article className="space-y-8" style={{ color: 'var(--text)' }}>
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Politique de confidentialité</h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Dernière mise à jour : mai 2026 — Conforme au RGPD (Règlement UE 2016/679)</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>1. Responsable du traitement</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Le responsable du traitement des données personnelles collectées via mixtura.buzz est :<br />
          <strong style={{ color: 'var(--text)' }}>Mixtura</strong> (projet en cours d&apos;immatriculation au Grand-Duché de Luxembourg).<br />
          Contact : <a href="mailto:privacy@mixtura.buzz" className="underline">privacy@mixtura.buzz</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>2. Données collectées</h2>
        <div className="text-sm space-y-2" style={{ color: 'var(--text-dim)' }}>
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong style={{ color: 'var(--text)' }}>Données d&apos;identification :</strong> nom, adresse email</li>
            <li><strong style={{ color: 'var(--text)' }}>Données de connexion :</strong> fournisseur d&apos;authentification (email/password ou Google), date de dernière connexion</li>
            <li><strong style={{ color: 'var(--text)' }}>Données d&apos;utilisation :</strong> recettes, ingrédients, menus, batchs de production créés dans l&apos;application</li>
            <li><strong style={{ color: 'var(--text)' }}>Données d&apos;équipe :</strong> membres, rôles, invitations, partages</li>
            <li><strong style={{ color: 'var(--text)' }}>Données techniques :</strong> logs d&apos;accès, adresse IP (via Supabase)</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>3. Finalités du traitement</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Fourniture du service Mixtura (gestion de bar, recettes, équipes)</li>
            <li>Authentification et sécurisation des comptes</li>
            <li>Communication liée au service (invitations d&apos;équipe, notifications)</li>
            <li>Amélioration du service et analyses statistiques agrégées</li>
            <li>Respect des obligations légales et comptables</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>4. Base légale des traitements</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong style={{ color: 'var(--text)' }}>Exécution du contrat</strong> (art. 6.1.b RGPD) : fourniture du service</li>
            <li><strong style={{ color: 'var(--text)' }}>Consentement</strong> (art. 6.1.a RGPD) : communications marketing</li>
            <li><strong style={{ color: 'var(--text)' }}>Obligation légale</strong> (art. 6.1.c RGPD) : facturation, comptabilité</li>
            <li><strong style={{ color: 'var(--text)' }}>Intérêt légitime</strong> (art. 6.1.f RGPD) : sécurité, amélioration du service</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>5. Durée de conservation</h2>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-dim)' }}>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Données de compte actif : conservées pendant toute la durée du compte</li>
            <li>Données après clôture du compte : supprimées dans un délai de 30 jours</li>
            <li>Données de facturation : conservées 10 ans (obligation légale luxembourgeoise)</li>
            <li>Logs techniques : 90 jours</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>6. Sous-traitants et transferts</h2>
        <div className="text-sm space-y-2" style={{ color: 'var(--text-dim)' }}>
          <p>Vos données peuvent être traitées par nos sous-traitants :</p>
          <div className="rounded-lg overflow-hidden border text-xs" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th className="text-left px-3 py-2">Sous-traitant</th>
                  <th className="text-left px-3 py-2">Finalité</th>
                  <th className="text-left px-3 py-2">Localisation</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2">Supabase Inc.</td>
                  <td className="px-3 py-2">Base de données, authentification</td>
                  <td className="px-3 py-2">Irlande (UE)</td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2">Vercel Inc.</td>
                  <td className="px-3 py-2">Hébergement frontend</td>
                  <td className="px-3 py-2">UE / USA (SCCs)</td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2">Google LLC</td>
                  <td className="px-3 py-2">Authentification Google OAuth</td>
                  <td className="px-3 py-2">USA (SCCs)</td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2">Resend Inc.</td>
                  <td className="px-3 py-2">Envoi d&apos;emails transactionnels</td>
                  <td className="px-3 py-2">USA (SCCs)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>Les transferts vers les États-Unis sont encadrés par des clauses contractuelles types (SCCs) conformément au RGPD.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>7. Vos droits</h2>
        <div className="text-sm space-y-2" style={{ color: 'var(--text-dim)' }}>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong style={{ color: 'var(--text)' }}>Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
            <li><strong style={{ color: 'var(--text)' }}>Droit de rectification</strong> : corriger des données inexactes</li>
            <li><strong style={{ color: 'var(--text)' }}>Droit à l&apos;effacement</strong> : supprimer votre compte et vos données</li>
            <li><strong style={{ color: 'var(--text)' }}>Droit à la portabilité</strong> : exporter vos données dans un format lisible</li>
            <li><strong style={{ color: 'var(--text)' }}>Droit d&apos;opposition</strong> : s&apos;opposer à certains traitements</li>
            <li><strong style={{ color: 'var(--text)' }}>Droit de limitation</strong> : limiter le traitement de vos données</li>
          </ul>
          <p>Pour exercer ces droits : <a href="mailto:privacy@mixtura.buzz" className="underline">privacy@mixtura.buzz</a></p>
          <p>
            Vous pouvez également introduire une réclamation auprès de la <strong style={{ color: 'var(--text)' }}>CNPD</strong> (Commission nationale pour la protection des données, Luxembourg) :{' '}
            <a href="https://cnpd.public.lu" className="underline" target="_blank" rel="noopener noreferrer">cnpd.public.lu</a>
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>8. Cookies</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Mixtura utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service (session d&apos;authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
        </p>
      </section>
    </article>
  );
}
