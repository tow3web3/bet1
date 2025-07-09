# 🔐 Sécurité - Configuration du Pool Wallet

## ⚠️ IMPORTANT: Protection de la Clé Privée

La clé privée du pool wallet est maintenant sécurisée dans un fichier `.env` qui ne sera jamais commité dans git.

### Configuration Sécurisée

1. **Fichier `.env`** (créé automatiquement) :
   ```
   POOL_PRIVATE_KEY="[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]"
   SOLANA_RPC="https://api.mainnet-beta.solana.com"
   ```

2. **Fichier `.gitignore`** (déjà configuré) :
   ```
   .env
   ```

### Mesures de Sécurité

✅ **Clé privée dans variables d'environnement** - Plus de clé hardcodée  
✅ **Fichier .env ignoré par git** - Ne sera jamais commité  
✅ **Validation de la clé au démarrage** - Erreur si clé manquante  
✅ **Logs sécurisés** - Affichage de l'adresse publique uniquement  

### Pour Changer la Clé Privée

1. Modifiez le fichier `.env` :
   ```bash
   nano .env
   ```

2. Remplacez la valeur de `POOL_PRIVATE_KEY` par votre nouvelle clé au format JSON array

3. Redémarrez le serveur :
   ```bash
   node server.cjs
   ```

### Vérification

Au démarrage, vous devriez voir :
```
🔐 Pool wallet sécurisé configuré: [adresse_publique]
🌐 Connexion Solana: https://api.mainnet-beta.solana.com
Backend combat global en écoute sur http://localhost:4000
```

### ⚠️ Recommandations de Sécurité

1. **Ne partagez jamais** le fichier `.env`
2. **Utilisez un wallet dédié** pour le pool (pas votre wallet principal)
3. **Surveillez les transactions** régulièrement
4. **Sauvegardez la clé privée** dans un endroit sécurisé
5. **En production**, utilisez un gestionnaire de secrets (AWS Secrets Manager, etc.)

### En Cas de Compromission

1. Transférez immédiatement tous les fonds vers un nouveau wallet
2. Changez la clé privée dans `.env`
3. Vérifiez les logs pour détecter des transactions suspectes
4. Considérez l'utilisation d'un wallet multi-signature pour plus de sécurité 