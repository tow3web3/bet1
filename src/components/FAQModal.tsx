import React from 'react';

const FAQModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="bg-black/95 border border-yellow-400/40 rounded-2xl shadow-neon-yellow p-4 max-w-md w-full max-h-[80vh] overflow-y-auto relative text-yellow-100 font-mono">
      <button
        className="absolute top-2 right-2 text-yellow-400 hover:text-white text-xl font-bold"
        onClick={onClose}
        aria-label="Fermer"
      >×</button>
      <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2"><span>❓</span>FAQ</h2>
      <div className="space-y-4 text-sm">
        <div>
          <b>💸 Comment fonctionnent les mises ?</b><br/>
          À chaque pari, 15% sont prélevés : 5% pour la Lucky Pool, 5% pour le burn (à retirer manuellement), 5% pour le wallet de fee. 85% de la mise va dans le pool du combat et est redistribué aux gagnants.
        </div>
        <div>
          <b>🍀 Qu'est-ce que la Lucky Pool ?</b><br/>
          La Lucky Pool est une cagnotte alimentée par 5% de chaque mise. Elle sert à payer les gagnants des combats et à récompenser un joueur chanceux tous les 10 combats via un tirage spécial.
        </div>
        <div>
          <b>🔥 Que deviennent les 5% burn ?</b><br/>
          Les 5% burn sont à retirer manuellement de la Lucky Pool pour être envoyés vers un dead wallet (burn). Ils ne sont pas redistribués automatiquement.
        </div>
        <div>
          <b>🏆 Comment sont payés les gagnants ?</b><br/>
          Les gagnants reçoivent exactement le montant de leur bet (85% de leur mise initiale), payé depuis la Lucky Pool.
        </div>
        <div>
          <b>🎰 Comment fonctionne le tirage Lucky Pool ?</b><br/>
          Tous les 10 combats, un tirage au sort a lieu parmi les joueurs, pondéré par leur "luck score" (combats joués, défaites récentes, parrainage). Le gagnant reçoit la Lucky Pool.
        </div>
        <div>
          <b>🤝 Comment marche le parrainage ?</b><br/>
          Chaque joueur connecté a un lien unique. Si un nouveau joueur s'inscrit via ce lien : le filleul gagne +20 luck dès sa première partie, le parrain +50 luck quand le filleul a joué 5 parties.
        </div>
        <div>
          <b>🔒 Est-ce sécurisé ?</b><br/>
          Oui, les transactions sont signées par les wallets, les clés privées ne quittent jamais le wallet, et les payouts sont gérés par le backend sécurisé.
        </div>
        <div>
          <b>❓ Autres questions ?</b><br/>
          Contacte le support ou pose ta question dans le chat !
        </div>
      </div>
    </div>
  </div>
);

export default FAQModal; 