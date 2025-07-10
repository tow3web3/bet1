// Script de récupération forcée des fonds
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Configuration avec plusieurs RPC
const RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

// Clé privée du pool wallet
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function forceRecovery() {
  const privateKeyArray = JSON.parse(PRIVATE_KEY_JSON);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
  
  console.log('🔑 Wallet source:', keypair.publicKey.toString());
  console.log('🎯 Destination:', DESTINATION_ADDRESS);
  
  // Essayer avec chaque RPC
  for (const rpcUrl of RPCS) {
    console.log(`\n🌐 Test avec RPC: ${rpcUrl}`);
    
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      
      // Vérifier le solde
      const balance = await connection.getBalance(keypair.publicKey);
      console.log('💰 Solde:', balance / LAMPORTS_PER_SOL, 'SOL');
      
      if (balance <= 0) {
        console.log('❌ Wallet vide sur ce RPC');
        continue;
      }
      
      // Essayer plusieurs montants différents
      const amounts = [
        balance - 50000,  // Tout moins 0.00005 SOL
        balance - 100000, // Tout moins 0.0001 SOL
        1000000,          // 0.001 SOL
        5000000,          // 0.005 SOL
        10000000          // 0.01 SOL
      ];
      
      for (const amount of amounts) {
        if (amount <= 0) continue;
        
        console.log(`📤 Tentative avec ${amount / LAMPORTS_PER_SOL} SOL...`);
        
        try {
          const transaction = new Transaction().add(
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
          
          // Envoyer avec options maximales
          const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 5,
            preflightCommitment: 'confirmed'
          });
          
          // Attendre confirmation
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          
          if (confirmation.value.err) {
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
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.log('❌ Erreur RPC:', error.message);
    }
  }
  
  console.log('\n💀 Toutes les tentatives ont échoué');
  console.log('🔧 Solutions alternatives:');
  console.log('1. Utiliser Solana CLI directement');
  console.log('2. Contacter le support Solana');
  console.log('3. Le wallet pourrait être irrécupérable');
}

// Lancer la récupération forcée
forceRecovery(); 