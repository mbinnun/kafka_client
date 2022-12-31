import { Controller, Get, Req, Request } from '@nestjs/common';
import { KafkaService } from './kafka.service';


@Controller('')
export class KafkaController {
  constructor(
    private readonly KafkaService: KafkaService,
  ) {}

  @Get()
  create(@Req() request: Request) {
    return this.KafkaService.showKafkaData(request);
  }
}
