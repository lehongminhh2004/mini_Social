import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import threadRoutes from './routes/threads';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/threads', threadRoutes);

app.get('/', (req, res) => {
  res.send('MiniSocial API is running!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
