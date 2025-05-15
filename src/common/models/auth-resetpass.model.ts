import { JwtTokenType } from "@prisma/client";
export class AuthResetPassModel {
    token: string;
    authId: string;
    expirationDateToken: Date;
    type?: JwtTokenType
}
