var expect = require('chai').expect;
var jssim = require('../src/jssim');

describe('L-System', function(){
   it('should generate the fractal plant', function(){
        var Pen = function(x, y, angle) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.init_x = x;
            this.init_y = y;
            this.init_angle = angle;
            this.stack = new jssim.Stack();
            this.canvas = new jssim.Space2D();
            this.commands = new jssim.Queue();
        };

        Pen.prototype.reset = function () {
            this.x = this.init_x;
            this.y = this.init_y;
            this.angle = this.init_angle;
            this.canvas.reset();
            this.stack.clear();
            this.commands.clear();
        };

        Pen.prototype.saveState = function () {
            this.stack.push(new Pen(this.x, this.y, this.angle));
        };

        Pen.prototype.loadState = function () {
            var oldState = this.stack.pop();
            this.x = oldState.x;
            this.y = oldState.y;
            this.angle = oldState.angle;
        };

        Pen.prototype.rotateLeft = function (angle) {
            this.angle += angle;  
        };

        Pen.prototype.rotateRight = function (angle) {
            this.angle -= angle;  
        };

        Pen.prototype.pushCommand = function(symbol) {
            this.commands.enqueue(symbol);
        };

        Pen.prototype.popCommand = function(symbol) {
            return this.commands.dequeue();  
        };

        Pen.prototype.drawForward = function (stride) {
            var rad = this.angle * Math.PI / 180;
            var dx = Math.cos(rad) * stride;
            var dy = Math.sin(rad) * stride;
            var oldX = this.x;
            var oldY = this.y;
            this.x += dx;
            this.y += dy;
            this.canvas.drawLine(oldX, oldY, this.x, this.y);
        };

        Pen.prototype.hasMoreCommands = function () {
            return !this.commands.isEmpty();
        };

        Pen.prototype.clearCanvas = function () {
            this.canvas.clearLines();
        };

        var Turtle = function(scheduler, pen) {
            jssim.SimEvent.call(this);
            this.scheduler = scheduler;
            this.pen = pen;
            this.angle = 25;
            this.stride = 1;
        };
        Turtle.prototype = Object.create(jssim.SimEvent.prototype);
        Turtle.prototype.update = function(deltaTime){
            // (X → F[−X][X]F[−X]+FX), (F → FF)
            var rules = '';


            while(this.pen.hasMoreCommands()){
                var symbol = this.pen.popCommand();

                var rule = '';
                if(symbol == 'X') {
                    rule = 'F[−X][X]F[−X]+FX';
                } else if(symbol == 'F'){
                    rule = 'FF';
                } else {
                    rule = symbol;
                }

                rules += rule;
            }

            this.pen.reset();
            for(var i = 0; i < rules.length; ++i) {
                var symbol = rules[i];
                if(symbol == 'F') {
                  this.pen.drawForward(this.stride);
                } else if(symbol == '[') {
                    this.pen.saveState();
                } else if(symbol == ']') {
                    this.pen.loadState();
                } else if(symbol == '-') {
                    this.pen.rotateLeft(this.angle);
                } else if(symbol == '+') {
                    this.pen.rotateRight(this.angle);
                }
                pen.pushCommand(rules[i]);
            }

            //console.log('state at time ' + this.time + ': ' + rules);
        };

        var scheduler = new jssim.Scheduler();
        var pen = new Pen(10, 0, 60);
        var turtle = new Turtle(scheduler, pen);
        turtle.stride = 5;


        scheduler.reset(); 
        pen.reset();

        pen.pushCommand('X');
        scheduler.scheduleRepeatingIn(turtle, 1);

       
        while(scheduler.hasEvents() && scheduler.current_time < 3) {
            scheduler.update();
        }
        
        
       
       
   });
});