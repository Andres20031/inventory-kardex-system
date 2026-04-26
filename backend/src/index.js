import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import mongoose from 'mongoose';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { getUsuarioDesdeToken } from './utils/auth.js';

const app = express();
app.use(express.json());

// Conectar MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ MongoDB conectado');

// Configurar Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const usuario = token ? getUsuarioDesdeToken(token) : null;
      return { usuario };
    },
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}/graphql`);
});