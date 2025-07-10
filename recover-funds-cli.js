// Script pour récupérer les fonds avec des méthodes alternatives
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bs58 = require('bs58');

// Configuration
const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Clé privée du pool wallet
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function recoverFundsCLI() {
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
    
    // Vérifier les comptes de données
    const accountInfo = await connection.getAccountInfo(keypair.publicKey);
    console.log('📊 Taille des données du compte:', accountInfo?.data.length || 0, 'bytes');
    
    if (accountInfo && accountInfo.data.length > 0) {
      console.log('⚠️  Le compte contient des données. Tentative de nettoyage...');
      
      // Essayer de créer un nouveau wallet et transférer via un intermédiaire
      console.log('🔄 Création d\'un wallet intermédiaire...');
      const intermediateKeypair = Keypair.generate();
      
      // Transférer une petite somme vers le wallet intermédiaire
      const smallAmount = 1000000; // 0.001 SOL
      const intermediateTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: intermediateKeypair.publicKey,
          lamports: smallAmount
        })
      );
      
      try {
        console.log('📤 Test avec une petite somme...');
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        intermediateTx.recentBlockhash = blockhash;
        intermediateTx.feePayer = keypair.publicKey;
        intermediateTx.sign(keypair);
        
        const sig = await connection.sendRawTransaction(intermediateTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3
        });
        
        await connection.confirmTransaction(sig, 'confirmed');
        console.log('✅ Test réussi! Signature:', sig);
        
        // Si le test fonctionne, essayer le transfert complet
        console.log('🔄 Tentative du transfert complet...');
        const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
        const fee = 50000; // 0.00005 SOL pour les frais
        const transferAmount = balance - smallAmount - fee;
        
        const finalTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: destinationPubkey,
            lamports: transferAmount
          })
        );
        
        const { blockhash: finalBlockhash } = await connection.getLatestBlockhash('finalized');
        finalTx.recentBlockhash = finalBlockhash;
        finalTx.feePayer = keypair.publicKey;
        finalTx.sign(keypair);
        
        const finalSig = await connection.sendRawTransaction(finalTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3
        });
        
        await connection.confirmTransaction(finalSig, 'confirmed');
        console.log('✅ Transfert complet réussi!');
        console.log('🔗 Signature:', finalSig);
        console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + finalSig);
        
      } catch (error) {
        console.log('❌ Même le test échoue:', error.message);
        console.log('\n💡 Le wallet semble vraiment corrompu.');
        console.log('🔧 Solutions alternatives:');
        console.log('1. Utiliser Solana CLI directement');
        console.log('2. Créer un nouveau wallet pour le pool');
        console.log('3. Contacter le support Solana');
      }
    } else {
      console.log('✅ Aucune donnée trouvée, le compte devrait être propre');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Lancer le script
recoverFundsCLI(); 