import { JwtTokenType } from "@prisma/client";

export class AuthResetPassModel {
    Token: string;
    authId: string;
    expirationDateToken: number;
    type?: JwtTokenType
}
