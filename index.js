////////////////////////////////////////////////////////////////////////////////////
///////////////////////// I M P O R T   S T U F F //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

import * as dotenv from "dotenv";               // Environment variable stuff
dotenv.config();                                // read shit from .env

import { setTimeout } from "timers/promises";   // async..things? I think?
import Mastodon from "mastodon-api";
import fs from "fs";                            // file reading stuff

import * as frac from "./fractalgeneration.js";

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// B O T  S T U F F //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

//let imgCreated = false;
//let code; // = "LOOP 6 ! PEN T -90 F 300 T 90 B 30 PEN LOOP 36 A 100 ! LOOP 10 TXT Love T 36 ! T 90 B 10 ? HUE 1 END ? PEN F 20 PEN HUE 6 T 1 END ? PEN F 20 T 60 PEN END";
Mockup();

const M = new Mastodon({
  client_secret: process.env.CLIENT_SECRET,
  client_key: process.env.CLIENT_KEY,
  access_token: process.env.ACCESS_TOKEN,
  timeout_ms: 60 * 1000,
  api_url: "https://botsin.space/api/v1/",
});
console.log("created Mastodon object.");

console.log("Setting up listener");
const stream = M.stream("streaming/user");
stream.on("message", async (msg) => {
    //console.log(msg);
    console.log("got msg");

    if(msg.event === 'notification'){
        if(msg.data.type === 'mention'){
            console.log(msg);
            // GETTING CODE FROM THE MESSAGE
            code = ExtractCode(msg, "$CODE ");
            if(!code || code == ""){
              console.log("No code to run");
              // TODO: reply something like "sorry, couldn't understand you :("
              return;
            }
            
            // CREATING IMAGE FROM CODE
            imgCreated = false;
            console.log("trying to parse and create image");
            let p5Instance = p5.createSketch(sketch);
            
            let waitTimeInSeconds = 10;
            console.log("waiting " + waitTimeInSeconds + " seconds for image to be created");
            await setTimeout(waitTimeInSeconds * 1000);

            if(!imgCreated){
              console.log("something went wrong creating the sketch, parsing or saving the image");
              // TODO: reply something like "sorry, your code seems incorrect check it and try again";
              return;
            }
            
            // REPLYING WITH IMAGE ATTACHED
            const accountName = msg.data.account.acct;
            let replyStatus = "@" + accountName + " here you go!"; 
            let replyID = msg.data.status.id;

            console.log("replying");
            M.post('media', { file: fs.createReadStream('myCanvas.png') }).then(resp => {
                const id = resp.data.id;
                M.post('statuses', { in_reply_to_id: replyID, status: replyStatus, visibility:'public', media_ids: [id] }, (err, data)=>{
                    if(err)
                        console.error(err);
                });
            });
        }
    }
});
console.log("listening...");

/*
stream.on("error", (err) => {
  console.log(err);
});

stream.on("heartbeat", (msg) => {
  console.log("thump.");
});
*/

async function Mockup(){

  /*
  let myMsg = []; 
  myMsg.data = [];
  myMsg.data.status = [];
  myMsg.data.status.content = "blabla bla <tag> $CODE HUE 150 NGON 6 200";
  code = ExtractCode(myMsg, "$CODE ");
  console.log("finished code extraction: " + code);
  let p5Instance = p5.createSketch(sketch);
  console.log("waiting........................");
  await setTimeout(5 * 1000);
  console.log("success = " + imgCreated);

  */
  let myMsg = []; 
  myMsg.data = [];
  myMsg.data.status = [];
  myMsg.data.status.content = "blabla bla <tag> $CODE HUE 150 NGON 6 200";
  code = ExtractCode(myMsg, "$CODE ");
  frac.TryGenFractal(code);
}


function tootPrivate(myStatus){
    let params ={
        status: myStatus,
        visibility:'private'
    };
    
    M.post('statuses', params, (err, data)=>{
        if(err)
            console.error(err);
        else
            console.log(data);
    });
}

function tootPublic(myStatus){
  let params ={
      status: myStatus,
      visibility:'private'
  };
  
  M.post('statuses', params, (err, data)=>{
      if(err)
          console.error(err);
      else
          console.log(data);
  });
}



function ExtractCode(message, codeDelimiter){
  // Extract the actual content of the message
  let content = message.data.status.content;
  if(!content){
    console.log("ERROR: something went wrong reading in the message");
    return;
  }

  // Strip HTML
  content = content.replace(/<[^>]*>?/gm, "");
  if(!content || content === ""){
     console.log("ERROR: there's nothing left after stripping HTML");
     return;
  }

  // Checking if there is a code section in the message
  let codeLocation = content.indexOf(codeDelimiter);
  if(!codeLocation || codeLocation === -1){
    console.log("ERROR: No code delimiter found in the message");
    return;
  }

  // stripping everything but the code
  content = content.slice(codeLocation + codeDelimiter.length, content.length);
  if(!content || content === ""){
    console.log("ERROR: didn't find any code after the delimiter");
    return;
  }

  // Everything's ... fine?
  return content; 
}
