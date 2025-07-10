// Script pour poster le message de support
const fs = require('fs');
const path = require('path');

console.log('🚨 POSTAGE DU MESSAGE DE SUPPORT SOLANA');
console.log('');

// Lire le message
const message = fs.readFileSync('support-message.md', 'utf8');

console.log('📋 MESSAGE PRÉPARÉ:');
console.log('==================');
console.log(message);
console.log('==================');
console.log('');

console.log('🌐 LIENS DE SUPPORT:');
console.log('');

console.log('1. Solana StackExchange (RECOMMANDÉ):');
console.log('   https://solana.stackexchange.com/questions/ask');
console.log('   - Copie-colle le message ci-dessus');
console.log('   - Titre: "Wallet Recovery - 3.2 SOL Locked Due to Data Corruption"');
console.log('');

console.log('2. GitHub Solana Issues:');
console.log('   https://github.com/solana-labs/solana/issues/new');
console.log('   - Titre: "Wallet recovery needed - 3.2 SOL locked due to data corruption"');
console.log('');

console.log('3. Solana Forums:');
console.log('   https://forums.solana.com/');
console.log('   - Crée un nouveau topic dans "Support"');
console.log('');

console.log('4. Email direct:');
console.log('   support@solana.com');
console.log('   foundation@solana.com');
console.log('');

console.log('📝 INSTRUCTIONS:');
console.log('1. Va sur Solana StackExchange (lien 1)');
console.log('2. Copie-colle le message ci-dessus');
console.log('3. Ajoute le titre suggéré');
console.log('4. Poste et attends une réponse');
console.log('');

console.log('⚠️  IMPORTANT:');
console.log('- Inclus toujours l\'adresse: 4MpnddXrsYGzCv6GBe6y39DWLpixqiTjW5nEpbaXffrq');
console.log('- Mentionne le solde: 3.227472136 SOL');
console.log('- Explique que tu as la clé privée');
console.log('- Sois patient, ils répondent généralement rapidement');
console.log('');

console.log('🔗 Vérification du solde:');
console.log('https://solscan.io/account/4MpnddXrsYGzCv6GBe6y39DWLpixqiTjW5nEpbaXffrq');
console.log('');

console.log('✅ Message prêt à poster !'); 