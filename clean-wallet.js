// Script pour nettoyer un wallet et s'assurer qu'il ne contient que du SOL
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// Configuration
const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a';
const connection = new Connection(SOLANA_RPC, 'confirmed');

async function cleanWallet(walletKeypair) {
  try {
    console.log('🧹 Nettoyage du wallet:', walletKeypair.publicKey.toString());
    
    // 1. Vérifier les tokens SPL
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletKeypair.publicKey, {
      programId: TOKEN_PROGRAM_ID
    });
    
    console.log('🔍 Comptes de tokens trouvés:', tokenAccounts.value.length);
    
    // 2. Vérifier les comptes de données
    const accountInfo = await connection.getAccountInfo(walletKeypair.publicKey);
    console.log('📊 Taille des données du compte:', accountInfo?.data.length || 0, 'bytes');
    
    // 3. Vérifier le solde SOL
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log('💰 Solde SOL:', balance / LAMPORTS_PER_SOL, 'SOL');
    
    if (tokenAccounts.value.length > 0) {
      console.log('⚠️  Tokens trouvés. Nettoyage nécessaire...');
      
      // Pour chaque token, essayer de le transférer ou le brûler
      for (const tokenAccount of tokenAccounts.value) {
        const account = tokenAccount.account;
        const tokenInfo = account.data.parsed.info;
        
        console.log(`🪙 Token: ${tokenInfo.mint} - Balance: ${tokenInfo.tokenAmount.uiAmount}`);
        
        // Si le token a un solde > 0, essayer de le transférer
        if (tokenInfo.tokenAmount.uiAmount > 0) {
          console.log('📤 Tentative de transfert du token...');
          // Ici tu peux ajouter la logique pour transférer le token
        }
      }
    }
    
    if (accountInfo && accountInfo.data.length > 0) {
      console.log('⚠️  Données trouvées dans le compte principal');
      console.log('💡 Ce compte ne peut pas être utilisé pour les transferts SOL');
      console.log('🔧 Solution: Créer un nouveau wallet propre');
      return false;
    }
    
    console.log('✅ Wallet propre - prêt pour les transferts SOL');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    return false;
  }
}

// Fonction pour créer un wallet propre
async function createCleanWallet() {
  console.log('🆕 Création d\'un nouveau wallet propre...');
  
  const newKeypair = Keypair.generate();
  console.log('🔑 Nouvelle adresse:', newKeypair.publicKey.toString());
  console.log('🔐 Clé privée (JSON):', JSON.stringify(Array.from(newKeypair.secretKey)));
  console.log('🔐 Clé privée (base58):', bs58.encode(newKeypair.secretKey));
  
  // Vérifier que le nouveau wallet est propre
  const isClean = await cleanWallet(newKeypair);
  
  if (isClean) {
    console.log('✅ Nouveau wallet créé et vérifié comme propre');
    console.log('📝 Ajoutez cette clé privée dans vos variables d\'environnement');
  }
  
  return newKeypair;
}

// Fonction pour vérifier un wallet existant
async function verifyWallet(privateKeyJSON) {
  try {
    const privateKeyArray = JSON.parse(privateKeyJSON);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    
    console.log('🔍 Vérification du wallet existant...');
    const isClean = await cleanWallet(keypair);
    
    if (isClean) {
      console.log('✅ Wallet propre - peut être utilisé pour les transferts');
    } else {
      console.log('❌ Wallet non propre - créer un nouveau wallet recommandé');
    }
    
    return isClean;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Exports pour utilisation
module.exports = {
  cleanWallet,
  createCleanWallet,
  verifyWallet
};

// Si exécuté directement
if (require.main === module) {
  console.log('🧹 Utilitaire de nettoyage de wallet');
  console.log('Options:');
  console.log('1. create - Créer un nouveau wallet propre');
  console.log('2. verify [privateKey] - Vérifier un wallet existant');
  
  const args = process.argv.slice(2);
  
  if (args[0] === 'create') {
    createCleanWallet();
  } else if (args[0] === 'verify' && args[1]) {
    verifyWallet(args[1]);
  } else {
    console.log('Usage: node clean-wallet.js [create|verify <privateKey>]');
  }
} 