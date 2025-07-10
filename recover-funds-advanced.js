// Script avancé pour récupérer les fonds d'un wallet avec des données
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

// Configuration
const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Clé privée du pool wallet
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function recoverFundsAdvanced() {
  try {
    // Créer le keypair
    const privateKeyArray = JSON.parse(PRIVATE_KEY_JSON);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    
    console.log('🔑 Wallet source:', keypair.publicKey.toString());
    console.log('🎯 Destination:', DESTINATION_ADDRESS);
    
    // Vérifier le solde
    const balance = await connection.getBalance(keypair.publicKey);
    console.log('💰 Solde disponible:', balance / LAMPORTS_PER_SOL, 'SOL');
    
    if (balance <= 0) {
      console.log('❌ Wallet vide');
      return;
    }
    
    // Vérifier les comptes associés
    const accounts = await connection.getParsedTokenAccountsByOwner(keypair.publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    console.log('🔍 Comptes de tokens trouvés:', accounts.value.length);
    
    if (accounts.value.length > 0) {
      console.log('⚠️  Le wallet contient des tokens. Tentative de transfert avec approche alternative...');
      
      // Essayer avec une transaction plus simple
      const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
      
      // Calculer les frais plus généreux
      const fee = 20000; // 20000 lamports pour les frais
      const transferAmount = balance - fee;
      
      if (transferAmount <= 0) {
        console.log('❌ Solde insuffisant pour couvrir les frais');
        return;
      }
      
      // Créer une transaction avec des paramètres différents
      const transaction = new Transaction();
      
      // Ajouter l'instruction de transfert
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destinationPubkey,
          lamports: transferAmount
        })
      );
      
      console.log('📤 Tentative de transfert de', transferAmount / LAMPORTS_PER_SOL, 'SOL...');
      
      // Essayer avec des paramètres différents
      let signature;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`🔄 Tentative ${attempt}/5 avec paramètres différents...`);
          
          // Obtenir un nouveau blockhash à chaque tentative
          const { blockhash } = await connection.getLatestBlockhash('finalized');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = keypair.publicKey;
          
          // Signer la transaction
          transaction.sign(keypair);
          
          // Envoyer avec des options différentes
          signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true, // Ignorer la pré-simulation
            maxRetries: 3
          });
          
          // Attendre la confirmation
          await connection.confirmTransaction(signature, 'confirmed');
          
          console.log('✅ Transaction réussie!');
          console.log('🔗 Signature:', signature);
          console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + signature);
          return;
          
        } catch (error) {
          console.log(`❌ Tentative ${attempt} échouée:`, error.message);
          if (attempt === 5) throw error;
          await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3s
        }
      }
    } else {
      console.log('✅ Aucun token trouvé, tentative de transfert normal...');
      
      // Calculer les frais plus généreux
      const fee = 20000; // 20000 lamports pour les frais
      const transferAmount = balance - fee;
      
      if (transferAmount <= 0) {
        console.log('❌ Solde insuffisant pour couvrir les frais');
        return;
      }
      
      // Créer une transaction avec des paramètres différents
      const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
      const transaction = new Transaction();
      
      // Ajouter l'instruction de transfert
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destinationPubkey,
          lamports: transferAmount
        })
      );
      
      console.log('📤 Tentative de transfert de', transferAmount / LAMPORTS_PER_SOL, 'SOL...');
      
      // Essayer avec des paramètres différents
      let signature;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`🔄 Tentative ${attempt}/5 avec paramètres différents...`);
          
          // Obtenir un nouveau blockhash à chaque tentative
          const { blockhash } = await connection.getLatestBlockhash('finalized');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = keypair.publicKey;
          
          // Signer la transaction
          transaction.sign(keypair);
          
          // Envoyer avec des options différentes
          signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true, // Ignorer la pré-simulation
            maxRetries: 3
          });
          
          // Attendre la confirmation
          await connection.confirmTransaction(signature, 'confirmed');
          
          console.log('✅ Transaction réussie!');
          console.log('🔗 Signature:', signature);
          console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + signature);
          return;
          
        } catch (error) {
          console.log(`❌ Tentative ${attempt} échouée:`, error.message);
          if (attempt === 5) throw error;
          await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3s
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur finale:', error.message);
    if (error.logs) {
      console.error('📋 Logs de simulation:', error.logs);
    }
    
    console.log('\n💡 Suggestions:');
    console.log('1. Essayer avec un RPC différent');
    console.log('2. Utiliser Solana CLI directement');
    console.log('3. Créer un nouveau wallet propre pour le pool');
  }
}

// Lancer le script
recoverFundsAdvanced(); 