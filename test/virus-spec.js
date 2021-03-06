var expect = require('chai').expect;
var jssim = require('../src/jssim');

describe('Virus simulation', function(){
   it('should simulate virus infectino and curing', function(){
        var XMIN = 0;
        var XMAX = 800;
        var YMIN = 0;
        var YMAX = 600;

        var DIAMETER = 8;

        var HEALING_DISTANCE = 20;
        var HEALING_DISTANCE_SQUARED = HEALING_DISTANCE * HEALING_DISTANCE;
        var INFECTION_DISTANCE = 20;
        var INFECTION_DISTANCE_SQUARED = INFECTION_DISTANCE * INFECTION_DISTANCE;

        var NUM_HUMANS = 100;
        var NUM_GOODS = 4;
        var NUM_EVILS = 4;

        var Evil = function(id, loc, space) {
            jssim.SimEvent.call(this);
            this.id = id;
            this.agentLocation = loc;
            this.color = '#ff0000';
            this.desiredLocation = null;
            this.suggestedLocation = null;
            this.steps = 0;  
            this.space = space;
            space.updateAgent(this, loc.x, loc.y);
            this.type = 'Evil';
            this.greedy = false;
        };

        Evil.prototype = Object.create(jssim.SimEvent.prototype);

        Evil.prototype.update = function(deltaTime) {
            var mysteriousObjects = this.space.getNeighborsWithinDistance(this.agentLocation, 10.0 * INFECTION_DISTANCE);

            var distance2DesiredLocation = 1000000;
            for(var i = 0 ; i < mysteriousObjects.length ; i++ )
            {
                if(mysteriousObjects[i] != this )
                {
                    if(mysteriousObjects[i].type != 'Human') continue;
                    var ta = mysteriousObjects[i];
                    if(ta.isInfected()) continue;
                    if(withinInfectionDistance(this.agentLocation, ta.agentLocation))
                        ta.setInfected( true );
                    else
                    {
                        if(this.greedy)
                        {
                            var tmpDist = distanceSquared(this.agentLocation, ta.agentLocation);
                            if(tmpDist <  distance2DesiredLocation )
                            {
                                this.desiredLocation = ta.agentLocation;
                                distance2DesiredLocation = tmpDist;
                            }
                        }
                    }
                }
            }


            this.steps--;
            if( this.desiredLocation == null || !this.greedy )
            {
                if(this.steps <= 0 )
                {
                    this.suggestedLocation = new jssim.Vector2D((Math.random()-0.5)*((XMAX-XMIN)/5-DIAMETER) + this.agentLocation.x,
                        (Math.random()-0.5)*((YMAX-YMIN)/5-DIAMETER) + this.agentLocation.y);
                    this.steps = 100;
                }
                this.desiredLocation = this.suggestedLocation;
            }

            var dx = this.desiredLocation.x - this.agentLocation.x;
            var dy = this.desiredLocation.y - this.agentLocation.y;

            var temp = 0.5 * Math.sqrt(dx*dx+dy*dy);
            if( temp < 1 )
            {
                this.steps = 0;
            }
            else
            {
                dx /= temp;
                dy /= temp;
            }


            if( !acceptablePosition(this, new jssim.Vector2D(this.agentLocation.x + dx, this.agentLocation.y + dy), this.space) )
            {
                this.steps = 0;
            }
            else
            {
                this.agentLocation = new jssim.Vector2D(this.agentLocation.x + dx, this.agentLocation.y + dy);
                space.updateAgent(this, this.agentLocation.x, this.agentLocation.y);
            }
        };

        var Good = function(id, loc, space) {
            jssim.SimEvent.call(this);
            this.id = id;
            this.agentLocation = loc;
            this.color = '#00ff00';
            this.desiredLocation = null;
            this.suggestedLocation = null;
            this.steps = 0;  
            this.space = space;
            space.updateAgent(this, loc.x, loc.y);
            this.type = 'Good';
            this.greedy = true;
        };

        Good.prototype = Object.create(jssim.SimEvent.prototype);

        Good.prototype.update = function(deltaTime) {
            var mysteriousObjects = this.space.getNeighborsWithinDistance(this.agentLocation, 10.0 * INFECTION_DISTANCE);

            var distance2DesiredLocation = 1000000;
            for(var i = 0 ; i < mysteriousObjects.length ; i++ )
            {
                if(mysteriousObjects[i] != this )
                {
                    if(mysteriousObjects[i].type != 'Human') continue;
                    var ta = mysteriousObjects[i];
                    if(!ta.isInfected()) continue;
                    if(withinHealingDistance(this.agentLocation, ta.agentLocation))
                        ta.setInfected(false);
                    else
                    {
                        if(this.greedy)
                        {
                            var tmpDist = distanceSquared(this.agentLocation, ta.agentLocation);
                            if(tmpDist <  distance2DesiredLocation )
                            {
                                this.desiredLocation = ta.agentLocation;
                                distance2DesiredLocation = tmpDist;
                            }
                        }
                    }
                }
            }


            this.steps--;
            if( this.desiredLocation == null || !this.greedy )
            {
                if(this.steps <= 0 )
                {
                    this.suggestedLocation = new jssim.Vector2D((Math.random()-0.5)*((XMAX-XMIN)/5-DIAMETER) + this.agentLocation.x,
                        (Math.random()-0.5)*((YMAX-YMIN)/5-DIAMETER) + this.agentLocation.y);
                    this.steps = 100;
                }
                this.desiredLocation = this.suggestedLocation;
            }

            var dx = this.desiredLocation.x - this.agentLocation.x;
            var dy = this.desiredLocation.y - this.agentLocation.y;

            var temp = 0.5 * Math.sqrt(dx*dx+dy*dy);
            if( temp < 1 )
            {
                this.steps = 0;
            }
            else
            {
                dx /= temp;
                dy /= temp;
            }


            if( !acceptablePosition(this, new jssim.Vector2D(this.agentLocation.x + dx, this.agentLocation.y + dy), this.space))
            {
                this.steps = 0;
            }
            else
            {
                this.agentLocation = new jssim.Vector2D(this.agentLocation.x + dx, this.agentLocation.y + dy);
                space.updateAgent(this, this.agentLocation.x, this.agentLocation.y);
            }
        };

        var Human = function(id, loc, space) {
            jssim.SimEvent.call(this);
            this.id = id;
            this.agentLocation = loc;
            this.color = '#ff8800';
            this.desiredLocation = null;
            this.suggestedLocation = null;
            this.steps = 0;  
            this.space = space;
            space.updateAgent(this, loc.x, loc.y);
            this.type = 'Human';
            this.infected = false;
        };

        Human.prototype = Object.create(jssim.SimEvent.prototype);

        Human.prototype.setInfected = function(infected) {
            this.infected = infected;
            if(infected){
                this.color = '#5533ff';
            } else {
                this.color = '#ff8800';
            }
        };

        Human.prototype.isInfected = function() {
            return this.infected;
        };

        Human.prototype.update = function(deltaTime) {
            this.steps--;
            if( this.desiredLocation == null || this.steps <= 0 )
            {
                this.desiredLocation = new jssim.Vector2D((Math.random()-0.5)*((XMAX-XMIN)/5-DIAMETER) + this.agentLocation.x,
                    (Math.random()-0.5)*((YMAX-YMIN)/5-DIAMETER) + this.agentLocation.y);
                this.steps = 50 + Math.floor(Math.random() * 50);
            }

            var dx = this.desiredLocation.x - this.agentLocation.x;
            var dy = this.desiredLocation.y - this.agentLocation.y;


            var temp = Math.sqrt(dx*dx+dy*dy);
            if( temp < 1 )
            {
                this.steps = 0;
            }
            else
            {
                dx /= temp;
                dy /= temp;
            }


            if( ! acceptablePosition(this, new jssim.Vector2D(this.agentLocation.x + dx, this.agentLocation.y + dy ), this.space) )
            {
                steps = 0;
            }
            else
            {
                this.agentLocation = new jssim.Vector2D(this.agentLocation.x + dx, this.agentLocation.y + dy);
                this.space.updateAgent(this, this.agentLocation.x, this.agentLocation.y);
            }  
        };



        function distanceSquared(loc1, loc2)
        {
            return( (loc1.x-loc2.x)*(loc1.x-loc2.x)+(loc1.y-loc2.y)*(loc1.y-loc2.y) );
        }

        function conflict(a, b)
        {
            if( ( ( a.x > b.x && a.x < b.x+DIAMETER ) ||
                    ( a.x+DIAMETER > b.x && a.x+DIAMETER < b.x+DIAMETER ) ) &&
                    ( ( a.y > b.y && a.y < b.y+DIAMETER ) ||
                    ( a.y+DIAMETER > b.y && a.y+DIAMETER < b.y+DIAMETER ) ) )
            {
                return true;
            }
            return false;
        }

        function withinInfectionDistance(a, b)
        {
            return ( (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y) <= INFECTION_DISTANCE_SQUARED );
        }

        function withinHealingDistance(a, b )
        {
            return ( (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y) <= HEALING_DISTANCE_SQUARED );
        }

        function acceptablePosition(agent, location, space)
        {
            if( location.x < DIAMETER/2 || location.x > (XMAX-XMIN)-DIAMETER/2 ||
                location.y < DIAMETER/2 || location.y > (YMAX-YMIN)-DIAMETER/2 )
                return false;
            var mysteriousObjects = space.getNeighborsWithinDistance( location, 2*DIAMETER );
            for(var i = 0 ; i < mysteriousObjects.length ; i++ )
            {
                if(mysteriousObjects[i] != agent)
                {
                    var ta = mysteriousObjects[i];
                    if(conflict(location, space.getLocation(ta.id))) return false;
                }
            }
            return true;
        }


        var scheduler = new jssim.Scheduler();

        var space = new jssim.Space2D();


        function reset() {
            scheduler.reset(); 
            space.reset();

            for(var x=0;x<NUM_HUMANS+NUM_GOODS+NUM_EVILS;x++) {
                var dx = Math.floor(Math.random() * 10) - 5;
                var dy = Math.floor(Math.random() * 10) - 5;

                var loc = null;
                var agent = null;
                var times = 0;
                while(loc == null || !acceptablePosition(agent, loc, space))
                {
                    loc = new jssim.Vector2D(Math.random()*(XMAX-XMIN-DIAMETER)+XMIN+DIAMETER/2,
                        Math.random()*(YMAX-YMIN-DIAMETER)+YMIN+DIAMETER/2 );
                    if( x < NUM_HUMANS )
                        agent = new Human( "Human"+x, loc, space);
                    else if( x < NUM_HUMANS+NUM_GOODS ) {
                        agent = new Good( "Good"+(x-NUM_HUMANS), loc, space);
                        agent.greedy = Math.random() < 0.5;
                    }
                    else {
                        agent = new Evil( "Evil"+(x-NUM_HUMANS-NUM_GOODS), loc, space);
                        agent.greedy = Math.random() < 0.5;
                    }
                    times++;
                    if( times == 1000 )
                    {
                        break;
                    }
                };
                scheduler.scheduleRepeatingIn(agent, 1);
            }
        }

        reset();
       
        while (scheduler.current_time < 2) {
           scheduler.update();
        }

   }) ;
});