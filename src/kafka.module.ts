import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { KafkaController } from './kafka.controller';
import { KafkaService } from './kafka.service';

@Module({
  imports: [],
  exports: [],
  controllers: [KafkaController],
  providers: [KafkaService, ConsumerService]
})
export class KafkaModule {}
