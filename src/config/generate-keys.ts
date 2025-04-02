import { generateKeyPairSync } from 'crypto';
import fs from 'fs';

console.log('🔑 Gerando chaves RSA (RS256)...');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync('private_key.pem', privateKey);
fs.writeFileSync('public_key.pem', publicKey);

console.log(
  "✅ Chaves geradas e salvas como 'private_key.pem' e 'public_key.pem'."
);

function convertPemToBase64(filePath: string) {
  const pem = fs.readFileSync(filePath, 'utf8');
  const base64 = Buffer.from(pem).toString('base64');
  return base64;
}

const privateKeyBase64 = convertPemToBase64('private_key.pem');
const publicKeyBase64 = convertPemToBase64('public_key.pem');

fs.writeFileSync('private_key_base64.txt', privateKeyBase64);
fs.writeFileSync('public_key_base64.txt', publicKeyBase64);

console.log(
  "✅ Chaves convertidas para Base64 e salvas como 'private_key_base64.txt' e 'public_key_base64.txt'."
);
