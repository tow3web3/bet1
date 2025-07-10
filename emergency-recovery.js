// RÉCUPÉRATION D'URGENCE - Méthodes agressives
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Clé privée du wallet corrompu
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function emergencyRecovery() {
  console.log('🚨 RÉCUPÉRATION D\'URGENCE EN COURS...');
  
  const privateKeyArray = JSON.parse(PRIVATE_KEY_JSON);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
  
  console.log('🔑 Wallet source:', keypair.publicKey.toString());
  console.log('🎯 Destination:', DESTINATION_ADDRESS);
  
  // Essayer avec plusieurs RPC et méthodes
  const methods = [
    {
      name: 'Méthode 1: RPC Helius + skipPreflight',
      rpc: 'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a',
      options: { skipPreflight: true, maxRetries: 10 }
    },
    {
      name: 'Méthode 2: RPC officiel + skipPreflight',
      rpc: 'https://api.mainnet-beta.solana.com',
      options: { skipPreflight: true, maxRetries: 10 }
    },
    {
      name: 'Méthode 3: RPC Helius + preflightCommitment',
      rpc: 'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a',
      options: { skipPreflight: true, preflightCommitment: 'processed', maxRetries: 10 }
    }
  ];
  
  for (const method of methods) {
    console.log(`\n🔄 ${method.name}`);
    
    try {
      const connection = new Connection(method.rpc, 'confirmed');
      
      // Vérifier le solde
      const balance = await connection.getBalance(keypair.publicKey);
      console.log('💰 Solde:', balance / LAMPORTS_PER_SOL, 'SOL');
      
      if (balance <= 0) {
        console.log('❌ Wallet vide');
        continue;
      }
      
      // Essayer plusieurs montants
      const amounts = [
        balance - 100000,  // Tout moins 0.0001 SOL
        balance - 200000,  // Tout moins 0.0002 SOL
        balance - 500000,  // Tout moins 0.0005 SOL
        1000000,           // 0.001 SOL
        5000000,           // 0.005 SOL
        10000000           // 0.01 SOL
      ];
      
      for (const amount of amounts) {
        if (amount <= 0) continue;
        
        console.log(`📤 Tentative avec ${amount / LAMPORTS_PER_SOL} SOL...`);
        
        try {
          // Créer une transaction très simple
          const transaction = new Transaction();
          
          // Ajouter l'instruction de transfert
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: keypair.publicKey,
              toPubkey: destinationPubkey,
              lamports: amount
            })
          );
          
          // Obtenir blockhash
          const { blockhash } = await connection.getLatestBlockhash('finalized');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = keypair.publicKey;
          
          // Signer
          transaction.sign(keypair);
          
          // Envoyer avec options agressives
          const signature = await connection.sendRawTransaction(transaction.serialize(), method.options);
          
          console.log('📤 Transaction envoyée, signature:', signature);
          
          // Attendre confirmation avec timeout
          const confirmation = await Promise.race([
            connection.confirmTransaction(signature, 'confirmed'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
          ]);
          
          if (confirmation.value && confirmation.value.err) {
            console.log('❌ Transaction échouée:', confirmation.value.err);
          } else {
            console.log('✅ SUCCÈS! Transaction confirmée!');
            console.log('🔗 Signature:', signature);
            console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + signature);
            return signature;
          }
          
        } catch (error) {
          console.log(`❌ Échec avec ${amount / LAMPORTS_PER_SOL} SOL:`, error.message);
        }
        
        // Attendre entre les tentatives
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.log('❌ Erreur méthode:', error.message);
    }
  }
  
  console.log('\n💀 Toutes les méthodes ont échoué');
  console.log('🚨 CONTACTEZ IMMÉDIATEMENT LE SUPPORT SOLANA:');
  console.log('Discord: https://discord.gg/solana');
  console.log('Canal: #support');
  console.log('Adresse: 4MpnddXrsYGzCv6GBe6y39DWLpixqiTjW5nEpbaXffrq');
  console.log('Solde: ~3.2 SOL');
  console.log('Problème: Wallet contient des données qui empêchent les transferts');
}

// Lancer la récupération d'urgence
emergencyRecovery(); 