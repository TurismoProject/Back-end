import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailService {
    constructor(private readonly mailerService: MailerService) { }
    async sendEmail(to: string, subject: string, resetLink: string): Promise<SentMessageInfo> {
        try {
            const response = await this.mailerService.sendMail({
                to,
                subject,
                template: 'forget',
                context: {
                    resetLink
                }
            });

            return { response };
        } catch (error) {
            throw new InternalServerErrorException('Erro ao enviar o e-mail de recuperação de senha.');
        }
    }
}