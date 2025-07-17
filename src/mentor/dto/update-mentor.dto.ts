import { PartialType } from '@nestjs/swagger';

import { CreateMentorDto } from './create-mentor.dto';

export class UpdateMentorDto extends PartialType(CreateMentorDto) {}
