import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class EmailService {

    constructor(private readonly mailerService: MailerService) { }

    async sendEmail(to: string, subject: string, text: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                text,
            });
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
            await this.mailerService.sendMail({
                to,
                subject,
                template,
                context,
            });
        } catch (error) {
            throw new InternalServerErrorException(`erro ao enviar email para o destinatário ${to}: ${error.message}`);
        }
    }
}
