// Bakeoff #2 - Seleção de Alvos Fora de Alcance
// IPM 2021-22, Período 3
// Entrega: até dia 22 de Abril às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 18 de Abril

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 43;      // Add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // Set to 'true' before sharing during the bake-off day

var bg1 = [];
var bg;
let song;
let song2;
let doSnapping = false;

let savedCursorX;
let savedCursorY;

// Target and grid properties (DO NOT CHANGE!)
let PPI, PPCM;
let TARGET_SIZE;
let TARGET_PADDING, MARGIN, LEFT_PADDING, TOP_PADDING;
let continue_button;
let inputArea        = {x: 0, y: 0, h: 0, w: 0}    // Position and size of the user input area

// Metrics
let testStartTime, testEndTime;// time between the start and end of one attempt (54 trials)
let hits 			 = 0;      // number of successful selections
let misses 			 = 0;      // number of missed selections (used to calculate accuracy)
let database;                  // Firebase DB  

// Study control parameters
let draw_targets     = false;  // used to control what to show in draw()
let trials 			 = [];     // contains the order of targets that activate in the test
let current_trial    = 0;      // the current trial number (indexes into trials array above)
let attempt          = 0;      // users complete each test twice to account for practice (attemps 0 and 1)
let fitts_IDs        = [];     // add the Fitts ID for each selection here (-1 when there is a miss)


// Target class (position and width)
class Target
{
  constructor(x, y, w)
  {
    this.x = x;
    this.y = y;
    this.w = w;
  }
}

// Runs once at the start
function setup()
{
  
  bg1[0] = loadImage('https://media.discordapp.net/attachments/950124025915519006/958759841197879357/IMG_0103.png');
  
  bg1[1] = loadImage('https://media.discordapp.net/attachments/950124025915519006/961272373812822056/IMG_0160.png?width=1178&height=663');
  
  bg1[2] = loadImage('https://media.discordapp.net/attachments/950124025915519006/961273198350049321/IMG_0162.png?width=1071&height=663');
  
  bg1[3] = loadImage('https://media.discordapp.net/attachments/950124025915519006/961274276592377906/IMG_0164.png?width=1009&height=663');
  
  bg1[4] = loadImage('https://media.discordapp.net/attachments/950124025915519006/961274861139931226/IMG_0165.jpg?width=1178&height=663');
  
  let indexes = [0,1,2,3,4];
  let index = random(indexes);
  bg = bg1[index];
  
  
  createCanvas(700, 500);    // window size in px before we go into //fullScreen()
  
  song = loadSound('yt1s.com - Undertale  Megalovania.mp3');
  song2 = loadSound('y2mate.com - Undertale OST 036  Dummy.mp3');
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  
  randomizeTrials();         // randomize the trial order at the start of execution
  
  textFont("Arial", 18);     // font size for the majority of the text
  drawUserIDScreen();        // draws the user start-up screen (student ID and display size)
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}


// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets)
  { 
    //bg = loadImage('https://media.discordapp.net/attachments/950124025915519006/958732775761010708/IMG_0100.png')
    // The user is interacting with the 6x3 target grid
    //background(image(bg));        // sets background to black
    background(bg);
    // Print trial count at the top left-corner of the canvas
    fill(color(255,255,255));
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    
    // Draw all 18 targets
	for (var i = 0; i < 18; i++) drawTarget(i);
    
    let t1 = getTargetBounds(trials[current_trial]);
    let t2 = getTargetBounds(trials[current_trial+1]);
    
    setLineDash([0,0]);
    stroke(2);
    stroke(color(900,900,900));
    line(t1.x, t1.y, t2.x, t2.y);
    
    if (trials[current_trial] == trials[current_trial+1]) {
      
      let virtual_x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
      let virtual_y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)
      
      stroke(color(5, 191, 400));
      setLineDash([0,0]);
      strokeWeight(2);
      fill(color(0,0,0));
      circle(t1.x, t1.y, t1.w+25);
      drawTarget(trials[current_trial]);
     
        if (dist(t1.x, t1.y, virtual_x, virtual_y) < t1.w/2) {
          
        stroke(color(0, 900, 0));
        setLineDash([0,0]);
        strokeWeight(2);
        fill(color(0,0,0));
        circle(t1.x, t1.y, t1.w+25);
        drawTarget(trials[current_trial]);
      
        }
    }
    
    drawTarget(trials[current_trial]);
    // Draw the user input area
    drawInputArea()

    let x;
    let y;
    
    
    // Draw the virtual cursor
    if (doSnapping == true) {
    x = savedCursorX;
    y = savedCursorY;
    
    noFill();
    stroke(color(50,50,50));
    strokeWeight(2);
    circle(x,y,0.5*PPCM);
    
    
    x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
    y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)

    fill(color(255,255,255));
    circle(x, y, 0.5 * PPCM);
    
    }
    else {
      x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
    y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)

    fill(color(255,255,255));
    circle(x, y, 0.5 * PPCM);
      
    }
    
  }
}

