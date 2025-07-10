// Script pour convertir la clé privée en format base58
const bs58 = require('bs58');

// Remplace par ta clé privée JSON depuis Render
const privateKeyJSON = '[1,2,3,...]'; // Remplace par ta vraie clé

try {
  const privateKeyArray = JSON.parse(privateKeyJSON);
  const privateKeyBase58 = bs58.encode(Uint8Array.from(privateKeyArray));
  
  console.log('🔑 Clé privée en base58 (pour Phantom/Solflare):');
  console.log(privateKeyBase58);
  console.log('\n📋 Copie cette clé et importe-la dans Phantom/Solflare');
} catch (error) {
  console.error('❌ Erreur:', error.message);
} 