import * as dotenv from "dotenv";
dotenv.config();

import { setTimeout } from "timers/promises";

import Mastodon from "mastodon-api";

import p5 from "node-p5";

import fs from "fs";

// FRACTAL STUFF

class Instruction {
  constructor(fn, numberOfInputs) {
    this.fn = fn;
    this.numberOfInputs = numberOfInputs;
    this.inputIndex = 0;
    this.inputs = [];
  }
  SetInput(value) {
    if (this.numberOfInputs === 0) {
      console.log("tried to set Input on something, that didn't need it.");
      return;
    }
    this.inputs[this.inputIndex++] = value;
  }
  Clone() {
    return new Instruction(this.fn, this.numberOfInputs);
  }
}

let instructionSet = {
    "F"     : new Instruction(Forward,        1),
    "B"     : new Instruction(Backward,       1),
    "T"     : new Instruction(Turn,           1),
    "PEN"   : new Instruction(SwitchPenState, 0),
    "LOOP"  : new Instruction(Repeat,         1),
    "HUE"   : new Instruction(ChangeHue,      1),
    "!"     : new Instruction(Push,           0),
    "?"     : new Instruction(Pop,            0),
    "A"     : new Instruction(ChangeAlpha,    1),
    "TXT"   : new Instruction(Text,           1),
    "NGON"  : new Instruction(NGon,           2)
};

class Parser {
  Parse(sketch, turtle, input) {
    let instructions = this.CreateInstructions(input);
    if (!this.VerifyInstructions(instructions))
      return console.log("instructions not valid");
    this.ExecuteInstructions(sketch, turtle, instructions);
  }

  ExecuteInstructions(sketch, turtle, instructions) {
    for (let i = 0; i < instructions.length; i++)
      instructions[i].fn(sketch, turtle, instructions[i].inputs);
  }

  LogInstructions(instructions) {
    console.log("instructions are:");
    for (let i = 0; i < instructions.length; i++) console.log(instructions[i]);
  }

  VerifyInstructions(instructions) {
    if (!instructions) return false;
    if (instructions == []) return false;

    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].numberOfInputs === 0) continue;
      else if (
        instructions[i].numberOfInputs !== 0 &&
        instructions[i].inputs === undefined
      )
        return false;
      else if (
        instructions[i].numberOfInputs !== 0 &&
        instructions[i].inputs === ""
      )
        return false;
      else if (
        instructions[i].numberOfInputs !== 0 &&
        instructions[i].inputs === []
      )
        return false;
    }
    return true;
  }

  CreateInstructions(input) {
    let instructions = [];
    let k = 0;
    let split = input.split(" ");
    for (let i = 0; i < split.length; i++) {
      let token = split[i];
      if (token === "") return console.log("got invalid token (empty)");
      if (!this.IsValidToken(token))
        return console.log("got invalid token: " + token);

      if (token !== "LOOP") {
        instructions[k] = instructionSet[token].Clone();
        if (instructions[k].numberOfInputs > 0) {
          for (let n = 0; n < instructions[k].numberOfInputs; n++)
            instructions[k].SetInput(split[++i]);
        }
      } else {
        instructions[k] = instructionSet[token].Clone();
        let loopInstructions = "";
        let j = 0;
        while ((split[++i] !== "END" || j !== 0) && i < split.length) {
          loopInstructions += split[i] + " ";
          if (split[i] === "LOOP") j++;
          else if (split[i] === "END") j--;
        }
        instructions[k].SetInput(loopInstructions.slice(0, -1));
      }
      k++;
    }
    return instructions;
  }

  IsValidToken(token) {
    let keys = Object.keys(instructionSet);
    return keys.includes(token);
  }
}

class Turtle {
    constructor() {
        this.penState = true;
        this.hue = 0;
        this.alpha = 255;
    }
    Move(sketch, amount) {
        sketch.stroke(this.hue, 255, 255, this.alpha);
        if (this.penState === true) sketch.line(0, 0, amount, 0);
            sketch.translate(amount, 0);

    }
    Turn(sketch, angle) {
        sketch.rotate(angle);

    }
}

