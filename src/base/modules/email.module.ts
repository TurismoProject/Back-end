import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { ConfigModule } from '@nestjs/config/dist/config.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('HOST'),
                    port: configService.get<number>('PORT_EMAIL'),
                    auth: {
                        user: configService.get<string>('USER'),
                        pass: configService.get<string>('PASS'),
                    },
                },
                defaults: {
                    from: configService.get<string>('EMAIL_DEFAULT'),
                },
                template: {
                    dir: __dirname + '/config/templates',
                    adapter: new PugAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
        }),
    ],

    exports: [MailerModule],
})
export class EmailModule { }
