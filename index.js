'use strict';

var dav = require('dav');
//var ICAL = require('ical.js');
var ical2json = require('ical2json');

var summary = require('./services/icalSummary');


module.exports =  {


    debug : true,

    mode : null,

    default_mode : { 
    				// API MODE PROPERTIES
                    apitype : null,
                    urlbase : null,
                    urlpath : null,
	        		port : 80,

	        		// REQUEST
                    search_phrase : null,
                    context : null,
                    identity : null,

                    // RESULT : ITEMS
                    items : [],
                    // RESULT : MODEL
                    models : [],

                    schemas : []
                },


    alterMode(mode){
        if(this.mode){
            this.mode = Object.assign(this.mode, mode);
        }else{
            this.mode = mode;
        }
        if(this.debug) console.log("MODE ALTERED TO : ", this.mode);
        return this.mode;
    },
    setMode(mode){
        this.mode = mode;
        if(this.debug) console.log("MODE SET AS : ", this.mode);
    },	
    getMode(){
    	return this.mode;
    },

    requireModePropertiesOrError(arr){
        if(this.debug)  console.log("requireModePropertiesOrError");
    	var mode = this.getMode();
    	var missing = [];
    	for(var i=0; i<arr.length; i++){
    		if(!mode.hasOwnProperty(arr[i]) || mode[arr[i]]===null ){
    			missing.push(arr[i]);
    		}
    	}
    	if(missing.length>0){
            //throw "ERROR : MODE IS MISSING PROPS : " + missing;
    		console.log("ERROR : MODE IS MISSING PROPS : ",missing);
            //throw "ERROR : MODE IS MISSING PROPS : " + missing;
    		return false
    	}


    	return true;
    },


    getItems(mode=null) {
    	var self = this;
    	if(mode) this.setMode(mode)
    	mode = this.getMode();
    	//------------------------

    	if(!this.requireModePropertiesOrError(['username','password','urlbase','urlpath','port','apitype'])){
            throw "ERROR : MISSING PROPERTIES";
    	}

        if(this.debug)  console.log("getItems");

        return this.populateItems(mode,mode.items);

	
    },

    getItem(mode=null) {
    	if(mode) this.setMode(mode)
    	mode = this.getMode();
    	//------------------------

    	if(!this.requireModePropertiesOrError(['username','password','urlbase','urlpath','port','apitype','identity'])){
    		throw "ERROR : MISSING PROPERTIES";
    	}

        if(this.debug)  console.log("getItem");
        
        return this.populateItems(mode,mode.models);


    },


    populateItems(mode,destiation_arr){
    	var self = this;
        return new Promise(function(resolve, reject) {
	    	try{

		    	var xhr = new dav.transport.Basic(
					new dav.Credentials({
					  username: mode.username,
					  password: mode.password
					})
				);
		    	//-------------------------------
		    	var accountProps = {
					server: mode.urlbase + mode.urlpath,
					xhr: xhr,
					loadObjects: true,
					accountType: mode.apitype
				};
				var filters = self.getFiltersFromMode(mode);
				if(filters) accountProps['filters'] = filters;
				//-------------------------------
				//dav.debug.enabled = true;
				dav.createAccount(accountProps).then(function(account) {

	                // ADD ITEMS PROPERTY IF IT DOESNT EXIST
	                if(!mode.hasOwnProperty('items')){
	                    mode['items'] = [];
	                }else{
	                    mode.items.length = 0; // TO EMPTY THE ARRAY
	                }

	                var results = [];
	                if(mode.apitype==="caldav"){
	                	results = self.getCalDavObjects(account,mode);
	                }else if(mode.apitype==="carddav"){
	                	results = self.getCardDavObjects(account,mode);
	                }
	                //PUSH RESULTS TO DESTINATION ARRAY
	                destiation_arr.push(...results);

	                resolve();
	            }, function(err) {
	            	console.log("ERROR MSG : ",err.message);
	                reject();
	            });
	    	}catch(err){
	    		console.log("ERROR : ",err.message);
	    		reject();
	    	}
        });
    },


    getFiltersFromMode(mode){

    	if(mode.hasOwnProperty('identity')){

			return [{
				type: 'comp-filter',
				attrs: { name: 'VCALENDAR' },
				children: [{
				  type: 'comp-filter',
				  attrs: { name: 'VEVENT' },
				  children: [{
				    type: 'prop-filter',
				    attrs: { name: 'UID' },
				    children: [{
				      type: 'text-match',
				      value: mode.identity
				  	}]
				   }]

				}]
			}]

    	}

    	//return null;
    	/*
		return [{
			type: 'comp-filter',
			attrs: { name: 'VCALENDAR' },
			children: [{
			  type: 'comp-filter',
			  attrs: { name: 'VEVENT' },
			  children: [{
			    type: 'time-range',
			    attrs: { start: '20190801T000000Z', end : '20190810T000000Z' }
			  }]
			}]
		}]
		*/

		
    },

    getCalDavObjects(account,mode){
    	var calendarobjects = [];

		var calendars = account.calendars;
        //console.log("-------------------------------");
        //console.log("CAL LEN:",calendars.length);
		for(var i=0; i<calendars.length; i++){
			let calendar = calendars[i];
			let objects = calendar.objects;

			// GET THE CALENDAR DIAPLAY NAME
			var calendarDisplayName = "";
			if(calendar.hasOwnProperty('data')) calendarDisplayName = calendar.data.props.displayname;
			

			console.log(calendar);
            //console.log("-------------------------------");
            //console.log("OBJ LEN:",objects.length);
			for(var y=0; y<objects.length; y++){
				let object = objects[y];
				if(object.hasOwnProperty('data')){

					//---------------------
					//ical to json method 1
					//var ics = objects[y].data.props.calendarData;
					//var jCal = ICAL.parse(ics);
					//var output = new ICAL.Component(jCal);

					//---------------------
					//ical to json method 2
					var output = ical2json.convert(objects[y].data.props.calendarData);
					
					//add the display name
			        output['calendar_name'] = calendarDisplayName

					//console.log("OUTPUT:",output);
					//console.log("OUTPUT:",output.VCALENDAR[0].VEVENT[0]);

					calendarobjects.push(output);

				}
			}
		}

		//----------------------------
		// CHOOSE TO PUSH EITHER (1) the raw data (2) the json object (3) the summary
		var summaries = summary.summary(calendarobjects);
		return summaries;

		//mode.items.push(...summaries);  

    },

    getCardDavObjects(account,mode){
    	var cardobjects = [];

		var addressbooks = account.addressBooks;

        //console.log("-------------------------------");
        //console.log("ADD LEN:",addressbooks.length);
		for(var i=0; i<addressbooks.length; i++){
			let addressbook = addressbooks[i];
			let objects = addressbook.objects;

            //console.log("-------------------------------");
            //console.log("OBJ LEN:",objects.length);
			for(var y=0; y<objects.length; y++){
				let object = objects[y];
				if(object.hasOwnProperty('data')){
					//console.log(objects[y].data);
					cardobjects.push(objects[y].data.props);  
				}
			}
		}
		return cardobjects;
    }


}
