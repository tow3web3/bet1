# Récupération des fonds avec Solana CLI

## Étape 1 : Installer Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## Étape 2 : Configurer le wallet
```bash
# Créer un fichier keypair.json avec ta clé privée
echo '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]' > keypair.json

# Configurer Solana CLI
solana config set --keypair keypair.json
solana config set --url https://api.mainnet-beta.solana.com
```

## Étape 3 : Vérifier le solde
```bash
solana balance
```

## Étape 4 : Transférer les fonds
```bash
# Transférer vers ton wallet
solana transfer DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK --allow-unfunded-recipient
```

## Alternative : Utiliser un RPC différent
```bash
solana config set --url https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a
solana transfer DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK --allow-unfunded-recipient
```

## Si ça ne marche toujours pas :
1. Essayer avec `--skip-preflight`
2. Utiliser un montant plus petit
3. Contacter le support Solana 