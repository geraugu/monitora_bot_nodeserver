
'use strict';

 var express    = require('express'),
   app          = express(),
   request      = require('request'),  
   watson       = require('watson-developer-cloud'),
   extend       = require('util')._extend,
   Parse        = require('parse/node'),  
   bodyParser   = require('body-parser'),
   Monitora     = require('./Monitora'),
   i18n         = require('i18next');
 

const moment = require('moment');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

Parse.initialize('JMzpiMhkL1z5hvuGzLhYPppNJPJpoaTAdIp3oNmh', 'mtyHx7hxS1zvPz5FnWq94w4GHzchvb44HJiZOZj2');
Parse.serverURL = 'http://52.27.220.189/monitoraserver'

//i18n settings
 require('./config/i18n')(app);
 
 // Bootstrap application settings
 require('./config/express')(app);

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: '9e5641e6-e063-47b0-a170-65656b3ed444',
    password: 'TlKATc1MiTK1',
    version: 'v1',
    version_date: '2016-07-11'
});
 
 // Create the service wrapper
 var personalityInsights = watson.personality_insights({
   version: 'v2',
   username: '<username>',
   password: '<password>'
 });
 
 app.get('/', function(req, res) {
   res.render('index', { ct: req._csrfToken });
 });


var workspace = process.env.WORKSPACE_ID || '4eff24d4-2b2c-4996-ba67-6a2869e2392a';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'tokenDeVerificacaoFacebook') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Erro de validação no token.');
});



app.post('/messengerbot2/webhook', function (req, res) {
	res.setHeader('Content-type', 'application/json');	
	var data = req.body;
	console.log(data)
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

app.post('/webhook/', function (req, res) {
	var text = null;
	
   var messaging_events = req.body.entry[0].messaging;
	for (var i = 0; i < messaging_events.length; i++) {	
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			context: {"conversation_id": conversation_id}
		}

		var payload = {
			workspace_id: workspace
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
        if (err) {
		console.log(err)
		console.log(convResults)
		return;
            //return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}
            
    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	var messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "EAAIQKYAU01QBAH5RbI1GjCv0LZAotyh55kV0UbPN58uUIZBh3WUqWuTjpbvU7x4oNg1OClFEGqghFhcB7wtYGIfsZARZBKMhb99mAzuNKZCjoJZAwBbji46gaEKFcgc7SCNduXwo9h10WE1yqgZCbZAHgsOovEQ8RSS4dsLw4AsKugZDZD";

// error-handler settings
 require('./config/error-handler')(app);
 
 var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
 app.listen(port);
 console.log('listening at:', port);


