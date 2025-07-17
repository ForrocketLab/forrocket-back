import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; 

@Global() 
@Module({
  imports: [
    ConfigModule, 
  ],
  providers: [EmailService],
  exports: [EmailService], 
})
export class EmailModule {}
