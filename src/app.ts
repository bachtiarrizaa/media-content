import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (_, res) => {
  res.send('Media Content API running');
});

app.use('/api', router);

app.use(errorMiddleware);

export default app;
