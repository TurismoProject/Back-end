import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {

    constructor(private readonly MailerService: MailerService) { }

    async sendEmail(to: string, subject: string, template: string): Promise<void> {
        try {
            await this.MailerService.sendMail({
                subject,
                to,
                template: template,
                context: {
                    code: Math.floor(100000 + Math.random() * 900000),
                    name: '',
                    link: '',
                },
            });
        } catch (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}
