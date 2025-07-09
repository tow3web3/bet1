# 🏆 Solana Battle Arena - Combat Global

Une arène de combat en temps réel où les utilisateurs du monde entier peuvent parier sur des batailles synchronisées.

## 🚀 Démarrage Rapide

### 1. Vérification de Sécurité
```bash
npm run security-check
```

### 2. Démarrage du Backend
```bash
npm run server
# ou
node server.cjs
```

### 3. Démarrage du Frontend
```bash
npm run dev
```

### 4. Accès à l'Application
- Frontend: http://localhost:5175
- Backend: http://localhost:4000

## 🔐 Sécurité

### Pool Wallet Sécurisé
- ✅ Clé privée dans variables d'environnement (`.env`)
- ✅ Fichier `.env` ignoré par git
- ✅ Validation automatique au démarrage
- ✅ Logs sécurisés (adresse publique uniquement)

### Configuration
Le pool wallet est configuré dans le fichier `.env` :
```
POOL_PRIVATE_KEY="[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]"
SOLANA_RPC="https://api.mainnet-beta.solana.com"
```

## 🎮 Fonctionnalités

### Combat Global Synchronisé
- Batailles en temps réel pour tous les utilisateurs
- Système de paris avec SOL
- Paiement automatique des gains
- Chat en temps réel
- Historique des combats

### Technologies
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Blockchain**: Solana Web3.js
- **UI**: Tailwind CSS

## 📋 Scripts Disponibles

```bash
npm run dev              # Démarre le frontend
npm run server           # Démarre le backend
npm run security-check   # Vérifie la sécurité
npm run build           # Build pour production
```

## ⚠️ Important

1. **Ne partagez jamais** le fichier `.env`
2. **Utilisez un wallet dédié** pour le pool
3. **Surveillez les transactions** régulièrement
4. **Sauvegardez la clé privée** dans un endroit sécurisé

## 📖 Documentation

- [Guide de Sécurité](SECURITY.md) - Configuration détaillée de la sécurité
- [Architecture](ARCHITECTURE.md) - Structure technique du projet

## 🛠️ Développement

### Structure du Projet
```
adada/
├── src/
│   ├── components/     # Composants React
│   ├── contexts/       # Contextes (Wallet)
│   ├── hooks/          # Hooks personnalisés
│   ├── services/       # Services (GlobalBattle)
│   └── types/          # Types TypeScript
├── server.cjs          # Backend Node.js
├── .env               # Variables d'environnement (sécurisé)
└── check-security.cjs # Script de vérification
```

### Ajout de Nouvelles Fonctionnalités
1. Modifiez les composants React dans `src/components/`
2. Ajoutez la logique backend dans `server.cjs`
3. Testez avec `npm run security-check`
4. Démarrez avec `npm run server` et `npm run dev` 