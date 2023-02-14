import p5 from "node-p5";
let c;
export let imgCreated = false;
export function TryGenFractal(externalCode){
    c = externalCode;
    console.log("recieved code "  + c);
    console.log("thank you mommy");
    imgCreated = false;
    let p5Instance = p5.createSketch(sketch);
}


////////////////////////////////////////////////////////////////////////////////////
//////////////////////// F R A C T A L   S T U F F /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

class Instruction {
    constructor(fn, numberOfInputs) {
      this.fn = fn;
      this.numberOfInputs = numberOfInputs;
      this.inputIndex = 0;
      this.inputs = [];
    }
  
    // Inputs get set one after the other
    // The following code:
    //    myInstruction.SetInput(input0);
    //    myInstruction.SetInput(input1);
    // Sets this.inputs[0] to input0 and this.inputs[1] to input1
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
  
  // All possible instructions tokens given in the form:
  // "TOKEN"  : new Instructions(functionName,  numberOfInputs);
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
    // Parse creates Instructions from code and executes it right away
    // TODO: yea.. maybe don't execute right away ya dumdum
    Parse(sketch, turtle, input) {
      let instructions = this.CreateInstructions(input);
      if (!this.VerifyInstructions(instructions))
        return console.log("instructions not valid");
      this.ExecuteInstructions(sketch, turtle, instructions);
      return true;
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
  
      // Check if every instruction, that needs inputs has them.
      // TODO: check a little better, if the instructions are actually valid inputs to the function
      // TODO: maybe modify an instruction to have a CheckInputs() method, so VerifyInstructions() stays clean
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
  
    // TODO: Oh god, please refactor this garbageblob
    CreateInstructions(input) {
      let instructions = [];
      let k = 0;
      let split = input.split(" ");
      for (let i = 0; i < split.length; i++) {
  
        // Verification of current token
        let token = split[i];
        if (token === "") return console.log("got invalid token (empty)");
        if (!this.IsValidToken(token))
          return console.log("got invalid token: " + token);
  
        // If token is not LOOP, then just read in the required number of inputs
        if (token !== "LOOP") {
          instructions[k] = instructionSet[token].Clone();
          if (instructions[k].numberOfInputs > 0) {
            for (let n = 0; n < instructions[k].numberOfInputs; n++)
              instructions[k].SetInput(split[++i]);
          }
        // If the toke is LOOP, read in everything until the corresponding END token occurs.
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
  
  // Mostly a datastructure to hold the mutable data of the sketch
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
  
  //////////////////////////// INSTRUCTION DEFINITIONS ////////////////////////////
  
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
      //console.log("got hue value to add: " + parseInt(val) + ", so the hue of " + parseInt(turtle.hue) + " will change to " + parseInt(parseInt(turtle.hue) + parseInt(val)));
      let newHue = parseInt(parseInt(turtle.hue)) + (parseInt(val));
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
  
  ///////////////////////////////////// SKETCH ////////////////////////////////////
  
  // this is the function, that actually gets the parser to do its job
  // it also handles the image creation and saving
  function sketch(p) {
      let canvas;
      p.setup = () => {
          canvas = p.createCanvas(800, 800);
      }
      p.draw = () => {
          p.background(0);
          p.translate(p.width/2, p.height/2);
          p.colorMode(p.HSB, 255, 255, 255, 255);
          p.angleMode(p.DEGREES);
  
          let turtle = new Turtle();
          let parser = new Parser();
  
          console.log("parsing in sketch");
          let result = parser.Parse(p, turtle, c);
  
          if(result === true){
            console.log("saving image");
            p.saveCanvas(canvas, 'myCanvas', 'png').then(filename => {
              console.log(`saved the canvas as ${filename}`);
            });
  
            imgCreated = true;
          }
          p.noLoop();
          p.remove();
      }
  }