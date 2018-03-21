/** Andrew Huynh Midterm 1 */
var express = require("express");
var bodyParser = require("body-parser");
var twilio = require("twilio");

var app = express();


app.use(bodyParser.urlencoded({extended:true}));

app.set("port", 5100);

var oPlayers = {};

app.use(express.static('www'));

function Game(){
    this.Player = null;
    this.GameTurn = "Player"
    this.fCurstate = this.fWelcoming;
    
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
        twiml.message("Welcome " + this.Player + " to Crawler. Enter Begin to start.");
        this.fCurstate = this.fStartGame;
    }

    this.fStartGame = function(req, twiml){
        this.room = "";
        
    }    
    this.fCurstate = this.fWelcoming;
}

function Monster() {
    this.name = "Monster";
    this.hitpoints = 10;
    this.attack = Math.ceil(Math.random() * 2);
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