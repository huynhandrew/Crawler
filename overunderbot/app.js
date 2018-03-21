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
    this.Player;

    this.fWelcoming = function(req, twiml){
        twiml.message("Welcome to the Crawler. 1 for New Game 2 for Load Game");
        this.fCurstate = this.fMenu;    
    }

    this.fGuessing2 = function(req, twiml){
        twiml.message("Combat Engaged!");        
    }

    this.fGuessing = function(req, twiml){

        this.sum = this.first + this.second;
        this.nGuesses++;

        if(req.body.Body == this.sum){
            this.nCorrect++;
            this.nGuesses = 0;
            this.nIncorrect = 0;
            
            this.first = NewNumber(this.difficulty);
            this.second = NewNumber(this.difficulty);
            twiml.message("You are correct! What is: " +  QuestionBuilder(this.first,this.second));
        }
        else {
            this.nIncorrect++;
            if (this.nIncorrect == 2){
                this.nIncorrect = 0;
                twiml.message("The correct answer was: " + this.first + this.second);

                this.first = NewNumber(this.difficulty);
                this.second = NewNumber(this.difficulty);
                twiml.message("Lets try another question, what is: " +  QuestionBuilder(this.first,this.second));                            
            }
            else {
                this.first = NewNumber(this.difficulty);
                this.second = NewNumber(this.difficulty);
                twiml.message("You are incorrect. Try another question: " + QuestionBuilder(this.first,this.second));                
            }
        }

        if (this.nCorrect == 4){
            this.difficulty = 1;
        }
        if (this.nCorrect == 9){
            this.difficulty = 2;
        }
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