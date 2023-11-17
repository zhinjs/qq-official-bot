export namespace User{
    export interface Info{
        id:string
        username:string
        avatar:string
        bot:boolean
        public_flag:number
    }
    export enum Permission{
        normal=1,
        admin=2,
        owner=4,
        channelAdmin=5,
    }
}
