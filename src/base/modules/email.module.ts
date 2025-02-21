import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: 'smtps://user@domain.com:pass@smtp.domain.com',
            defaults: {
<<<<<<< HEAD
                from: "matheusrogato@gmail.com",
            },
            template: {
                dir: __dirname + 'config/templates',
=======
                from: '"nest-modules" <modules@nestjs.com>',
            },
            template: {
                dir: __dirname + '/templates',
>>>>>>> 9176aaa2d034a831ce775d4c3b0d33d838e38168
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