// Print and save results at the end of 54 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
  text(timestamp, 10, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);
  
  // Print Fitts IDS (one per target, -1 if failed selection, optional)
  // 

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,
        fitts_IDs:          fitts_IDs
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    // Get the location and size of the target the user should be trying to select
    let target = getTargetBounds(trials[current_trial]);   
    
    // Check to see if the virtual cursor is inside the target bounds,
    // increasing either the 'hits' or 'misses' counters
        
    if (insideInputArea(mouseX, mouseY))
    {
      let virtual_x = savedCursorX
      let virtual_y = savedCursorY

      if (dist(target.x, target.y, virtual_x, virtual_y) < target.w/2) hits++;
      else misses++;
      
      current_trial++;                 // Move on to the next trial/target
    }

    // Check if the user has completed all 54 trials
    if (current_trial === trials.length)
    {
      testEndTime = millis();
      if (song.isPlaying()) {
        song.stop();
      }
      else {
        song2.play();
      }
      if (song2.isPlaying()) {
        song2.stop();
      }
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    } 
    else if (current_trial === 1) testStartTime = millis();
  }
}

// Draw target on-screen
function drawTarget(i)
{
  // Get the location and size for target (i)
  let target = getTargetBounds(i);  
  
  // Draws the target
  fill(color(70,70,70));                 
  
  let virtual_x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
  let virtual_y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)
  
  
  // snapping
  if(dist(target.x, target.y, virtual_x, virtual_y) < target.w && dist(target.x, target.y, virtual_x, virtual_y) > target.w/2) {
    virtual_x = target.x;
    virtual_y = target.y;
    savedCursorY = target.y;
    savedCursorX = target.x;
    doSnapping = true;
  }
  else if (dist(target.x, target.y, virtual_x, virtual_y) < target.w/2){
    doSnapping = false;
  }
  
  
  if (trials[current_trial] === i) 
  { 
    if (dist(target.x, target.y, virtual_x, virtual_y) < target.w/2) {
      
      fill(color(0, 900, 0));
      setLineDash([0,0]);
      stroke(color(500,500,500));
      strokeWeight(5);
      circle(target.x, target.y, target.w);
    }
    
    else {
     
      // Highlights the target the user should be trying to select
    // with a white border
      //vermelho 900. 0. 0
    fill(color(5, 191, 400));
    setLineDash([0,0]);
    stroke(color(500,500,500));
    strokeWeight(5);
    circle(target.x, target.y, target.w);
      
    }
  
    
    // Remember you are allowed to access targets (i-1) and (i+1)
    // if this is the target the user should be trying to select
    //
  }
  
  else if (trials[current_trial+1] === i) {
    // vermeloh 115. 0. 0
    fill(color(112, 153, 194));
    setLineDash([10,10]);
    stroke(color(222, 222, 222));
    strokeWeight(5);
    circle(target.x, target.y, target.w);
    
  } 
  
  // Check whether this target is the target the user should be trying to select
  
  
  // Does not draw a border if this is not the target the user
  // should be trying to select
  else noStroke();      
  
  circle(target.x, target.y, target.w);
}

// Returns the location and size of a given target
function getTargetBounds(i)
{
  var x = parseInt(LEFT_PADDING) + parseInt((i % 3) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);
  var y = parseInt(TOP_PADDING) + parseInt(Math.floor(i / 3) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);

  return new Target(x, y, TARGET_SIZE);
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  // Re-randomize the trial order
  shuffle(trials, true);
  current_trial = 0;
  print("trial order: " + trials);
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  fitts_IDs = [];
  
  continue_button.remove();
  
  let indexes = [1,2,3,4];
  let index = random(indexes);
  bg = bg1[index];
  background(bg);
  
  if (song.isPlaying()) {
    song.stop();
  }
  else if (song2.isPlaying()) {
    song2.stop();
  }
  else{
    song2.play();
  }
  
  // Shows the targets again
  draw_targets = true;
  testStartTime = millis();  
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
    
  
  if (song.isPlaying()){
    song2.stop();    
    song.stop();
  }
  else {
    song.play();
  }
  
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NOT CHANGE THESE!
  PPI            = display.ppi;                        // calculates pixels per inch
  PPCM           = PPI / 2.54;                         // calculates pixels per cm
  TARGET_SIZE    = 1.5 * PPCM;                         // sets the target size in cm, i.e, 1.5cm
  TARGET_PADDING = 1.5 * PPCM;                         // sets the padding around the targets in cm
  MARGIN         = 1.5 * PPCM;                         // sets the margin around the targets in cm

  // Sets the margin of the grid of targets to the left of the canvas (DO NOT CHANGE!)
  LEFT_PADDING   = width/3 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;        

  // Sets the margin of the grid of targets to the top of the canvas (DO NOT CHANGE!)
  TOP_PADDING    = height/2 - TARGET_SIZE - 3.5 * TARGET_PADDING - 1.5 * MARGIN;
  
  // Defines the user input area (DO NOT CHANGE!)
  inputArea      = {x: width/2 + 2 * TARGET_SIZE,
                    y: height/2,
                    w: width/3,
                    h: height/3
                   }

  // Starts drawing targets immediately after we go fullscreen
  draw_targets = true;
}

// Responsible for drawing the input area
function drawInputArea()
{
  fill(color(900, 900, 900, 50));
  setLineDash([0,0]);
  stroke(color(220,220,220));
  strokeWeight(2);
  
  rect(inputArea.x, inputArea.y, inputArea.w, inputArea.h);
}
