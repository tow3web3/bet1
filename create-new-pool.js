// Script pour créer un nouveau wallet propre pour le pool
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

console.log('🆕 Création d\'un nouveau wallet propre pour le pool...');
console.log('');

// Générer un nouveau keypair
const newKeypair = Keypair.generate();

console.log('🔑 NOUVELLE ADRESSE DU POOL:');
console.log(newKeypair.publicKey.toString());
console.log('');

console.log('🔐 CLÉ PRIVÉE (JSON) - À ajouter dans POOL_PRIVATE_KEY sur Render:');
console.log(JSON.stringify(Array.from(newKeypair.secretKey)));
console.log('');

console.log('🔐 CLÉ PRIVÉE (base58) - Pour Phantom/Solflare si nécessaire:');
console.log(bs58.encode(newKeypair.secretKey));
console.log('');

console.log('📋 INSTRUCTIONS:');
console.log('1. Copie la clé privée JSON ci-dessus');
console.log('2. Va sur Render → ton app → Environment');
console.log('3. Remplace POOL_PRIVATE_KEY par la nouvelle clé');
console.log('4. Ajoute du SOL sur la nouvelle adresse');
console.log('5. Redéploie l\'app');
console.log('');

console.log('⚠️  IMPORTANT:');
console.log('- Ce nouveau wallet est propre et ne contient aucune donnée');
console.log('- Il peut être utilisé pour les transferts SOL sans problème');
console.log('- Sauvegarde la clé privée en lieu sûr');
console.log('- Ajoute au moins 1 SOL sur ce wallet pour les paiements'); 