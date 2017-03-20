
use strict';

 var express    = require('express'),
   app          = express(),
   watson       = require('watson-developer-cloud'),
   extend       = require('util')._extend,
   Parse        = require('parse/node'),  
   bodyParser   = require('body-parser'),
   Monitora     = require('./Monitora'),
   i18n         = require('i18next');
 

const moment = require('moment');



Parse.initialize('JMzpiMhkL1z5hvuGzLhYPppNJPJpoaTAdIp3oNmh', 'mtyHx7hxS1zvPz5FnWq94w4GHzchvb44HJiZOZj2');
Parse.serverURL = 'http://52.27.220.189/monitoraserver'

//i18n settings
 require('./config/i18n')(app);
 
 // Bootstrap application settings
 require('./config/express')(app);
 
 // Create the service wrapper
 var personalityInsights = watson.personality_insights({
   version: 'v2',
   username: '<username>',
   password: '<password>'
 });
 
 app.get('/', function(req, res) {
   res.render('index', { ct: req._csrfToken });
 });




app.post('/messengerbot2/webhook', function (req, res) {
	res.setHeader('Content-type', 'application/json');	
	var data = req.body;
	var sender = data.originalRequest.data.sender.id;
	var metadata = data.result.metadata;
	var mensagem = data.result.resolvedQuery;
	var action = data.result.action;
	var actionIncomplete = data.result.actionIncomplete;
	var retorno ={};
	if(IsJsonString(mensagem)){

		var json = JSON.parse(mensagem)
		console.log(json)	
		action = json.type;
		var idPolitico = json.id_politico;
		var nomePolitico = json.nome;
		var casa = json.casa;
		var sexo = json.sexo;
	}
	//action = 'input.faltas'
	switch (action){

		case 'presenca':
			Monitora.getPresenca(idPolitico, function(ret){
				retorno.speech = "Dep. "+nomePolitico+":\n"+ret;
				res.send(retorno);
			})
		break;
		
		case 'gastos_cota':
			Monitora.getGastos({"politicoId":idPolitico,"nome":nomePolitico, "sexo":sexo, "casa": casa}, function(ret){
				retorno.speech = ret;
				res.send(retorno);
			});
		break;

		case 'projetos':
			Monitora.getProjects({"politicoId": idPolitico}, function(ret){
				if(ret.length > 0){
				retorno.data ={
                                                "facebook" : {
                                                        "attachment" : {
                                                                "type" : "template",
                                                                "payload" : {
                                                                        "template_type" : "generic",
                                                                        "elements" : ret
                                                                }
                                                        }
                                                }
                                        }
                                }else{
                                        //se nao encontrar, enviar o fulfillment
                                        retorno.speech="Não encontrei nenhum projeto";

                                }
                                res.send(retorno);
			});
		break;
		//Se não sabe o que foi digitado, pode ser um nome de político
		case 'input.unknown':			
			Monitora.getPolitico(mensagem, function(ret){
				if(ret.success){
					retorno.data ={
						"facebook" : {
							"attachment" : {
								"type" : "template",
								"payload" : {
									"template_type" : "generic",
									"elements" : ret.cards
								}
							}
						}
					}
				}else{
					//se nao encontrar, enviar o fulfillment
					retorno.speech=data.result.fulfillment.speech;				
						
				}		
				res.send(retorno);
			});			
		break;
		
		//buscar os gastos de acordo com o que o usuário digitou
		//pode ser 
		//	quem gastou mais até o momento
		//	quem gastou mais no mes 
		//	quem gastou mais no ano
		//	qual o maior gasto
		case 'input.gastos':
			Monitora.getGastaMais({mes:null, ano: null,casa:'c'}, function(ret){
				retorno.speech=
					"O deputado que mais gastou até agora:\n"+
					ret;
				Monitora.getGastaMais({mes:null, ano: null,casa:'s'}, function(ret){
					retorno.speech=retorno.speech+"\n"+
					"O senador que mais gastou até agora:\n"+
					ret;
					res.send(retorno);
				});	
				
			});	
			
		break;
		
		//buscar as faltas de um político		
		case 'input.faltas':
			Monitora.getFaltouMais({mes:null, ano: null}, function(ret){
				retorno.speech=
					"O deputado que mais faltou:\n"+
					ret;
				res.send(retorno);
			});	
			
		break;
		
		//seguir um político		
		case 'input.seguir':
			
			
		break;
		
		//buscar os processos de um político
		case 'input.processos':
		
		break;
	}
	

	/*console.log('---RESULT-----')
	console.log(data.result)
	console.log('----CONTEXTS----')
	console.log(data.result.contexts)
	console.log('----FIM----')
	console.log(data)
	*/
//console.log(data.result.fulfillment
	
	
	
})

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// error-handler settings
 require('./config/error-handler')(app);
 
 var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
 app.listen(port);
 console.log('listening at:', port);


