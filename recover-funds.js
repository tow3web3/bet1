// Script pour récupérer les fonds du wallet du pool
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

// Configuration - Utiliser un RPC plus fiable
const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=5c95d345-229b-4fa7-aa3c-a5b064507a5a';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Clé privée du pool wallet
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function recoverFunds() {
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
    
    // Calculer le montant à transférer (laisser de quoi payer les frais)
    const fee = 10000; // 10000 lamports pour les frais (plus généreux)
    const transferAmount = balance - fee;
    
    if (transferAmount <= 0) {
      console.log('❌ Solde insuffisant pour couvrir les frais');
      return;
    }
    
    // Créer la transaction
    const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: destinationPubkey,
        lamports: transferAmount
      })
    );
    
    console.log('📤 Envoi de', transferAmount / LAMPORTS_PER_SOL, 'SOL...');
    
    // Essayer plusieurs fois en cas d'échec
    let signature;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/3...`);
        signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
          commitment: 'confirmed',
          maxRetries: 3
        });
        break;
      } catch (error) {
        console.log(`❌ Tentative ${attempt} échouée:`, error.message);
        if (attempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s
      }
    }
    
    console.log('✅ Transaction réussie!');
    console.log('🔗 Signature:', signature);
    console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + signature);
    
  } catch (error) {
    console.error('❌ Erreur finale:', error.message);
    if (error.logs) {
      console.error('📋 Logs de simulation:', error.logs);
    }
  }
}

// Lancer le script
recoverFunds(); 