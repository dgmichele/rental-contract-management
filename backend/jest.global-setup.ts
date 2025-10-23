
import * as path from 'path';
import * as dotenv from 'dotenv';

export default async () => {
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });
};
