import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmailTemplate } from '../enums/email.enums';

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({
    description:
      'Optional custom email subject. If not provided, a default based on the template will be used.',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    enum: EmailTemplate,
    description: 'The email template to use',
  })
  @IsEnum(EmailTemplate)
  @IsNotEmpty()
  template: EmailTemplate;

  @ApiProperty({
    description: 'Data properties to populate the email template',
  })
  @IsObject()
  @IsNotEmpty()
  context: Record<string, any>;
}
