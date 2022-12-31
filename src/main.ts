import { NestFactory } from '@nestjs/core';
import { KafkaModule } from './kafka.module';

async function bootstrap() {
  // Create a NEST-JS app and listen on port
  const app = await NestFactory.create(KafkaModule);
  await app.listen(8000); // ==> change port 8000 to whatever you like
}
bootstrap();
