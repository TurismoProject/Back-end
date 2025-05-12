// email.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { SESClient } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const ses = new SESClient({
                    region: configService.get<string>('AWS_REGION'),
                    credentials: {
                        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
                    },
                });

                return {
                    transport: {
                        SES: { ses, aws },
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
                };
            },
        }),
    ],
    exports: [MailerModule],
})
export class EmailModule { }
