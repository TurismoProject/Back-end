import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: 'smtps://user@domain.com:pass@smtp.domain.com',
            defaults: {
                from: "matheusrogato@gmail.com",
            },
            template: {
                dir: __dirname + 'config/templates',
                adapter: new PugAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
    ],
    exports: [MailerModule],
})
export class EmailModule { }
