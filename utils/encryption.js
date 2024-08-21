const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

// Nachricht verschlüsseln
function encrypt(text) {
    const iv = crypto.randomBytes(16); // Generiere einen neuen IV für jede Verschlüsselung
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Schlüssel aus Umgebungsvariablen laden
    const hmacKey = Buffer.from(process.env.HMAC_KEY, 'hex'); // Schlüssel für HMAC aus Umgebungsvariablen

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // HMAC berechnen
    const hmac = crypto.createHmac('sha256', hmacKey)
        .update(iv.toString('hex') + encrypted.toString('hex'))
        .digest('hex');

    // IV, verschlüsselter Text und HMAC zusammen zurückgeben
    return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + hmac;
}

// Nachricht entschlüsseln
function decrypt(text) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Schlüssel aus Umgebungsvariablen laden
    const hmacKey = Buffer.from(process.env.HMAC_KEY, 'hex'); // Schlüssel für HMAC aus Umgebungsvariablen

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.shift(), 'hex');
    const hmacReceived = textParts.shift();

    // HMAC überprüfen
    const hmacCalculated = crypto.createHmac('sha256', hmacKey)
        .update(iv.toString('hex') + encryptedText.toString('hex'))
        .digest('hex');

    if (hmacReceived !== hmacCalculated) {
        throw new Error('Data integrity check failed'); // HMAC stimmt nicht überein, Daten sind möglicherweise manipuliert
    }

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
