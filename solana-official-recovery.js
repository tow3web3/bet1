// Récupération officielle selon la documentation Solana
const { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} = require('@solana/web3.js');

// Configuration selon la documentation officielle
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Clé privée du wallet corrompu
const PRIVATE_KEY_JSON = '[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]';
const DESTINATION_ADDRESS = 'DAK13FyysiSLnDHreLKJApsX7UkvzUcfc3iPdH178cSK';

async function officialRecovery() {
  console.log('🔍 Diagnostic officiel selon la documentation Solana...');
  
  const privateKeyArray = JSON.parse(PRIVATE_KEY_JSON);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  const destinationPubkey = new PublicKey(DESTINATION_ADDRESS);
  
  console.log('🔑 Wallet source:', keypair.publicKey.toString());
  console.log('🎯 Destination:', DESTINATION_ADDRESS);
  
  try {
    // 1. Vérifier le solde selon la documentation
    const balance = await connection.getBalance(keypair.publicKey);
    console.log('💰 Solde:', balance / LAMPORTS_PER_SOL, 'SOL');
    
    // 2. Obtenir les informations du compte selon la documentation
    const accountInfo = await connection.getAccountInfo(keypair.publicKey);
    console.log('📊 Taille des données:', accountInfo?.data.length || 0, 'bytes');
    console.log('🏦 Propriétaire:', accountInfo?.owner?.toString());
    console.log('💸 Rent-exempt:', accountInfo?.rentEpoch);
    
    if (accountInfo && accountInfo.data.length > 0) {
      console.log('⚠️  Le compte contient des données non-SOL');
      console.log('🔍 Analyse des données...');
      
      // 3. Vérifier si c'est un compte de programme
      if (accountInfo.owner && accountInfo.owner.toString() !== '11111111111111111111111111111111') {
        console.log('❌ Ce compte appartient à un programme, pas au System Program');
        console.log('💡 Solution: Contacter le développeur du programme');
      } else {
        console.log('✅ Le compte appartient au System Program');
        console.log('🔧 Tentative de nettoyage...');
        
        // 4. Essayer de créer un nouveau compte et transférer
        const newKeypair = Keypair.generate();
        console.log('🆕 Création d\'un compte intermédiaire:', newKeypair.publicKey.toString());
        
        // 5. Transférer vers le compte intermédiaire
        const transferAmount = balance - 100000; // Laisser de quoi payer les frais
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: newKeypair.publicKey,
            lamports: transferAmount
          })
        );
        
        console.log('📤 Tentative de transfert vers compte intermédiaire...');
        
        try {
          const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
          console.log('✅ Transfert vers intermédiaire réussi:', signature);
          
          // 6. Transférer depuis l'intermédiaire vers la destination
          const finalTransaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: newKeypair.publicKey,
              toPubkey: destinationPubkey,
              lamports: transferAmount - 5000 // Frais
            })
          );
          
          const finalSignature = await sendAndConfirmTransaction(connection, finalTransaction, [newKeypair]);
          console.log('✅ Transfert final réussi:', finalSignature);
          console.log('🌐 Voir sur Solscan: https://solscan.io/tx/' + finalSignature);
          
        } catch (error) {
          console.log('❌ Échec du transfert vers intermédiaire:', error.message);
          
          // 7. Dernière tentative : utiliser des méthodes avancées
          console.log('🔄 Tentative avec méthodes avancées...');
          
          const advancedTransaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: keypair.publicKey,
              toPubkey: destinationPubkey,
              lamports: transferAmount
            })
          );
          
          const { blockhash } = await connection.getLatestBlockhash('finalized');
          advancedTransaction.recentBlockhash = blockhash;
          advancedTransaction.feePayer = keypair.publicKey;
          advancedTransaction.sign(keypair);
          
          const advancedSignature = await connection.sendRawTransaction(advancedTransaction.serialize(), {
            skipPreflight: true,
            maxRetries: 5
          });
          
          await connection.confirmTransaction(advancedSignature, 'confirmed');
          console.log('✅ Méthode avancée réussie:', advancedSignature);
          
        }
      }
    } else {
      console.log('✅ Le compte semble propre, tentative de transfert normal...');
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destinationPubkey,
          lamports: balance - 5000
        })
      );
      
      const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
      console.log('✅ Transfert réussi:', signature);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📚 Selon la documentation Solana:');
    console.log('1. Vérifiez que le compte appartient au System Program');
    console.log('2. Assurez-vous qu\'aucun programme n\'utilise ce compte');
    console.log('3. Contactez le support Solana si le problème persiste');
    console.log('4. Utilisez Solana StackExchange pour obtenir de l\'aide');
  }
}

// Lancer la récupération officielle
officialRecovery(); 