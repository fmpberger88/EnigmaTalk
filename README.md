# 🔒 Encrypted Messaging App 🔒

A secure messaging application built with Node.js, Express, PostgreSQL, Prisma ORM, Passport.js, and Socket.IO, featuring client-side end-to-end encryption and automatic message deletion.

## 🌟 Features

- 🔐 Users can securely send and receive encrypted messages.
- 🔑 Client-side end-to-end encryption ensures messages are encrypted before being sent.
- ⏱️ Messages are automatically deleted 30 seconds after being read.
- 🗄️ Messages and users are managed with PostgreSQL using Prisma ORM.
- ✅ Form validation and sanitization using `express-validator`.
- 🔒 Authentication using Passport.js with session management.
- 📡 Real-time communication enabled with Socket.IO.

## 🛠️ Getting Started

### Prerequisites

- 🟢 Node.js and npm installed.
- 🟠 PostgreSQL installed and running locally or on a cloud service.
- 🟣 Redis installed and running locally or use a Redis cloud service for session management (optional but recommended).

### Installation

1. 📥 Clone the repository:
    ```bash
    git clone https://github.com/yourusername/encrypted-messaging-app.git
    cd encrypted-messaging-app
    ```

2. 📦 Install the dependencies:
    ```bash
    npm install
    ```

3. 🗝️ Create a `.env` file in the root directory and add your PostgreSQL, Redis, and encryption keys:
    ```env
    PORT=5000
    DATABASE_URL=postgresql://user:password@localhost:5432/encrypted_messaging
    NODE_ENV=development
    ENCRYPTION_KEY=Your32ByteHexKey
    HMAC_KEY=Your32ByteHexHMACKey
    SESSION_SECRET=YourSessionSecret
    ```

4. 🛠️ Run the Prisma migrations to set up your database:
    ```bash
    npx prisma migrate dev --name init
    ```

5. 🚀 Start the application:
    ```bash
    node index.js
    ```

   Alternatively, use `nodemon` for development:
    ```bash
    npm install -g nodemon
    npm run dev
    ```

### Usage

1. 🌐 Use a tool like Postman or Insomnia to interact with the API.
2. 🔑 Register a new user using the `/register` endpoint.
3. 🔓 Log in using the `/login` endpoint.
4. 📨 Send encrypted messages using the `/api/message` endpoint.
5. 🗑️ Messages are automatically deleted 30 seconds after being marked as read using the `/api/message/:messageId/read` endpoint.

## API Endpoints

### Authentication
- `POST /register` - Register a new user.
- `POST /login` - Log in a user and start a session.
- `POST /logout` - Log out the current user.

### Messages
- `POST /api/message` - Send a new encrypted message.
- `GET /api/messages/:userId` - Retrieve all messages for a user.
- `POST /api/message/:messageId/read` - Mark a message as read and trigger deletion after 30 seconds.

## Dependencies

- [express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js.
- [prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript.
- [passport](https://www.passportjs.org/) - Simple, unobtrusive authentication for Node.js.
- [bcrypt](https://www.npmjs.com/package/bcrypt) - A library to help you hash passwords.
- [socket.io](https://socket.io/) - Enables real-time bidirectional event-based communication.
- [express-validator](https://express-validator.github.io/docs/) - Express middleware for validation of incoming requests.
- [dotenv](https://github.com/motdotla/dotenv) - Loads environment variables from a `.env` file.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need for secure and ephemeral messaging.
- Thanks to all the open-source contributors whose libraries and tools made this project possible.
