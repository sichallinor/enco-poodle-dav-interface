

var moment = require('moment');

module.exports = {


	summary(vCalFileObjects){

		//console.log("About to parse");
		//console.log(vCalFileObjects);

		const dateFormat = /^\d{4}\d{2}\d{2}T\d{2}\d{2}\d{2}/;
		const reqFormat = 'YYYY-MM-DDTHH:mm:ss';

		var summaries = [];


      	var len_vCalFileObjects = vCalFileObjects.length;
      	for (var i = 0; i < len_vCalFileObjects; i++) {
      		var vCalFileObject = vCalFileObjects[i];
      		//console.log("obj type 1 : ");
      		//console.log(vCalFileObject);

			if('VCALENDAR' in vCalFileObject) {
				var vCalObjects = vCalFileObject['VCALENDAR'];
  				//console.log("obj type 2 : ");
  				//console.log(vCalObjects);

				var len_vCalObjects = vCalObjects.length;
      			for (var y = 0; y < len_vCalObjects; y++) {
      				var vCalObject = vCalObjects[y];
      				//console.log("obj type 3 : ");
      				//console.log(vCalObject);

					if('VTODO' in vCalObject) {
						var vTodoObjects = vCalObject['VTODO'];
      					//console.log("obj type 4 : ");
      					//console.log(vTodoObjects);


						var len_vTodoObjects = vTodoObjects.length;
		      			for (var m = 0; m < len_vTodoObjects; m++) {
		      				var vTodo = vTodoObjects[m];
		      				//console.log("obj type 5 : ");
		      				//console.log(vTodo);

		      				//!!!!!!!!!!!!
		      				/// working here  ... see below
							var uid = "";
							var summary = "";
							var dtstart = "";
							var dtend = "";
							if('SUMMARY' in vTodo) summary = vTodo['SUMMARY'];
							if('UID' in vTodo) uid = vTodo['UID'];
			

							for(prop in vEvent){
								if(prop.startsWith('DTSTART')) dtstart = this.formatDate(vEvent[prop],dateFormat,reqFormat);
								if(prop.startsWith('DTEND')) dtend = this.formatDate(vEvent[prop],dateFormat,reqFormat);
							}

							/*
							if('DTSTART' in vTodo) dtstart = this.formatDate(vTodo['DTSTART'],dateFormat,reqFormat);
							if('DTEND' in vTodo) dtend = this.formatDate(vTodo['DTEND'],dateFormat,reqFormat);
							if('DTSTART;VALUE=DATE' in vTodo) dtstart = this.formatDate(vTodo['DTSTART;VALUE=DATE'],dateFormat,reqFormat);
							if('DTEND;VALUE=DATE' in vTodo) dtend = this.formatDate(vTodo['DTEND;VALUE=DATE'],dateFormat,reqFormat); 
							*/

							
							var summaryObj = { "uid": uid , "summary": summary, "dtstart": dtstart, "dtend": dtend, "calendar": vCalFileObject.calendar_name  };
							summaries.push(summaryObj);

							//console.log("VTODO: ("+uid+") "+summary);
					

					      		
						}

					}

					if('VEVENT' in vCalObject) {
						var vEventObjects = vCalObject['VEVENT'];
      					//console.log("obj type 4 : ");
      					//console.log(vTodoObjects);


						var len_vEventObjects = vEventObjects.length;
		      			for (var m = 0; m < len_vEventObjects; m++) {
		      				var vEvent = vEventObjects[m];
		      				//console.log("obj type 5 : ");
		      				//console.log(vTodo);


							var uid = "";
							var summary = "";
							var dtstart = "";
							var dtend = "";
							if('SUMMARY' in vEvent) summary = vEvent['SUMMARY'];
							if('UID' in vEvent) uid = vEvent['UID'];

							for(prop in vEvent){
								if(prop.startsWith('DTSTART')) dtstart = this.formatDate(vEvent[prop],dateFormat,reqFormat);
								if(prop.startsWith('DTEND')) dtend = this.formatDate(vEvent[prop],dateFormat,reqFormat);
							}

							/*
							if('DTSTART' in vEvent) dtstart = this.formatDate(vEvent['DTSTART'],dateFormat,reqFormat);
							if('DTEND' in vEvent) dtend = this.formatDate(vEvent['DTEND'],dateFormat,reqFormat);
							if('DTSTART;VALUE=DATE' in vEvent) dtstart = this.formatDate(vEvent['DTSTART;VALUE=DATE'],dateFormat,reqFormat);
							if('DTEND;VALUE=DATE' in vEvent) dtend = this.formatDate(vEvent['DTEND;VALUE=DATE'],dateFormat,reqFormat); 
							*/


							var summaryObj = { "uid": uid , "summary": summary, "dtstart": dtstart, "dtend": dtend, "calendar": vCalFileObject.calendar_name  };
							summaries.push(summaryObj);

							//console.log("VEVENT: ("+uid+") "+summary);
					

					      		
						}

					}


				}

			}
			
		}

		return summaries;

	},

    formatDate(inputDateString,inputFormat,outputFormat){
        if( typeof inputDateString === "string" && inputFormat.test( inputDateString ) ){
          return moment( inputDateString ).format(outputFormat);
        }
    }


}
