const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

// Nachricht verschlüsseln
function encrypt(text) {
    const iv = crypto.randomBytes(16); // Generiere einen neuen IV für jede Verschlüsselung
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Schlüssel aus Umgebungsvariablen laden

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Der IV wird zusammen mit dem verschlüsselten Text zurückgegeben
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Nachricht entschlüsseln
function decrypt(text) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Schlüssel aus Umgebungsvariablen laden
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
