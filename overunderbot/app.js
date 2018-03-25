/** Andrew Huynh Midterm 1 */
var express = require("express");
var bodyParser = require("body-parser");
var twilio = require("twilio");
var app = express();

var listOfMonsters = ["Skeleton","Goblin","Annoying Bat"];
var listOfPlayerNames = ["Harrison Butterscotch","Richard, King of the Andals, the Rhoynar of the First Men, Knight of the 7 Mountains, Guardian of the 5th Sea, Judicator of the 3rd eye","Glimb Gnomewick","Big Bertha"]
var CurrRoomKey = 'room0';
var CurrRoomIndex = 0;

app.use(bodyParser.urlencoded({extended:true}));

app.set("port", 5100);

var oPlayers = {};

var rand = Math.floor(Math.random()*4);

app.use(express.static('www'));

function Game(){

    this.PlayerState = new Player();
    this.MonsterState = null;
    this.GameTurn = "Player"
    this.fCurstate = this.fWelcoming;

    this.Dungeon = new Dungeon();  
    
    
    this.fWelcoming = function(req, twiml){
        twiml.message("Welcome to the Crawler. 1 for New Game");
        this.fCurstate = this.fAskInput; 
    }

    this.fAskInput = function(req, twiml){
        if (req.body.Body == 1 && this.PlayerState.name == ""){
            twiml.message("Enter a new name to play or Press enter for a random name.");
            this.fCurstate = this.fNewUser;
        }
        else {
            this.fCurstate = this.fAskInput;
        }
    }

    this.fNewUser = function(req, twiml){
        if (req.body.Body == ""){
            this.PlayerState.name = listOfPlayerNames[rand];
        }
        else {
            this.PlayerState.name = req.body.Body;
        }
        twiml.message("Welcome " + this.PlayerState.name + " to Crawler. Send anything to start.");
        this.fCurstate = this.fStartGame;
    }

    this.fStartGame = function(req, twiml){
        twiml.message(this.PlayerState.name + ", What would you like to do? 1. Look for an exit 2. Look for monsters.");
        this.fCurstate = this.fQuestionMaster;
    }    

    this.fQuestionMaster = function(req, twiml){
        this.CurrRoom = this.Dungeon.listDungeonRooms[CurrRoomIndex];
        if (req.body.Body == 1 && CurrRoomIndex < 4){
            twiml.message(this.PlayerState.name + " find a "+this.CurrRoom[CurrRoomKey].door + " coloured door | 1. Enter it | 2. Do something else");
            this.fCurstate = this.DoorScenario;
        }
        else if (req.body.Body == 1 && CurrRoomIndex == 4){
            twiml.message("There are no doors. 2. Look for monsters.");            
        }
        else if (req.body.Body == 2){
            twiml.message(this.PlayerState.name + " encounters a monster! | 1. To engage. | 2. Do something else.");
            this.fCurstate = this.MonsterScenario;
        }
        else if (req.body.Body == 3){
            twiml.message(this.PlayerState.name + " finds a single chest");
        }
        else {
            twiml.message("Use numbers to enter an action. | 1. Enter it | 2. Do something else");
        }
    }

    this.DoorScenario = function(req, twiml){
        if (req.body.Body == 1){
            twiml.message(this.PlayerState.name + " opens the door. Send anything to continue.");
            CurrRoomIndex++;
            CurrRoomKey = NewRoom(CurrRoomIndex);
            this.fCurstate = this.fStartGame;
        }
        else {
            twiml.message(this.PlayerState.name + " decides not to open the door. Send anything to continue.");            
            this.fCurstate = this.fStartGame;
        }
    }

    this.MonsterScenario = function(req, twiml){
        if (req.body.Body == 1){
            twiml.message(this.PlayerState.name + " engages in combat! Send anything to begin combat.");

            this.MonsterState = new Monster(listOfMonsters[Math.floor(Math.random()*2)]);
            this.fCurstate = this.CombatTransition;
        }
        else {
            twiml.message(this.PlayerState.name + " decides not to engage. Send anything to continue.");                        
            this.fCurstate = this.fStartGame;
        }
    }

    this.CombatTransition = function(req, twiml) {
        twiml.message(this.PlayerState.name + " HP: " 
                    + this.PlayerState.hitpoints + " vs. " 
                    + this.MonsterState.name + " HP: " 
                    + this.MonsterState.hitpoints 
                    + "| 1. Attack | 2. Run away!");
        this.fCurstate = this.CombatEngaged;
    } 

    this.CombatEngaged = function(req, twiml){
        
        if (req.body.Body == 1){
            this.pAttack = this.PlayerState.attackModifier + Math.floor(Math.random()*7);
            this.mAttack = this.MonsterState.attackModifier + Math.floor(Math.random()*3);
            this.MonsterState.hitpoints -= this.pAttack;

            if (this.MonsterState.hitpoints <= 0) {
                twiml.message(this.MonsterState.name + " has been slain! Send anything to return to disengage.");
                this.fCurstate = this.fStartGame;
            }
            else {
                this.PlayerState.hitpoints -= this.mAttack;
                twiml.message(this.PlayerState.name + " hits " + this.pAttack 
                                + " against " + this.MonsterState.name + " with " 
                                + this.MonsterState.hitpoints + " HP remaining, it strikes back with " + this.mAttack + " damage!" 
                                + this.PlayerState.name + " has " + this.PlayerState.hitpoints 
                                + " remaining | 1. Attack again! | 2. Retreat!");                
            }
        }
        else if (req.body.Body == 2){
            twiml.message(this.PlayerState.name + " has retreated from combat. Enter anything to disengage.");
            this.fCurstate = this.fStartGame;
        }
        else {
            twiml.message("You are in combat. | 1. To attack | 2. To retreat")
        }
    }
    this.fCurstate = this.fWelcoming;
}

function NewRoom(index){
    return 'room' + index;
}

/* DUNGEON OBJECT */
function Dungeon(){
    this.listDungeonRooms = [
        {room0: new DungeonRoom("blue")},
        {room1: new DungeonRoom("yellow")},
        {room2: new DungeonRoom("green")},
        {room3: new DungeonRoom("purple")}
    ];
}

/* DUNGEON ROOM OBJECT */
function DungeonRoom(colour){
    this.door = colour;
}

/* MONSTER OBJECT */
function Monster(name){
    this.name = name;
    this.hitpoints = 15;
    this.attackModifier = 0;
}

/* PLAYER OBJECT */
function Player(){
    this.name = "";
    this.hitpoints = 50;
    this.attackModifier = 3;
}

app.post('/sms', function(req, res){
    var sFrom = req.body.From;
    if(!oPlayers.hasOwnProperty(sFrom)){
        oPlayers[sFrom] = new Game();
    }
    var twiml = new twilio.twiml.MessagingResponse();
    res.writeHead(200, {'Content-Type': 'text/xml'});
    oPlayers[sFrom].fCurstate(req, twiml);
    var sMessage = twiml.toString();
    res.end(sMessage);
});

var server = app.listen(app.get("port"), function(){
    console.log("Javascript is rocking on port " + app.get("port"));
});