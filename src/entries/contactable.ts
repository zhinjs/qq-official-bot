import {Bot} from "@";

export class Contactable {
    guild_id?: string
    channel_id?: string
    group_id?: string
    user_id?: string

    constructor(public bot: Bot) {

    }
}
