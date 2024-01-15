import {User} from "@/entries/user";

export namespace Friend {
    export interface Info {
        id: string
        user: User.Info
        name: string
    }
}
