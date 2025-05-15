import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailService {
    constructor(private readonly mailerService: MailerService) { }
    async sendEmail(to: string, subject: string, text: string): Promise<SentMessageInfo> {
        try {
            const response = await this.mailerService.sendMail({
                to,
                subject,
                text,
                template: 'forget'
            });
            return {response};
        } catch (error) {
            throw new InternalServerErrorException(`erro ao enviar email para o destinatário ${to}: ${error}`);
        }
    }
    async sendEmailWithTemplate(
        to: string,
        subject: string,
        template: string,
        context: any
    ) {
        try {
            const response = await this.mailerService.sendMail({
                to,
                subject,
                template,
                context,
            });
            return response;
        } catch (error) {
            throw new InternalServerErrorException(`erro ao enviar email para o destinatário ${to}: ${error.message}`);
        }
    }
}
