import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as dotenv from 'dotenv';
dotenv.config();

// Clé privée lue depuis la variable d'environnement
const POOL_PRIVATE_KEY_STRING = process.env.POOL_PRIVATE_KEY;
if (!POOL_PRIVATE_KEY_STRING) {
  throw new Error('POOL_PRIVATE_KEY non définie dans les variables d\'environnement');
}
const POOL_PRIVATE_KEY = Uint8Array.from(JSON.parse(POOL_PRIVATE_KEY_STRING));
const poolKeypair = Keypair.fromSecretKey(POOL_PRIVATE_KEY);

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

/**
 * Envoie un payout sécurisé depuis le wallet pool.
 * @param toPubkeyString PublicKey du destinataire
 * @param amountSol Montant en SOL
 */
export async function securePayout(toPubkeyString: string, amountSol: number) {
  const toPubkey = new PublicKey(toPubkeyString);
  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  // 1. Crée une transaction avec uniquement un transfert SOL
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: poolKeypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  // 2. Vérifie que la transaction ne contient qu'une instruction de transfert
  if (
    transaction.instructions.length !== 1 ||
    !transaction.instructions[0].programId.equals(SystemProgram.programId)
  ) {
    throw new Error("Transaction non autorisée : uniquement SystemProgram.transfer permis !");
  }

  // 3. Envoie la transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [poolKeypair]);
  console.log(`Payout sécurisé envoyé ! Signature : ${signature}`);
  return signature;
}

// Exemple d'utilisation (à commenter ou supprimer en prod)
// securePayout("DESTINATAIRE_PUBLIC_KEY", 0.1).catch(console.error); 