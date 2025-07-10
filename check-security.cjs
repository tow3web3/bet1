#!/usr/bin/env node

// Script de vérification de sécurité
const fs = require('fs');
const path = require('path');

console.log('🔐 Vérification de la sécurité du pool wallet...\n');

// 1. Vérifier que .env existe
if (!fs.existsSync('.env')) {
  console.error('❌ ERREUR: Fichier .env manquant');
  console.error('Le fichier .env doit contenir POOL_PRIVATE_KEY');
  process.exit(1);
}

// 2. Vérifier que .env est dans .gitignore
const gitignore = fs.readFileSync('.gitignore', 'utf8');
if (!gitignore.includes('.env')) {
  console.error('❌ ERREUR: .env n\'est pas dans .gitignore');
  console.error('Ajoutez .env à votre .gitignore');
  process.exit(1);
}

// 3. Vérifier le contenu de .env
const envContent = fs.readFileSync('.env', 'utf8');
if (!envContent.includes('POOL_PRIVATE_KEY=')) {
  console.error('❌ ERREUR: POOL_PRIVATE_KEY manquante dans .env');
  process.exit(1);
}

// 4. Vérifier que la clé privée n'est plus dans server.js
const serverContent = fs.readFileSync('server.js', 'utf8');
if (serverContent.includes('[64,243,245,223,49,250,236,150,242,84,230,44,25,105,133,216,125,177,153,22,115,111,247,59,224,45,91,105,173,219,189,34,49,232,181,169,33,223,10,206,84,244,215,182,89,51,181,78,9,60,59,185,127,232,114,78,101,0,191,54,210,231,139,18]')) {
  console.error('❌ ERREUR: Clé privée encore hardcodée dans server.js');
  process.exit(1);
}

// 5. Vérifier que dotenv est installé
try {
  require('dotenv');
} catch (error) {
  console.error('❌ ERREUR: Package dotenv non installé');
  console.error('Exécutez: npm install dotenv');
  process.exit(1);
}

console.log('✅ Fichier .env présent et configuré');
console.log('✅ .env dans .gitignore');
console.log('✅ Clé privée sécurisée (plus de hardcode)');
console.log('✅ Package dotenv installé');
console.log('\n🎉 Configuration de sécurité validée !');
console.log('\n📋 Prochaines étapes:');
console.log('1. Démarrez le backend: node server.js');
console.log('2. Démarrez le frontend: npm run dev');
console.log('3. Testez sur http://localhost:5175');
console.log('\n⚠️  Rappel: Ne partagez jamais le fichier .env !'); 