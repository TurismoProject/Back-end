import { User } from "@prisma/client";

export class ResponseResetPassModel {
    user: User;
    message: string;
}