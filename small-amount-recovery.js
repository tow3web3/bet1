// Récupération avec de petits montants
const { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Clé privée du wallet corrompu
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function smallAmountRecovery() {
  console.log('💰 Récupération avec de petits montants...');
  
  const privateKeyArray = JSON.parse(PRIVATE_KEY_JSON);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
  
  console.log('🔑 Wallet source:', keypair.publicKey.toString());
  console.log('🎯 Destination:', DESTINATION_ADDRESS);
  
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    console.log('💰 Solde total:', balance / LAMPORTS_PER_SOL, 'SOL');
    
    // Essayer avec des montants très petits
    const smallAmounts = [
      100000,    // 0.0001 SOL
      500000,    // 0.0005 SOL
      1000000,   // 0.001 SOL
      5000000,   // 0.005 SOL
      10000000,  // 0.01 SOL
      50000000,  // 0.05 SOL
      100000000  // 0.1 SOL
    ];
    
    for (const amount of smallAmounts) {
      if (amount >= balance - 100000) continue; // Éviter de vider complètement
      
      console.log(`\n📤 Tentative avec ${amount / LAMPORTS_PER_SOL} SOL...`);
      
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: destinationPubkey,
            lamports: amount
          })
        );
        
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = keypair.publicKey;
        transaction.sign(keypair);
        
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: true,
          maxRetries: 5
        });
        
        console.log('📤 Transaction envoyée:', signature);
        
        // Attendre confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value && confirmation.value.err) {
          console.log('❌ Transaction échouée:', confirmation.value.err);
        } else {
          console.log('✅ SUCCÈS! Montant transféré:', amount / LAMPORTS_PER_SOL, 'SOL');
          console.log('🔗 Signature:', signature);
          console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + signature);
          
          // Si ça marche, essayer de transférer le reste
          const remainingBalance = await connection.getBalance(keypair.publicKey);
          if (remainingBalance > 100000) { // Plus de 0.0001 SOL
            console.log('🔄 Tentative de transférer le reste...');
            await transferRemaining(keypair, destinationPubkey, remainingBalance - 50000);
          }
          
          return signature;
        }
        
      } catch (error) {
        console.log(`❌ Échec avec ${amount / LAMPORTS_PER_SOL} SOL:`, error.message);
      }
      
      // Attendre entre les tentatives
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n💀 Tous les petits montants ont échoué');
    console.log('🚨 Le wallet est définitivement corrompu');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function transferRemaining(keypair, destinationPubkey, amount) {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: destinationPubkey,
        lamports: amount
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    transaction.sign(keypair);
    
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 5
    });
    
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('✅ Reste transféré:', amount / LAMPORTS_PER_SOL, 'SOL');
    console.log('🔗 Signature:', signature);
    
  } catch (error) {
    console.log('❌ Échec du transfert du reste:', error.message);
  }
}

// Lancer la récupération
smallAmountRecovery(); 