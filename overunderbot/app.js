/** Andrew Huynh Midterm 1 */
var express = require("express");
var bodyParser = require("body-parser");
var twilio = require("twilio");

var app = express();

var CurrRoomKey = 'room0';
var CurrRoomIndex = 0;

app.use(bodyParser.urlencoded({extended:true}));

app.set("port", 5100);

var oPlayers = {};

app.use(express.static('www'));

function Game(){
    this.Player = null;
    this.GameTurn = "Player"
    this.fCurstate = this.fWelcoming;

    this.Dungeon = new Dungeon();  
    
    
    this.fWelcoming = function(req, twiml){
        twiml.message("Welcome to the Crawler. 1 for New Game | 2 for Load Game");
        this.fCurstate = this.fAskInput; 
    }

    this.fAskInput = function(req, twiml){
        if (req.body.Body == 1 && this.Player == null){
            twiml.message("Enter a new name to play: ");
            this.fCurstate = this.fNewUser;
        }
    }

    this.fNewUser = function(req, twiml){
        this.Player = req.body.Body;
        twiml.message("Welcome " + this.Player + " to Crawler. Send anything to start.");
        this.fCurstate = this.fStartGame;
    }

    this.fStartGame = function(req, twiml){
        twiml.message("Hello " + this.Player + ". You've arrived in a room, what would you like to do? 1. Look for an exit 2. Look for monsters.");
        this.fCurstate = this.fQuestionMaster;
    }    

    this.fQuestionMaster = function(req, twiml){
        this.CurrRoom = this.Dungeon.listDungeonRooms[CurrRoomIndex];
        if (req.body.Body == 1 && CurrRoomIndex < 4){
            twiml.message("You find a "+this.CurrRoom[CurrRoomKey].door + " coloured door. 1. Enter it 2. Do something else");
            this.fCurstate = this.DoorScenario;
        }
        else if (req.body.Body == 1 && CurrRoomIndex == 4){
            twiml.message("There are no doors. 2. Look for monsters.");            
        }
        else if (req.body.Body == 2){
            twiml.message("You find monsters");
        }
        else if (req.body.Body == 3){
            twiml.message("You find a single chest");
        }
        else {
            twiml.message("Use numbers to enter an action.");
        }
    }

    this.DoorScenario = function(req, twiml){
        if (req.body.Body == 1){
            twiml.message("You open the door. Send anything to continue.");
            CurrRoomIndex++;
            CurrRoomKey = NewRoom(CurrRoomIndex);
            this.fCurstate = this.fStartGame;
        }
        else {
            this.fCurstate = this.fStartGame;
        }
    }

    this.fCurstate = this.fWelcoming;
}

function NewRoom(index){
    return 'room' + index;
}

/* DUNGEON CLASS */
function Dungeon(){
    this.listDungeonRooms = [
        {room0: new DungeonRoom("blue")},
        {room1: new DungeonRoom("yellow")},
        {room2: new DungeonRoom("green")},
        {room3: new DungeonRoom("purple")}
    ];
}

/* DUNGEON ROOM CLASS */
function DungeonRoom(colour){
    this.door = colour;
    this.listMonsters = [
        {monster0: new Monster("Skeleton", 5)},
        {monster1: new Monster("Goblin", 3)},
        {monster2: new Monster("Annoying Bat", 2)}
    ];
}

/* MONSTER CLASS */
function Monster(name, hitpoints) {
    this.name = name;
    this.hitpoints = hitpoints;
    this.attack = Math.ceil(Math.random() * 2);
}

Monster.prototype.attack = function(){
    return this.attack;
}

/*###############*/

/* PLAYER CLASS */
function Player(){
    this.name = "";
    this.hitpoints = 20;
    this.attack = Math.ceil(Math.random()*7);
}

function NewNumber(difficulty){
    if (difficulty == 0) {
        return (Math.ceil(Math.random() * 9));        
    }
    else if (difficulty == 1) {
        return (Math.ceil(Math.random() * 99));
    }
    else {
        return (Math.ceil(Math.random() * 999));
    }
}

function QuestionBuilder(n,m){
    return ("What is: " + n + " + " + m + " ?");
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