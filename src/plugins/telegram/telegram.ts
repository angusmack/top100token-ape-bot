import { EventEmitter } from "eventemitter3";
import { Api, TelegramClient }from "telegram";
import  { StringSession } from "telegram/sessions";


export class TelegramScrapper extends EventEmitter {
    private apiId: number;
    private apiHash: string;
    private stringSession: StringSession;
    private channelName: string;

    private lastSignal = '';

    constructor(apiId: string, apiHash: string, session: string, channelName: string){
        super();
        this.apiId = Number(apiId);  
        this.apiHash = apiHash;  
        this.stringSession = new StringSession(session); 
        this.channelName = channelName;

        // Every 2 Minute check
        setInterval(async ()=> {
          await this.GetPoocoinSignal();

        }, 15000);


    }

    public async GetPoocoinSignal(): Promise<string | null>{
        try {
            const client = new TelegramClient(this.stringSession, this.apiId, this.apiHash, {
                connectionRetries: 5,
              });
              await client.connect();
    
              const channelResult = await client.invoke(
                new Api.channels.GetFullChannel({
                  channel: this.channelName,
                })
              );
            
              const lastMessage = (channelResult.fullChat as any).readInboxMaxId;
              const unreadCount = (channelResult.fullChat as any).unreadCount;
    
              const getLastMessage = await client.invoke(
                new Api.channels.GetMessages({
                  channel: this.channelName,
                  id: [lastMessage+unreadCount] as any
                })
              );
    
              const content = (getLastMessage as any).messages[0];
    
              if((content.message as string).includes('poocoin.app'))
              {
                  const almostAddres =(content.message as string).split("poocoin.app/tokens/");
          
                  // for e.g. 0xb6a6dcccba92905c34801e1458b0606e07bb3dd4
                  const address = almostAddres[1].substring(0,42);
          
                  await client.disconnect();
                
                if(this.lastSignal !== address){
                    this.lastSignal = address;

                    this.emit('newSignal', address);

                    return address;
                }
              }

              return null;
        } catch (error) {

            console.log('Telegram error, ', error);

            return null;
        }
    }
}


