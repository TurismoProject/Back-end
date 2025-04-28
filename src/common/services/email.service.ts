import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Admin, Supplier, User } from '@prisma/client';

@Injectable()
export class EmailService {

    constructor(private readonly MailerService: MailerService) { }

    async sendEmailUsers(user: User | Admin | Supplier, to: string, subject: string, template: string): Promise<boolean> {
        try {
            const isSend: boolean = await this.MailerService.sendMail({
                subject,
                to,
                template: template,
                context: {
                    code: Math.floor(100000 + Math.random() * 900000),
                    name: user.name,
                    link: '',
                },
            });
            return isSend;
        } catch (error) {
            throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
        }
    }
}