function Forward(sketch, turtle, value){
    turtle.Move(sketch, value[0]);
}
function Backward(sketch, turtle, value){
    turtle.Move(sketch, -value[0]);
}
function Turn(sketch, turtle, value){
    turtle.Turn(sketch, value[0])
}
function SwitchPenState(sketch, turtle, inputs){
    turtle.penState = !turtle.penState;
}
function Repeat(sketch, turtle, instructions){
    let k = instructions[0].indexOf(' ');
    let counter = instructions[0].slice(0, k);
    let rest = instructions[0].slice(k+1, instructions[0].length);
    let newParser = new Parser();
    for(let i = 0; i < counter; i++)
      newParser.Parse(sketch, turtle, rest);
}
function ChangeHue(sketch, turtle, value){
    let val = value[0];
    let newHue = (turtle.hue) + (val);
    
    while(newHue > 255)
      newHue -= 255;
    
    while(newHue < 0)
      newHue += 255;
  
    turtle.hue = newHue;
}
function Pop(sketch, turtle, input){
    sketch.pop();
}
function Push(sketch, turtle, input){
    sketch.push();
}
function ChangeAlpha(sketch, turtle, value){
    let val = value[0];
    let newAlpha = (turtle.alpha) + (val);
    
    while(newAlpha > 255)
      newAlpha -= 255;
    
    while(newAlpha < 0)
      newAlpha += 255;
  
    turtle.alpha = newAlpha;
}
function Text(sketch, turtle, value){
    sketch.fill(turtle.hue, 255, 255);
    sketch.noStroke();
    sketch.text(value[0], 0, 0);
    sketch.textSize(20);
    SwitchPenState(sketch, turtle, value);
    Forward(sketch, turtle, [sketch.textWidth(value[0])]);
    SwitchPenState(sketch, turtle, value);
}
function NGon(sketch, turtle, inputs){
    let n = inputs[0];
    let size = [inputs[1]];
    
    let a = [360.0 / n];
    
    for(let i = 0; i < n; i++){
      Forward(sketch, turtle, size);
      Turn(sketch, turtle, a);
    }
}

function sketch(p) {
    let canvas;
    p.setup = () => {
        console.log("inside sketch");
        canvas = p.createCanvas(800, 800);
        /*
        setTimeout(() => {
            p.saveCanvas(canvas, 'myCanvas', 'png').then(filename => {
                console.log(`saved the canvas as ${filename}`);
            });
        }, 100);
        */
    }
    p.draw = () => {
        console.log("inside draw");
        p.background(0);
        p.translate(p.width/2, p.height/2);
        p.colorMode(p.HSB);
        p.angleMode(p.DEGREES);

        let turtle = new Turtle();
        let parser = new Parser();

        console.log("parsing in sketch");
        parser.Parse(p, turtle, code);


        console.log("saving image");
        p.saveCanvas(canvas, 'myCanvas', 'png').then(filename => {
            console.log(`saved the canvas as ${filename}`);
        });

        p.noLoop();
        p.remove();
    }
}


let code = "LOOP 6 ! PEN T -90 F 300 T 90 B 30 PEN LOOP 36 A 100 ! LOOP 10 TXT Love T 36 ! T 90 B 10 ? HUE 1 END ? PEN F 20 PEN HUE 6 T 1 END ? PEN F 20 T 60 PEN END";
//let p5Instance = p5.createSketch(sketch);
console.log("connecting");

const M = new Mastodon({
  client_secret: process.env.CLIENT_SECRET,
  client_key: process.env.CLIENT_KEY,
  access_token: process.env.ACCESS_TOKEN,
  timeout_ms: 60 * 1000,
  api_url: "https://botsin.space/api/v1/",
});

console.log("created Mastodon object.");

const stream = M.stream("streaming/user");

stream.on("message", async (msg) => {
    //console.log(msg);
    console.log("got msg");

    if(msg.event === 'notification'){
        if(msg.data.type === 'mention'){
            console.log(msg);
            const accountName = msg.data.account.acct;
            code = msg.data.status.content.replace(/<[^>]*>?/gm, "");

            code = code.slice(code.indexOf("$CODE ") + 6, code.length); 

            console.log("running sketch");
            let p5Instance = p5.createSketch(sketch);

            console.log("waiting");
            await setTimeout(2000);
            
            let replyStatus = "@" + accountName + " here you go!"; 
            let replyID = msg.data.status.id;

            console.log("replying");
            M.post('media', { file: fs.createReadStream('myCanvas.png') }).then(resp => {
                const id = resp.data.id;
                M.post('statuses', { in_reply_to_id: replyID, status: replyStatus, visibility:'public', media_ids: [id] }, (err, data)=>{
                    if(err)
                        console.error(err);
                    /*else
                        console.log(data);*/
                });
            });
        }
    }
});

stream.on("error", (err) => {
  console.log(err);
});

stream.on("heartbeat", (msg) => {
  console.log("thump.");
});

console.log("listening...");


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
