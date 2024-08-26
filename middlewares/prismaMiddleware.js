// prismaMiddleware.js
const { PrismaClient } = require('@prisma/client');

// Middleware, die Prisma für jede Anfrage initialisiert und dann schließt
function prismaMiddleware(req, res, next) {
    const prisma = new PrismaClient();

    // Prisma-Instanz an req-Objekt anhängen
    req.prisma = prisma;

    // Wenn die Antwort gesendet wird, Prisma-Instanz schließen
    res.on('finish', async () => {
        await prisma.$disconnect();
    });

    next();
}

module.exports = prismaMiddleware;
